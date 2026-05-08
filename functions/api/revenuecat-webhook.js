// ===== REVENUECAT WEBHOOK =====
// Receives subscription events from RevenueCat and writes a normalized
// shape into Firestore at subscriptions/{userId}.
//
// CRITICAL: the document shape stored here MUST match what stripe-webhook.js
// writes — TrialService and the rest of the app read this collection
// without knowing which provider produced the row. Adding fields specific
// to RevenueCat (entitlement_identifier, etc.) here would leak provider
// detail and make a future migration painful.
//
// Event types handled (RevenueCat normalizes Apple/Google notifications):
//   INITIAL_PURCHASE      — first purchase by this user
//   RENEWAL               — auto-renewal succeeded
//   CANCELLATION          — user turned off renewal (still active until expiresAt)
//   UNCANCELLATION        — user re-enabled renewal
//   NON_RENEWING_PURCHASE — one-off (we don't use)
//   EXPIRATION            — subscription actually ended
//   BILLING_ISSUE         — payment retry needed
//   PRODUCT_CHANGE        — switched plan (annual ↔ monthly)
//   TRANSFER              — moved to another account
//
// Reference: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
import admin from 'firebase-admin';
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';

// Map RevenueCat product identifiers → our internal plan label.
// MUST match the package identifiers configured in
// js/services/payment-revenuecat.js _packageIdFor().
function _planFromProduct(productId) {
    if (!productId) return 'annual';
    const id = String(productId).toLowerCase();
    if (id.includes('monthly') || id.includes('month')) return 'monthly';
    return 'annual';
}

// Translate a RevenueCat event to our internal subscription status.
// IMPORTANT: this status taxonomy ('active' / 'cancelled' / 'expired' /
// 'payment_failed') is the SAME one stripe-webhook.js uses. Don't introduce
// provider-specific values.
function _statusFromEvent(type) {
    switch (type) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'UNCANCELLATION':
        case 'PRODUCT_CHANGE':
            return 'active';
        case 'CANCELLATION':
            return 'active'; // still active until expiration
        case 'EXPIRATION':
        case 'TRANSFER':
            return 'expired';
        case 'BILLING_ISSUE':
            return 'payment_failed';
        default:
            return null; // unknown event — no state change
    }
}

export async function onRequestPost(context) {
    const { env, request } = context;

    // Auth: RevenueCat sends a configurable Bearer token in the Authorization
    // header. Set REVENUECAT_WEBHOOK_TOKEN as a Cloudflare Worker secret and
    // configure the same value in RevenueCat dashboard → Webhooks.
    const expected = env.REVENUECAT_WEBHOOK_TOKEN;
    if (!expected) return errorResponse('Webhook non configuré.', 503);
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${expected}`) {
        return errorResponse('Auth invalide.', 401);
    }

    initFirebase(env);
    const db = getDb(env);
    if (!db) return errorResponse('Database indisponible.', 503);

    let payload;
    try { payload = await request.json(); }
    catch { return errorResponse('Payload invalide.', 400); }

    const event = payload && payload.event;
    if (!event || !event.type) {
        return jsonResponse({ ok: true, ignored: true });
    }

    const userId = event.app_user_id || event.original_app_user_id;
    if (!userId) {
        console.error('[rc-webhook] Missing app_user_id', event.type);
        return jsonResponse({ ok: true, missingUserId: true });
    }

    const status = _statusFromEvent(event.type);
    if (!status) return jsonResponse({ ok: true, unknownEvent: event.type });

    const plan = _planFromProduct(event.product_id);
    const expiresAtMs = event.expiration_at_ms || null;
    const expiresAt = expiresAtMs ? new Date(parseInt(expiresAtMs)) : null;
    const platform = (event.store || '').toLowerCase().includes('app_store') ? 'apple'
                   : (event.store || '').toLowerCase().includes('play_store') ? 'google'
                   : 'unknown';

    // Normalized subscription document — same shape regardless of provider.
    // Fields prefixed with `rc_` are debug-only and may be removed on migration.
    const update = {
        userId,
        status,
        plan,
        provider: 'revenuecat',
        platform,
        expiresAt: expiresAt ? admin.firestore.Timestamp.fromDate(expiresAt) : null,
        cancelAtPeriodEnd: event.type === 'CANCELLATION',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        rc_event: event.type,
        rc_product: event.product_id || null,
        rc_transactionId: event.transaction_id || null
    };

    try {
        const ref = db.collection('subscriptions').doc(userId);
        if (event.type === 'INITIAL_PURCHASE') {
            update.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }
        await ref.set(update, { merge: true });
    } catch (err) {
        console.error('[rc-webhook] Firestore write failed:', err.message, event.type);
        return errorResponse('Échec d\'enregistrement.', 500);
    }

    return jsonResponse({ ok: true, status, plan });
}
