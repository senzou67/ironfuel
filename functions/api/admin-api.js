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

        if (action === 'metrics') {
            const now = Date.now();
            const day = 86400000;
            const dauCutoff = now - day;
            const wauCutoff = now - 7 * day;
            const mauCutoff = now - 30 * day;
            const startOf30d = now - 30 * day;

            let totalUsers = 0, premiumUsers = 0, dau = 0, wau = 0, mau = 0, newSignups24h = 0, newSignups7d = 0, newSignups30d = 0;
            const signupsByDay = {};

            const usersSnap = await db.collection('users').get();
            usersSnap.forEach(doc => {
                totalUsers++;
                const d = doc.data();
                const fields = d.data?.mapValue?.fields || {};
                let trial = {}; try { trial = JSON.parse(fields.trial?.stringValue || '{}'); } catch {}
                if (trial.paid === true || trial.paid === 'true') premiumUsers++;

                const updatedAt = d.updatedAt?.timestampValue ? new Date(d.updatedAt.timestampValue).getTime() : 0;
                if (updatedAt) {
                    if (updatedAt > dauCutoff) dau++;
                    if (updatedAt > wauCutoff) wau++;
                    if (updatedAt > mauCutoff) mau++;
                }

                const createdAt = d.createdAt?.timestampValue ? new Date(d.createdAt.timestampValue).getTime() : (d.createdAt?._seconds ? d.createdAt._seconds * 1000 : 0);
                if (createdAt) {
                    if (createdAt > dauCutoff) newSignups24h++;
                    if (createdAt > wauCutoff) newSignups7d++;
                    if (createdAt > mauCutoff) newSignups30d++;
                    if (createdAt > mauCutoff) {
                        const dayKey = new Date(createdAt).toISOString().slice(0, 10);
                        signupsByDay[dayKey] = (signupsByDay[dayKey] || 0) + 1;
                    }
                }
            });

            let monthlySubs = 0, annualSubs = 0, activeSubs = 0, cancelledSubs = 0, churnedLast30d = 0, activeAtStartOf30d = 0, retainedPremium = 0;
            try {
                const s = await db.collection('subscriptions').get();
                s.forEach(doc => {
                    const d = doc.data();
                    const status = d.status || 'active';
                    const plan = (d.plan || '').toLowerCase();
                    const isCancelled = status === 'cancelled' || status === 'canceled';
                    const createdAt = d.createdAt?._seconds ? d.createdAt._seconds * 1000 : (d.createdAt?.seconds ? d.createdAt.seconds * 1000 : 0);
                    const cancelledAt = d.cancelledAt?._seconds ? d.cancelledAt._seconds * 1000 : (d.cancelledAt?.seconds ? d.cancelledAt.seconds * 1000 : (d.canceledAt?._seconds ? d.canceledAt._seconds * 1000 : 0));

                    if (isCancelled) {
                        cancelledSubs++;
                        const cancelTime = cancelledAt || createdAt;
                        if (cancelTime && cancelTime > startOf30d) churnedLast30d++;
                    } else {
                        activeSubs++;
                        if (plan.includes('year') || plan.includes('annual') || plan.includes('an')) annualSubs++;
                        else monthlySubs++;
                        if (createdAt && createdAt < startOf30d) retainedPremium++;
                    }

                    if (createdAt && createdAt < startOf30d && (!cancelledAt || cancelledAt > startOf30d)) {
                        activeAtStartOf30d++;
                    }
                });
            } catch {}

            let donationCount = 0, donationTotal = 0;
            try {
                const d = await db.collection('donations').get();
                d.forEach(doc => { donationCount++; donationTotal += parseFloat(doc.data().amount || 0); });
            } catch {}

            const MONTHLY_PRICE = 3.99;
            const ANNUAL_PRICE = 14.99;
            const mrr = (monthlySubs * MONTHLY_PRICE) + (annualSubs * ANNUAL_PRICE / 12);
            const arr = mrr * 12;
            const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;
            const churnRate = activeAtStartOf30d > 0 ? (churnedLast30d / activeAtStartOf30d) * 100 : 0;
            const arpu = totalUsers > 0 ? mrr / totalUsers : 0;
            const retentionRate = activeAtStartOf30d > 0 ? (retainedPremium / activeAtStartOf30d) * 100 : 0;

            return jsonResponse({
                dau, wau, mau,
                totalUsers,
                premiumUsers,
                newSignups: { last24h: newSignups24h, last7d: newSignups7d, last30d: newSignups30d },
                signupsByDay,
                subscriptions: { active: activeSubs, cancelled: cancelledSubs, monthly: monthlySubs, annual: annualSubs },
                mrr: Math.round(mrr * 100) / 100,
                arr: Math.round(arr * 100) / 100,
                arpu: Math.round(arpu * 100) / 100,
                conversionRate: Math.round(conversionRate * 100) / 100,
                churnRate: Math.round(churnRate * 100) / 100,
                retentionRate: Math.round(retentionRate * 100) / 100,
                churnedLast30d,
                donations: { count: donationCount, total: Math.round(donationTotal * 100) / 100 },
                generatedAt: new Date().toISOString()
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

        if (action === 'errors') {
            // List recent error logs (last 50)
            const errors = [];
            try {
                const snap = await db.collection('error_logs').orderBy('createdAt', 'desc').limit(50).get();
                snap.forEach(doc => {
                    const d = doc.data();
                    errors.push({
                        id: doc.id,
                        message: d.message,
                        stack: d.stack,
                        url: d.url,
                        userAgent: d.userAgent,
                        userId: d.userId,
                        page: d.page,
                        country: d.country,
                        timestamp: d.timestamp
                    });
                });
            } catch (e) { return jsonResponse({ errors: [], error: e.message }); }
            return jsonResponse({ errors });
        }

        return errorResponse('Unknown action', 400);
    } catch (e) {
        return errorResponse(e.message);
    }
}
