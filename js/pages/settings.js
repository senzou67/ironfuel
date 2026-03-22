const SettingsPage = {
    render() {
        const settings = Storage.getSettings();
        const theme = settings.theme || 'auto';

        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="settings-container fade-in">
                <div class="settings-group">
                    <div class="settings-group-title">Apparence</div>
                    <div class="settings-item" style="flex-direction:column;align-items:stretch;gap:8px">
                        <span>Thème</span>
                        <div style="display:flex;gap:6px">
                            <button class="btn ${theme === 'auto' ? 'btn-primary' : 'btn-outline'}" onclick="SettingsPage.setTheme('auto')" style="flex:1;padding:8px;font-size:12px">Auto</button>
                            <button class="btn ${theme === 'light' ? 'btn-primary' : 'btn-outline'}" onclick="SettingsPage.setTheme('light')" style="flex:1;padding:8px;font-size:12px">Clair</button>
                            <button class="btn ${theme === 'dark' ? 'btn-primary' : 'btn-outline'}" onclick="SettingsPage.setTheme('dark')" style="flex:1;padding:8px;font-size:12px">Sombre</button>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="settings-group-title">Notifications</div>
                    <button class="settings-item" onclick="SettingsPage.toggleNotifications()">
                        <span>🔔 Notifications push</span>
                        <span style="font-size:12px;color:${settings.notifications !== false && typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'var(--success)' : 'var(--text-secondary)'}">
                            ${settings.notifications !== false && typeof Notification !== 'undefined' && Notification.permission === 'granted' ? '✓ Activées — Désactiver' : 'Activer'}
                        </span>
                    </button>
                    ${settings.notifications !== false && typeof Notification !== 'undefined' && Notification.permission === 'granted' ? (() => {
                        const prefs = typeof LocalNotificationScheduler !== 'undefined' ? LocalNotificationScheduler.getPreferences() : {};
                        const cats = [
                            { key: 'motivation', label: '💪 Motivation' },
                            { key: 'supplements', label: '💊 Compléments' },
                            { key: 'gym', label: '🏋️ Salle' },
                            { key: 'weight', label: '⚖️ Poids' }
                        ];
                        return cats.map(c => {
                            const pref = prefs[c.key] || { enabled: false, time: '08:00' };
                            return `
                                <div class="settings-item" style="flex-direction:column;align-items:stretch;gap:6px;padding:10px 16px">
                                    <div style="display:flex;align-items:center;justify-content:space-between">
                                        <span style="font-size:13px;font-weight:600">${c.label}</span>
                                        <button class="btn ${pref.enabled ? 'btn-primary' : 'btn-outline'}" style="padding:4px 14px;font-size:12px;border-radius:20px" onclick="LocalNotificationScheduler.setPreference('${c.key}',${!pref.enabled},'${pref.time}');SettingsPage.render()">${pref.enabled ? 'ON' : 'OFF'}</button>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:8px">
                                        <span style="font-size:12px;color:var(--text-secondary)">Heure :</span>
                                        <input type="time" value="${pref.time}" style="padding:4px 8px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:13px" onchange="LocalNotificationScheduler.setPreference('${c.key}',${pref.enabled},this.value)">
                                    </div>
                                </div>
                            `;
                        }).join('');
                    })() : ''}
                </div>

                <div class="settings-group">
                    <div class="settings-group-title">Données</div>
                    <button class="settings-item" onclick="SettingsPage.clearData()" style="color:var(--danger)">
                        <span>Réinitialiser toutes les données</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>

                ${!TrialService.isPaid() && TrialService._premiumVerified ? `
                <div class="settings-group" style="border:2px solid var(--primary);border-radius:var(--radius)">
                    <div class="settings-group-title" style="color:var(--primary)">
                        ${TrialService.isTrialActive() ? '🎉 Essai gratuit — ' + TrialService.daysLeft() + 'j restants' : '⭐ Passe à Premium'}
                    </div>
                    <div class="settings-item" style="flex-direction:column;align-items:stretch;gap:10px">
                        <p style="font-size:13px;color:var(--text-secondary);line-height:1.4">
                            ${TrialService.isTrialActive()
                                ? 'Profite de l\'accès complet pendant ton essai. Abonne-toi pour ne rien perdre !'
                                : 'Débloque la créature, les objectifs personnalisés, la photo IA et plus encore.'}
                        </p>

                        <div style="display:flex;gap:8px">
                            <div class="settings-plan-card selected" id="settings-plan-annual" onclick="SettingsPage._selectPlan('annual')" style="flex:1;padding:12px;border:2px solid var(--primary);border-radius:10px;text-align:center;cursor:pointer;background:var(--primary-light)">
                                <div style="font-size:10px;font-weight:700;color:var(--primary);margin-bottom:4px">MEILLEURE OFFRE</div>
                                <div style="font-weight:800;font-size:18px;color:var(--primary)">14,99€</div>
                                <div style="font-size:11px;color:var(--text-secondary)">/an (1,25€/mois)</div>
                            </div>
                            <div class="settings-plan-card" id="settings-plan-monthly" onclick="SettingsPage._selectPlan('monthly')" style="flex:1;padding:12px;border:2px solid var(--border);border-radius:10px;text-align:center;cursor:pointer">
                                <div style="font-size:10px;font-weight:700;color:transparent;margin-bottom:4px">.</div>
                                <div style="font-weight:800;font-size:18px">1,25€</div>
                                <div style="font-size:11px;color:var(--text-secondary)">/mois (14,99€/an)</div>
                            </div>
                        </div>

                        <button class="btn btn-primary" id="settings-sub-btn" onclick="SettingsPage._subscribe()" style="width:100%;font-weight:700;font-size:16px;padding:14px">
                            S'abonner — 14,99€/an
                        </button>
                        <div id="paypal-subscribe-btn" style="margin-top:6px"></div>
                        <p style="font-size:11px;color:var(--text-secondary);text-align:center">🔒 Stripe (annuel) · PayPal (mensuel) — Paiement sécurisé</p>
                        <p style="font-size:11px;color:var(--primary);text-align:center;font-weight:600">🚫 Sans engagement — Résiliable à tout moment</p>
                    </div>
                </div>
                ` : `
                <div class="settings-group">
                    <div class="settings-group-title" style="color:#4CAF50">✅ Abonnement Premium actif</div>
                    <div class="settings-item">
                        <span>Statut</span>
                        <span style="color:#4CAF50;font-weight:600">Premium</span>
                    </div>
                    <div class="settings-item">
                        <span>Expire dans</span>
                        <span style="color:var(--text-secondary)">${TrialService.subscriptionDaysLeft()} jours</span>
                    </div>
                </div>
                `}

                <div class="settings-group">
                    <div class="settings-group-title">Soutien</div>
                    <button class="settings-item" onclick="SettingsPage.showDonate()">
                        <span>❤️ Soutenir le créateur</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                </div>

                ${TrialService.isPaid() ? `
                <div class="settings-group">
                    <div class="settings-group-title">Abonnement</div>
                    <button class="settings-item" onclick="SettingsPage.manageSubscription()">
                        <span>📋 Gérer mon abonnement</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                    <button class="settings-item" onclick="window.open('https://billing.stripe.com/p/login/dRmcMXcr4bNCaKWci65c400','_blank')">
                        <span>💳 Portail de facturation Stripe</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                    </button>
                </div>
                ` : ''}

                <div class="settings-group">
                    <div class="settings-group-title">Données</div>
                    <button class="settings-item" onclick="SettingsPage.exportData()">
                        <span>📥 Exporter mes données (JSON)</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </button>
                    <label class="settings-item" style="cursor:pointer">
                        <span>📤 Importer des données</span>
                        <input type="file" accept=".json" onchange="SettingsPage.importData(event)" style="display:none">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    </label>
                </div>

                <div class="settings-group">
                    <div class="settings-group-title">Compte</div>
                    <div class="settings-item">
                        <span>Connecté en tant que</span>
                        <span style="color:var(--text-secondary);font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis">${AuthService.getCurrentUser()?.email || 'Non connecté'}</span>
                    </div>
                    <button class="settings-item" onclick="SettingsPage.logout()" style="color:var(--danger)">
                        <span>Se déconnecter</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                        </svg>
                    </button>
                    <button class="settings-item" onclick="SettingsPage.deleteAccount()" style="color:var(--danger)">
                        <span>🗑️ Supprimer mon compte</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                        </svg>
                    </button>
                </div>

                <div class="settings-group">
                    <div class="settings-group-title">À propos</div>
                    <div class="settings-item">
                        <span>Version</span>
                        <span style="color:var(--text-secondary)">3.1.0</span>
                    </div>
                    <div class="settings-item">
                        <span>IronFuel</span>
                        <span style="color:var(--text-secondary)">Nutrition & Musculation</span>
                    </div>
                    <button class="settings-item" onclick="window.open('mailto:iron.fuel@outlook.com')">
                        <span>📧 Contact</span>
                        <span style="color:var(--text-secondary);font-size:12px">iron.fuel@outlook.com</span>
                    </button>
                </div>

                <div class="settings-group">
                    <div class="settings-group-title">Légal</div>
                    <button class="settings-item" onclick="window.open('/privacy.html','_blank')">
                        <span>🔒 Politique de confidentialité</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                    <button class="settings-item" onclick="window.open('/terms.html','_blank')">
                        <span>📄 Conditions d'utilisation</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                </div>
            </div>
        `;

        // Render PayPal subscribe button for monthly plan if configured
        if (typeof PayPalService !== 'undefined' && PayPalService.isConfigured() && !TrialService.isPaid()) {
            setTimeout(() => {
                PayPalService.renderSubscribeButton('paypal-subscribe-btn');
            }, 200);
        } else if (!TrialService.isPaid()) {
            // Fallback: simple PayPal.me button for subscription
            setTimeout(() => {
                const container = document.getElementById('paypal-subscribe-btn');
                if (container) {
                    container.innerHTML = `<button class="btn btn-outline" onclick="window.open('https://paypal.me/ironfuel/1.25','_blank')" style="width:100%;font-weight:600;font-size:13px;padding:10px;color:#0070ba;border-color:#0070ba">💳 Mensuel via PayPal — 1,25€/mois</button>`;
                }
            }, 100);
        }
    },

    async toggleNotifications() {
        // Check current state — if already granted, allow user to disable locally
        const currentlyEnabled = Storage.getSettings().notifications !== false
            && typeof Notification !== 'undefined' && Notification.permission === 'granted';

        if (currentlyEnabled) {
            // Disable notifications locally (can't revoke browser permission, but we stop sending)
            const settings = Storage.getSettings();
            settings.notifications = false;
            Storage.setSettings(settings);
            // Unregister FCM token from server
            if (typeof NotificationService !== 'undefined') {
                NotificationService._token = null;
                Storage._set('fcm_token', null);
                Storage._set('fcm_last_reg', 0);
            }
            App.showToast('Notifications désactivées');
            this.render();
            return;
        }

        // Enable: request permission
        if (typeof NotificationService !== 'undefined') {
            const token = await NotificationService.requestPermission();
            if (token) {
                const settings = Storage.getSettings();
                settings.notifications = true;
                Storage.setSettings(settings);
            }
        } else {
            if (!('Notification' in window)) {
                App.showToast('Notifications non supportées');
                return;
            }
            const result = await Notification.requestPermission();
            if (result === 'granted') {
                const settings = Storage.getSettings();
                settings.notifications = true;
                Storage.setSettings(settings);
                App.showToast('Notifications activées ! 🔔');
            } else if (result === 'denied') {
                App.showToast('Notifications bloquées — active dans les paramètres navigateur');
            } else {
                App.showToast('Notifications refusées');
            }
        }
        this.render();
    },

    setTheme(theme) {
        Storage.setTheme(theme);
        this.render();
    },

    toggleTheme() {
        const current = Storage.getTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    exportData() {
        const data = Storage.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ironfuel-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        App.showToast('Données exportées');
    },

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                Storage.importData(data);
                App.showToast('Données importées avec succès');
                App.navigate('dashboard');
            } catch {
                App.showToast('Fichier invalide');
            }
        };
        reader.readAsText(file);
    },

    clearData() {
        Modal.show(`
            <div class="modal-title" style="color:var(--danger)">Réinitialiser les données ?</div>
            <p style="color:var(--text-secondary);margin-bottom:16px">
                Cette action est irréversible. Toutes vos données seront supprimées.
            </p>
            <div style="display:flex;gap:12px">
                <button class="btn btn-secondary" onclick="Modal.close()" style="flex:1">Annuler</button>
                <button class="btn btn-danger" onclick="SettingsPage.confirmClear()" style="flex:1">Supprimer</button>
            </div>
        `);
    },

    confirmClear() {
        Storage.clearAll();
        Modal.close();
        App.showToast('Données réinitialisées');
        App.navigate('dashboard');
    },

    showDonate() {
        Modal.show(`
            <div style="text-align:center">
                <div style="font-size:48px;margin-bottom:12px">❤️</div>
                <div class="modal-title">Soutenir IronFuel</div>
                <p style="color:var(--text-secondary);font-size:14px;margin-bottom:16px;line-height:1.5">
                    Un petit geste aide à continuer le développement !
                </p>
                <div style="display:flex;gap:8px;margin-bottom:12px">
                    <button class="btn btn-outline" onclick="SettingsPage._setDonateAmount(3)" style="flex:1;font-weight:700">3€</button>
                    <button class="btn btn-primary" onclick="SettingsPage._setDonateAmount(5)" style="flex:1;font-weight:700">5€</button>
                    <button class="btn btn-outline" onclick="SettingsPage._setDonateAmount(10)" style="flex:1;font-weight:700">10€</button>
                    <button class="btn btn-outline" onclick="SettingsPage._setDonateAmount(20)" style="flex:1;font-weight:700">20€</button>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
                    <span style="font-size:13px;color:var(--text-secondary);white-space:nowrap">Ou :</span>
                    <input type="number" id="donate-custom-amount" min="1" step="1" value="5" placeholder="Montant" style="flex:1;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:16px;font-weight:700;text-align:center;background:var(--surface);color:var(--text)" />
                    <span style="font-size:16px;font-weight:700">€</span>
                </div>
                <button class="btn btn-primary" id="donate-action-btn" onclick="SettingsPage._confirmDonate()" style="width:100%;font-weight:700;font-size:16px;padding:12px;margin-bottom:8px">
                    💝 Donner
                </button>
                <div id="paypal-donate-btn" style="margin-bottom:8px"></div>
                <p style="font-size:11px;color:var(--text-secondary)">🔒 PayPal (< 10€) · Stripe (10€+) — automatique selon le montant</p>
            </div>
        `);

        // Update button text based on amount + listen for changes
        this._updateDonateButton();
        setTimeout(() => {
            const inp = document.getElementById('donate-custom-amount');
            if (inp) inp.addEventListener('input', () => this._updateDonateButton());
        }, 50);

        // Render PayPal donate button for < 10€
        if (typeof PayPalService !== 'undefined' && PayPalService.isConfigured()) {
            setTimeout(() => {
                PayPalService.renderDonateButton('paypal-donate-btn', () => {
                    const inp = document.getElementById('donate-custom-amount');
                    return parseFloat(inp ? inp.value : '5');
                });
            }, 100);
        } else {
            // Fallback: simple PayPal.me link
            setTimeout(() => {
                const container = document.getElementById('paypal-donate-btn');
                if (container) {
                    container.innerHTML = `<button class="btn btn-outline" onclick="window.open('https://paypal.me/ironfuel','_blank')" style="width:100%;font-weight:600;font-size:14px;padding:10px;color:#0070ba;border-color:#0070ba">💳 PayPal (< 10€)</button>`;
                }
            }, 50);
        }
    },

    _setDonateAmount(amount) {
        const input = document.getElementById('donate-custom-amount');
        if (input) input.value = amount;
        this._updateDonateButton();
    },

    _updateDonateButton() {
        const input = document.getElementById('donate-custom-amount');
        const btn = document.getElementById('donate-action-btn');
        const paypalContainer = document.getElementById('paypal-donate-btn');
        if (!btn) return;
        const amount = parseFloat(input ? input.value : '5');
        if (amount >= 10) {
            btn.textContent = '💳 Donner ' + amount + '€ via Stripe';
            btn.style.display = '';
            if (paypalContainer) paypalContainer.style.display = 'none';
        } else {
            btn.style.display = 'none';
            if (paypalContainer) paypalContainer.style.display = '';
        }
    },

    _confirmDonate() {
        const input = document.getElementById('donate-custom-amount');
        const amount = parseFloat(input ? input.value : '5');
        if (!amount || amount < 1) {
            App.showToast('Minimum 1€');
            return;
        }
        if (amount < 10) {
            // Small donations (<10€) go through PayPal — show PayPal button
            App.showToast('Utilise le bouton PayPal pour les dons de moins de 10€');
            return;
        }
        // 10€+ goes through Stripe
        this.donate(amount);
    },

    logout() {
        Modal.show(`
            <div class="modal-title">Se déconnecter ?</div>
            <p style="color:var(--text-secondary);margin-bottom:16px">
                Tu seras redirigé vers l'écran de connexion.
            </p>
            <div style="display:flex;gap:12px">
                <button class="btn btn-secondary" onclick="Modal.close()" style="flex:1">Annuler</button>
                <button class="btn btn-danger" onclick="Modal.close();AuthService.signOut()" style="flex:1">Déconnexion</button>
            </div>
        `);
    },

    _selectedPlan: 'annual',

    _selectPlan(plan) {
        this._selectedPlan = plan;
        const annual = document.getElementById('settings-plan-annual');
        const monthly = document.getElementById('settings-plan-monthly');
        if (annual) {
            annual.style.borderColor = plan === 'annual' ? 'var(--primary)' : 'var(--border)';
            annual.style.background = plan === 'annual' ? 'var(--primary-light)' : '';
        }
        if (monthly) {
            monthly.style.borderColor = plan === 'monthly' ? 'var(--primary)' : 'var(--border)';
            monthly.style.background = plan === 'monthly' ? 'var(--primary-light)' : '';
        }
        const btn = document.getElementById('settings-sub-btn');
        if (btn) {
            btn.textContent = plan === 'annual' ? 'S\'abonner — 14,99€/an' : 'S\'abonner — 1,25€/mois';
        }
        TrialService._selectedPlan = plan;
    },

    _subscribe() {
        TrialService._selectedPlan = this._selectedPlan || 'annual';
        TrialService.startPayment(true);
    },

    deleteAccount() {
        Modal.show(`
            <div style="text-align:center">
                <div style="font-size:48px;margin-bottom:12px">⚠️</div>
                <div class="modal-title" style="color:var(--danger)">Supprimer mon compte ?</div>
                <p style="color:var(--text-secondary);font-size:14px;margin-bottom:8px;line-height:1.5">
                    Cette action est <strong>définitive et irréversible</strong>.
                </p>
                <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;line-height:1.5">
                    Toutes vos données seront supprimées :<br>
                    profil, journal alimentaire, créature, historique, abonnement.
                </p>
                <p style="font-size:13px;margin-bottom:16px;line-height:1.5">
                    Tapez <strong style="color:var(--danger)">SUPPRIMER</strong> pour confirmer :
                </p>
                <input type="text" id="delete-confirm-input" class="form-input" placeholder="SUPPRIMER" style="text-align:center;font-weight:700;margin-bottom:16px">
                <div style="display:flex;gap:12px">
                    <button class="btn btn-secondary" onclick="Modal.close()" style="flex:1">Annuler</button>
                    <button class="btn btn-danger" onclick="SettingsPage.confirmDeleteAccount()" style="flex:1">Supprimer</button>
                </div>
            </div>
        `);
    },

    async confirmDeleteAccount() {
        const input = document.getElementById('delete-confirm-input');
        if (!input || input.value.trim().toUpperCase() !== 'SUPPRIMER') {
            App.showToast('Tapez SUPPRIMER pour confirmer');
            return;
        }

        try {
            const user = AuthService.getCurrentUser();

            // 1. Delete Firestore data if logged in (main doc + logs subcollection)
            if (user && typeof SyncService !== 'undefined' && SyncService._projectId) {
                try {
                    const token = await user.getIdToken();
                    const baseUrl = `https://firestore.googleapis.com/v1/projects/${SyncService._projectId}/databases/(default)/documents`;
                    const uid = user.uid;

                    // Delete all logs in subcollection first
                    try {
                        const logsRes = await fetch(`${baseUrl}/users/${uid}/logs`, {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        if (logsRes.ok) {
                            const logsData = await logsRes.json();
                            const docs = logsData.documents || [];
                            await Promise.all(docs.map(doc =>
                                fetch(`${baseUrl}/${doc.name.split('/documents/')[1]}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': 'Bearer ' + token }
                                })
                            ));
                        }
                    } catch (e) {}

                    // Delete main user document
                    await fetch(`${baseUrl}/users/${uid}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                } catch (e) {}
            }

            // 2. Clear all local data
            Storage.clearAll();

            // 3. Delete Firebase Auth account
            if (user) {
                try {
                    await user.delete();
                } catch (e) {
                    // If requires re-auth, sign out instead
                    if (e.code === 'auth/requires-recent-login') {
                        await firebase.auth().signOut();
                    }
                }
            }

            Modal.close();
            App.showToast('Compte supprimé. Au revoir.');
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            App.showToast('Erreur lors de la suppression');
        }
    },

    async manageSubscription() {
        try {
            App.showToast('Ouverture du portail...');
            const user = AuthService.getCurrentUser();
            const reqHeaders = { 'Content-Type': 'application/json' };
            if (user) {
                try { reqHeaders['Authorization'] = 'Bearer ' + await user.getIdToken(); } catch(e) {}
            }
            const res = await fetch('/.netlify/functions/create-portal-session', {
                method: 'POST',
                headers: reqHeaders,
                body: JSON.stringify({
                    userId: user ? user.uid : Storage._get('device_id', ''),
                    email: user ? user.email : null
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                App.showToast('Impossible de charger le portail. Contacte iron.fuel@outlook.com');
            }
        } catch (err) {
            App.showToast('Erreur réseau. Réessaie ou contacte iron.fuel@outlook.com');
        }
    },

    async donate(amount) {
        Modal.close();

        try {
            const res = await fetch('/.netlify/functions/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: AuthService.isLoggedIn() ? AuthService.getCurrentUser().uid : Storage._get('device_id', ''),
                    email: AuthService.isLoggedIn() ? AuthService.getCurrentUser().email : null,
                    mode: 'donation',
                    amount: amount
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
        }
    }
};
