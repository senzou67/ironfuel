// Daily notification — called via Cloudflare Cron Trigger (every 30 min)
// Can also be called manually via POST /api/daily-notification with admin key
import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';

const MESSAGES = {
    meals: ['Nouvelle journée ! Commence par un bon petit-déj 🍳', "C'est parti ! N'oublie pas de logger tes repas 📝", 'Ton corps a besoin de fuel — log ton premier repas ! 🔥', 'Bonne journée ! Pense à noter ce que tu manges 🍽️', 'Un repas loggé = un pas vers ton objectif 💪', 'Allez, on track ses macros aujourd\'hui ! 🎯', 'Chaque calorie compte — note tout ! 📊'],
    supplements: ["N'oublie pas tes compléments ! 💊", 'Tes compléments t\'attendent 💊✨', 'Pense à ta routine suppléments du jour !', 'Créatine, vitamines... c\'est l\'heure ! ⚡'],
    gym: ["C'est l'heure de ta séance ! 🏋️", 'La salle t\'attend — go push ! 💪', 'No excuses — c\'est jour de training ! 🔥', 'Ton corps te remerciera après la séance 🏆'],
    weight: ['Pense à noter ton poids ! ⚖️', 'Pesée du jour — monte sur la balance ! ⚖️', 'Un suivi régulier = des résultats visibles 📈'],
    water: ["Hydrate-toi ! N'oublie pas ton eau 💧", "T'as bu assez d'eau ? Go boire un verre ! 💧", "L'eau c'est la vie — hydrate-toi 🥤", 'Ton corps a besoin d\'eau — bois ! 💧'],
};
const ICONS = { meals: '🍽️', supplements: '💊', gym: '🏋️', weight: '⚖️', water: '💧' };

function getMessage(category) {
    const msgs = MESSAGES[category];
    if (!msgs) return null;
    return { title: 'OneFood ' + (ICONS[category] || '💪'), body: msgs[new Date().getDate() % msgs.length] };
}

function isTimeToSend(scheduledTime) {
    const now = new Date();
    const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const currentMinutes = parisTime.getHours() * 60 + parisTime.getMinutes();
    const [h, m] = scheduledTime.split(':').map(Number);
    return Math.abs(currentMinutes - (h * 60 + m)) <= 15;
}

async function runNotifications(env) {
    initFirebase(env);
    const db = getDb(env);
    if (!db) return { sent: 0, error: 'Firebase not configured' };

    const usersSnap = await db.collection('users').where('fcmToken', '!=', '').get();
    if (usersSnap.empty) return { sent: 0 };

    let totalSent = 0, totalFailed = 0;

    for (const doc of usersSnap.docs) {
        const userData = doc.data();
        const token = userData.fcmToken;
        if (!token) continue;

        let prefs = {};
        try { prefs = userData.notifPrefs ? JSON.parse(userData.notifPrefs) : {}; } catch { prefs = {}; }
        if (!Object.keys(prefs).length) prefs = { meals: { enabled: true, time: '08:00' } };

        for (const [category, pref] of Object.entries(prefs)) {
            if (!pref?.enabled || !isTimeToSend(pref.time)) continue;
            const msg = getMessage(category);
            if (!msg) continue;

            try {
                await admin.messaging().send({
                    token, notification: { title: msg.title, body: msg.body },
                    webpush: { notification: { icon: '/assets/icons/icon-192.png', tag: 'onefood-' + category }, fcm_options: { link: '/' } }
                });
                totalSent++;
            } catch (e) {
                totalFailed++;
                if (e.code === 'messaging/invalid-registration-token' || e.code === 'messaging/registration-token-not-registered') {
                    try { doc.ref.update({ fcmToken: admin.firestore.FieldValue.delete() }); } catch {}
                }
            }
        }
    }
    return { sent: totalSent, failed: totalFailed };
}

// HTTP handler (manual trigger)
export async function onRequestPost(context) {
    const adminKey = context.env.ADMIN_API_KEY;
    const authHeader = context.request.headers.get('X-Admin-Key') || '';
    if (!adminKey || authHeader !== adminKey) return errorResponse('Forbidden', 403);

    const result = await runNotifications(context.env);
    return jsonResponse(result);
}

// Cloudflare Cron Trigger handler
export default {
    async scheduled(event, env, ctx) {
        const result = await runNotifications(env);
        console.log('[Notif]', result);
    }
};
