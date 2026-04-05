import Stripe from 'stripe';
import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';

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

    try {
        switch (type) {
            case 'checkout.session.completed': {
                const meta = obj.metadata || {};
                const email = obj.customer_email || obj.customer_details?.email || null;
                const userId = meta.userId || 'anonymous';

                if (meta.type === 'donation') {
                    const amount = parseFloat(meta.amount) || (obj.amount_total / 100);
                    if (db) {
                        await db.collection('donations').add({
                            userId, email: email || null, amount, currency: 'eur',
                            message: meta.message || null, stripeSessionId: obj.id,
                            stripePaymentIntentId: obj.payment_intent || null,
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        await notifyAdmin(db, env.ADMIN_UID, '💝 Don reçu !', `${amount}€ de ${email || 'anonyme'}`);
                    }
                    if (db && email) await saveEmail(db, email, userId, 'donation');
                    break;
                }

                if (db) {
                    await db.collection('subscriptions').doc(userId).set({
                        userId, email: email || null, plan: meta.plan || 'annual',
                        stripeSessionId: obj.id, stripeSubscriptionId: obj.subscription || null,
                        stripeCustomerId: obj.customer || null, status: 'active',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    await notifyAdmin(db, env.ADMIN_UID, '⭐ Nouvel abonnement !', `${meta.plan || 'annual'} — ${email || 'anonyme'}`);
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
        console.error('Webhook processing error:', err.message);
    }

    return jsonResponse({ received: true });
}
