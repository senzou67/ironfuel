// Verify a Stripe Checkout session status
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) console.error('STRIPE_SECRET_KEY is not set');
const stripe = STRIPE_KEY ? require('stripe')(STRIPE_KEY) : null;

const ALLOWED_ORIGIN = process.env.URL || 'https://theironfuel.netlify.app';

const admin = (() => {
    try {
        const a = require('firebase-admin');
        if (!a.apps.length) {
            const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (sa) a.initializeApp({ credential: a.credential.cert(JSON.parse(sa)) });
        }
        return a.apps.length ? a : null;
    } catch { return null; }
})();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Require Firebase auth
    if (admin) {
        const authHeader = event.headers.authorization || event.headers.Authorization || '';
        const token = authHeader.replace('Bearer ', '');
        if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Auth required' }) };
        try { await admin.auth().verifyIdToken(token); }
        catch (e) { return { statusCode: 403, headers, body: JSON.stringify({ error: 'Invalid token' }) }; }
    }

    try {
        const { sessionId } = JSON.parse(event.body || '{}');
        if (!sessionId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing sessionId' }) };
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                paid: session.payment_status === 'paid',
                email: session.customer_email,
                userId: session.metadata?.userId
            })
        };
    } catch (err) {
        console.error('Verify payment error:', err.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Verification failed' })
        };
    }
};
