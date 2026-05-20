// ===== CRON : TRIAL-ENDING EMAIL =====
// GET /api/cron-trial-ending  (protect with CRON_SECRET)
//
// Cloudflare Pages Functions have no native cron trigger — call this URL
// once a day from any scheduler (cron-job.org, GitHub Actions, a Worker
// cron). Auth : header "Authorization: Bearer <CRON_SECRET>" OR ?key=.
//
// Targets users whose 14-day free trial ends in ~3 days (J-3):
//   - emails/{key} with emailConsent == true
//   - signupDate between 11 and 12 days ago
//   - not already paid (subscriptions/{userId}.status active/trialing)
//   - trialEndingSentAt not yet set (send once)
import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';
import { sendEmail } from './_email.js';

const TRIAL_DAYS = 14;
const REMIND_AT_DAY = 11;          // J-3 of a 14-day trial
const PAGE = 500;

function authorised(request, env) {
    const secret = env.CRON_SECRET;
    if (!secret) return false;     // refuse if not configured (fail closed)
    const url = new URL(request.url);
    const header = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    return header === secret || url.searchParams.get('key') === secret;
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
                if (d.trialEndingSentAt) { report.skippedAlready++; continue; }

                // Days since signup
                const signup = d.signupDate ? new Date(d.signupDate).getTime() : NaN;
                if (isNaN(signup)) { report.skippedWindow++; continue; }
                const daysSince = Math.floor((now - signup) / dayMs);
                if (daysSince < REMIND_AT_DAY || daysSince >= REMIND_AT_DAY + 1) {
                    report.skippedWindow++; continue;
                }

                // Skip if already a paying / trialing subscriber
                const uid = d.userId && d.userId !== 'anonymous' ? d.userId : null;
                let activeDays = 0;
                if (uid) {
                    try {
                        const sub = await db.collection('subscriptions').doc(uid).get();
                        const st = sub.exists ? sub.data()?.status : null;
                        if (st === 'active' || st === 'trialing') { report.skippedPaid++; continue; }
                    } catch { /* treat as not paid */ }
                    try {
                        const c = await db.collection('users').doc(uid).collection('logs').count().get();
                        activeDays = c.data().count || 0;
                    } catch { /* leave 0 */ }
                }

                const res = await sendEmail(env, {
                    to: d.email,
                    template: 'trial-ending',
                    data: {
                        name: d.displayName || 'toi',
                        daysLeft: Math.max(1, TRIAL_DAYS - daysSince),
                        streak: d.streak || 0,
                        activeDays
                    }
                });
                if (res && res.sent === false) { report.errors++; continue; }
                report.sent++;
                await doc.ref.set({ trialEndingSentAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            }

            last = snap.docs[snap.docs.length - 1];
            if (snap.size < PAGE) break;
        }
        return jsonResponse({ ok: true, report });
    } catch (err) {
        console.error('[cron-trial-ending]', err.message);
        return jsonResponse({ ok: false, error: err.message, report }, 500);
    }
}
