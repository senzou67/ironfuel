import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';

const ADMIN_HASH = '302333801873a46149bed26a09a7ff46689e089067520fe3fd9b7199e5a6e158';

async function checkAuth(request) {
    const auth = request.headers.get('X-Admin-Key') || '';
    const data = new TextEncoder().encode(auth);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === ADMIN_HASH;
}

export async function onRequest(context) {
    const { env, request } = context;
    initFirebase(env);

    if (!await checkAuth(request)) return errorResponse('Unauthorized', 401);

    const db = getDb(env);
    if (!db) return errorResponse('Firebase not configured');

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';

    try {
        if (action === 'stats') {
            const usersSnap = await db.collection('users').get();
            let totalUsers = 0, premiumUsers = 0, withFcm = 0, activeLastWeek = 0;
            const weekAgo = Date.now() - 7 * 86400000;

            usersSnap.forEach(doc => {
                totalUsers++;
                const d = doc.data();
                if (d.data?.stringValue) { try { const p = JSON.parse(d.data.stringValue || '{}'); if (p.paid === 'true' || p.paid === true) premiumUsers++; } catch {} }
                if (d.data?.mapValue?.fields?.trial?.stringValue) { try { const t = JSON.parse(d.data.mapValue.fields.trial.stringValue); if (t.paid) premiumUsers++; } catch {} }
                if (d.fcmToken) withFcm++;
                if (d.updatedAt?.timestampValue) { if (new Date(d.updatedAt.timestampValue).getTime() > weekAgo) activeLastWeek++; }
            });

            let activeSubscriptions = 0, cancelledSubscriptions = 0;
            try { const s = await db.collection('subscriptions').get(); s.forEach(doc => { const d = doc.data(); if (d.status === 'cancelled' || d.status === 'canceled') cancelledSubscriptions++; else activeSubscriptions++; }); } catch {}

            let totalDonations = 0, donationAmount = 0;
            try { const d = await db.collection('donations').get(); d.forEach(doc => { totalDonations++; donationAmount += parseFloat(doc.data().amount || 0); }); } catch {}

            return jsonResponse({
                users: { total: totalUsers, premium: premiumUsers, withFcm, activeLastWeek },
                subscriptions: { active: activeSubscriptions, cancelled: cancelledSubscriptions },
                donations: { count: totalDonations, total: Math.round(donationAmount * 100) / 100 },
                server: { timestamp: new Date().toISOString(), version: env.DEPLOY_ID || 'unknown' }
            });
        }

        if (action === 'users') {
            const users = [];
            const usersSnap = await db.collection('users').get();
            usersSnap.forEach(doc => {
                const d = doc.data();
                const fields = d.data?.mapValue?.fields || {};
                let profile = {}; try { profile = JSON.parse(fields.profile?.stringValue || '{}'); } catch {}
                let trial = {}; try { trial = JSON.parse(fields.trial?.stringValue || '{}'); } catch {}
                users.push({ uid: doc.id, email: profile.email || d.email || '—', name: profile.name || '—', paid: trial.paid || false, plan: trial.plan || '—', hasFcm: !!d.fcmToken, updatedAt: d.updatedAt?.timestampValue || '—' });
            });
            users.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
            return jsonResponse({ users });
        }

        if (action === 'notes') {
            const doc = await db.collection('admin').doc('notes').get();
            return jsonResponse({ notes: doc.exists ? doc.data().content || '' : '' });
        }

        if (action === 'save-notes' && request.method === 'POST') {
            const { notes } = await request.json();
            await db.collection('admin').doc('notes').set({ content: notes || '', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
            return jsonResponse({ ok: true });
        }

        if (action === 'payments') {
            const payments = [];
            try { const s = await db.collection('subscriptions').get(); s.forEach(doc => { const d = doc.data(); const ts = d.createdAt?._seconds || d.createdAt?.seconds || 0; payments.push({ type: 'abo', email: d.email || doc.id, plan: d.plan || '—', status: d.status || 'active', date: ts ? new Date(ts * 1000).toISOString() : '—' }); }); } catch {}
            try { const d = await db.collection('donations').get(); d.forEach(doc => { const dd = doc.data(); const ts = dd.createdAt?._seconds || dd.createdAt?.seconds || 0; payments.push({ type: 'don', email: dd.email || doc.id, amount: dd.amount || 0, date: ts ? new Date(ts * 1000).toISOString() : '—' }); }); } catch {}
            payments.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            return jsonResponse({ payments });
        }

        if (action === 'broadcast' && request.method === 'POST') {
            const { title, body: msgBody } = await request.json();
            if (!title || !msgBody) return errorResponse('title and body required', 400);
            const usersSnap = await db.collection('users').where('fcmToken', '!=', '').get();
            let sent = 0, failed = 0;
            for (const doc of usersSnap.docs) {
                const token = doc.data().fcmToken;
                if (!token) continue;
                try { await admin.messaging().send({ token, notification: { title, body: msgBody }, webpush: { notification: { icon: '/assets/icons/icon-192.png', tag: 'admin-broadcast' }, fcm_options: { link: '/' } } }); sent++; } catch { failed++; }
            }
            return jsonResponse({ sent, failed });
        }

        return errorResponse('Unknown action', 400);
    } catch (e) {
        return errorResponse(e.message);
    }
}
