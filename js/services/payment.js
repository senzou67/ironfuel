// ===== PAYMENT SERVICE — provider-agnostic facade =====
//
// Single entry point for ALL subscription / billing operations across the app.
// Callers (TrialService, SettingsPage, paywall buttons…) MUST go through this
// service instead of touching Stripe / RevenueCat / native IAP directly.
//
// The goal: when we eventually want to migrate away from RevenueCat to a
// direct StoreKit / Play Billing implementation, we only swap the provider
// file (services/payment-revenuecat.js → payment-native.js) without touching
// any UI or business logic.
//
// Routing rule:
//   - Native (Android/iOS, detected via Capacitor) → mobile provider (RevenueCat)
//   - Web (PWA, browser) → Stripe checkout
//   - Donations → ALWAYS Stripe (one-time payments aren't subject to IAP rules)
//
// Server-side, every provider's webhook normalizes its payload into the same
// Firestore document shape (`subscriptions/{userId}` or `users/{userId}`)
// so the rest of the app reads ONE consistent state regardless of provider.
const PaymentService = {
    _provider: null,

    _isNative() {
        try {
            return typeof Capacitor !== 'undefined'
                && typeof Capacitor.isNativePlatform === 'function'
                && Capacitor.isNativePlatform();
        } catch { return false; }
    },

    _getProvider() {
        if (this._provider) return this._provider;
        // Native + RevenueCat available → use it.
        // Otherwise fall back to web Stripe (works in PWA + native if RC not yet wired).
        if (this._isNative() && typeof RevenueCatPaymentService !== 'undefined' && RevenueCatPaymentService) {
            this._provider = RevenueCatPaymentService;
        } else {
            this._provider = StripePaymentService;
        }
        return this._provider;
    },

    // -- Public API (the contract the rest of the app depends on) --

    async subscribe(opts) {
        return this._getProvider().subscribe(opts || {});
    },

    // Donations always go through Stripe — Apple/Google IAP is for digital subscriptions only.
    async donate(opts) {
        return StripePaymentService.donate(opts || {});
    },

    async manage(opts) {
        const p = this._getProvider();
        if (typeof p.manage !== 'function') throw new Error('Gestion d\'abonnement indisponible.');
        return p.manage(opts || {});
    },

    async restore(opts) {
        const p = this._getProvider();
        if (typeof p.restore !== 'function') return null;
        return p.restore(opts || {});
    }
};
