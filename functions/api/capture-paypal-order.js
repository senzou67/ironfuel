import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';

async function getAccessToken(env) {
    const clientId = env.PAYPAL_CLIENT_ID;
    const secret = env.PAYPAL_SECRET;
    const PAYPAL_API = env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const auth = btoa(`${clientId}:${secret}`);

    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials'
    });
    const data = await res.json();
    return data.access_token;
}

export async function onRequestPost(context) {
    const { env, request } = context;
    initFirebase(env);
    const PAYPAL_API = env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    try {
        const { orderId, subscriptionId, userId, type, plan } = await request.json();
        const db = getDb(env);

        if (type === 'subscription' && subscriptionId) {
            const accessToken = await getAccessToken(env);
            const subRes = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
            });
            const subData = await subRes.json();
            if (subData.status !== 'ACTIVE' && subData.status !== 'APPROVED') {
                return errorResponse('Subscription not active', 400);
            }
            if (db) {
                await db.collection('subscriptions').doc(userId || subscriptionId).set({
                    provider: 'paypal', subscriptionId, plan: plan || 'monthly', status: 'active',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(), userId: userId || 'anonymous'
                }, { merge: true });
            }
            return jsonResponse({ status: 'ACTIVE', subscriptionId });
        }

        if (!orderId) return errorResponse('orderId required', 400);

        const accessToken = await getAccessToken(env);
        const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        const captureData = await captureRes.json();

        if (captureData.status === 'COMPLETED') {
            if (db) {
                const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
                await db.collection('donations').add({
                    provider: 'paypal', orderId, captureId: capture?.id || '',
                    amount: parseFloat(capture?.amount?.value || '0'), currency: capture?.amount?.currency_code || 'EUR',
                    userId: userId || captureData.purchase_units?.[0]?.custom_id || 'anonymous', status: 'completed',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            return jsonResponse({ status: 'COMPLETED', orderId });
        }
        return errorResponse('Capture not completed', 400);
    } catch (e) {
        return errorResponse(e.message);
    }
}
