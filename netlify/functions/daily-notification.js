// Daily motivation notification — Netlify Scheduled Function
// Runs every day at 7:00 UTC (= 8:00 Paris time CET, 9:00 CEST)
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

// 30 motivational messages for daily rotation
const MOTIVATIONS = [
    "Chaque repas compte. Allez, on track ! 🔥",
    "Ton corps est une machine — donne-lui le bon carburant 💪",
    "Pas de raccourci, que de la régularité 🏆",
    "La discipline bat le talent quand le talent ne travaille pas ⚡",
    "T'as géré hier, fais pareil aujourd'hui 🎯",
    "Les résultats viennent avec la constance, pas la perfection 📈",
    "Un jour de plus vers ton objectif. Let's go ! 🚀",
    "Hydrate-toi, mange bien, bouge — la trinité 💧",
    "Le meilleur moment pour bien manger, c'est maintenant 🍽️",
    "Ta version future te remerciera. Continue ! 🙌",
    "Muscles et nutrition = duo gagnant 💯",
    "Pas besoin d'être parfait, juste constant 🔄",
    "Chaque calorie trackée est un pas de plus vers ton but 📊",
    "Le progrès se construit jour après jour 🏗️",
    "Tu mérites de te sentir bien dans ton corps 💎",
    "La nutrition, c'est 80% du résultat. Track tes macros ! 🧠",
    "Jour après jour, tu construis ta meilleure version 🌟",
    "N'oublie pas tes protéines aujourd'hui ! 🥩",
    "L'eau, c'est la base. Hydrate-toi bien ! 💧",
    "Ta streak continue ! Garde le rythme 🔥",
    "Le petit-déj, c'est le carburant du champion 🌅",
    "Prépare tes repas, contrôle tes résultats 📋",
    "Chaque gramme de protéine compte pour tes muscles 💪",
    "Bien manger = bien performer. C'est aussi simple que ça 🎯",
    "Ton IronFuel t'attend ! Commence par tracker ton premier repas 📱",
    "La constance bat l'intensité. Reviens chaque jour 🔄",
    "Tu es ce que tu manges. Choisis bien ! 🥗",
    "Un bon repas, c'est un investissement dans toi-même 💰",
    "Les abdos se font à la cuisine, pas qu'à la salle 🍳",
    "Reste focus, reste discipliné, reste IronFuel 🔥"
];

exports.handler = async (event) => {
    console.log('[Daily] Triggered at', new Date().toISOString());

    const db = getDb();
    if (!db) {
        console.error('[Daily] Firebase not configured');
        return { statusCode: 500, body: 'Firebase not configured' };
    }

    try {
        // Get all users with FCM tokens
        const usersSnap = await db.collection('users').where('fcmToken', '!=', '').get();
        const tokens = [];
        usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.fcmToken) tokens.push(data.fcmToken);
        });

        if (tokens.length === 0) {
            console.log('[Daily] No FCM tokens found');
            return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };
        }

        // Pick daily motivation (rotation based on day of year)
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const motivation = MOTIVATIONS[dayOfYear % MOTIVATIONS.length];

        const message = {
            notification: {
                title: 'IronFuel 💪',
                body: motivation
            },
            webpush: {
                notification: {
                    icon: '/assets/icons/icon-192.png',
                    badge: '/assets/icons/icon-96.svg',
                    tag: 'daily-motivation',
                    vibrate: [200, 100, 200]
                },
                fcm_options: {
                    link: '/'
                }
            }
        };

        let sent = 0;
        let failed = 0;

        for (const token of tokens) {
            try {
                await admin.messaging().send({ ...message, token });
                sent++;
            } catch (e) {
                failed++;
                // Clean invalid tokens
                if (e.code === 'messaging/invalid-registration-token' ||
                    e.code === 'messaging/registration-token-not-registered') {
                    try {
                        const snap = await db.collection('users').where('fcmToken', '==', token).get();
                        snap.forEach(doc => doc.ref.update({ fcmToken: admin.firestore.FieldValue.delete() }));
                    } catch (_) {}
                }
            }
        }

        console.log(`[Daily] Sent ${sent}/${tokens.length}, failed ${failed}`);
        return { statusCode: 200, body: JSON.stringify({ sent, failed, total: tokens.length }) };
    } catch (e) {
        console.error('[Daily] Error:', e);
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};

// Netlify Scheduled Function config
// Add this to netlify.toml:
// [functions."daily-notification"]
//   schedule = "0 7 * * *"
