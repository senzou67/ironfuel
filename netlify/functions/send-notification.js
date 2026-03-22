// Send FCM push notification to a specific user or broadcast
const admin = require('firebase-admin');

if (!admin.apps.length) {
    try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(sa),
            projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID
        });
    } catch (e) {
        console.error('Firebase Admin init failed:', e.message);
    }
}

function getDb() {
    try { return admin.firestore(); } catch { return null; }
}

const ALLOWED_ORIGIN = process.env.URL || 'https://theironfuel.netlify.app';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method not allowed' };
    }

    try {
        const { userId, title, body, broadcast } = JSON.parse(event.body || '{}');
        const db = getDb();
        if (!db) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Firebase not configured' }) };
        }

        let tokens = [];

        if (broadcast) {
            // Get all FCM tokens from all users
            const usersSnap = await db.collection('users').where('fcmToken', '!=', '').get();
            usersSnap.forEach(doc => {
                const data = doc.data();
                if (data.fcmToken) tokens.push(data.fcmToken);
            });
        } else if (userId) {
            // Get FCM token for specific user
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().fcmToken) {
                tokens.push(userDoc.data().fcmToken);
            }
        }

        if (tokens.length === 0) {
            return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, message: 'No tokens found' }) };
        }

        // Send to all tokens
        const message = {
            notification: {
                title: title || 'IronFuel 💪',
                body: body || 'Ton suivi nutrition t\'attend !'
            },
            webpush: {
                notification: {
                    icon: '/assets/icons/icon-192.png',
                    badge: '/assets/icons/icon-96.svg',
                    tag: 'daily-motivation',
                    vibrate: [200, 100, 200],
                    actions: [
                        { action: 'open', title: 'Ouvrir IronFuel' }
                    ]
                },
                fcm_options: {
                    link: '/'
                }
            }
        };

        let sent = 0;
        let failed = 0;
        const invalidTokens = [];

        for (const token of tokens) {
            try {
                await admin.messaging().send({ ...message, token });
                sent++;
            } catch (e) {
                failed++;
                // Clean up invalid tokens
                if (e.code === 'messaging/invalid-registration-token' ||
                    e.code === 'messaging/registration-token-not-registered') {
                    invalidTokens.push(token);
                }
                console.error(`[FCM] Send failed for token ${token.substring(0, 10)}...:`, e.code);
            }
        }

        // Clean up invalid tokens from Firestore
        if (invalidTokens.length > 0) {
            const batch = db.batch();
            const usersSnap = await db.collection('users').where('fcmToken', 'in', invalidTokens).get();
            usersSnap.forEach(doc => {
                batch.update(doc.ref, { fcmToken: admin.firestore.FieldValue.delete() });
            });
            await batch.commit();
            console.log(`[FCM] Cleaned ${invalidTokens.length} invalid tokens`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ sent, failed, total: tokens.length })
        };
    } catch (e) {
        console.error('[FCM] Error:', e);
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
