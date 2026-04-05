import Stripe from 'stripe';
import { verifyAuth, jsonResponse, errorResponse } from './_shared.js';

export async function onRequestPost(context) {
    const { env, request } = context;
    const STRIPE_KEY = env.STRIPE_SECRET_KEY;
    if (!STRIPE_KEY) return errorResponse('Stripe not configured');

    if (!await verifyAuth(request, env)) {
        return errorResponse('Auth required', 401);
    }

    try {
        const stripe = new Stripe(STRIPE_KEY);
        const { email } = await request.json();
        if (!email) return errorResponse('Email required', 400);

        const customers = await stripe.customers.list({ email, limit: 1 });
        if (!customers.data.length) {
            return errorResponse('No subscription found for this email', 404);
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customers.data[0].id,
            return_url: (env.URL || 'https://1food.fr') + '/index.html#settings'
        });

        return jsonResponse({ url: session.url });
    } catch (err) {
        return errorResponse('Failed to create portal session');
    }
}
