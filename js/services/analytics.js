// Firebase Analytics + Ad Management Service
const AnalyticsService = {
    _initialized: false,

    init() {
        if (this._initialized) return;
        this._initialized = true;

        // Initialize Firebase Analytics if available and properly configured
        try {
            if (typeof firebase !== 'undefined' && firebase.app()) {
                const config = firebase.app().options || {};
                // Analytics requires appId and measurementId
                if (!config.appId || !config.measurementId) {
                    // Silently skip — not configured yet
                    return;
                }
                // Load analytics module dynamically
                const script = document.createElement('script');
                script.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics-compat.js';
                script.onload = () => {
                    try {
                        firebase.analytics();
                        this._logEvent('app_open', {
                            version: 'v53',
                            platform: this._getPlatform()
                        });
                    } catch { /* silent */ }
                };
                document.head.appendChild(script);
            }
        } catch { /* silent */ }

        // Initialize ads for non-premium users
        this._initAds();
    },

    // === ANALYTICS TRACKING ===

    logPageView(page) {
        this._logEvent('page_view', { page_name: page });
    },

    logFoodAdded(foodName, mealType, method) {
        this._logEvent('food_added', {
            food_name: foodName,
            meal_type: mealType,
            method: method || 'search' // search, voice, camera, barcode
        });
    },

    logSearch(query, resultCount) {
        this._logEvent('search', {
            search_term: query,
            result_count: resultCount
        });
    },

    logWaterAdded(currentAmount, goal) {
        this._logEvent('water_added', {
            current_liters: currentAmount,
            goal_liters: goal
        });
    },

    logSubscription(plan, action) {
        this._logEvent('subscription_action', {
            plan: plan,
            action: action // 'start_trial', 'subscribe', 'cancel'
        });
    },

    logDonation(amount) {
        this._logEvent('donation', { amount: amount, currency: 'EUR' });
    },

    logAvatarChange(itemType, itemId) {
        this._logEvent('avatar_change', {
            item_type: itemType,
            item_id: itemId
        });
    },

    _logEvent(name, params) {
        try {
            if (typeof firebase !== 'undefined' && firebase.analytics) {
                firebase.analytics().logEvent(name, params || {});
            }
        } catch { /* silent */ }
    },

    _getPlatform() {
        if (window.matchMedia('(display-mode: standalone)').matches) return 'pwa';
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'ios_browser';
        if (/Android/.test(navigator.userAgent)) return 'android_browser';
        return 'desktop_browser';
    },

    // === AD MANAGEMENT ===
    // Shows banner ads for non-premium users
    // Uses Google AdSense for web (AdMob is for native apps only)

    _adInitialized: false,
    _adSlotId: null, // Set your AdSense slot ID here

    _initAds() {
        // Only show ads to non-premium users
        if (typeof TrialService !== 'undefined' && TrialService.isPaid()) {
            this._removeAds();
            return;
        }

        // Check if AdSense publisher ID is configured
        const publisherId = this._getAdConfig().publisherId;
        if (!publisherId) return; // Not configured yet — silent skip

        // Load Google AdSense script
        if (!this._adInitialized) {
            this._adInitialized = true;
            const script = document.createElement('script');
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
            script.crossOrigin = 'anonymous';
            script.async = true;
            document.head.appendChild(script);
        }
    },

    // Show a banner ad in a container element
    showBannerAd(containerId) {
        // Don't show ads to premium users
        if (typeof TrialService !== 'undefined' && TrialService.isPaid()) return;

        const config = this._getAdConfig();
        if (!config.publisherId || !config.bannerSlot) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="ad-banner" style="text-align:center;margin:8px 0;min-height:50px">
                <ins class="adsbygoogle"
                    style="display:block"
                    data-ad-client="${config.publisherId}"
                    data-ad-slot="${config.bannerSlot}"
                    data-ad-format="auto"
                    data-full-width-responsive="true"></ins>
            </div>
        `;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch { /* ad blocked or not loaded */ }
    },

    _removeAds() {
        // Remove all ad banners when user goes premium
        document.querySelectorAll('.ad-banner').forEach(el => el.remove());
    },

    _getAdConfig() {
        return Storage._get('ad_config', {
            publisherId: '', // e.g. 'ca-pub-XXXXXXXXXXXXXXXX'
            bannerSlot: ''   // e.g. '1234567890'
        });
    },

    // Call this when user's premium status changes
    onPremiumStatusChanged(isPremium) {
        if (isPremium) {
            this._removeAds();
        } else {
            this._initAds();
        }
    }
};
