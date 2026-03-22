// Verify a Stripe Checkout session status
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) console.error('STRIPE_SECRET_KEY is not set');
const stripe = STRIPE_KEY ? require('stripe')(STRIPE_KEY) : null;

const ALLOWED_ORIGIN = process.env.URL || 'https://theironfuel.netlify.app';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
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
            body: JSON.stringify({ error: err.message })
        };
    }
};
