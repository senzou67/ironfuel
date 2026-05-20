import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';
import { sendEmail } from './_email.js';

export async function onRequestPost(context) {
    const { env, request } = context;
    initFirebase(env);

    try {
        const { userId, email, displayName, consent, streak, signupDate } = await request.json();
        if (!email) return errorResponse('Email required', 400);

        const db = getDb(env);
        if (!db) return errorResponse('Database not available');

        const emailKey = email.toLowerCase().trim();
        const docId = emailKey.replace(/[^a-z0-9@._-]/g, '_');
        const docRef = db.collection('emails').doc(docId);

        // Check whether this address already got the welcome email and
        // whether it has unsubscribed — avoids double-send on re-login.
        const existing = await docRef.get();
        const alreadyWelcomed = existing.exists && !!existing.data()?.welcomeSentAt;
        const optedOut = existing.exists && existing.data()?.emailConsent === false;
        const wantsWelcome = !!consent && !alreadyWelcomed && !optedOut;

        const payload = {
            email: emailKey, userId: userId || 'anonymous', displayName: displayName || '',
            emailConsent: !!consent, consentDate: consent ? admin.firestore.FieldValue.serverTimestamp() : null,
            streak: streak || 0, signupDate: signupDate || new Date().toISOString(), source: 'login',
            lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (wantsWelcome) payload.welcomeSentAt = admin.firestore.FieldValue.serverTimestamp();

        await docRef.set(payload, { merge: true });

        // Send the welcome email (graceful no-op if RESEND_API_KEY absent).
        // waitUntil keeps the HTTP response fast while the send completes.
        if (wantsWelcome) {
            const sendPromise = sendEmail(env, {
                to: emailKey,
                template: 'welcome',
                data: { name: displayName || 'toi' }
            }).then(r => {
                // If the send genuinely failed, clear welcomeSentAt so a
                // later login retries it.
                if (r && r.sent === false) {
                    return docRef.set({ welcomeSentAt: null }, { merge: true }).catch(() => {});
                }
            }).catch(() => {});
            if (context.waitUntil) context.waitUntil(sendPromise);
            else await sendPromise;
        }

        return jsonResponse({ success: true });
    } catch (err) {
        return errorResponse(err.message);
    }
}
