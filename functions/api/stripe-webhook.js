import Stripe from 'stripe';
import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';

const VALID_PLANS = ['monthly', 'annual', 'lifetime'];

async function notifyAdmin(db, adminUid, title, body) {
    if (!db || !adminUid) return;
    try {
        const doc = await db.collection('users').doc(adminUid).get();
        const token = doc.data()?.fcmToken;
        if (token) {
            await admin.messaging().send({
                token,
                notification: { title, body },
                webpush: { notification: { icon: '/assets/icons/icon-192.png', tag: 'admin-payment' }, fcm_options: { link: '/admin.html' } }
            });
        }
    } catch {}
}

async function saveEmail(db, email, userId, source) {
    try {
        const emailKey = email.toLowerCase().trim();
        const docRef = db.collection('emails').doc(emailKey.replace(/[^a-z0-9@._-]/g, '_'));
        await docRef.set({
            email: emailKey, userId: userId || 'anonymous', source,
            lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch {}
}

export async function onRequestPost(context) {
    const { env, request } = context;
    initFirebase(env);

    const STRIPE_KEY = env.STRIPE_SECRET_KEY;
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
    if (!STRIPE_KEY || !webhookSecret) return errorResponse('Webhook not configured');

    const stripe = new Stripe(STRIPE_KEY);
    const sig = request.headers.get('stripe-signature');
    if (!sig) return errorResponse('Missing stripe-signature header', 400);

    const rawBody = await request.text();
    let stripeEvent;
    try {
        stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
        return errorResponse(`Webhook Error: ${err.message}`, 400);
    }

    const type = stripeEvent.type;
    const obj = stripeEvent.data.object;
    const db = getDb(env);

    // Idempotency: Stripe retries up to 6x over 3 days. `create()` is atomic
    // and fails with code 6 (ALREADY_EXISTS) if the event was already received.
    let eventRef = null;
    if (db) {
        eventRef = db.collection('webhook_events').doc(stripeEvent.id);
        try {
            await eventRef.create({
                provider: 'stripe',
                type,
                receivedAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'processing'
            });
        } catch (err) {
            if (err.code === 6 /* ALREADY_EXISTS */) {
                return jsonResponse({ received: true, duplicate: true });
            }
            console.error('[stripe-webhook] idempotency check failed:', err.message);
        }
    }

    let processingError = null;
    try {
        switch (type) {
            case 'checkout.session.completed': {
                const meta = obj.metadata || {};
                const email = obj.customer_email || obj.customer_details?.email || null;
                const userId = meta.userId || 'anonymous';

                if (meta.type === 'donation') {
                    // Authoritative amount from Stripe (NEVER from client metadata —
                    // client could spoof meta.amount to inflate the donation log).
                    const amount = (obj.amount_total || 0) / 100;
                    if (amount <= 0) {
                        processingError = 'Donation rejected: zero amount';
                        break;
                    }
                    if (db) {
                        await db.collection('donations').add({
                            userId, email: email || null, amount, currency: 'eur',
                            message: (meta.message || '').substring(0, 500),
                            stripeSessionId: obj.id,
                            stripePaymentIntentId: obj.payment_intent || null,
                            stripeEventId: stripeEvent.id,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        await notifyAdmin(db, env.ADMIN_UID, '💝 Don reçu !', `${amount}€ de ${email || 'anonyme'}`);
                    }
                    if (db && email) await saveEmail(db, email, userId, 'donation');
                    break;
                }

                // Subscription branch: reject anonymous to avoid doc collision on
                // `subscriptions/anonymous` (all anon subs would overwrite each other).
                if (userId === 'anonymous') {
                    processingError = `Subscription rejected: missing userId metadata (session=${obj.id})`;
                    await notifyAdmin(db, env.ADMIN_UID, '⚠️ Webhook problème', `Subscription sans userId — session ${obj.id}, email ${email || 'inconnu'}`);
                    break;
                }

                // Validate plan against allowlist (don't trust client metadata).
                const plan = VALID_PLANS.includes(meta.plan) ? meta.plan : 'annual';

                if (db) {
                    await db.collection('subscriptions').doc(userId).set({
                        userId, email: email || null, plan,
                        stripeSessionId: obj.id, stripeSubscriptionId: obj.subscription || null,
                        stripeCustomerId: obj.customer || null, status: 'active',
                        provider: 'stripe',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    await notifyAdmin(db, env.ADMIN_UID, '⭐ Nouvel abonnement !', `${plan} — ${email || 'anonyme'}`);
                }
                if (db && email) await saveEmail(db, email, userId, 'subscription');
                break;
            }
            case 'invoice.paid': {
                const subId = obj.subscription;
                if (db && subId) {
                    const snap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', subId).limit(1).get();
                    if (!snap.empty) {
                        await snap.docs[0].ref.update({
                            status: 'active', lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
                            lastAmountPaid: obj.amount_paid, updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        // Race: invoice.paid arrived before checkout.session.completed.
                        // Don't fail (Stripe would retry forever); the checkout handler
                        // will set status=active when it arrives. Log for audit.
                        console.warn(`[stripe-webhook] invoice.paid: no subscription doc yet for ${subId} (race condition, will catch up)`);
                    }
                }
                break;
            }
            case 'invoice.payment_failed': {
                const subId = obj.subscription;
                if (db && subId) {
                    const snap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', subId).limit(1).get();
                    if (!snap.empty) await snap.docs[0].ref.update({ status: 'payment_failed', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subId = obj.id;
                if (db) {
                    const snap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', subId).limit(1).get();
                    if (!snap.empty) await snap.docs[0].ref.update({ status: 'cancelled', cancelledAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subId = obj.id;
                if (db) {
                    const snap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', subId).limit(1).get();
                    if (!snap.empty) await snap.docs[0].ref.update({ status: obj.status, cancelAtPeriodEnd: obj.cancel_at_period_end || false, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                }
                break;
            }
        }
    } catch (err) {
        processingError = err.message;
        console.error('[stripe-webhook] processing error:', err.message, { type, eventId: stripeEvent.id, stack: err.stack });
    }

    if (eventRef) {
        try {
            await eventRef.update({
                status: processingError ? 'error' : 'completed',
                error: processingError || null,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch {}
    }

    // Always 200 to Stripe: non-200 triggers retries, but our processing errors
    // are not network-recoverable (they're logic errors). The webhook_events
    // collection captures failures for manual replay.
    return jsonResponse({ received: true });
}
