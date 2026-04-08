// ===== TRIAL & PAYMENT SERVICE =====
// Bulletproof premium: 4-layer persistence (localStorage + cookie + IndexedDB + Firestore)
// Premium status must NEVER be lost — brand reputation depends on it.
const TrialService = {
    TRIAL_DAYS: 14,
    SUBSCRIPTION_DAYS: 365,
    PRICE_ANNUAL: '14,99€',
    PRICE_MONTHLY: '2,99€',
    _serverChecked: false,
    _premiumVerified: false,
    _premiumPromise: null,     // resolves when all premium checks done

    // === PREMIUM FEATURES (locked after trial for free users) ===
    PREMIUM_FEATURES: ['creature', 'custom_macros', 'camera', 'voice', 'barcode', 'gym', 'weight', 'supplements', 'shop', 'chat'],

    // Admin secret key — change this to your own secret
    _ADMIN_SECRET: 'onefood-admin-2026-secret',

    init() {
        // Admin force-premium via URL (requires secret key)
        const params = new URLSearchParams(window.location.search);
        if (params.get('admin_premium') === this._ADMIN_SECRET) {
            this.markPaid('admin-force', 'annual');
            App.showToast('Premium activé manuellement ✅');
            window.history.replaceState({}, '', window.location.pathname + window.location.hash);
        }

        const data = this._getData();
        if (!data.startDate) {
            data.startDate = new Date().toISOString();
            this._setData(data);
        }

        // Layer 2: restore from cookie if localStorage was cleared
        if (!data.paid) this._restoreFromCookie();

        // Layer 3+4: async restore from IndexedDB and Firestore
        this._premiumPromise = this._asyncRestorePremium();

        // Recover pending payment if verify-payment failed last time
        const pending = Storage._get('pending_payment', null);
        if (pending && pending.sessionId && (Date.now() - pending.ts) < 86400000) {
            this._verifyAndUnlock(pending.sessionId, pending.plan);
        } else if (pending) {
            Storage._set('pending_payment', null);
        }
    },

    // Wait for all async premium checks to complete (call before showing trial UI)
    async waitForPremiumCheck() {
        if (this._premiumVerified) return;
        if (this._premiumPromise) {
            try { await this._premiumPromise; } catch(e) {}
        }
        this._premiumVerified = true;
    },

    // ====== 4-LAYER PREMIUM PERSISTENCE ======

    // Layer 1: localStorage (default via Storage._get/_set) — fast, but cleared by cache nuke

    // Layer 2: Cookie — survives localStorage clear, survives cache nuke
    _saveToCookie(paid, plan, paidDate) {
        if (!paid) return;
        try {
            const val = JSON.stringify({ p: 1, pl: plan || 'annual', d: paidDate || new Date().toISOString() });
            const expires = new Date(Date.now() + 400 * 86400000).toUTCString();
            document.cookie = `ifp=${encodeURIComponent(val)};expires=${expires};path=/;SameSite=Strict`;
        } catch(e) {}
    },

    _restoreFromCookie() {
        try {
            const match = document.cookie.match(/ifp=([^;]+)/);
            if (!match) return false;
            const data = JSON.parse(decodeURIComponent(match[1]));
            if (data && data.p === 1) {
                this.markPaid('restored-from-cookie', data.pl || 'annual');
                console.log('[Trial] Premium restored from cookie');
                return true;
            }
        } catch(e) {}
        return false;
    },

    // Layer 3: IndexedDB — independent from localStorage, survives cache nuke
    _saveToIDB(paid, plan, paidDate) {
        if (!paid || typeof indexedDB === 'undefined') return;
        try {
            const req = indexedDB.open('ironfuel_premium', 1);
            req.onupgradeneeded = (e) => { e.target.result.createObjectStore('status'); };
            req.onsuccess = (e) => {
                try {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('status')) return;
                    const tx = db.transaction('status', 'readwrite');
                    tx.objectStore('status').put({ paid: true, plan: plan || 'annual', paidDate: paidDate || new Date().toISOString() }, 'premium');
                } catch {}
            };
            req.onerror = () => {};
        } catch {}
    },

    _restoreFromIDB() {
        return new Promise((resolve) => {
            if (typeof indexedDB === 'undefined') return resolve(null);
            try {
                const req = indexedDB.open('ironfuel_premium', 1);
                req.onupgradeneeded = (e) => { e.target.result.createObjectStore('status'); };
                req.onerror = () => resolve(null);
                req.onsuccess = (e) => {
                    try {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains('status')) return resolve(null);
                        const tx = db.transaction('status', 'readonly');
                        const get = tx.objectStore('status').get('premium');
                        get.onsuccess = () => {
                            const result = get.result;
                            if (result && result.paid) {
                                resolve({ paid: true, plan: result.plan, paidDate: result.paidDate });
                            } else {
                                resolve(null);
                            }
                        };
                        get.onerror = () => resolve(null);
                    } catch(e) { resolve(null); }
                };
                req.onerror = () => resolve(null);
                // Timeout — don't block forever
                setTimeout(() => resolve(null), 3000);
            } catch(e) { resolve(null); }
        });
    },

    // Layer 4: Firestore — survives device wipe, reinstall, device switch
    async _restoreFromFirestore() {
        try {
            if (typeof AuthService === 'undefined' || !AuthService.isLoggedIn()) return null;
            const user = AuthService.getCurrentUser();
            if (!user) return null;
            const token = await user.getIdToken();
            const res = await fetch(
                `https://firestore.googleapis.com/v1/projects/ironfuel-422fe/databases/(default)/documents/users/${user.uid}`,
                { headers: { 'Authorization': 'Bearer ' + token } }
            );
            if (!res.ok) return null;
            const doc = await res.json();
            const fields = doc.fields || {};
            if (fields.paid && (fields.paid.booleanValue === true || fields.paid.stringValue === 'true')) {
                return {
                    paid: true,
                    plan: (fields.plan && fields.plan.stringValue) || 'annual',
                    paidDate: (fields.paidDate && fields.paidDate.stringValue) || null
                };
            }
        } catch(e) {}
        return null;
    },

    async _savePremiumToFirestore(plan) {
        try {
            if (typeof AuthService === 'undefined' || !AuthService.isLoggedIn()) return;
            const user = AuthService.getCurrentUser();
            if (!user) return;
            const token = await user.getIdToken();
            await fetch(
                `https://firestore.googleapis.com/v1/projects/ironfuel-422fe/databases/(default)/documents/users/${user.uid}?updateMask.fieldPaths=paid&updateMask.fieldPaths=plan&updateMask.fieldPaths=paidDate`,
                {
                    method: 'PATCH',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fields: {
                            paid: { booleanValue: true },
                            plan: { stringValue: plan || 'annual' },
                            paidDate: { stringValue: new Date().toISOString() }
                        }
                    })
                }
            );
        } catch(e) {}
    },

    // Master async restore — checks IndexedDB + Firestore + re-renders dashboard
    async _asyncRestorePremium() {
        if (this.isPaid()) { this._premiumVerified = true; return; }
        try {
            // Check IndexedDB first (faster, local)
            const idbData = await this._restoreFromIDB();
            if (idbData && idbData.paid) {
                this.markPaid('restored-from-indexeddb', idbData.plan);
                console.log('[Trial] Premium restored from IndexedDB');
                this._premiumVerified = true;
                this._reRenderDashboardIfActive();
                return;
            }
            // Check Firestore (slower, network)
            const fsData = await this._restoreFromFirestore();
            if (fsData && fsData.paid) {
                this.markPaid('restored-from-firestore', fsData.plan);
                console.log('[Trial] Premium restored from Firestore');
                this._premiumVerified = true;
                this._reRenderDashboardIfActive();
                return;
            }
        } catch(e) {}
        this._premiumVerified = true;
    },

    _reRenderDashboardIfActive() {
        // If dashboard is currently showing, re-render to remove trial banner
        try {
            if (typeof App !== 'undefined' && App.currentPage === 'dashboard' && typeof DashboardPage !== 'undefined') {
                DashboardPage.render();
            }
        } catch(e) {}
    },

    _getData() {
        return Storage._get('trial', {
            startDate: null,
            paid: false,
            paymentId: null,
            paidDate: null,
            hasCard: false,
            plan: null
        });
    },

    _setData(data) {
        Storage._set('trial', data);
    },

    // Admin mode override via URL param (?admin_mode=premium|free)
    _adminMode: (() => {
        try { return new URLSearchParams(window.location.search).get('admin_mode'); } catch { return null; }
    })(),

    isPaid() {
        if (this._adminMode === 'premium') return true;
        if (this._adminMode === 'free') return false;
        const data = this._getData();
        if (!data.paid) return false;
        if (!data.paidDate) return true;
        if (data.paidDate) {
            const paidDate = new Date(data.paidDate);
            const now = new Date();
            const daysSincePaid = Math.floor((now - paidDate) / (1000 * 60 * 60 * 24));
            const subDays = data.plan === 'monthly' ? 31 : this.SUBSCRIPTION_DAYS;
            if (daysSincePaid >= subDays) return false;
        }
        if (data._serverRevoked) {
            data._serverRevoked = false;
            this._setData(data);
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
        if (this._adminMode === 'premium') return true;
        if (this._adminMode === 'free') return false;
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
        const p = plan || 'annual';
        const data = this._getData();
        data.paid = true;
        data.hasCard = true;
        data.paymentId = paymentId || 'manual';
        data.paidDate = data.paidDate || new Date().toISOString();
        data.plan = p;
        // Layer 1: localStorage
        this._setData(data);
        // Layer 2: cookie (survives localStorage clear)
        this._saveToCookie(true, p, data.paidDate);
        // Layer 3: IndexedDB (survives cache nuke)
        this._saveToIDB(true, p, data.paidDate);
        // Layer 4: Firestore (survives device wipe)
        this._savePremiumToFirestore(p);
        // Server sync
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

            const res = await fetch('/api/trial-check', {
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

            // Server says NOT paid but local has payment — re-sync server
            // Never revoke local payment — server IP-check is unreliable on mobile
            if (!data.paid && this._getData().paid) {
                this._serverAction('paid');
            }

            if (!data.allowed && data.reason !== 'error') {
                // Only block if server explicitly says expired, and user isn't paid locally
                if (!this._getData().paid) {
                    const local = this._getData();
                    local.startDate = new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)).toISOString();
                    local.ipBlocked = true;
                    this._setData(local);
                }
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

            const reqHeaders = { 'Content-Type': 'application/json' };
            // Send auth token for 'paid' action (required by server)
            if (action === 'paid' && AuthService.isLoggedIn()) {
                try {
                    const token = await AuthService.getCurrentUser().getIdToken();
                    reqHeaders['Authorization'] = 'Bearer ' + token;
                } catch(e) {}
            }

            await fetch('/api/trial-check', {
                method: 'POST',
                headers: reqHeaders,
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
            barcode: 'Scan code-barres',
            gym: 'Suivi Salle de Sport',
            weight: 'Suivi du Poids',
            supplements: 'Compléments Alimentaires',
            shop: 'Boutique & Cosmétiques'
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
                    <h2>Passe à OneFood Premium</h2>
                    <p>Débloque toutes les fonctionnalités pour atteindre tes objectifs.</p>

                    <div class="paywall-features">
                        <div class="paywall-feature">✅ Créature & personnalisation avatar</div>
                        <div class="paywall-feature">✅ Objectifs calories & macros personnalisés</div>
                        <div class="paywall-feature">✅ Photo IA & reconnaissance vocale</div>
                        <div class="paywall-feature">✅ Scan code-barres</div>
                        <div class="paywall-feature">✅ Boutique & cosmétiques</div>
                        <div class="paywall-feature">✅ Suivi salle de sport</div>
                        <div class="paywall-feature">✅ Suivi du poids & graphiques</div>
                        <div class="paywall-feature">✅ Compléments alimentaires</div>
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
                            <div class="paywall-plan-detail">Soit 2,99€/mois</div>
                        </div>
                        <div class="paywall-plan" id="plan-monthly" onclick="TrialService._selectPlan('monthly')">
                            <div class="paywall-plan-name">Mensuel</div>
                            <div class="paywall-plan-price">
                                <span class="paywall-amount">2,99€</span>
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
                : 'S\'abonner — 2,99€/mois';
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
            const res = await fetch('/api/create-checkout', {
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
                                Ton soutien aide à faire grandir OneFood.<br>
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
        if (params.get('payment') === 'cancel') {
            App.showToast('Paiement annulé');
            window.history.replaceState({}, '', window.location.pathname + window.location.hash);
        }
        return false;
    },

    async _verifyAndUnlock(sessionId, plan) {
        // Save pending flag in case verification fails (will retry on next init)
        if (sessionId) Storage._set('pending_payment', { sessionId, plan, ts: Date.now() });
        if (sessionId) {
            try {
                const reqHeaders = { 'Content-Type': 'application/json' };
                try {
                    const user = AuthService.getCurrentUser();
                    if (user) reqHeaders['Authorization'] = 'Bearer ' + await user.getIdToken();
                } catch(e) {}
                const res = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: reqHeaders,
                    body: JSON.stringify({ sessionId })
                });
                const data = await res.json();
                if (!data.paid && !data.subscription) {
                    App.showToast('Vérification du paiement échouée. Contacte contact@1food.fr');
                    return;
                }
            } catch (err) {
                // Network error — do NOT grant premium without verification
                console.warn('Payment verification network error');
                App.showToast('Vérification en cours… Vérifie ta connexion.');
                return;
            }
        }

        this.markCardRegistered();
        this.markPaid(sessionId || 'stripe', plan || 'annual');
        await this._serverAction('paid');
        Storage._set('pending_payment', null); // Clear pending — payment confirmed
        App.showToast('Bienvenue Premium ! Toutes les fonctionnalités sont débloquées 🎉');
    },

    _generateDeviceId() {
        let id;
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            id = 'dev_' + crypto.randomUUID();
        } else {
            id = 'dev_' + Math.random().toString(36).substr(2, 16);
        }
        Storage._set('device_id', id);
        return id;
    }
};
