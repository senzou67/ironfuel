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
        const { sessionId } = await request.json();
        if (!sessionId) return errorResponse('Missing sessionId', 400);

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return jsonResponse({
            paid: session.payment_status === 'paid',
            email: session.customer_email,
            userId: session.metadata?.userId
        });
    } catch (err) {
        return errorResponse('Verification failed');
    }
}
