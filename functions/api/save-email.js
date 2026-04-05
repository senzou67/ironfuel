import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';

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

        await db.collection('emails').doc(docId).set({
            email: emailKey, userId: userId || 'anonymous', displayName: displayName || '',
            emailConsent: !!consent, consentDate: consent ? admin.firestore.FieldValue.serverTimestamp() : null,
            streak: streak || 0, signupDate: signupDate || new Date().toISOString(), source: 'login',
            lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return jsonResponse({ success: true });
    } catch (err) {
        return errorResponse(err.message);
    }
}
