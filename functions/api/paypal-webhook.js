import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';

export async function onRequestPost(context) {
    const { env, request } = context;
    initFirebase(env);

    try {
        const rawBody = await request.text();
        const webhookId = env.PAYPAL_WEBHOOK_ID;

        if (webhookId) {
            const PAYPAL_API = env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
            const clientId = env.PAYPAL_CLIENT_ID;
            const secret = env.PAYPAL_SECRET;
            if (clientId && secret) {
                const auth = btoa(`${clientId}:${secret}`);
                const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
                    method: 'POST',
                    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'grant_type=client_credentials'
                });
                const tokenData = await tokenRes.json();
                const verifyRes = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        auth_algo: request.headers.get('paypal-auth-algo'),
                        cert_url: request.headers.get('paypal-cert-url'),
                        transmission_id: request.headers.get('paypal-transmission-id'),
                        transmission_sig: request.headers.get('paypal-transmission-sig'),
                        transmission_time: request.headers.get('paypal-transmission-time'),
                        webhook_id: webhookId,
                        webhook_event: JSON.parse(rawBody)
                    })
                });
                const verifyData = await verifyRes.json();
                if (verifyData.verification_status !== 'SUCCESS') {
                    return errorResponse('Invalid signature', 403);
                }
            }
        }

        const body = JSON.parse(rawBody);
        const eventType = body.event_type;
        const resource = body.resource || {};
        const db = getDb(env);
        if (!db) return jsonResponse({ received: true });

        switch (eventType) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED': {
                const subId = resource.id;
                const customId = resource.custom_id;
                await db.collection('subscriptions').doc(customId || subId).set({
                    provider: 'paypal', subscriptionId: subId, plan: 'monthly', status: 'active',
                    activatedAt: admin.firestore.FieldValue.serverTimestamp(), userId: customId || 'unknown'
                }, { merge: true });
                break;
            }
            case 'PAYMENT.SALE.COMPLETED': {
                const billingAgreementId = resource.billing_agreement_id;
                if (billingAgreementId) {
                    const snap = await db.collection('subscriptions').where('subscriptionId', '==', billingAgreementId).limit(1).get();
                    if (!snap.empty) {
                        await snap.docs[0].ref.update({ status: 'active', lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(), lastPaymentAmount: parseFloat(resource.amount?.total || '0') });
                    }
                }
                break;
            }
            case 'BILLING.SUBSCRIPTION.CANCELLED': {
                const snap = await db.collection('subscriptions').where('subscriptionId', '==', resource.id).limit(1).get();
                if (!snap.empty) await snap.docs[0].ref.update({ status: 'cancelled', cancelledAt: admin.firestore.FieldValue.serverTimestamp() });
                break;
            }
            case 'BILLING.SUBSCRIPTION.SUSPENDED': {
                const snap = await db.collection('subscriptions').where('subscriptionId', '==', resource.id).limit(1).get();
                if (!snap.empty) await snap.docs[0].ref.update({ status: 'suspended', suspendedAt: admin.firestore.FieldValue.serverTimestamp() });
                break;
            }
        }

        return jsonResponse({ received: true });
    } catch (e) {
        return jsonResponse({ received: true, error: e.message });
    }
}
