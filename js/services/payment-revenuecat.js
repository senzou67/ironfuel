// ===== REVENUECAT PAYMENT PROVIDER =====
// Used ONLY on native Capacitor builds (Android Play Billing / iOS StoreKit).
// On web, the plugin isn't registered → PaymentService falls back to Stripe.
//
// Plugin: @revenuecat/purchases-capacitor (added via npm run android:install)
// The plugin is auto-registered by Capacitor at native runtime; we access it
// via window.Capacitor.Plugins.Purchases without an ESM import (so this file
// is safe to load on web — it just never gets invoked).
//
// Migration path: when we eventually drop RevenueCat, replace ONLY this file
// with services/payment-native.js using @capacitor-community/in-app-purchases-2.
// PaymentService router + the rest of the app keep working unchanged.
const RevenueCatPaymentService = {
    _configured: false,

    // RC public API key — environment-specific, replaced per-platform at build time.
    // Get yours from https://app.revenuecat.com → Project Settings → API keys.
    // Apple key (starts appl_…) for iOS, Google key (goog_…) for Android.
    _apiKey() {
        try {
            const platform = window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform();
            if (platform === 'ios') return window.__REVENUECAT_APPLE_KEY__ || '';
            if (platform === 'android') return window.__REVENUECAT_GOOGLE_KEY__ || '';
        } catch {}
        return '';
    },

    async _plugin() {
        const Cap = window.Capacitor;
        const P = Cap && Cap.Plugins && Cap.Plugins.Purchases;
        if (!P) throw new Error('RevenueCat non disponible sur cette plateforme.');
        if (!this._configured) {
            const apiKey = this._apiKey();
            if (!apiKey) throw new Error('Clé RevenueCat non configurée.');
            const userId = (typeof AuthService !== 'undefined' && AuthService.isLoggedIn())
                ? AuthService.getCurrentUser().uid
                : (typeof Storage !== 'undefined' ? Storage._get('device_id', '') : '');
            await P.configure({ apiKey, appUserID: userId || undefined });
            this._configured = true;
        }
        return P;
    },

    // Map our internal plan names → RevenueCat product/package identifiers.
    // These IDs must match what's set in the RevenueCat dashboard offering "default".
    _packageIdFor(plan) {
        return plan === 'monthly' ? 'onefood_monthly' : 'onefood_annual';
    },

    async subscribe({ plan }) {
        const P = await this._plugin();
        const targetId = this._packageIdFor(plan);

        // Pull the current offering and find the matching package
        const offerings = await P.getOfferings();
        const current = offerings && offerings.current;
        if (!current || !current.availablePackages || !current.availablePackages.length) {
            throw new Error('Aucune offre disponible.');
        }
        const pkg = current.availablePackages.find(p => p.identifier === targetId)
                 || current.availablePackages[0];

        // Trigger native purchase sheet (Apple / Google). Promise resolves on completion.
        const result = await P.purchasePackage({ aPackage: pkg });
        const entitlements = result && result.customerInfo && result.customerInfo.entitlements;
        const hasPremium = entitlements && entitlements.active && !!entitlements.active['premium'];

        if (hasPremium) {
            // Optimistic local state — server webhook is the source of truth.
            try { TrialService.markPaid(pkg.identifier, plan || 'annual'); } catch {}
            try { App.showToast('Bienvenue Premium ! 🎉'); } catch {}
        }
        return { status: 'native_complete', hasPremium };
    },

    // Native subscription management = open the platform's subscription page.
    // Apple: itms-apps://… deep link. Google: Play Store subscription URL.
    async manage() {
        const P = await this._plugin();
        if (typeof P.showManageSubscriptions === 'function') {
            await P.showManageSubscriptions();
            return { status: 'native_complete' };
        }
        throw new Error('Gestion d\'abonnement disponible uniquement dans le store natif.');
    },

    // Reapply purchases for users who reinstall or switch device.
    async restore() {
        const P = await this._plugin();
        const customerInfo = await P.restorePurchases();
        const hasPremium = customerInfo
            && customerInfo.entitlements
            && customerInfo.entitlements.active
            && !!customerInfo.entitlements.active['premium'];
        if (hasPremium) {
            try { TrialService.markPaid('restored', 'annual'); } catch {}
        }
        return { status: 'native_complete', hasPremium };
    }
};
