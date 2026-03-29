const admin = require('firebase-admin');
if (!admin.apps.length) {
    try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID });
    } catch {}
}
function getDb() { try { return admin.firestore(); } catch { return null; } }

const ADMIN_HASH = '302333801873a46149bed26a09a7ff46689e089067520fe3fd9b7199e5a6e158';
const crypto = require('crypto');

function checkAuth(event) {
    const auth = event.headers['x-admin-key'] || '';
    return crypto.createHash('sha256').update(auth).digest('hex') === ADMIN_HASH;
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': process.env.URL || 'https://1food.fr',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
    if (!checkAuth(event)) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    const db = getDb();
    if (!db) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Firebase not configured' }) };

    const action = event.queryStringParameters?.action || 'stats';

    try {
        if (action === 'stats') {
            // Count users
            const usersSnap = await db.collection('users').get();
            let totalUsers = 0, premiumUsers = 0, withFcm = 0, activeLastWeek = 0;
            const now = Date.now();
            const weekAgo = now - 7 * 86400000;

            usersSnap.forEach(doc => {
                totalUsers++;
                const d = doc.data();
                if (d.data?.stringValue) {
                    try {
                        const parsed = JSON.parse(d.data.stringValue || '{}');
                        if (parsed.paid === 'true' || parsed.paid === true) premiumUsers++;
                    } catch {}
                }
                // Check mapValue format
                if (d.data?.mapValue?.fields?.trial?.stringValue) {
                    try {
                        const trial = JSON.parse(d.data.mapValue.fields.trial.stringValue);
                        if (trial.paid) premiumUsers++;
                    } catch {}
                }
                if (d.fcmToken) withFcm++;
                if (d.updatedAt?.timestampValue) {
                    const ts = new Date(d.updatedAt.timestampValue).getTime();
                    if (ts > weekAgo) activeLastWeek++;
                }
            });

            // Count subscriptions
            let activeSubscriptions = 0, cancelledSubscriptions = 0;
            try {
                const subsSnap = await db.collection('subscriptions').get();
                subsSnap.forEach(doc => {
                    const d = doc.data();
                    if (d.status === 'active' || d.status === 'paid') activeSubscriptions++;
                    else if (d.status === 'cancelled') cancelledSubscriptions++;
                });
            } catch {}

            // Count donations
            let totalDonations = 0, donationAmount = 0;
            try {
                const donSnap = await db.collection('donations').get();
                donSnap.forEach(doc => {
                    totalDonations++;
                    const d = doc.data();
                    donationAmount += parseFloat(d.amount || 0);
                });
            } catch {}

            return {
                statusCode: 200, headers,
                body: JSON.stringify({
                    users: { total: totalUsers, premium: premiumUsers, withFcm, activeLastWeek },
                    subscriptions: { active: activeSubscriptions, cancelled: cancelledSubscriptions },
                    donations: { count: totalDonations, total: Math.round(donationAmount * 100) / 100 },
                    server: { timestamp: new Date().toISOString(), version: process.env.DEPLOY_ID || 'unknown' }
                })
            };
        }

        if (action === 'users') {
            const users = [];
            const usersSnap = await db.collection('users').get();
            usersSnap.forEach(doc => {
                const d = doc.data();
                const fields = d.data?.mapValue?.fields || {};
                let profile = {};
                try { profile = JSON.parse(fields.profile?.stringValue || '{}'); } catch {}
                let trial = {};
                try { trial = JSON.parse(fields.trial?.stringValue || '{}'); } catch {}
                users.push({
                    uid: doc.id,
                    email: profile.email || d.email || '—',
                    name: profile.name || '—',
                    paid: trial.paid || false,
                    plan: trial.plan || '—',
                    hasFcm: !!d.fcmToken,
                    updatedAt: d.updatedAt?.timestampValue || '—'
                });
            });
            users.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
            return { statusCode: 200, headers, body: JSON.stringify({ users }) };
        }

        if (action === 'broadcast' && event.httpMethod === 'POST') {
            const { title, body: msgBody } = JSON.parse(event.body || '{}');
            if (!title || !msgBody) return { statusCode: 400, headers, body: JSON.stringify({ error: 'title and body required' }) };

            const usersSnap = await db.collection('users').where('fcmToken', '!=', '').get();
            let sent = 0, failed = 0;
            for (const doc of usersSnap.docs) {
                const token = doc.data().fcmToken;
                if (!token) continue;
                try {
                    await admin.messaging().send({
                        token,
                        notification: { title, body: msgBody },
                        webpush: { notification: { icon: '/assets/icons/icon-192.png', tag: 'admin-broadcast' }, fcm_options: { link: '/' } }
                    });
                    sent++;
                } catch { failed++; }
            }
            return { statusCode: 200, headers, body: JSON.stringify({ sent, failed }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
