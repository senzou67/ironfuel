const ProfilePage = {
    // Macro ratio presets
    ratioPresets: {
        balanced: { label: 'Équilibré', prot: 30, carbs: 40, fat: 30 },
        highprot: { label: 'Riche en protéines', prot: 40, carbs: 35, fat: 25 },
        lowcarb: { label: 'Faible en glucides', prot: 35, carbs: 20, fat: 45 },
        keto: { label: 'Keto', prot: 25, carbs: 5, fat: 70 }
    },

    render() {
        const profile = Storage.getProfile();
        const goals = Storage.getGoals();
        const hasBMIData = profile.weight > 0 && profile.height > 0;
        const bmi = hasBMIData ? NutritionService.calculateBMI(profile.weight, profile.height) : null;
        const bmiCat = hasBMIData ? NutritionService.getBMICategory(bmi) : { label: 'Complète ton profil', color: 'var(--text-secondary)' };
        const streak = Storage.getStreak();
        const totalDays = Storage.getLogDates().length;

        // Calculate current macro percentages
        const totalMacroCal = (goals.protein * 4) + (goals.carbs * 4) + (goals.fat * 9);
        const pctProt = totalMacroCal > 0 ? Math.round((goals.protein * 4) / totalMacroCal * 100) : 30;
        const pctCarbs = totalMacroCal > 0 ? Math.round((goals.carbs * 4) / totalMacroCal * 100) : 40;
        const pctFat = totalMacroCal > 0 ? Math.round((goals.fat * 9) / totalMacroCal * 100) : 30;

        const authUser = AuthService.getStoredUser();
        const isLoggedIn = AuthService.isLoggedIn();

        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="profile-container fade-in">
                <div class="profile-avatar creature-display" data-type="${(Creature.getData().type || 'fire')}" style="display:flex;justify-content:center">
                    ${Avatar.buildSVG(90)}
                </div>
                <h2 style="text-align:center;font-size:20px">${profile.name || 'Mon profil'}</h2>
                ${authUser && authUser.email ? `<p style="text-align:center;font-size:12px;color:var(--text-secondary);margin-top:-4px">${authUser.email}</p>` : ''}

                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value">${hasBMIData ? bmi : '—'}</div>
                        <div class="profile-stat-label">IMC</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${streak}🔥</div>
                        <div class="profile-stat-label">Série</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${totalDays}</div>
                        <div class="profile-stat-label">Jours</div>
                    </div>
                </div>

                <p style="text-align:center;font-size:13px;margin-bottom:16px">
                    IMC : <span style="color:${bmiCat.color};font-weight:600">${bmiCat.label}</span>
                </p>

                <!-- Current macro summary with percentages -->
                <div class="card" style="margin:0 0 12px">
                    <div class="card-title">🎯 Objectifs du jour</div>
                    <div style="text-align:center;margin-bottom:12px">
                        <span style="font-size:28px;font-weight:700;color:var(--primary)">${goals.calories}</span>
                        <span style="color:var(--text-secondary);font-size:14px"> kcal</span>
                    </div>
                    <div style="display:flex;gap:8px;justify-content:center">
                        <div style="text-align:center;flex:1;padding:8px;background:var(--bg);border-radius:8px">
                            <span class="macro-pct-badge prot">${pctProt}%</span>
                            <div style="font-size:16px;font-weight:600;color:var(--protein-color);margin-top:4px">${goals.protein}g</div>
                            <div style="font-size:11px;color:var(--text-secondary)">Protéines</div>
                        </div>
                        <div style="text-align:center;flex:1;padding:8px;background:var(--bg);border-radius:8px">
                            <span class="macro-pct-badge carb">${pctCarbs}%</span>
                            <div style="font-size:16px;font-weight:600;color:var(--carbs-color);margin-top:4px">${goals.carbs}g</div>
                            <div style="font-size:11px;color:var(--text-secondary)">Glucides</div>
                        </div>
                        <div style="text-align:center;flex:1;padding:8px;background:var(--bg);border-radius:8px">
                            <span class="macro-pct-badge fat">${pctFat}%</span>
                            <div style="font-size:16px;font-weight:600;color:var(--fat-color);margin-top:4px">${goals.fat}g</div>
                            <div style="font-size:11px;color:var(--text-secondary)">Lipides</div>
                        </div>
                        <div style="text-align:center;flex:1;padding:8px;background:var(--bg);border-radius:8px">
                            <div style="font-size:16px;font-weight:600;color:var(--fiber-color);margin-top:4px">${goals.fiber || 25}g</div>
                            <div style="font-size:11px;color:var(--text-secondary)">Fibres</div>
                        </div>
                    </div>
                </div>

                <button class="profile-menu-item" onclick="ProfilePage.editProfile()">
                    <span>Informations personnelles</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button class="profile-menu-item" onclick="ProfilePage.editGoals()">
                    <span>Objectifs nutritionnels ${TrialService.isFeatureLocked('custom_macros') ? '🔒' : ''}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button class="profile-menu-item" onclick="App.navigate('history')">
                    <span>Historique & statistiques</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button class="profile-menu-item" onclick="App.navigate('settings')">
                    <span>Paramètres</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button class="profile-menu-item" onclick="ProfilePage.signOut()" style="color:var(--danger);margin-top:8px">
                    <span>Se déconnecter</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                </button>
            </div>
        `;
    },

    editProfile() {
        const profile = Storage.getProfile();
        const activityLabels = {
            sedentary: 'Sédentaire',
            light: 'Légèrement actif',
            moderate: 'Modérément actif',
            active: 'Actif',
            very_active: 'Très actif'
        };
        const goalLabels = {
            lose: 'Perte de poids',
            maintain: 'Maintien',
            gain: 'Prise de masse'
        };

        Modal.show(`
            <div class="modal-title">Informations personnelles</div>
            <div class="form-group">
                <label class="form-label">Nom</label>
                <input type="text" class="form-input" id="p-name" value="${profile.name || ''}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="form-group">
                    <label class="form-label">Âge</label>
                    <input type="number" class="form-input" id="p-age" value="${profile.age}" min="10" max="120">
                </div>
                <div class="form-group">
                    <label class="form-label">Sexe</label>
                    <select class="form-select" id="p-sex">
                        <option value="male" ${profile.sex === 'male' ? 'selected' : ''}>Homme</option>
                        <option value="female" ${profile.sex === 'female' ? 'selected' : ''}>Femme</option>
                    </select>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="form-group">
                    <label class="form-label">Taille (cm)</label>
                    <input type="number" class="form-input" id="p-height" value="${profile.height}" min="100" max="250">
                </div>
                <div class="form-group">
                    <label class="form-label">Poids (kg)</label>
                    <input type="number" class="form-input weight-input" id="p-weight" value="${profile.weight}" step="0.1" min="30" max="300">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Niveau d'activité</label>
                <select class="form-select" id="p-activity">
                    ${Object.entries(activityLabels).map(([k, v]) =>
                        `<option value="${k}" ${profile.activity === k ? 'selected' : ''}>${v}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Objectif</label>
                <select class="form-select" id="p-goal">
                    ${Object.entries(goalLabels).map(([k, v]) =>
                        `<option value="${k}" ${profile.goal === k ? 'selected' : ''}>${v}</option>`
                    ).join('')}
                </select>
            </div>
            <button class="btn btn-primary" onclick="ProfilePage.saveProfile()">Enregistrer</button>
        `);
    },

    saveProfile() {
        const profile = {
            name: document.getElementById('p-name').value,
            age: parseInt(document.getElementById('p-age').value) || 30,
            sex: document.getElementById('p-sex').value,
            height: parseInt(document.getElementById('p-height').value) || 175,
            weight: parseFloat(document.getElementById('p-weight').value) || 70,
            activity: document.getElementById('p-activity').value,
            goal: document.getElementById('p-goal').value
        };

        // Check if nutrition-impacting fields changed
        const old = Storage.getProfile();
        const changed = old.weight !== profile.weight || old.height !== profile.height || old.activity !== profile.activity || old.goal !== profile.goal || old.sex !== profile.sex || old.age !== profile.age;

        Storage._set('profile', profile);
        Storage._triggerSync();

        if (changed) {
            const auto = NutritionService.calculateDailyNeeds(profile);
            const goals = Storage.getGoals();
            Modal.close();
            // Show comparison and ask user
            Modal.show(`
                <div class="modal-title">Mettre à jour les objectifs ?</div>
                <p style="color:var(--text-secondary);font-size:13px;margin-bottom:12px">
                    Ton profil a changé. Voici les nouveaux objectifs recommandés :
                </p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
                    <div style="text-align:center">
                        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">Actuels</div>
                        <div style="font-size:22px;font-weight:800">${goals.calories}</div>
                        <div style="font-size:11px;color:var(--text-secondary)">kcal</div>
                        <div style="font-size:11px;margin-top:4px">P ${goals.protein}g · G ${goals.carbs}g · L ${goals.fat}g</div>
                    </div>
                    <div style="text-align:center;background:var(--primary-light);border-radius:10px;padding:8px">
                        <div style="font-size:11px;color:var(--primary);font-weight:600;margin-bottom:4px">Recommandés</div>
                        <div style="font-size:22px;font-weight:800;color:var(--primary)">${auto.calories}</div>
                        <div style="font-size:11px;color:var(--text-secondary)">kcal</div>
                        <div style="font-size:11px;margin-top:4px">P ${auto.protein}g · G ${auto.carbs}g · L ${auto.fat}g</div>
                    </div>
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-outline" onclick="Modal.close();ProfilePage.render()" style="flex:1;padding:12px;font-size:13px">Garder les actuels</button>
                    <button class="btn btn-primary" onclick="ProfilePage._applyAutoGoals();Modal.close();ProfilePage.render()" style="flex:1;padding:12px;font-size:13px">Mettre à jour</button>
                </div>
            `);
        } else {
            Modal.close();
            App.showToast('Profil mis à jour');
            this.render();
        }
    },

    _applyAutoGoals() {
        const profile = Storage.getProfile();
        const auto = NutritionService.calculateDailyNeeds(profile);
        const goals = Storage.getGoals();
        goals.calories = auto.calories;
        goals.protein = auto.protein;
        goals.carbs = auto.carbs;
        goals.fat = auto.fat;
        goals.fiber = auto.fiber || 25;
        goals.custom = false;
        Storage.setGoals(goals);
        App.showToast('Objectifs mis à jour ! 🎯');
    },

    editGoals() {
        // Check premium access for custom macros
        if (TrialService.isFeatureLocked('custom_macros')) {
            TrialService.showFeatureLockedPrompt('custom_macros');
            return;
        }

        const goals = Storage.getGoals();
        const profile = Storage.getProfile();
        const auto = NutritionService.calculateDailyNeeds(profile);

        // Calculate current percentages
        const totalMacroCal = (goals.protein * 4) + (goals.carbs * 4) + (goals.fat * 9);
        const pctProt = totalMacroCal > 0 ? Math.round((goals.protein * 4) / totalMacroCal * 100) : 30;
        const pctCarbs = totalMacroCal > 0 ? Math.round((goals.carbs * 4) / totalMacroCal * 100) : 40;
        const pctFat = totalMacroCal > 0 ? Math.round((goals.fat * 9) / totalMacroCal * 100) : 30;

        Modal.show(`
            <div class="modal-title">Objectifs nutritionnels</div>

            <div style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:10px">
                <p style="font-size:13px;color:var(--text-secondary)">
                    Recommandation auto : ${auto.calories} kcal · P:${auto.protein}g · G:${auto.carbs}g · L:${auto.fat}g
                </p>
                <button class="btn btn-outline mt-8" onclick="ProfilePage.applyAutoGoals()" style="width:100%;font-size:13px;padding:8px">
                    Appliquer les valeurs recommandées
                </button>
            </div>

            <div class="macro-sync-info">
                🔗 Les macros se recalculent automatiquement si vous changez les calories, et inversement.
            </div>

            <div class="form-group">
                <label class="form-label">Calories quotidiennes (kcal)</label>
                <input type="number" class="form-input" id="g-cal" value="${goals.calories}" min="800" max="6000"
                    oninput="ProfilePage.onCaloriesChange()">
            </div>

            <!-- Macro ratio preset -->
            <div class="form-group">
                <label class="form-label">Répartition des macros</label>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                    ${Object.entries(this.ratioPresets).map(([key, preset]) => `
                        <button class="category-chip ratio-preset" data-ratio="${key}"
                            onclick="ProfilePage.applyRatio('${key}')"
                            style="font-size:12px;padding:6px 12px">
                            ${preset.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Macro inputs with percentages -->
            <div class="macro-pct-row">
                <div class="form-group">
                    <label class="form-label">Protéines (g) <span class="macro-pct-badge prot" id="pct-prot">${pctProt}%</span></label>
                    <input type="number" class="form-input" id="g-prot" value="${goals.protein}"
                        oninput="ProfilePage.onMacroChange()">
                </div>
                <div class="form-group">
                    <label class="form-label">Glucides (g) <span class="macro-pct-badge carb" id="pct-carbs">${pctCarbs}%</span></label>
                    <input type="number" class="form-input" id="g-carbs" value="${goals.carbs}"
                        oninput="ProfilePage.onMacroChange()">
                </div>
                <div class="form-group">
                    <label class="form-label">Lipides (g) <span class="macro-pct-badge fat" id="pct-fat">${pctFat}%</span></label>
                    <input type="number" class="form-input" id="g-fat" value="${goals.fat}"
                        oninput="ProfilePage.onMacroChange()">
                </div>
            </div>

            <div id="macro-total-bar" style="margin-bottom:16px">
                ${this._renderMacroBar(pctProt, pctCarbs, pctFat)}
            </div>

            <div class="form-group">
                <label class="form-label">Objectif eau par jour</label>
                <select class="form-input" id="g-water">
                    ${[1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(l => {
                        const glasses = l * 4; // 4 glasses of 250ml per liter
                        return `<option value="${glasses}" ${(goals.water || 12) == glasses ? 'selected' : ''}>${l}L (${glasses} verres)</option>`;
                    }).join('')}
                </select>
            </div>
            <button class="btn btn-primary" onclick="ProfilePage.saveGoals()">Enregistrer</button>
        `);

        // Store current ratios for calorie sync
        this._currentRatios = { prot: pctProt, carbs: pctCarbs, fat: pctFat };
    },

    _renderMacroBar(pctProt, pctCarbs, pctFat) {
        const total = pctProt + pctCarbs + pctFat;
        const isValid = total >= 95 && total <= 105;
        return `
            <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin-bottom:4px">
                <div style="width:${pctProt}%;background:var(--protein-color);transition:width 0.3s"></div>
                <div style="width:${pctCarbs}%;background:var(--carbs-color);transition:width 0.3s"></div>
                <div style="width:${pctFat}%;background:var(--fat-color);transition:width 0.3s"></div>
            </div>
            <div style="font-size:11px;color:${isValid ? 'var(--text-secondary)' : 'var(--danger)'}">
                Total : ${total}% ${isValid ? '✓' : '(devrait être ~100%)'}
            </div>
        `;
    },

    // When calories change → recalculate macros keeping current ratios
    onCaloriesChange() {
        const cal = parseInt(document.getElementById('g-cal').value) || 2000;
        const ratios = this._currentRatios || { prot: 30, carbs: 40, fat: 30 };

        const newProt = Math.round((cal * ratios.prot / 100) / 4);
        const newCarbs = Math.round((cal * ratios.carbs / 100) / 4);
        const newFat = Math.round((cal * ratios.fat / 100) / 9);

        document.getElementById('g-prot').value = newProt;
        document.getElementById('g-carbs').value = newCarbs;
        document.getElementById('g-fat').value = newFat;

        this._updatePctDisplay();
    },

    // When a macro changes → recalculate percentages (don't touch calories)
    onMacroChange() {
        this._updatePctDisplay();
        // Update stored ratios
        const prot = parseInt(document.getElementById('g-prot').value) || 0;
        const carbs = parseInt(document.getElementById('g-carbs').value) || 0;
        const fat = parseInt(document.getElementById('g-fat').value) || 0;
        const totalCal = (prot * 4) + (carbs * 4) + (fat * 9);
        if (totalCal > 0) {
            this._currentRatios = {
                prot: Math.round((prot * 4) / totalCal * 100),
                carbs: Math.round((carbs * 4) / totalCal * 100),
                fat: Math.round((fat * 9) / totalCal * 100)
            };
        }
        // Also update calories to match macro total
        const cal = document.getElementById('g-cal');
        if (cal) cal.value = Math.round(totalCal);
    },

    _updatePctDisplay() {
        const prot = parseInt(document.getElementById('g-prot').value) || 0;
        const carbs = parseInt(document.getElementById('g-carbs').value) || 0;
        const fat = parseInt(document.getElementById('g-fat').value) || 0;
        const total = (prot * 4) + (carbs * 4) + (fat * 9);

        const pp = total > 0 ? Math.round((prot * 4) / total * 100) : 0;
        const pc = total > 0 ? Math.round((carbs * 4) / total * 100) : 0;
        const pf = total > 0 ? Math.round((fat * 9) / total * 100) : 0;

        const ppEl = document.getElementById('pct-prot');
        const pcEl = document.getElementById('pct-carbs');
        const pfEl = document.getElementById('pct-fat');
        if (ppEl) ppEl.textContent = pp + '%';
        if (pcEl) pcEl.textContent = pc + '%';
        if (pfEl) pfEl.textContent = pf + '%';

        const bar = document.getElementById('macro-total-bar');
        if (bar) bar.innerHTML = this._renderMacroBar(pp, pc, pf);
    },

    applyRatio(key) {
        const preset = this.ratioPresets[key];
        if (!preset) return;
        const cal = parseInt(document.getElementById('g-cal').value) || 2000;

        document.getElementById('g-prot').value = Math.round((cal * preset.prot / 100) / 4);
        document.getElementById('g-carbs').value = Math.round((cal * preset.carbs / 100) / 4);
        document.getElementById('g-fat').value = Math.round((cal * preset.fat / 100) / 9);

        this._currentRatios = { prot: preset.prot, carbs: preset.carbs, fat: preset.fat };
        this._updatePctDisplay();

        // Highlight selected preset
        document.querySelectorAll('.ratio-preset').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === key);
        });
    },

    applyAutoGoals() {
        const profile = Storage.getProfile();
        const auto = NutritionService.calculateDailyNeeds(profile);
        document.getElementById('g-cal').value = auto.calories;
        document.getElementById('g-prot').value = auto.protein;
        document.getElementById('g-carbs').value = auto.carbs;
        document.getElementById('g-fat').value = auto.fat;
        this._currentRatios = {
            prot: Math.round((auto.protein * 4) / auto.calories * 100),
            carbs: Math.round((auto.carbs * 4) / auto.calories * 100),
            fat: Math.round((auto.fat * 9) / auto.calories * 100)
        };
        this._updatePctDisplay();
    },

    async signInGoogle() {
        const user = await AuthService.signInWithGoogle();
        if (user) {
            App.showToast('Connecté !');
            // Offer one-time avatar customization on first sign-in
            if (!Avatar.hasBeenCustomized()) {
                Avatar.showCustomizationModal(() => {
                    this.render();
                });
            } else {
                this.render();
            }
        }
    },

    async signOut() {
        await AuthService.signOut();
    },

    saveGoals() {
        const goals = {
            calories: parseInt(document.getElementById('g-cal').value) || 2000,
            protein: parseInt(document.getElementById('g-prot').value) || 150,
            carbs: parseInt(document.getElementById('g-carbs').value) || 250,
            fat: parseInt(document.getElementById('g-fat').value) || 65,
            water: parseInt(document.getElementById('g-water').value) || 8,
            custom: true
        };
        Storage.setGoals(goals);
        Modal.close();
        App.showToast('Objectifs mis à jour');
        this.render();
    }
};
