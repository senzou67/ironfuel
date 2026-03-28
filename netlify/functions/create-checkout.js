// Stripe Checkout Session — Subscription (annual/monthly) + Donation
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
        if (!stripe) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe not configured' }) };
        }
        const { userId, email, skipTrial, plan, mode, amount, message } = JSON.parse(event.body || '{}');
        const siteUrl = process.env.URL || 'https://theironfuel.netlify.app';

        // === DONATION (one-time payment) ===
        if (mode === 'donation') {
            const donationAmount = amount || 5;
            if (donationAmount < 0.50 || donationAmount > 500) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Le montant doit être entre 0.50€ et 500€.' })
                };
            }
            const amountCents = Math.round(donationAmount * 100);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                phone_number_collection: { enabled: false },
                billing_address_collection: 'required',
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Don IronFuel — ${donationAmount}€`,
                            description: 'Merci pour votre soutien ❤️'
                        },
                        unit_amount: amountCents
                    },
                    quantity: 1
                }],
                mode: 'payment',
                customer_email: email || undefined,
                payment_intent_data: {
                    statement_descriptor: 'IRONFUEL',
                    statement_descriptor_suffix: 'DON'
                },
                metadata: { userId: userId || 'anonymous', type: 'donation', amount: String(donationAmount), message: (message || '').substring(0, 500) },
                success_url: `${siteUrl}/?payment=donation_success`,
                cancel_url: `${siteUrl}/?payment=cancel`
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ url: session.url, sessionId: session.id })
            };
        }

        // === SUBSCRIPTION ===
        const isMonthly = plan === 'monthly';

        // Use env var price IDs if set, otherwise create on the fly
        let priceId = isMonthly ? process.env.STRIPE_PRICE_MONTHLY_ID : process.env.STRIPE_PRICE_ID;

        if (!priceId) {
            // Create the product + price on the fly
            const productName = isMonthly ? 'IronFuel Premium Mensuel' : 'IronFuel Premium Annuel';
            const product = await stripe.products.create({
                name: productName,
                description: 'Suivi nutrition, Photo IA, Avatar, Boutique — Accès complet.'
            });

            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: isMonthly ? 299 : 1499, // 2.99€/month or 14.99€/year
                currency: 'eur',
                recurring: {
                    interval: isMonthly ? 'month' : 'year'
                }
            });

            priceId = price.id;
            console.log(`Created Stripe Price ID (${isMonthly ? 'monthly' : 'annual'}):`, priceId);
        }

        const sessionParams = {
            payment_method_types: ['card'],
            phone_number_collection: { enabled: false },
            billing_address_collection: 'required',
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'subscription',
            success_url: `${siteUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}&plan=${plan || 'annual'}`,
            cancel_url: `${siteUrl}/?payment=cancel`,
            metadata: {
                userId: userId || 'anonymous',
                app: 'ironfuel',
                plan: plan || 'annual'
            },
            subscription_data: {
                trial_period_days: skipTrial ? undefined : 14,
                description: 'IronFuel Premium',
                metadata: {
                    userId: userId || 'anonymous',
                    app: 'ironfuel',
                    plan: plan || 'annual'
                }
            }
        };

        if (email) {
            sessionParams.customer_email = email;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ url: session.url, sessionId: session.id })
        };
    } catch (err) {
        console.error('Stripe error:', err.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Checkout creation failed' })
        };
    }
};
