const AuthService = {
    _user: null,
    _initialized: false,
    _authReadyResolve: null,

    init() {
        // Create a promise that resolves when auth state is known
        this._authReady = new Promise(resolve => {
            this._authReadyResolve = resolve;
        });

        // Firebase SDK ready → init immediately
        if (typeof firebase !== 'undefined') {
            this._initFirebase();
            return;
        }

        // Firebase SDK not loaded yet — retry every 200ms up to 10s
        // This prevents "connexion non disponible" if scripts load late
        let attempts = 0;
        const maxAttempts = 50; // 50 × 200ms = 10s
        const retryInterval = setInterval(() => {
            attempts++;
            if (typeof firebase !== 'undefined') {
                clearInterval(retryInterval);
                console.log('[Auth] Firebase SDK loaded after ' + (attempts * 200) + 'ms');
                this._initFirebase();
            } else if (attempts >= maxAttempts) {
                clearInterval(retryInterval);
                console.error('[Auth] Firebase SDK failed to load after 10s');
                this._initialized = true;
                if (this._authReadyResolve) this._authReadyResolve();
            }
        }, 200);
    },

    _initFirebase() {
        const config = this._getConfig();
        if (!config.apiKey) {
            this._initialized = true;
            if (this._authReadyResolve) this._authReadyResolve();
            return;
        }

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
            }

            // Handle redirect result (fallback from popup on iOS/Safari)
            firebase.auth().getRedirectResult().then(result => {
                if (result && result.user) {
                    this._user = result.user;
                    this._saveUserProfile(result.user);
                    this._onLoginSuccess(result.user);
                }
            }).catch(() => {});

            firebase.auth().onAuthStateChanged((user) => {
                this._user = user;
                this._initialized = true;
                if (user) {
                    this._saveUserProfile(user);
                }
                if (this._authReadyResolve) {
                    this._authReadyResolve();
                    this._authReadyResolve = null;
                }
            });
        } catch (err) {
            console.error('[Auth] Firebase init error:', err);
            this._initialized = true;
            if (this._authReadyResolve) this._authReadyResolve();
        }
    },

    // Wait until Firebase has determined auth state
    waitForAuth() {
        return this._authReady || Promise.resolve();
    },

    _getConfig() {
        // Hardcoded — never read from localStorage to prevent config injection
        return {
            apiKey: 'AIzaSyDHt1oEFkLZCK3Oo-1kRIL8kDPBwFTsH_0',
            authDomain: 'ironfuel-422fe.firebaseapp.com',
            projectId: 'ironfuel-422fe',
            storageBucket: 'ironfuel-422fe.firebasestorage.app',
            messagingSenderId: '692208019425',
            appId: '1:692208019425:web:0ebcedcb10e7baaaf754a0',
            measurementId: 'G-80126EN55Y'
        };
    },

    isAvailable() {
        return typeof firebase !== 'undefined' && this._getConfig().apiKey !== '';
    },

    getCurrentUser() {
        return this._user;
    },

    isLoggedIn() {
        return !!this._user;
    },

    // Wait for Firebase SDK if not yet loaded (max 10s)
    async _ensureFirebase() {
        if (typeof firebase !== 'undefined' && firebase.auth) return true;
        return new Promise(resolve => {
            let attempts = 0;
            const check = setInterval(() => {
                attempts++;
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    clearInterval(check);
                    if (!firebase.apps.length) {
                        firebase.initializeApp(this._getConfig());
                    }
                    resolve(true);
                } else if (attempts >= 50) {
                    clearInterval(check);
                    resolve(false);
                }
            }, 200);
        });
    },

    // ===== GOOGLE SIGN-IN =====
    async signInWithGoogle() {
        const ready = await this._ensureFirebase();
        if (!ready) {
            App.showToast('Chargement en cours… Réessaie dans quelques secondes');
            return null;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await firebase.auth().signInWithPopup(provider);
            this._user = result.user;
            this._saveUserProfile(result.user);
            App.showToast(`Bienvenue ${result.user.displayName || ''} !`);
            return result.user;
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') return null;
            if (err.code === 'auth/cancelled-popup-request') return null;
            // Popup blocked/failed → fallback to redirect (works on iOS Safari)
            if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
                try {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    provider.setCustomParameters({ prompt: 'select_account' });
                    await firebase.auth().signInWithRedirect(provider);
                    return null; // page will redirect
                } catch (redirectErr) {
                    App.showToast('Erreur de connexion Google');
                    return null;
                }
            }
            if (err.code === 'auth/unauthorized-domain') {
                App.showToast('Domaine non autorisé dans Firebase');
                return null;
            }
            if (err.code === 'auth/operation-not-allowed') {
                App.showToast('Google Sign-In non activé dans Firebase');
                return null;
            }
            App.showToast(`Erreur: ${err.code || err.message}`);
            return null;
        }
    },

    // ===== APPLE SIGN-IN =====
    async signInWithApple() {
        const ready = await this._ensureFirebase();
        if (!ready) {
            App.showToast('Chargement en cours… Réessaie dans quelques secondes');
            return null;
        }

        try {
            const provider = new firebase.auth.OAuthProvider('apple.com');
            provider.addScope('email');
            provider.addScope('name');
            const result = await firebase.auth().signInWithPopup(provider);
            this._user = result.user;
            this._saveUserProfile(result.user);
            App.showToast(`Bienvenue !`);
            return result.user;
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') return null;
            if (err.code === 'auth/cancelled-popup-request') return null;
            // Popup blocked/failed → fallback to redirect
            if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
                try {
                    const provider = new firebase.auth.OAuthProvider('apple.com');
                    provider.addScope('email');
                    provider.addScope('name');
                    await firebase.auth().signInWithRedirect(provider);
                    return null;
                } catch (redirectErr) {
                    App.showToast('Erreur de connexion Apple');
                    return null;
                }
            }
            App.showToast(`Erreur: ${err.code || err.message}`);
            return null;
        }
    },

    // ===== EMAIL SIGN-IN =====
    async signInWithEmail(email, password) {
        if (!this.isAvailable()) {
            App.showToast('Connexion non disponible');
            return null;
        }

        try {
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            this._user = result.user;
            this._saveUserProfile(result.user);
            App.showToast(`Bienvenue !`);
            return result.user;
        } catch (err) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                // Try creating account
                return this.signUpWithEmail(email, password);
            }
            if (err.code === 'auth/wrong-password') {
                App.showToast('Mot de passe incorrect');
                return null;
            }
            if (err.code === 'auth/invalid-email') {
                App.showToast('Email invalide');
                return null;
            }
            if (err.code === 'auth/too-many-requests') {
                App.showToast('Trop de tentatives. Réessaie plus tard.');
                return null;
            }
            App.showToast(`Erreur: ${err.code || err.message}`);
            return null;
        }
    },

    async signUpWithEmail(email, password) {
        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            this._user = result.user;
            this._saveUserProfile(result.user);
            App.showToast('Compte créé ! Bienvenue !');
            return result.user;
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                App.showToast('Mot de passe incorrect');
                return null;
            }
            if (err.code === 'auth/weak-password') {
                App.showToast('Mot de passe trop court (6 caractères min)');
                return null;
            }
            App.showToast(`Erreur: ${err.code || err.message}`);
            return null;
        }
    },

    async resetPassword(email) {
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            App.showToast('Email de réinitialisation envoyé !');
            return true;
        } catch (err) {
            App.showToast(`Erreur: ${err.message}`);
            return false;
        }
    },

    async signOut() {
        if (!this.isAvailable()) return;
        try {
            await firebase.auth().signOut();
            this._user = null;
            Storage._set('auth_user', null);
            App.showToast('Déconnecté');
            // Show login screen
            App.showLoginScreen();
        } catch (err) {
        }
    },

    _saveUserProfile(user) {
        if (!user) return;
        const profile = Storage.getProfile();
        if (!profile.name || profile.name === '') {
            profile.name = user.displayName || user.email?.split('@')[0] || 'Utilisateur';
            Storage.setProfile(profile);
        }
        Storage._set('auth_user', {
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0],
            email: user.email,
            photo: user.photoURL,
            provider: user.providerData?.[0]?.providerId || 'unknown'
        });
    },

    getStoredUser() {
        return Storage._get('auth_user', null);
    },

    // ===== LOGIN SCREEN =====
    showLoginScreen() {
        const content = document.getElementById('page-content');
        // Hide nav
        document.getElementById('bottom-nav').style.display = 'none';
        document.getElementById('app-header').style.display = 'none';

        content.innerHTML = `
            <div class="login-screen fade-in">
                <div class="login-card">
                    <div class="login-logo">
                        <svg width="64" height="64" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="#C62828"/>
                            <text x="50" y="62" text-anchor="middle" fill="white" font-size="42" font-weight="900">1</text>
                        </svg>
                    </div>
                    <h1 class="login-title">OneFood</h1>
                    <p class="login-subtitle">Ton coach nutrition pour la muscu</p>

                    <div class="login-methods" id="login-methods">
                        <button class="btn login-btn google" onclick="AuthService._loginGoogle()">
                            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            Continuer avec Google
                        </button>

                        <button class="btn login-btn apple" onclick="AuthService._loginApple()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                            Continuer avec Apple
                        </button>

                        <div class="login-divider">
                            <div class="login-divider-line"></div>
                            <span>ou</span>
                            <div class="login-divider-line"></div>
                        </div>

                        <button class="btn login-btn email" onclick="AuthService._showEmailForm()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>
                            Continuer avec Email
                        </button>
                    </div>

                    <div class="login-email-form hidden" id="login-email-form">
                        <div class="form-group">
                            <input type="email" class="form-input" id="login-email" placeholder="Email" autocomplete="email">
                        </div>
                        <div class="form-group">
                            <input type="password" class="form-input" id="login-password" placeholder="Mot de passe (6 car. min)" autocomplete="current-password">
                        </div>
                        <button class="btn btn-primary login-btn-submit" id="login-submit" onclick="AuthService._submitEmail()">
                            Se connecter / Créer un compte
                        </button>
                        <button class="btn-link login-forgot" onclick="AuthService._forgotPassword()">
                            Mot de passe oublié ?
                        </button>
                        <button class="btn-link login-back" onclick="AuthService._showMethods()">
                            ← Retour
                        </button>
                    </div>

                    <div style="margin:12px 0 8px;display:flex;align-items:flex-start;gap:8px">
                        <input type="checkbox" id="login-newsletter" checked style="margin-top:3px;accent-color:var(--primary);width:16px;height:16px;flex-shrink:0">
                        <label for="login-newsletter" style="font-size:12px;color:var(--text-secondary);line-height:1.4;cursor:pointer">
                            J'accepte de recevoir des emails d'OneFood (conseils nutrition, mises à jour). Désabonnement possible à tout moment.
                        </label>
                    </div>
                    <p class="login-legal">En continuant, tu acceptes les <a href="/terms.html" target="_blank" style="color:var(--primary)">CGU</a> et la <a href="/privacy.html" target="_blank" style="color:var(--primary)">politique de confidentialité</a></p>
                </div>
            </div>
        `;
    },

    _showEmailForm() {
        document.getElementById('login-methods').classList.add('hidden');
        document.getElementById('login-email-form').classList.remove('hidden');
        setTimeout(() => document.getElementById('login-email')?.focus(), 100);
    },

    _showMethods() {
        document.getElementById('login-methods').classList.remove('hidden');
        document.getElementById('login-email-form').classList.add('hidden');
    },

    async _loginGoogle() {
        const user = await this.signInWithGoogle();
        if (user) this._onLoginSuccess(user);
    },

    async _loginApple() {
        const user = await this.signInWithApple();
        if (user) this._onLoginSuccess(user);
    },

    async _submitEmail() {
        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value;

        if (!email) { App.showToast('Entre ton email'); return; }
        if (!password || password.length < 6) { App.showToast('Mot de passe : 6 caractères min'); return; }

        const btn = document.getElementById('login-submit');
        if (btn) { btn.disabled = true; btn.textContent = 'Connexion...'; }

        const user = await this.signInWithEmail(email, password);

        if (btn) { btn.disabled = false; btn.textContent = 'Se connecter / Créer un compte'; }
        if (user) this._onLoginSuccess(user);
    },

    async _forgotPassword() {
        const email = document.getElementById('login-email')?.value?.trim();
        if (!email) {
            App.showToast('Entre ton email d\'abord');
            document.getElementById('login-email')?.focus();
            return;
        }
        await this.resetPassword(email);
    },

    async _onLoginSuccess(user) {
        // Read newsletter consent BEFORE replacing the DOM
        const newsletterCheck = document.getElementById('login-newsletter');
        const emailConsent = newsletterCheck ? newsletterCheck.checked : false;

        // Immediately hide login screen and show loading state
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:80vh;gap:16px">
                <div class="loading-spinner" style="width:40px;height:40px;border:3px solid var(--border);border-top:3px solid var(--primary);border-radius:50%;animation:spin 0.8s linear infinite"></div>
                <p style="color:var(--text-secondary);font-size:14px">Chargement de tes donn\u00e9es...</p>
            </div>
        `;

        // Restore nav
        document.getElementById('bottom-nav').style.display = '';
        document.getElementById('app-header').style.display = '';
        Storage._set('email_consent', emailConsent);
        this._saveEmailConsent(user, emailConsent);

        // Init cloud sync + restore data from Firestore
        SyncService.init();
        const restored = await SyncService.loadAll();
        // Check server-side trial (IP-based)
        TrialService.init();
        const hasAccess = await TrialService.checkServerTrial();

        // Check onboarding (re-read profile AFTER sync restore)
        const profile = Storage.getProfile();
        if (!profile.weight || profile.weight === 0) {
            Onboarding.start();
        } else {
            App.navigate('dashboard');
        }
    },

    async _saveEmailConsent(user, consent) {
        if (!user || !user.email) return;
        try {
            const res = await fetch('/.netlify/functions/save-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    email: user.email,
                    displayName: user.displayName || '',
                    consent: consent,
                    streak: Storage.getStreak() || 0,
                    signupDate: new Date().toISOString()
                })
            });
        } catch (err) {
        }
    }
};
