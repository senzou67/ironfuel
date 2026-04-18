import Stripe from 'stripe';
import { jsonResponse, errorResponse } from './_shared.js';

function _mapStripeError(err) {
    const msg = (err && err.message) || '';
    if (err && err.type === 'StripeAuthenticationError') return 'Paiement indisponible — contacte contact@1food.fr';
    if (/price|STRIPE_PRICE/i.test(msg)) return 'Configuration de prix invalide. Contacte le support.';
    if (/email/i.test(msg)) return 'Adresse e-mail invalide.';
    if (/currency/i.test(msg)) return 'Devise non supportée.';
    if (/amount/i.test(msg)) return 'Montant invalide.';
    return 'Paiement indisponible — réessaie dans quelques instants.';
}

export async function onRequestPost(context) {
    const { env, request } = context;
    const STRIPE_KEY = env.STRIPE_SECRET_KEY;
    if (!STRIPE_KEY) return errorResponse('Paiement non configuré. Contacte le support.', 503);

    const stripe = new Stripe(STRIPE_KEY);
    const siteUrl = env.URL || 'https://1food.fr';

    let body;
    try { body = await request.json(); }
    catch { return errorResponse('Requête invalide.', 400); }
    const { userId, email, skipTrial, plan, mode, amount, message } = body || {};

    try {

        // === DONATION ===
        if (mode === 'donation') {
            const donationAmount = amount || 5;
            if (donationAmount < 0.50 || donationAmount > 500) {
                return errorResponse('Le montant doit être entre 0.50€ et 500€.', 400);
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                phone_number_collection: { enabled: false },
                billing_address_collection: 'required',
                line_items: [{ price_data: { currency: 'eur', product_data: { name: `Don OneFood — ${donationAmount}€`, description: 'Merci pour votre soutien ❤️' }, unit_amount: Math.round(donationAmount * 100) }, quantity: 1 }],
                mode: 'payment',
                customer_email: email || undefined,
                payment_intent_data: { statement_descriptor: 'ONEFOOD', statement_descriptor_suffix: 'DON' },
                metadata: { userId: userId || 'anonymous', type: 'donation', amount: String(donationAmount), message: (message || '').substring(0, 500) },
                success_url: `${siteUrl}/?payment=donation_success`,
                cancel_url: `${siteUrl}/?payment=cancel`
            });

            return jsonResponse({ url: session.url, sessionId: session.id });
        }

        // === SUBSCRIPTION ===
        const isMonthly = plan === 'monthly';
        let priceId = isMonthly ? env.STRIPE_PRICE_MONTHLY_ID : env.STRIPE_PRICE_ID;

        if (!priceId) {
            const product = await stripe.products.create({
                name: isMonthly ? 'OneFood Premium Mensuel' : 'OneFood Premium Annuel',
                description: 'Suivi nutrition, Photo IA, Avatar, Boutique — Accès complet.'
            });
            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: isMonthly ? 399 : 1499,
                currency: 'eur',
                recurring: { interval: isMonthly ? 'month' : 'year' }
            });
            priceId = price.id;
        }

        const sessionParams = {
            payment_method_types: ['card'],
            phone_number_collection: { enabled: false },
            billing_address_collection: 'required',
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${siteUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}&plan=${plan || 'annual'}`,
            cancel_url: `${siteUrl}/?payment=cancel`,
            metadata: { userId: userId || 'anonymous', app: 'onefood', plan: plan || 'annual' },
            subscription_data: {
                trial_period_days: skipTrial ? undefined : 14,
                description: 'OneFood Premium',
                metadata: { userId: userId || 'anonymous', app: 'onefood', plan: plan || 'annual' }
            }
        };
        if (email) sessionParams.customer_email = email;

        const session = await stripe.checkout.sessions.create(sessionParams);
        return jsonResponse({ url: session.url, sessionId: session.id });
    } catch (err) {
        console.error('[create-checkout] Stripe error:', err?.type, err?.message, err?.raw?.message, { plan, mode, hasEmail: !!email });
        return errorResponse(_mapStripeError(err), 500);
    }
}
