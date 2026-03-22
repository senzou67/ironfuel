// Capture a PayPal order after buyer approval + save to Firestore
const admin = require('firebase-admin');

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

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

async function getAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const data = await res.json();
    return data.access_token;
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
        const { orderId, subscriptionId, userId, type, plan } = JSON.parse(event.body || '{}');
        const db = getDb();

        // Handle subscription confirmation (from client-side PayPal Buttons)
        if (type === 'subscription' && subscriptionId) {
            if (db) {
                await db.collection('subscriptions').doc(userId || subscriptionId).set({
                    provider: 'paypal',
                    subscriptionId: subscriptionId,
                    plan: plan || 'monthly',
                    status: 'active',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    userId: userId || 'anonymous'
                }, { merge: true });
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: 'ACTIVE', subscriptionId })
            };
        }

        // Handle donation order capture
        if (!orderId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'orderId required' }) };
        }

        const accessToken = await getAccessToken();

        const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const captureData = await captureRes.json();

        if (captureData.status === 'COMPLETED') {
            // Save donation to Firestore
            if (db) {
                const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
                await db.collection('donations').add({
                    provider: 'paypal',
                    orderId: orderId,
                    captureId: capture?.id || '',
                    amount: parseFloat(capture?.amount?.value || '0'),
                    currency: capture?.amount?.currency_code || 'EUR',
                    userId: userId || captureData.purchase_units?.[0]?.custom_id || 'anonymous',
                    status: 'completed',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[PayPal] Donation captured: ${capture?.amount?.value}€ from ${userId}`);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: 'COMPLETED', orderId })
            };
        } else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ status: captureData.status, error: 'Capture not completed' })
            };
        }
    } catch (e) {
        console.error('[PayPal] Capture error:', e);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: e.message })
        };
    }
};
