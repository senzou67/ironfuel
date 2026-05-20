// ===== CRON : WIN-BACK EMAIL =====
// GET /api/cron-win-back  (protect with CRON_SECRET)
//
// Cloudflare Pages Functions have no native cron trigger — call this URL
// once a day from any scheduler. Auth : header "Authorization: Bearer
// <CRON_SECRET>" OR ?key=.
//
// Targets users inactive 30-90 days:
//   - emails/{key} with emailConsent == true
//   - lastSeenAt between 30 and 90 days ago
//   - not currently paid
//   - winBackSentAt not yet set (send once ever)
import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';
import { sendEmail } from './_email.js';

const INACTIVE_MIN = 30;
const INACTIVE_MAX = 90;
const PAGE = 500;

function authorised(request, env) {
    const secret = env.CRON_SECRET;
    if (!secret) return false;     // fail closed
    const url = new URL(request.url);
    const header = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    return header === secret || url.searchParams.get('key') === secret;
}

// lastSeenAt is a Firestore Timestamp; signupDate is an ISO string.
function toMs(v) {
    if (!v) return NaN;
    if (typeof v.toDate === 'function') return v.toDate().getTime();
    const t = new Date(v).getTime();
    return isNaN(t) ? NaN : t;
}

export async function onRequestGet(context) {
    const { env, request } = context;
    if (!authorised(request, env)) return errorResponse('Unauthorized', 401);

    initFirebase(env);
    const db = getDb(env);
    if (!db) return errorResponse('Database unavailable', 503);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const report = { scanned: 0, sent: 0, skippedPaid: 0, skippedWindow: 0, skippedAlready: 0, errors: 0 };

    try {
        let last = null;
        while (true) {
            let q = db.collection('emails').where('emailConsent', '==', true)
                .orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE);
            if (last) q = q.startAfter(last);
            const snap = await q.get();
            if (snap.empty) break;

            for (const doc of snap.docs) {
                report.scanned++;
                const d = doc.data();
                if (d.winBackSentAt) { report.skippedAlready++; continue; }

                const seen = toMs(d.lastSeenAt) || toMs(d.signupDate);
                if (isNaN(seen)) { report.skippedWindow++; continue; }
                const daysInactive = Math.floor((now - seen) / dayMs);
                if (daysInactive < INACTIVE_MIN || daysInactive > INACTIVE_MAX) {
                    report.skippedWindow++; continue;
                }

                const uid = d.userId && d.userId !== 'anonymous' ? d.userId : null;
                if (uid) {
                    try {
                        const sub = await db.collection('subscriptions').doc(uid).get();
                        const st = sub.exists ? sub.data()?.status : null;
                        if (st === 'active' || st === 'trialing') { report.skippedPaid++; continue; }
                    } catch { /* treat as not paid */ }
                }

                const res = await sendEmail(env, {
                    to: d.email,
                    template: 'win-back',
                    data: { name: d.displayName || 'toi', daysInactive }
                });
                if (res && res.sent === false) { report.errors++; continue; }
                report.sent++;
                await doc.ref.set({ winBackSentAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            }

            last = snap.docs[snap.docs.length - 1];
            if (snap.size < PAGE) break;
        }
        return jsonResponse({ ok: true, report });
    } catch (err) {
        console.error('[cron-win-back]', err.message);
        return jsonResponse({ ok: false, error: err.message, report }, 500);
    }
}
