const App = {
    currentPage: 'dashboard',
    previousPage: null,
    selectedDate: null, // null = today

    // Helper: format Date to YYYY-MM-DD in local timezone (never UTC)
    _localDateKey(d) {
        if (!d) d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },

    getSelectedDate() {
        return this.selectedDate || new Date();
    },

    isToday() {
        if (!this.selectedDate) return true;
        return this._localDateKey(this.selectedDate) === this._localDateKey(new Date());
    },

    isTomorrow() {
        if (!this.selectedDate) return false;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this._localDateKey(this.selectedDate) === this._localDateKey(tomorrow);
    },

    isFuture() {
        if (!this.selectedDate) return false;
        return this._localDateKey(this.selectedDate) > this._localDateKey(new Date());
    },

    setSelectedDate(dateStr) {
        if (!dateStr) {
            this.selectedDate = null;
        } else {
            const parts = dateStr.split('-');
            this.selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
        }
        // Reset to null if it's today
        if (this.selectedDate && this.isToday()) this.selectedDate = null;
        // Re-render current page
        if (this.currentPage === 'dashboard') DashboardPage.render();
        else if (this.currentPage === 'diary') DiaryPage.render();
    },

    getDateLabel() {
        const d = this.getSelectedDate();
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dStr = this._localDateKey(d);
        if (dStr === this._localDateKey(today)) return "Aujourd'hui";
        if (dStr === this._localDateKey(yesterday)) return 'Hier';
        if (dStr === this._localDateKey(tomorrow)) return 'Demain';
        return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    },

    pages: {
        dashboard: { title: 'IronFuel', render: () => DashboardPage.render(), nav: true },
        diary: { title: 'Journal', render: (p) => DiaryPage.render(p), nav: true },
        search: { title: 'Rechercher', render: (p) => SearchPage.render(p), nav: false },
        camera: { title: 'Photo IA', render: () => CameraPage.render(), nav: false, cleanup: () => CameraPage.cleanup() },
        voice: { title: 'Saisie vocale', render: () => VoicePage.render(), nav: false },
        barcode: { title: 'Code-barres', render: () => BarcodePage.render(), nav: false, cleanup: () => BarcodePage.cleanup() },
        history: { title: 'Historique', render: () => HistoryPage.render(), nav: false },
        profile: { title: 'Profil', render: () => ProfilePage.render(), nav: true },
        settings: { title: 'Paramètres', render: () => SettingsPage.render(), nav: false },
        customfood: { title: 'Nouvel aliment', render: () => CustomFoodPage.render(), nav: false, cleanup: () => CustomFoodPage.cleanup() },
        gym: { title: 'Salle', render: () => GymPage.render(), nav: false },
        shop: { title: 'Boutique', render: () => ShopPage.render(), nav: false },
        avatar: { title: 'Créature', render: () => AvatarPage.render(), nav: true, cleanup: () => AvatarPage.cleanup() },
        supplements: { title: 'Compléments', render: () => SupplementsPage.render(), nav: false },
        weight: { title: 'Poids', render: () => WeightPage.render(), nav: false }
    },

    init() {
        // Apply saved theme (or auto-detect system preference)
        const theme = Storage.getTheme();
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            // 'auto': remove attribute, let CSS @media handle it
            document.documentElement.removeAttribute('data-theme');
        }

        // Show skeleton loader while loading
        this._showSkeleton();

        // Init Firebase Auth
        AuthService.init();

        // Init Analytics + Ads
        if (typeof AnalyticsService !== 'undefined') {
            AnalyticsService.init();
        }

        // Init trial system
        TrialService.init();

        // Check payment return from Stripe/PayPal
        TrialService.checkPaymentReturn();

        // Init FCM notifications
        if (typeof NotificationService !== 'undefined') {
            NotificationService.init();
            NotificationService.setupForegroundHandler();
        }

        // Init navigation
        Navbar.init();

        // Wait for Firebase auth state, then route
        AuthService.waitForAuth().then(async () => {
            if (!AuthService.isLoggedIn()) {
                // Not logged in → show login screen
                this._dismissSplash();
                AuthService.showLoginScreen();
            } else {
                // Show GDPR consent first — block sync/trial until consent given
                const hasConsent = this._hasGDPRConsent();
                if (!hasConsent) {
                    this._dismissSplash();
                    this._showGDPRConsentIfNeeded(() => {
                        // Consent given — now init sync and continue
                        this._postConsentInit();
                    });
                } else {
                    await this._postConsentInit();
                }
            }
        });

        // Handle back button
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this._renderPage(e.state.page, e.state.params, false);
            }
        });

        // Material ripple effect
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.btn, .nav-btn, .quick-action-btn, .fab-option, .meal-header');
            if (!target) return;
            const rect = target.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            const size = Math.max(rect.width, rect.height) * 2;
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            target.style.position = target.style.position || 'relative';
            target.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    },

    // Haptic feedback helper for mobile interactions
    haptic(type) {
        if (!navigator.vibrate) return;
        const patterns = { light: [10], medium: [30], success: [30, 50, 30], error: [50, 30, 50, 30, 50] };
        navigator.vibrate(patterns[type] || patterns.light);
    },

    showLoginScreen() {
        AuthService.showLoginScreen();
    },

    navigate(page, params = {}) {
        // Cleanup previous page
        const prevPageConfig = this.pages[this.currentPage];
        if (prevPageConfig && prevPageConfig.cleanup) {
            prevPageConfig.cleanup();
        }

        this.previousPage = this.currentPage;
        this._renderPage(page, params, true);
    },

    _renderPage(page, params = {}, pushState = true) {
        const pageConfig = this.pages[page];
        if (!pageConfig) return;

        // Track page view
        if (typeof AnalyticsService !== 'undefined') {
            AnalyticsService.logPageView(page);
        }

        // Check premium feature access (freemium model)
        // avatar page shows its own locked state — don't block navigation to it
        const premiumPages = { camera: 'camera', voice: 'voice', barcode: 'barcode', shop: 'shop', gym: 'gym', weight: 'weight', supplements: 'supplements' };
        if (premiumPages[page] && TrialService.isFeatureLocked(premiumPages[page])) {
            TrialService.showFeatureLockedPrompt(premiumPages[page]);
            return;
        }

        this.currentPage = page;

        // Update header
        document.getElementById('page-title').textContent = pageConfig.title;
        const backBtn = document.getElementById('header-back');
        if (!pageConfig.nav) {
            backBtn.classList.remove('hidden');
        } else {
            backBtn.classList.add('hidden');
        }

        // Update nav
        Navbar.setActive(page);

        // Close FAB menu
        this.closeFabMenu();

        // Destroy all charts before rendering new page
        Charts.destroyAll();

        // Render page with transition
        const content = document.getElementById('page-content');
        content.classList.remove('page-enter');
        void content.offsetWidth; // force reflow
        content.classList.add('page-enter');
        pageConfig.render(params);

        // Scroll to top
        window.scrollTo(0, 0);

        // Push state
        if (pushState) {
            history.pushState({ page, params }, '', '#' + page);
        }
    },

    toggleFabMenu() {
        const menu = document.getElementById('fab-menu');
        menu.classList.toggle('hidden');
        menu.classList.toggle('open');
    },

    closeFabMenu() {
        const menu = document.getElementById('fab-menu');
        if (menu) {
            menu.classList.add('hidden');
            menu.classList.remove('open');
        }
    },

    showToast(message, duration = 2500) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, duration);
    },

    // R5: Splash screen dismiss
    _dismissSplash() {
        const splash = document.getElementById('splash');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 500);
        }
    },

    // R5: Skeleton loader while loading
    _showSkeleton() {
        const content = document.getElementById('page-content');
        if (content) {
            content.innerHTML = `
                <div style="padding:16px">
                    <div class="skeleton skeleton-circle"></div>
                    <div class="skeleton skeleton-text medium" style="margin:12px auto;width:60%"></div>
                    <div class="skeleton skeleton-text short" style="margin:8px auto;width:40%"></div>
                    <div style="display:flex;gap:8px;margin:16px">
                        <div class="skeleton skeleton-bar" style="flex:1"></div>
                        <div class="skeleton skeleton-bar" style="flex:1"></div>
                        <div class="skeleton skeleton-bar" style="flex:1"></div>
                    </div>
                    <div class="skeleton skeleton-card"></div>
                    <div class="skeleton skeleton-card"></div>
                    <div class="skeleton skeleton-card"></div>
                </div>
            `;
        }
    },

    _hasGDPRConsent() {
        try { return !!localStorage.getItem('nutritrack_gdpr_consent'); }
        catch(e) { return true; } // If localStorage broken, don't block
    },

    async _postConsentInit() {
        // Init cloud sync + restore data if needed
        SyncService.init();
        await SyncService.onLogin();

        // Wait for all premium checks (cookie, IndexedDB, Firestore) BEFORE dashboard
        // This prevents the trial banner from flashing for paying users
        await TrialService.waitForPremiumCheck();

        // Check server-side trial (IP block)
        await TrialService.checkServerTrial();

        // Schedule local notifications for today
        if (typeof LocalNotificationScheduler !== 'undefined') {
            LocalNotificationScheduler.rescheduleAll();
        }

        // Check onboarding or go to dashboard
        const profile = Storage.getProfile();
        if (!profile.weight || profile.weight === 0) {
            this._dismissSplash();
            Onboarding.start();
        } else {
            this.navigate('dashboard');
            this._dismissSplash();
            this._showTutorialIfNeeded();
        }
    },

    // RGPD consent modal — shown once before any data processing
    _showGDPRConsentIfNeeded(onAccept) {
        try {
            if (localStorage.getItem('nutritrack_gdpr_consent')) { if (onAccept) onAccept(); return; }
        } catch(e) { if (onAccept) onAccept(); return; }
        this._gdprCallback = onAccept || null;

        const overlay = document.createElement('div');
        overlay.id = 'gdpr-overlay';
        overlay.className = 'onboarding-overlay';
        overlay.style.cssText = 'z-index:10001;';
        overlay.innerHTML = `
            <div class="onboarding-card" style="max-width:380px;padding:24px 20px;text-align:left">
                <div style="text-align:center;margin-bottom:12px">
                    <div style="font-size:40px">🔒</div>
                    <h3 style="font-size:18px;font-weight:700;margin:8px 0 4px">Protection de vos données</h3>
                </div>
                <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">
                    IronFuel collecte des <strong>données de santé</strong> (poids, alimentation, objectifs nutritionnels) pour fonctionner.
                    Ces données sont stockées localement sur votre appareil et, si vous activez la synchronisation, sur nos serveurs sécurisés (Firebase).
                </p>
                <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">
                    Conformément au RGPD, nous avons besoin de votre <strong>consentement explicite</strong> pour traiter ces données.
                </p>
                <div style="margin-bottom:14px">
                    <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin-bottom:8px">
                        <input type="checkbox" id="gdpr-health" style="margin-top:2px;accent-color:var(--primary);width:18px;height:18px;flex-shrink:0">
                        <span style="font-size:13px;line-height:1.5"><strong>Données de santé</strong> — J'accepte le traitement de mes données nutritionnelles et corporelles <span style="color:var(--danger)">*</span></span>
                    </label>
                    <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer">
                        <input type="checkbox" id="gdpr-analytics" checked style="margin-top:2px;accent-color:var(--primary);width:18px;height:18px;flex-shrink:0">
                        <span style="font-size:13px;line-height:1.5"><strong>Analytique</strong> — J'accepte l'analyse anonyme d'utilisation pour améliorer l'app</span>
                    </label>
                </div>
                <p style="font-size:11px;color:var(--text-secondary);margin-bottom:14px;line-height:1.5">
                    <a href="/privacy.html" target="_blank" style="color:var(--primary)">Politique de confidentialité</a> · <a href="/terms.html" target="_blank" style="color:var(--primary)">CGU</a> · Vous pouvez retirer votre consentement à tout moment dans les Paramètres.
                </p>
                <button class="btn btn-primary" id="gdpr-accept-btn" onclick="App._acceptGDPR()" style="width:100%;font-weight:700;padding:14px;font-size:15px" disabled>
                    Accepter et continuer
                </button>
                <p id="gdpr-error" style="font-size:12px;color:var(--danger);text-align:center;margin-top:8px;display:none">
                    Veuillez accepter le traitement des données de santé pour continuer.
                </p>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));

        // Enable button only when health checkbox is checked
        setTimeout(() => {
            const healthCb = document.getElementById('gdpr-health');
            const btn = document.getElementById('gdpr-accept-btn');
            if (healthCb && btn) {
                healthCb.addEventListener('change', () => {
                    btn.disabled = !healthCb.checked;
                    const err = document.getElementById('gdpr-error');
                    if (err) err.style.display = healthCb.checked ? 'none' : '';
                });
            }
        }, 50);
    },

    _acceptGDPR() {
        const healthCb = document.getElementById('gdpr-health');
        if (!healthCb || !healthCb.checked) {
            const err = document.getElementById('gdpr-error');
            if (err) err.style.display = '';
            return;
        }
        const analyticsCb = document.getElementById('gdpr-analytics');
        try {
            localStorage.setItem('nutritrack_gdpr_consent', JSON.stringify({
                health: true,
                analytics: analyticsCb ? analyticsCb.checked : true,
                date: new Date().toISOString(),
                version: 1
            }));
        } catch(e) {}
        const overlay = document.getElementById('gdpr-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s';
            setTimeout(() => overlay.remove(), 300);
        }
        // Trigger post-consent initialization
        if (this._gdprCallback) {
            this._gdprCallback();
            this._gdprCallback = null;
        }
    },

    // R3: Post-onboarding tutorial
    _showTutorialIfNeeded() {
        try {
            if (localStorage.getItem('nutritrack_tutorial_v2_done')) return;
        } catch(e) { return; }

        const steps = [
            { icon: '🍽️', title: 'Ajoute tes repas', desc: 'Utilise Photo IA, Vocal ou Recherche pour tracker tout ce que tu manges.' },
            { icon: '💧', title: 'Hydratation', desc: 'Clique sur le réservoir d\'eau pour ajouter 250ml. Un bonus t\'attend à l\'objectif !' },
            { icon: '💊', title: 'Compléments', desc: 'Configure ton plan de suppléments et coche-les chaque jour. (Premium)' },
            { icon: '🏋️', title: 'Salle de sport', desc: 'Planifie tes séances Push/Pull/Legs et suis ton calendrier. (Premium)' },
            { icon: '⚖️', title: 'Suivi du poids', desc: 'Note ton poids régulièrement pour voir ta courbe de progression. (Premium)' },
            { icon: '🐣', title: 'Ta créature', desc: 'Plus tu es régulier, plus elle gagne d\'XP et évolue. Débloque des cosmétiques ! (Premium)' },
            { icon: '⭐', title: 'IronFuel Premium', desc: 'Débloque la créature, les compléments, la salle, le poids et bien plus !' }
        ];

        let currentStep = 0;

        const renderTutorial = () => {
            let overlay = document.getElementById('tutorial-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'tutorial-overlay';
                overlay.className = 'onboarding-overlay';
                document.body.appendChild(overlay);
            }

            const step = steps[currentStep];
            overlay.innerHTML = `
                <div class="onboarding-card">
                    <div class="onboarding-icon">${step.icon}</div>
                    <div class="onboarding-title">${step.title}</div>
                    <div class="onboarding-desc">${step.desc}</div>
                    <div class="onboarding-dots">
                        ${steps.map((_, i) => `<div class="onboarding-dot ${i === currentStep ? 'active' : ''}"></div>`).join('')}
                    </div>
                    <button class="onboarding-btn" onclick="App._nextTutorial()">
                        ${currentStep < steps.length - 1 ? 'Suivant' : 'C\'est parti ! 🔥'}
                    </button>
                    <button class="onboarding-skip" onclick="App._closeTutorial()">Passer</button>
                </div>
            `;
        };

        this._nextTutorial = () => {
            currentStep++;
            if (currentStep >= steps.length) {
                this._closeTutorial();
            } else {
                renderTutorial();
            }
        };

        this._closeTutorial = () => {
            const overlay = document.getElementById('tutorial-overlay');
            if (overlay) overlay.remove();
            try { localStorage.setItem('nutritrack_tutorial_v2_done', '1'); } catch(e) {}
        };

        // Delay to let dashboard render first
        setTimeout(renderTutorial, 800);
    },

    // Animated success checkmark (Reco #4)
    showSuccessCheck() {
        const el = document.createElement('div');
        el.className = 'success-check';
        el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';
        document.body.appendChild(el);
        this.haptic('success');
        if (navigator.vibrate) navigator.vibrate(50);
        setTimeout(() => el.remove(), 700);
    }
};

// ===== ONBOARDING (Reco #2) =====
const Onboarding = {
    step: 0,

    start() {
        this.step = 0;
        this.renderStep();
    },

    renderStep() {
        // Remove existing overlay
        const existing = document.querySelector('.onboarding-overlay');
        if (existing) existing.remove();

        const steps = [this.stepWelcome, this.stepBody, this.stepGoal, this.stepStarter];
        if (this.step >= steps.length) {
            this.finish();
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        overlay.innerHTML = `
            <div class="onboarding-step">
                <div class="onboarding-progress">
                    ${steps.map((_, i) => `<div class="onboarding-dot ${i === this.step ? 'active' : i < this.step ? 'active' : ''}"></div>`).join('')}
                </div>
                ${steps[this.step]()}
            </div>
        `;
        document.body.appendChild(overlay);
    },

    _escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    stepWelcome() {
        const user = AuthService.getCurrentUser();
        const rawName = user?.displayName || user?.email?.split('@')[0] || '';
        const displayName = this._escapeHTML(rawName);
        return `
            <div class="ob-icon">💪</div>
            <h2>Bienvenue ${displayName} !</h2>
            <p>Configurons ton profil pour calculer tes besoins.</p>
            <div style="max-width:300px;margin:0 auto;display:flex;flex-direction:column;gap:10px">
                <div class="form-group" style="text-align:left;margin:0">
                    <label class="form-label">Ton prénom</label>
                    <input type="text" class="form-input" id="ob-name" placeholder="Prénom" value="${displayName}" autofocus>
                </div>
                <button class="btn btn-primary" onclick="Onboarding.next()">
                    Continuer
                </button>
            </div>
        `;
    },

    stepBody() {
        return `
            <div class="ob-icon">🔥</div>
            <h2>Vos informations</h2>
            <p>Pour calculer vos besoins caloriques quotidiens.</p>
            <div style="max-width:300px;margin:0 auto;text-align:left">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Sexe</label>
                        <select class="form-select" id="ob-sex">
                            <option value="male">Homme</option>
                            <option value="female">Femme</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Âge</label>
                        <input type="number" class="form-input" id="ob-age" value="30" min="10" max="120">
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label class="form-label">Taille (cm)</label>
                        <input type="number" class="form-input" id="ob-height" value="175" min="100" max="250">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Poids (kg)</label>
                        <input type="number" class="form-input" id="ob-weight" value="70" step="0.1" min="30" max="300">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Niveau d'activité</label>
                    <select class="form-select" id="ob-activity">
                        <option value="sedentary">Sédentaire</option>
                        <option value="light">Légèrement actif</option>
                        <option value="moderate" selected>Modérément actif</option>
                        <option value="active">Actif</option>
                        <option value="very_active">Très actif</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-primary mt-16" onclick="Onboarding.next()" style="max-width:300px">
                Continuer
            </button>
        `;
    },

    stepGoal() {
        return `
            <div class="ob-icon">🏋️</div>
            <h2>Votre objectif</h2>
            <p>Nous ajusterons vos calories en conséquence.</p>
            <div style="max-width:300px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
                <button class="btn btn-outline ob-goal-btn" data-goal="lose" onclick="Onboarding.selectGoal('lose')" style="width:100%;justify-content:flex-start;gap:12px">
                    📉 Perdre du poids
                </button>
                <button class="btn btn-outline ob-goal-btn" data-goal="maintain" onclick="Onboarding.selectGoal('maintain')" style="width:100%;justify-content:flex-start;gap:12px;border-color:var(--primary);background:var(--primary-light)">
                    ⚖️ Maintenir mon poids
                </button>
                <button class="btn btn-outline ob-goal-btn" data-goal="gain" onclick="Onboarding.selectGoal('gain')" style="width:100%;justify-content:flex-start;gap:12px">
                    📈 Prendre de la masse 💪
                </button>
            </div>
            <button class="btn btn-primary mt-16" onclick="Onboarding.next()" style="max-width:300px">
                Continuer
            </button>
        `;
    },

    stepStarter() {
        const firePreview = Creature.buildSVG(70, { creatureData: { type: 'fire', xp: 0, form: 1, chosen: true }, mood: 'happy', previewItems: [] });
        const plantPreview = Creature.buildSVG(70, { creatureData: { type: 'plant', xp: 0, form: 1, chosen: true }, mood: 'happy', previewItems: [] });
        const waterPreview = Creature.buildSVG(70, { creatureData: { type: 'water', xp: 0, form: 1, chosen: true }, mood: 'happy', previewItems: [] });

        return `
            <div class="ob-icon">🥚</div>
            <h2>Choisis ton compagnon !</h2>
            <p>Il t'accompagnera et évoluera avec toi.</p>
            <div class="starter-choice-grid" style="max-width:320px;margin:0 auto">
                <div class="starter-card ${this._selectedStarter === 'fire' ? 'selected' : ''}" data-starter="fire" onclick="Onboarding.selectStarter('fire')">
                    ${firePreview}
                    <div class="starter-name">Flamoussin</div>
                    <div class="starter-type">🔥 Feu</div>
                </div>
                <div class="starter-card ${this._selectedStarter === 'plant' ? 'selected' : ''}" data-starter="plant" onclick="Onboarding.selectStarter('plant')">
                    ${plantPreview}
                    <div class="starter-name">Herbachat</div>
                    <div class="starter-type">🌿 Plante</div>
                </div>
                <div class="starter-card ${this._selectedStarter === 'water' ? 'selected' : ''}" data-starter="water" onclick="Onboarding.selectStarter('water')">
                    ${waterPreview}
                    <div class="starter-name">Aquarein</div>
                    <div class="starter-type">💧 Eau</div>
                </div>
            </div>
            <button class="btn btn-primary mt-16" onclick="Onboarding.next()" style="max-width:300px">
                Commencer ! 🎉
            </button>
        `;
    },

    _selectedStarter: 'fire',

    selectStarter(type) {
        this._selectedStarter = type;
        document.querySelectorAll('.starter-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.starter === type);
        });
    },

    _selectedGoal: 'maintain',

    selectGoal(goal) {
        this._selectedGoal = goal;
        document.querySelectorAll('.ob-goal-btn').forEach(btn => {
            const isSelected = btn.dataset.goal === goal;
            btn.style.borderColor = isSelected ? 'var(--primary)' : '';
            btn.style.background = isSelected ? 'var(--primary-light)' : '';
        });
    },

    next() {
        // Save current step data
        if (this.step === 0) {
            const name = document.getElementById('ob-name')?.value?.trim();
            if (!name) {
                App.showToast('Veuillez entrer votre prénom');
                return;
            }
            this._name = name;
        } else if (this.step === 1) {
            this._sex = document.getElementById('ob-sex').value;
            this._age = parseInt(document.getElementById('ob-age').value) || 30;
            this._height = parseInt(document.getElementById('ob-height').value) || 175;
            this._weight = parseFloat(document.getElementById('ob-weight').value) || 70;
            this._activity = document.getElementById('ob-activity').value;
        }

        this.step++;
        this.renderStep();
    },

    finish() {
        // Save profile
        const profile = {
            name: this._name || 'Utilisateur',
            age: this._age || 30,
            sex: this._sex || 'male',
            height: this._height || 175,
            weight: this._weight || 70,
            activity: this._activity || 'moderate',
            goal: this._selectedGoal || 'maintain'
        };
        Storage.setProfile(profile);

        // Calculate and save goals
        const auto = NutritionService.calculateDailyNeeds(profile);
        Storage.setGoals({
            calories: auto.calories,
            protein: auto.protein,
            carbs: auto.carbs,
            fat: auto.fat,
            fiber: auto.fiber || 25,
            water: 8,
            custom: false
        });

        // Add initial weight
        Storage.addWeight(profile.weight);

        // Save creature starter choice
        Storage.setCreature({
            type: this._selectedStarter || 'fire',
            xp: 0,
            form: 1,
            chosen: true
        });

        // Initialize creature streak
        Storage.setCreatureStreak({
            current: 0,
            best: 0,
            lastActiveDate: null,
            freezesOwned: 0,
            freezesUsed: []
        });

        // Remove overlay
        const overlay = document.querySelector('.onboarding-overlay');
        if (overlay) overlay.remove();

        // Force immediate cloud save after onboarding
        if (typeof SyncService !== 'undefined' && SyncService.isReady()) {
            SyncService.saveAll();
        }

        App.showToast(`C'est parti ${profile.name} ! 🔥`);
        App.navigate('dashboard');
    }
};

// Capture install prompt for PWA install button (only on website, not installed PWA)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window._deferredInstallPrompt = e;
});

// PWA Force-Update: detect new service worker and auto-reload
// SW registration is in index.html <head> — here we just attach update listeners
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
        // Check for updates every 60s
        setInterval(() => reg.update(), 60000);

        reg.addEventListener('updatefound', () => {
            const newSW = reg.installing;
            if (!newSW) return;
            newSW.addEventListener('statechange', () => {
                if (newSW.state === 'activated' && navigator.serviceWorker.controller) {
                    window.location.reload();
                }
            });
        });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (window._swReloading) return;
        window._swReloading = true;
        window.location.reload();
    });
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
