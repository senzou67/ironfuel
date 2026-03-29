// PayPal Webhook — handles subscription lifecycle events
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

const ALLOWED_ORIGIN = process.env.URL || 'https://1food.fr';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method not allowed' };
    }

    try {
        // Verify PayPal webhook signature
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;
        if (webhookId) {
            const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
                ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
            const clientId = process.env.PAYPAL_CLIENT_ID;
            const secret = process.env.PAYPAL_SECRET;
            if (clientId && secret) {
                const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
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
                        auth_algo: event.headers['paypal-auth-algo'],
                        cert_url: event.headers['paypal-cert-url'],
                        transmission_id: event.headers['paypal-transmission-id'],
                        transmission_sig: event.headers['paypal-transmission-sig'],
                        transmission_time: event.headers['paypal-transmission-time'],
                        webhook_id: webhookId,
                        webhook_event: JSON.parse(event.body)
                    })
                });
                const verifyData = await verifyRes.json();
                if (verifyData.verification_status !== 'SUCCESS') {
                    console.error('[PayPal Webhook] Signature verification failed:', verifyData);
                    return { statusCode: 403, headers, body: 'Invalid signature' };
                }
            }
        }

        const body = JSON.parse(event.body || '{}');
        const eventType = body.event_type;
        const resource = body.resource || {};
        const db = getDb();

        console.log(`[PayPal Webhook] Event: ${eventType}`);

        if (!db) {
            console.error('[PayPal Webhook] Firebase not configured');
            return { statusCode: 200, headers, body: 'OK (no DB)' };
        }

        switch (eventType) {
            // Subscription activated (first payment)
            case 'BILLING.SUBSCRIPTION.ACTIVATED': {
                const subId = resource.id;
                const customId = resource.custom_id; // userId
                await db.collection('subscriptions').doc(customId || subId).set({
                    provider: 'paypal',
                    subscriptionId: subId,
                    plan: 'monthly',
                    status: 'active',
                    activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    userId: customId || 'unknown'
                }, { merge: true });
                console.log(`[PayPal] Subscription activated: ${subId} for ${customId}`);
                break;
            }

            // Recurring payment completed
            case 'PAYMENT.SALE.COMPLETED': {
                const billingAgreementId = resource.billing_agreement_id;
                if (billingAgreementId) {
                    // Find subscription by ID and update last payment
                    const snap = await db.collection('subscriptions')
                        .where('subscriptionId', '==', billingAgreementId)
                        .limit(1).get();
                    if (!snap.empty) {
                        const doc = snap.docs[0];
                        await doc.ref.update({
                            status: 'active',
                            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
                            lastPaymentAmount: parseFloat(resource.amount?.total || '0')
                        });
                        console.log(`[PayPal] Payment received for subscription ${billingAgreementId}`);
                    }
                }
                break;
            }

            // Subscription cancelled
            case 'BILLING.SUBSCRIPTION.CANCELLED': {
                const subId = resource.id;
                const snap = await db.collection('subscriptions')
                    .where('subscriptionId', '==', subId)
                    .limit(1).get();
                if (!snap.empty) {
                    await snap.docs[0].ref.update({
                        status: 'cancelled',
                        cancelledAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`[PayPal] Subscription cancelled: ${subId}`);
                }
                break;
            }

            // Subscription suspended (payment failed)
            case 'BILLING.SUBSCRIPTION.SUSPENDED': {
                const subId = resource.id;
                const snap = await db.collection('subscriptions')
                    .where('subscriptionId', '==', subId)
                    .limit(1).get();
                if (!snap.empty) {
                    await snap.docs[0].ref.update({
                        status: 'suspended',
                        suspendedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`[PayPal] Subscription suspended: ${subId}`);
                }
                break;
            }

            // Payment failed for subscription
            case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
                console.log(`[PayPal] Payment failed for subscription: ${resource.id}`);
                break;
            }

            default:
                console.log(`[PayPal Webhook] Unhandled event: ${eventType}`);
        }

        // Always return 200 to acknowledge the webhook
        return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
    } catch (e) {
        console.error('[PayPal Webhook] Error:', e);
        // Still return 200 to prevent PayPal from retrying
        return { statusCode: 200, headers, body: JSON.stringify({ received: true, error: e.message }) };
    }
};
