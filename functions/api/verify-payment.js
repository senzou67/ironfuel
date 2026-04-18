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
        // For subscriptions with a free trial, payment_status can be 'no_payment_required'
        // (trial active, card on file). Treat a subscription with active/trialing status as paid.
        const isSubscriptionActive = session.mode === 'subscription'
            && (session.status === 'complete' || session.status === 'active')
            && !!session.subscription;
        const isPaidOnetime = session.payment_status === 'paid';
        const isTrialing = session.payment_status === 'no_payment_required';
        return jsonResponse({
            paid: isPaidOnetime || isTrialing || isSubscriptionActive,
            subscription: isSubscriptionActive || isTrialing,
            status: session.status,
            paymentStatus: session.payment_status,
            email: session.customer_email || session.customer_details?.email || null,
            userId: session.metadata?.userId
        });
    } catch (err) {
        console.error('[verify-payment] Stripe error:', err?.type, err?.message);
        return errorResponse('Vérification impossible. Réessaie ou contacte contact@1food.fr.', 500);
    }
}
