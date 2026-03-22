// Stripe Customer Portal — manage subscription, cancel, update payment
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_KEY ? require('stripe')(STRIPE_KEY) : null;

const ALLOWED_ORIGIN = process.env.URL || 'https://theironfuel.netlify.app';
const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    if (!stripe) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe not configured' }) };
    }

    try {
        const { email } = JSON.parse(event.body || '{}');

        if (!email) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };
        }

        // Find customer by email
        const customers = await stripe.customers.list({ email, limit: 1 });

        if (!customers.data.length) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'No subscription found for this email' })
            };
        }

        const customer = customers.data[0];

        // Create portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: ALLOWED_ORIGIN + '/index.html#settings'
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ url: session.url })
        };
    } catch (err) {
        console.error('Portal session error:', err.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create portal session' })
        };
    }
};
