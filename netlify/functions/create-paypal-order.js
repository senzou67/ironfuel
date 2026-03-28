// Create PayPal order for donations or subscription redirect
const https = require('https');

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;

    if (!clientId || !secret) throw new Error('PayPal credentials not configured');

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
    if (!data.access_token) throw new Error('Failed to get PayPal access token');
    return data.access_token;
}

const ALLOWED_ORIGIN = process.env.URL || 'https://theonefood.netlify.app';

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
        const { mode, amount, userId, message } = JSON.parse(event.body || '{}');

        if (mode === 'donation') {
            // Create a one-time donation order
            const donationAmount = parseFloat(amount) || 5;
            if (donationAmount < 0.50) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Le montant minimum est de 0.50€' })
                };
            }

            const accessToken = await getAccessToken();

            const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [{
                        amount: {
                            currency_code: 'EUR',
                            value: donationAmount.toFixed(2)
                        },
                        description: 'Don OneFood',
                        custom_id: userId || 'anonymous',
                        soft_descriptor: 'ONEFOOD'
                    }],
                    application_context: {
                        brand_name: 'OneFood',
                        locale: 'fr-FR',
                        landing_page: 'NO_PREFERENCE',
                        user_action: 'PAY_NOW',
                        return_url: `${process.env.URL || 'https://onefood.netlify.app'}/?payment=paypal_success`,
                        cancel_url: `${process.env.URL || 'https://onefood.netlify.app'}/?payment=cancel`
                    }
                })
            });

            const orderData = await orderRes.json();

            if (orderData.id) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ orderId: orderData.id })
                };
            } else {
                throw new Error(orderData.message || 'Failed to create PayPal order');
            }
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Mode invalide. Utilisez mode=donation' })
        };
    } catch (e) {
        console.error('[PayPal] Create order error:', e);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: e.message })
        };
    }
};
