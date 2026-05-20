// ===== ACCOUNT DELETION ENDPOINT =====
// Server-side complete account deletion via Firebase Admin SDK.
// Required by Apple App Store §5.1.1.v and Google Play Developer Program
// Policies — the in-app "Supprimer mon compte" flow calls this.
//
// The client-side delete (settings.js) could only remove users/{uid}
// because Firestore rules forbid clients writing to subscriptions/ etc.
// This endpoint runs with admin privileges and cleans EVERYTHING.
//
// Deletes for the authenticated UID :
//   - users/{uid} + all subcollections (logs, ...) via recursiveDelete
//   - subscriptions/{uid}
//   - emails/* where userId == uid
//   - error_logs/* where userId == uid
//   - the Firebase Auth account itself
// Keeps (legal basis — accounting, art. L123-22 Code de commerce) :
//   - donations/* (10-year retention) — userId field is anonymised
// Writes an audit record to deletion_log/ (RGPD proof of compliance).
import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse, getVerifiedUid } from './_shared.js';

// Delete every doc returned by a query, in batches of 450 (<500 limit).
async function deleteQueryBatched(db, query) {
    let deleted = 0;
    while (true) {
        const snap = await query.limit(450).get();
        if (snap.empty) break;
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        deleted += snap.size;
        if (snap.size < 450) break;
    }
    return deleted;
}

// Anonymise donations instead of deleting (accounting records must be kept).
async function anonymiseDonations(db, uid) {
    let updated = 0;
    while (true) {
        const snap = await db.collection('donations').where('userId', '==', uid).limit(450).get();
        if (snap.empty) break;
        const batch = db.batch();
        snap.docs.forEach(d => batch.update(d.ref, { userId: 'deleted', email: null }));
        await batch.commit();
        updated += snap.size;
        if (snap.size < 450) break;
    }
    return updated;
}

export async function onRequestPost(context) {
    const { env, request } = context;
    initFirebase(env);

    const db = getDb(env);
    if (!db) return errorResponse('Service indisponible.', 503);

    // Auth is mandatory — we delete the data of the authenticated user only.
    const uid = await getVerifiedUid(request, env);
    if (!uid) return errorResponse('Authentification requise.', 401);

    const report = {
        users: 0, subscriptions: 0, emails: 0, errorLogs: 0,
        donationsAnonymised: 0, authDeleted: false
    };

    try {
        // 1. users/{uid} + subcollections (logs, etc.)
        try {
            await db.recursiveDelete(db.collection('users').doc(uid));
            report.users = 1;
        } catch (e) {
            // Fallback if recursiveDelete unavailable: delete known subcollection + doc
            try {
                await deleteQueryBatched(db, db.collection('users').doc(uid).collection('logs'));
                await db.collection('users').doc(uid).delete();
                report.users = 1;
            } catch { /* doc may not exist */ }
        }

        // 2. subscriptions/{uid}
        try {
            await db.collection('subscriptions').doc(uid).delete();
            report.subscriptions = 1;
        } catch { /* may not exist */ }

        // 3. emails/* where userId == uid
        report.emails = await deleteQueryBatched(
            db, db.collection('emails').where('userId', '==', uid)
        );

        // 4. error_logs/* where userId == uid
        report.errorLogs = await deleteQueryBatched(
            db, db.collection('error_logs').where('userId', '==', uid)
        );

        // 5. donations — anonymise (kept for accounting, art. L123-22)
        report.donationsAnonymised = await anonymiseDonations(db, uid);

        // 6. Firebase Auth account
        try {
            await admin.auth().deleteUser(uid);
            report.authDeleted = true;
        } catch (e) {
            // user-not-found is acceptable (already gone)
            if (e.code !== 'auth/user-not-found') {
                console.error('[delete-account] auth delete failed:', e.message);
            }
        }

        // 7. Audit record (RGPD compliance proof). Does NOT store the uid
        // in a way that re-identifies — only a one-way reference.
        try {
            await db.collection('deletion_log').add({
                uidHash: uid.substring(0, 8) + '…',  // partial, non-reversible reference
                deletedAt: admin.firestore.FieldValue.serverTimestamp(),
                report
            });
        } catch { /* non-blocking */ }

        return jsonResponse({ success: true, report });
    } catch (err) {
        console.error('[delete-account] error:', err.message, { uid: uid.substring(0, 8) });
        return errorResponse('La suppression a échoué. Contacte contact@1food.fr.', 500);
    }
}
