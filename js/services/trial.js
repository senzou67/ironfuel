// ===== TRIAL & PAYMENT SERVICE =====
// Foodvisor-style: 2 weeks free full access, then limited (freemium)
const TrialService = {
    TRIAL_DAYS: 14,
    SUBSCRIPTION_DAYS: 365,
    PRICE_ANNUAL: '14,99€',
    PRICE_MONTHLY: '1,25€',
    _serverChecked: false,

    // === PREMIUM FEATURES (locked after trial for free users) ===
    PREMIUM_FEATURES: ['creature', 'custom_macros', 'camera', 'voice', 'barcode'],

    init() {
        const data = this._getData();
        if (!data.startDate) {
            data.startDate = new Date().toISOString();
            this._setData(data);
        }
    },

    _getData() {
        return Storage._get('trial', {
            startDate: null,
            paid: false,
            paymentId: null,
            paidDate: null,
            hasCard: false,
            plan: null // 'annual' or 'monthly'
        });
    },

    _setData(data) {
        Storage._set('trial', data);
    },

    isPaid() {
        const data = this._getData();
        if (!data.paid) return false;
        if (data.paidDate) {
            const paidDate = new Date(data.paidDate);
            const now = new Date();
            const daysSincePaid = Math.floor((now - paidDate) / (1000 * 60 * 60 * 24));
            const subDays = data.plan === 'monthly' ? 31 : this.SUBSCRIPTION_DAYS;
            if (daysSincePaid >= subDays) return false;
        }
        // Server verification flag — only revoke if no legitimate payment proof
        // Stripe/PayPal payments have a real paymentId; server IP check can't override those
        // (IP changes on mobile → server loses track → must not revoke real payments)
        if (data._serverRevoked) {
            if (data.paymentId && data.paymentId !== 'manual') {
                // Has real payment — clear stale server revoke flag
                data._serverRevoked = false;
                this._setData(data);
            } else {
                return false;
            }
        }
        return true;
    },

    hasCard() {
        return this._getData().hasCard === true;
    },

    isSubscriptionExpired() {
        const data = this._getData();
        if (!data.paid || !data.paidDate) return false;
        const paidDate = new Date(data.paidDate);
        const now = new Date();
        const daysSincePaid = Math.floor((now - paidDate) / (1000 * 60 * 60 * 24));
        const subDays = data.plan === 'monthly' ? 31 : this.SUBSCRIPTION_DAYS;
        return daysSincePaid >= subDays;
    },

    subscriptionDaysLeft() {
        const data = this._getData();
        if (!data.paid || !data.paidDate) return 0;
        const paidDate = new Date(data.paidDate);
        const now = new Date();
        const daysSincePaid = Math.floor((now - paidDate) / (1000 * 60 * 60 * 24));
        const subDays = data.plan === 'monthly' ? 31 : this.SUBSCRIPTION_DAYS;
        return Math.max(0, subDays - daysSincePaid);
    },

    daysLeft() {
        const data = this._getData();
        if (!data.startDate) return this.TRIAL_DAYS;
        const start = new Date(data.startDate);
        const now = new Date();
        const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        return Math.max(0, this.TRIAL_DAYS - elapsed);
    },

    isTrialActive() {
        return this.daysLeft() > 0;
    },

    // Always allow basic app access (food logging, search, diary, history)
    hasAccess() {
        return true;
    },

    // Full premium access (creature, custom macros, AI features)
    hasFullAccess() {
        if (this.isPaid()) return true;
        if (this.isTrialActive()) return true;
        return false;
    },

    // Check if a specific premium feature is available
    isFeatureLocked(feature) {
        if (this.hasFullAccess()) return false;
        return this.PREMIUM_FEATURES.includes(feature);
    },

    markPaid(paymentId, plan) {
        const data = this._getData();
        data.paid = true;
        data.hasCard = true;
        data.paymentId = paymentId || 'manual';
        data.paidDate = new Date().toISOString();
        data.plan = plan || 'annual';
        this._setData(data);
        this._serverAction('paid');
    },

    markCardRegistered() {
        const data = this._getData();
        data.hasCard = true;
        this._setData(data);
    },

    getStatusText() {
        if (this.isPaid()) {
            const data = this._getData();
            const subDays = this.subscriptionDaysLeft();
            const planLabel = data.plan === 'monthly' ? 'mensuel' : 'annuel';
            if (subDays <= 30) return `Premium ${planLabel} — renouvellement dans ${subDays}j`;
            const months = Math.floor(subDays / 30);
            return `Premium — ${months} mois restants ✅`;
        }
        if (this.isSubscriptionExpired()) return 'Abonnement expiré';
        const days = this.daysLeft();
        if (days > 0) {
            return `Essai gratuit — ${days}j restants`;
        }
        return 'Version gratuite';
    },

    // === SERVER-SIDE IP CHECK ===
    async checkServerTrial() {
        try {
            const userId = AuthService.isLoggedIn()
                ? AuthService.getCurrentUser().uid
                : Storage._get('device_id', this._generateDeviceId());

            const res = await fetch('/.netlify/functions/trial-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check', userId })
            });

            const data = await res.json();
            this._serverChecked = true;

            if (data.paid) {
                // Server confirms paid — trust server
                const local = this._getData();
                local._serverRevoked = false;
                this._setData(local);
                if (!this.isPaid()) this.markPaid('server-verified', data.plan || 'annual');
                return true;
            }

            // Server says NOT paid — only revoke if no legitimate Stripe/PayPal payment
            // IP-based check can't reliably track paid status (IP changes on mobile)
            if (!data.paid && this._getData().paid) {
                const local = this._getData();
                if (!local.paymentId || local.paymentId === 'manual') {
                    local._serverRevoked = true;
                    this._setData(local);
                } else {
                    // Has real payment proof — re-register on server with new IP
                    this._serverAction('paid');
                }
            }

            if (!data.allowed) {
                const local = this._getData();
                local.startDate = new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)).toISOString();
                local.ipBlocked = true;
                this._setData(local);
                return false;
            }

            if (data.reason === 'new') {
                await this._serverAction('register');
            } else if (data.reason === 'trial') {
                const serverDays = data.daysLeft;
                const localDays = this.daysLeft();
                if (serverDays < localDays) {
                    const local = this._getData();
                    local.startDate = new Date(Date.now() - ((this.TRIAL_DAYS - serverDays) * 24 * 60 * 60 * 1000)).toISOString();
                    this._setData(local);
                }
            }

            return true; // Always allow access now (freemium)
        } catch (err) {
            this._serverChecked = true;
            return true;
        }
    },

    async _serverAction(action) {
        try {
            const userId = AuthService.isLoggedIn()
                ? AuthService.getCurrentUser().uid
                : Storage._get('device_id', this._generateDeviceId());

            await fetch('/.netlify/functions/trial-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, userId })
            });
        } catch (err) {
        }
    },

    checkAccess() {
        return true; // Always allow basic access
    },

    // Show upgrade prompt for a locked premium feature
    showFeatureLockedPrompt(featureName) {
        const featureLabels = {
            creature: 'Créature & Avatar',
            custom_macros: 'Personnalisation des objectifs',
            camera: 'Photo IA',
            voice: 'Saisie vocale',
            barcode: 'Scan code-barres'
        };
        const label = featureLabels[featureName] || featureName;

        Modal.show(`
            <div style="text-align:center">
                <div style="font-size:48px;margin-bottom:12px">🔒</div>
                <h3 style="margin-bottom:8px">${label}</h3>
                <p style="color:var(--text-secondary);font-size:14px;margin-bottom:16px;line-height:1.5">
                    Cette fonctionnalité est réservée aux membres Premium.<br>
                    Passe à Premium pour en profiter !
                </p>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-secondary" onclick="Modal.close()" style="flex:1">Plus tard</button>
                    <button class="btn btn-primary" onclick="Modal.close();App.navigate('settings')" style="flex:1">Voir les offres</button>
                </div>
            </div>
        `);
    },

    // Show the paywall / subscription screen (full page version)
    showPaywall() {
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="paywall-overlay fade-in">
                <div class="paywall-card">
                    <div class="paywall-icon">🚀</div>
                    <h2>Passe à IronFuel Premium</h2>
                    <p>Débloque toutes les fonctionnalités pour atteindre tes objectifs.</p>

                    <div class="paywall-features">
                        <div class="paywall-feature">✅ Créature & personnalisation avatar</div>
                        <div class="paywall-feature">✅ Objectifs calories & macros personnalisés</div>
                        <div class="paywall-feature">✅ Photo IA & reconnaissance vocale</div>
                        <div class="paywall-feature">✅ Scan code-barres</div>
                        <div class="paywall-feature">✅ Boutique & cosmétiques</div>
                    </div>

                    <div class="paywall-free-features">
                        <div class="paywall-free-title">Inclus gratuitement :</div>
                        <div class="paywall-feature" style="opacity:0.7">📋 Journal alimentaire illimité</div>
                        <div class="paywall-feature" style="opacity:0.7">🔍 Recherche d'aliments</div>
                        <div class="paywall-feature" style="opacity:0.7">📊 Historique & statistiques</div>
                    </div>

                    <!-- Plan selection -->
                    <div class="paywall-plans">
                        <div class="paywall-plan selected" id="plan-annual" onclick="TrialService._selectPlan('annual')">
                            <div class="paywall-plan-badge">MEILLEURE OFFRE</div>
                            <div class="paywall-plan-name">Annuel</div>
                            <div class="paywall-plan-price">
                                <span class="paywall-amount">14,99€</span>
                                <span class="paywall-period">/an</span>
                            </div>
                            <div class="paywall-plan-detail">Soit 1,25€/mois</div>
                        </div>
                        <div class="paywall-plan" id="plan-monthly" onclick="TrialService._selectPlan('monthly')">
                            <div class="paywall-plan-name">Mensuel</div>
                            <div class="paywall-plan-price">
                                <span class="paywall-amount">1,25€</span>
                                <span class="paywall-period">/mois</span>
                            </div>
                            <div class="paywall-plan-detail">15€/an</div>
                        </div>
                    </div>

                    <button class="btn btn-primary paywall-btn" onclick="TrialService.startPayment(true)">
                        S'abonner — 14,99€/an
                    </button>

                    <p class="paywall-no-commitment">🚫 Sans engagement — Résiliable à tout moment</p>
                    <p class="paywall-secure">🔒 Paiement sécurisé par Stripe</p>
                </div>
            </div>
        `;
        this._selectedPlan = 'annual';
    },

    _selectedPlan: 'annual',

    _selectPlan(plan) {
        this._selectedPlan = plan;
        document.getElementById('plan-annual').classList.toggle('selected', plan === 'annual');
        document.getElementById('plan-monthly').classList.toggle('selected', plan === 'monthly');

        const btn = document.querySelector('.paywall-btn');
        if (btn) {
            btn.textContent = plan === 'annual'
                ? 'S\'abonner — 14,99€/an'
                : 'S\'abonner — 1,25€/mois';
        }
    },

    // Start Stripe Checkout (subscription mode)
    async startPayment(skipTrial = false) {
        const btn = document.querySelector('.paywall-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Redirection...';
        }

        try {
            const res = await fetch('/.netlify/functions/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: AuthService.isLoggedIn() ? AuthService.getCurrentUser().uid : Storage._get('device_id', this._generateDeviceId()),
                    email: AuthService.isLoggedIn() ? AuthService.getCurrentUser().email : null,
                    skipTrial: skipTrial,
                    plan: this._selectedPlan || 'annual'
                })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Erreur');
            }
        } catch (err) {
            App.showToast('Erreur de paiement. Réessaie.');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Réessayer';
            }
        }
    },

    checkPaymentReturn() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment') === 'success') {
            const sessionId = params.get('session_id');
            const plan = params.get('plan') || 'annual';
            this._verifyAndUnlock(sessionId, plan);
            window.history.replaceState({}, '', window.location.pathname + window.location.hash);
            return true;
        }
        if (params.get('payment') === 'donation_success') {
            // Show thank-you modal instead of just a toast
            setTimeout(() => {
                if (typeof Modal !== 'undefined') {
                    Modal.show(`
                        <div style="text-align:center">
                            <div style="font-size:56px;margin-bottom:12px">💝</div>
                            <h3 style="margin-bottom:8px">Merci infiniment !</h3>
                            <p style="color:var(--text-secondary);font-size:14px;line-height:1.5;margin-bottom:16px">
                                Ton soutien aide à faire grandir IronFuel.<br>
                                Chaque don compte, merci d'y croire ! 🙏
                            </p>
                            <button class="btn btn-primary" onclick="Modal.close()" style="width:100%">Fermer</button>
                        </div>
                    `);
                } else {
                    App.showToast('Merci pour ton soutien ! ❤️');
                }
            }, 500);
            window.history.replaceState({}, '', window.location.pathname + window.location.hash);
            return true;
        }
        if (params.get('payment') === 'paypal_success') {
            // PayPal donation return
            setTimeout(() => {
                if (typeof Modal !== 'undefined') {
                    Modal.show(`
                        <div style="text-align:center">
                            <div style="font-size:56px;margin-bottom:12px">💝</div>
                            <h3 style="margin-bottom:8px">Merci via PayPal !</h3>
                            <p style="color:var(--text-secondary);font-size:14px;line-height:1.5;margin-bottom:16px">
                                Ton soutien aide à faire grandir IronFuel.<br>
                                Merci d'y croire ! 🙏
                            </p>
                            <button class="btn btn-primary" onclick="Modal.close()" style="width:100%">Fermer</button>
                        </div>
                    `);
                } else {
                    App.showToast('Merci pour ton soutien PayPal ! ❤️');
                }
            }, 500);
            window.history.replaceState({}, '', window.location.pathname + window.location.hash);
            return true;
        }
        if (params.get('payment') === 'cancel') {
            App.showToast('Paiement annulé');
            window.history.replaceState({}, '', window.location.pathname + window.location.hash);
        }
        return false;
    },

    async _verifyAndUnlock(sessionId, plan) {
        if (sessionId) {
            try {
                const res = await fetch('/.netlify/functions/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                });
                const data = await res.json();
                if (!data.paid && !data.subscription) {
                    App.showToast('Vérification du paiement échouée. Contacte iron.fuel@outlook.com');
                    return;
                }
            } catch (err) {
                // Network error — give benefit of the doubt but mark for recheck
                console.warn('Payment verification network error, granting temporarily');
            }
        }

        this.markCardRegistered();
        this.markPaid(sessionId || 'stripe', plan || 'annual');
        await this._serverAction('paid');
        App.showToast('Bienvenue Premium ! Toutes les fonctionnalités sont débloquées 🎉');
    },

    _generateDeviceId() {
        const id = 'dev_' + Math.random().toString(36).substr(2, 16);
        Storage._set('device_id', id);
        return id;
    }
};
