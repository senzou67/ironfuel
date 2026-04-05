import { jsonResponse, errorResponse } from './_shared.js';

async function getAccessToken(env) {
    const clientId = env.PAYPAL_CLIENT_ID;
    const secret = env.PAYPAL_SECRET;
    if (!clientId || !secret) throw new Error('PayPal credentials not configured');

    const PAYPAL_API = env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const auth = btoa(`${clientId}:${secret}`);

    const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials'
    });
    const data = await res.json();
    if (!data.access_token) throw new Error('Failed to get PayPal access token');
    return data.access_token;
}

export async function onRequestPost(context) {
    const { env, request } = context;
    const PAYPAL_API = env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const siteUrl = env.URL || 'https://1food.fr';

    try {
        const { mode, amount, userId } = await request.json();

        if (mode === 'donation') {
            const donationAmount = parseFloat(amount) || 5;
            if (donationAmount < 0.50) return errorResponse('Le montant minimum est de 0.50€', 400);

            const accessToken = await getAccessToken(env);
            const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [{ amount: { currency_code: 'EUR', value: donationAmount.toFixed(2) }, description: 'Don OneFood', custom_id: userId || 'anonymous', soft_descriptor: 'ONEFOOD' }],
                    application_context: { brand_name: 'OneFood', locale: 'fr-FR', landing_page: 'NO_PREFERENCE', user_action: 'PAY_NOW', return_url: `${siteUrl}/?payment=paypal_success`, cancel_url: `${siteUrl}/?payment=cancel` }
                })
            });
            const orderData = await orderRes.json();
            if (orderData.id) return jsonResponse({ orderId: orderData.id });
            throw new Error(orderData.message || 'Failed to create PayPal order');
        }

        return errorResponse('Mode invalide. Utilisez mode=donation', 400);
    } catch (e) {
        return errorResponse(e.message);
    }
}
