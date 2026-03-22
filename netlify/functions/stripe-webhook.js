// Stripe Webhook — handles subscription & donation events, saves to Firestore
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set');
}
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Init Firebase Admin (once per cold start)
if (!admin.apps.length) {
    try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(sa),
            projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID
        });
    } catch (e) {
        console.error('Firebase Admin init failed:', e.message);
    }
}

function getDb() {
    try { return admin.firestore(); } catch { return null; }
}

const ALLOWED_ORIGIN = process.env.URL || 'https://theironfuel.netlify.app';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method not allowed' };
    }

    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let stripeEvent;

    try {
        if (!webhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET not set — rejecting webhook');
            return { statusCode: 500, headers, body: 'Webhook secret not configured' };
        }
        if (!sig) {
            return { statusCode: 400, headers, body: 'Missing stripe-signature header' };
        }
        stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return { statusCode: 400, headers, body: `Webhook Error: ${err.message}` };
    }

    const type = stripeEvent.type;
    const obj = stripeEvent.data.object;
    const db = getDb();

    try {
        switch (type) {
            case 'checkout.session.completed': {
                const meta = obj.metadata || {};
                const email = obj.customer_email || obj.customer_details?.email || null;
                const userId = meta.userId || 'anonymous';

                // === DONATION ===
                if (meta.type === 'donation') {
                    const amount = parseFloat(meta.amount) || (obj.amount_total / 100);
                    console.log('💝 Donation received:', { email, userId, amount });

                    if (db) {
                        await db.collection('donations').add({
                            userId,
                            email: email || null,
                            amount,
                            currency: 'eur',
                            message: meta.message || null,
                            stripeSessionId: obj.id,
                            stripePaymentIntentId: obj.payment_intent || null,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log('✅ Donation saved to Firestore');
                    }

                    // Save email to emails collection
                    if (db && email) {
                        await _saveEmail(db, email, userId, 'donation');
                    }
                    break;
                }

                // === SUBSCRIPTION ===
                console.log('🔔 Subscription started:', {
                    sessionId: obj.id,
                    email,
                    userId,
                    plan: meta.plan,
                    subscriptionId: obj.subscription
                });

                if (db) {
                    await db.collection('subscriptions').doc(userId).set({
                        userId,
                        email: email || null,
                        plan: meta.plan || 'annual',
                        stripeSessionId: obj.id,
                        stripeSubscriptionId: obj.subscription || null,
                        stripeCustomerId: obj.customer || null,
                        status: 'active',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    console.log('✅ Subscription saved to Firestore');
                }

                // Save email
                if (db && email) {
                    await _saveEmail(db, email, userId, 'subscription');
                }
                break;
            }

            case 'invoice.paid': {
                const email = obj.customer_email;
                const subId = obj.subscription;
                const amount = obj.amount_paid;
                console.log('💰 Invoice paid:', { email, subId, amount });

                if (db && subId) {
                    // Find subscription doc by stripeSubscriptionId
                    const snap = await db.collection('subscriptions')
                        .where('stripeSubscriptionId', '==', subId)
                        .limit(1).get();

                    if (!snap.empty) {
                        const docRef = snap.docs[0].ref;
                        await docRef.update({
                            status: 'active',
                            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
                            lastAmountPaid: amount,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log('✅ Subscription renewal recorded');
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                const subId = obj.subscription;
                console.log('❌ Payment failed:', { subId, email: obj.customer_email });

                if (db && subId) {
                    const snap = await db.collection('subscriptions')
                        .where('stripeSubscriptionId', '==', subId)
                        .limit(1).get();

                    if (!snap.empty) {
                        await snap.docs[0].ref.update({
                            status: 'payment_failed',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subId = obj.id;
                console.log('🚫 Subscription cancelled:', { subId, email: obj.customer_email });

                if (db) {
                    const snap = await db.collection('subscriptions')
                        .where('stripeSubscriptionId', '==', subId)
                        .limit(1).get();

                    if (!snap.empty) {
                        await snap.docs[0].ref.update({
                            status: 'cancelled',
                            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subId = obj.id;
                console.log('🔄 Subscription updated:', { subId, status: obj.status });

                if (db) {
                    const snap = await db.collection('subscriptions')
                        .where('stripeSubscriptionId', '==', subId)
                        .limit(1).get();

                    if (!snap.empty) {
                        await snap.docs[0].ref.update({
                            status: obj.status,
                            cancelAtPeriodEnd: obj.cancel_at_period_end || false,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
                break;
            }

            default:
                console.log('Unhandled event:', type);
        }
    } catch (err) {
        console.error('Webhook processing error:', err.message);
        // Still return 200 to prevent Stripe retries on our errors
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
};

// === Save email to 'emails' collection (deduplicated by email) ===
async function _saveEmail(db, email, userId, source) {
    try {
        const emailKey = email.toLowerCase().trim();
        const docRef = db.collection('emails').doc(emailKey.replace(/[^a-z0-9@._-]/g, '_'));

        await docRef.set({
            email: emailKey,
            userId: userId || 'anonymous',
            source,
            lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Email saved:', emailKey);
    } catch (err) {
        console.error('Email save failed:', err.message);
    }
}
