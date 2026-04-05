import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';

export async function onRequestPost(context) {
    const { env, request } = context;
    initFirebase(env);

    const adminKey = env.ADMIN_API_KEY;
    const authHeader = request.headers.get('X-Admin-Key') || '';
    if (!adminKey || authHeader !== adminKey) return errorResponse('Forbidden', 403);

    try {
        const { userId, title, body, broadcast } = await request.json();
        const db = getDb(env);
        if (!db) return errorResponse('Firebase not configured');

        let tokens = [];
        if (broadcast) {
            const usersSnap = await db.collection('users').where('fcmToken', '!=', '').get();
            usersSnap.forEach(doc => { const d = doc.data(); if (d.fcmToken) tokens.push(d.fcmToken); });
        } else if (userId) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().fcmToken) tokens.push(userDoc.data().fcmToken);
        }

        if (tokens.length === 0) return jsonResponse({ sent: 0, message: 'No tokens found' });

        const message = {
            notification: { title: title || 'OneFood 💪', body: body || 'Ton suivi nutrition t\'attend !' },
            webpush: { notification: { icon: '/assets/icons/icon-192.png', badge: '/assets/icons/icon-96.svg', tag: 'daily-motivation', vibrate: [200, 100, 200] }, fcm_options: { link: '/' } }
        };

        let sent = 0, failed = 0;
        const invalidTokens = [];

        for (const token of tokens) {
            try { await admin.messaging().send({ ...message, token }); sent++; }
            catch (e) {
                failed++;
                if (e.code === 'messaging/invalid-registration-token' || e.code === 'messaging/registration-token-not-registered') invalidTokens.push(token);
            }
        }

        if (invalidTokens.length > 0) {
            const batch = db.batch();
            const usersSnap = await db.collection('users').where('fcmToken', 'in', invalidTokens).get();
            usersSnap.forEach(doc => batch.update(doc.ref, { fcmToken: admin.firestore.FieldValue.delete() }));
            await batch.commit();
        }

        return jsonResponse({ sent, failed, total: tokens.length });
    } catch (e) {
        return errorResponse(e.message);
    }
}
