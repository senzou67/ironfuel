// Smart notification scheduler — Netlify Scheduled Function
// Runs every 30 minutes, checks each user's notification preferences,
// and sends FCM push for categories whose scheduled time matches now.
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

// Rotating messages per category
const MESSAGES = {
    meals: [
        'Nouvelle journée ! Commence par un bon petit-déj 🍳',
        "C'est parti ! N'oublie pas de logger tes repas 📝",
        'Ton corps a besoin de fuel — log ton premier repas ! 🔥',
        'Bonne journée ! Pense à noter ce que tu manges 🍽️',
        'Un repas loggé = un pas vers ton objectif 💪',
        'Allez, on track ses macros aujourd\'hui ! 🎯',
        'Chaque calorie compte — note tout ! 📊',
    ],
    supplements: [
        "N'oublie pas tes compléments ! 💊",
        'Tes compléments t\'attendent 💊✨',
        'Pense à ta routine suppléments du jour !',
        'Créatine, vitamines... c\'est l\'heure ! ⚡',
    ],
    gym: [
        "C'est l'heure de ta séance ! 🏋️",
        'La salle t\'attend — go push ! 💪',
        'No excuses — c\'est jour de training ! 🔥',
        'Ton corps te remerciera après la séance 🏆',
    ],
    weight: [
        'Pense à noter ton poids ! ⚖️',
        'Pesée du jour — monte sur la balance ! ⚖️',
        'Un suivi régulier = des résultats visibles 📈',
    ],
    water: [
        "Hydrate-toi ! N'oublie pas ton eau 💧",
        "T'as bu assez d'eau ? Go boire un verre ! 💧",
        "L'eau c'est la vie — hydrate-toi 🥤",
        'Ton corps a besoin d\'eau — bois ! 💧',
    ],
};

const ICONS = { meals: '🍽️', supplements: '💊', gym: '🏋️', weight: '⚖️', water: '💧' };

function getMessage(category) {
    const msgs = MESSAGES[category];
    if (!msgs) return null;
    const idx = new Date().getDate() % msgs.length;
    return { title: 'IronFuel ' + (ICONS[category] || '💪'), body: msgs[idx] };
}

// Check if current time (Paris timezone) matches a scheduled time within ±15 min window
function isTimeToSend(scheduledTime) {
    // Get current Paris time
    const now = new Date();
    const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const currentMinutes = parisTime.getHours() * 60 + parisTime.getMinutes();

    const [h, m] = scheduledTime.split(':').map(Number);
    const scheduledMinutes = h * 60 + m;

    // Match if within ±15 min window (since cron runs every 30 min)
    const diff = Math.abs(currentMinutes - scheduledMinutes);
    return diff <= 15;
}

exports.handler = async (event) => {
    console.log('[Notif] Triggered at', new Date().toISOString());

    const db = getDb();
    if (!db) {
        console.error('[Notif] Firebase not configured');
        return { statusCode: 500, body: 'Firebase not configured' };
    }

    try {
        // Get all users with FCM tokens
        const usersSnap = await db.collection('users').where('fcmToken', '!=', '').get();

        if (usersSnap.empty) {
            console.log('[Notif] No users with FCM tokens');
            return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };
        }

        let totalSent = 0, totalFailed = 0;

        for (const doc of usersSnap.docs) {
            const userData = doc.data();
            const token = userData.fcmToken;
            if (!token) continue;

            // Parse user's notification preferences
            let prefs = {};
            try {
                prefs = userData.notifPrefs ? JSON.parse(userData.notifPrefs) : {};
            } catch { prefs = {}; }

            // Default prefs if not set
            if (!prefs.meals && !prefs.supplements && !prefs.gym && !prefs.weight && !prefs.water) {
                prefs = { meals: { enabled: true, time: '08:00' } };
            }

            // Check each enabled category
            for (const [category, pref] of Object.entries(prefs)) {
                if (!pref || !pref.enabled) continue;
                if (!isTimeToSend(pref.time)) continue;

                const msg = getMessage(category);
                if (!msg) continue;

                try {
                    await admin.messaging().send({
                        token,
                        notification: { title: msg.title, body: msg.body },
                        webpush: {
                            notification: {
                                icon: '/assets/icons/icon-192.png',
                                badge: '/assets/icons/icon-96.svg',
                                tag: 'ironfuel-' + category,
                                vibrate: [200, 100, 200]
                            },
                            fcm_options: { link: '/' }
                        }
                    });
                    totalSent++;
                } catch (e) {
                    totalFailed++;
                    // Clean invalid tokens
                    if (e.code === 'messaging/invalid-registration-token' ||
                        e.code === 'messaging/registration-token-not-registered') {
                        try {
                            doc.ref.update({ fcmToken: admin.firestore.FieldValue.delete() });
                        } catch {}
                    }
                }
            }
        }

        console.log(`[Notif] Sent ${totalSent}, failed ${totalFailed}`);
        return { statusCode: 200, body: JSON.stringify({ sent: totalSent, failed: totalFailed }) };
    } catch (e) {
        console.error('[Notif] Error:', e);
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};

// Netlify Scheduled Function config — runs every 30 minutes
// See netlify.toml: schedule = "*/30 * * * *"
