const DashboardPage = {
    // Daily fun facts about nutrition (rotates daily based on day of year)
    _funFacts: [
        "Le brocoli contient plus de vitamine C que l'orange à poids égal 🥦",
        "Prendre des protéines au petit-déj aide à réduire les fringales 🍳",
        "Le corps humain est composé à environ 60% d'eau 💧",
        "Les amandes sont le fruit à coque le plus riche en protéines 🥜",
        "Le chocolat noir (70%+) est riche en flavonoïdes, de puissants antioxydants 🍫",
        "Le muscle est plus dense que la graisse mais brûle plus de calories au repos 💪",
        "La banane est une excellente source de potassium (~360mg pour 100g) 🍌",
        "Manger lentement laisse le temps à la satiété de se déclencher (~20 min) 🐌",
        "Les œufs sont une excellente source de choline, essentielle pour le cerveau 🧠",
        "La patate douce a un index glycémique plus bas que la pomme de terre classique 🍠",
        "Dormir 7-9h par nuit favorise la récupération musculaire 😴",
        "Les fibres alimentaires nourrissent le microbiote intestinal 🦠",
        "L'avocat contient plus de potassium que la banane (~485mg/100g) 🥑",
        "Le saumon sauvage est l'une des meilleures sources d'oméga-3 🐟",
        "Manger des fibres (légumes) avant les glucides peut réduire le pic de glycémie 🥬",
        "Le thé vert contient des catéchines qui peuvent légèrement stimuler le métabolisme 🍵",
        "Les myrtilles sont riches en anthocyanes, de puissants antioxydants 🫐",
        "La créatine monohydrate est le complément sportif le plus étudié scientifiquement ⚡",
        "Boire de l'eau avant un repas peut aider à réduire l'apport calorique 🥤",
        "La whey se digère rapidement (~1-2h), la caséine lentement (~6-7h) 🥛",
        "100g de blanc de poulet apportent environ 31g de protéines 🍗",
        "Le stress chronique élève le cortisol, ce qui peut favoriser le stockage abdominal 😤",
        "Les noix du Brésil sont la source alimentaire la plus concentrée en sélénium 🌰",
        "Répartir ses protéines sur tous les repas optimise la synthèse musculaire ⚡",
        "Le curcuma contient de la curcumine, un composé aux propriétés anti-inflammatoires 🟡",
        "La vitamine D est synthétisée par la peau sous l'effet des UVB du soleil ☀️",
        "Les lentilles sont riches en fer végétal (mais moins bien absorbé que le fer animal) 🫘",
        "Un déficit calorique modéré et régulier est la clé d'une perte de poids durable 📉",
        "Le magnésium participe à plus de 300 réactions enzymatiques dans le corps 💤",
        "La caféine peut améliorer les performances d'endurance de quelques pourcents ☕"
    ],

    _getDailyFunFact() {
        // Rotate daily at 8h (not midnight) — shift date by -8h so "day" starts at 08:00
        const now = new Date();
        const shifted = new Date(now.getTime() - 8 * 60 * 60 * 1000);
        const dateStr = shifted.toISOString().slice(0, 10);
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
            hash |= 0;
        }
        return this._funFacts[Math.abs(hash) % this._funFacts.length];
    },

    render() {
        const date = App.getSelectedDate();
        const isToday = App.isToday();
        const goals = Storage.getGoals();
        const totals = Storage.getDayTotals(date);
        const log = Storage.getDayLog(date);
        const streak = Storage.getStreak();
        const water = Storage.getWater(date);
        const waterGoal = goals.water || 12;
        const trialData = Storage._get('trial', {});
        const isPremium = TrialService.isPaid() || (trialData.paid === true && trialData.paymentId);
        const hasAccess = isPremium || TrialService.isTrialActive();
        const premiumStillChecking = !isPremium && !TrialService._premiumVerified;
        const isOnSite = !window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone && !window.matchMedia('(display-mode: fullscreen)').matches;

        const pctCal = Math.min(Math.round((totals.calories / goals.calories) * 100), 150);
        const pctProt = goals.protein ? Math.min(Math.round((totals.protein / goals.protein) * 100), 100) : 0;
        const pctCarbs = goals.carbs ? Math.min(Math.round((totals.carbs / goals.carbs) * 100), 100) : 0;
        const pctFat = goals.fat ? Math.min(Math.round((totals.fat / goals.fat) * 100), 100) : 0;
        const fiberGoal = goals.fiber || 25;
        const pctFiber = fiberGoal ? Math.min(Math.round((totals.fiber / fiberGoal) * 100), 100) : 0;

        const remaining = Math.max(goals.calories - totals.calories, 0);
        const waterPct = Math.min(Math.round((water / waterGoal) * 100), 100);

        // Supplements completion check
        const mySupplements = Storage._get('my_supplements', []);
        const takenSuppl = Storage._get('suppl_' + Storage._dateKey(date), []);
        const supplAllDone = mySupplements.length > 0 && mySupplements.every(s => takenSuppl.some(t => t.id === s.id));
        const supplCount = takenSuppl.filter(t => mySupplements.some(s => s.id === t.id)).length;

        // Gym completion check
        const gymToday = Storage._get('gym_' + Storage._dateKey(date), null);
        const gymType = gymToday && typeof GymPage !== 'undefined' ? GymPage.WORKOUT_TYPES.find(t => t.id === gymToday.type) : null;
        const gymDone = gymToday && (gymToday.done || false);

        // Weight completion check
        const weightLog = Storage.getWeightLog();
        const weightToday = weightLog.find(w => w.date === Storage._dateKey(date));

        // Separate meals with items from empty meals
        const mealsWithItems = Object.entries(log.meals).filter(([, items]) => items.length > 0);
        const emptyMeals = Object.entries(log.meals).filter(([, items]) => items.length === 0);

        const userMeals = Storage.getMeals();
        const mealIcons = {};
        const mealNames = {};
        userMeals.forEach(m => { mealIcons[m.id] = m.icon; mealNames[m.id] = m.name; });

        const content = document.getElementById('page-content');

        // Non-premium banner — NEVER show while premium check is still in progress
        // This prevents false "Essai gratuit" banners for paying users
        const adBanner = premiumStillChecking ? '' :
            !isPremium && !TrialService.isTrialActive() ? `
            <div class="trial-banner" onclick="App.navigate('settings')" style="background:linear-gradient(135deg,var(--primary),var(--accent));color:white;padding:10px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between">
                <span style="font-size:13px;font-weight:600">⭐ Passe Premium — Photo IA, créature, micro-nutriments</span>
                <span style="font-size:12px;opacity:0.9">Voir →</span>
            </div>
        ` : !isPremium && TrialService.isTrialActive() ? `
            <div class="trial-banner" onclick="App.navigate('settings')" style="background:var(--primary-light);color:var(--primary);padding:10px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between">
                <span style="font-size:13px;font-weight:600">🎉 Essai gratuit — ${TrialService.daysLeft()}j restants</span>
                <span style="font-size:12px">S'abonner →</span>
            </div>
        ` : '';

        // Download app button if on website (not PWA)
        const downloadBanner = isOnSite ? `
            <div class="card" onclick="DashboardPage._showInstallPrompt()" style="padding:10px 16px;margin:4px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;border:1.5px solid var(--primary);background:var(--primary-light)">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <div>
                    <div style="font-size:13px;font-weight:700;color:var(--primary)">Installer l'application</div>
                    <div style="font-size:11px;color:var(--text-secondary)">Accès rapide depuis ton écran d'accueil</div>
                </div>
            </div>
        ` : '';

        // Micro-nutriments: compact summary (top 4 lowest)
        const microSummary = typeof MicronutrientService !== 'undefined' && TrialService.hasFullAccess()
            ? this._renderMicroSummary(date)
            : '';

        const dateLabel = App.getDateLabel();
        const dateKey = App._localDateKey(date);

        content.innerHTML = `
            <div class="fade-in stagger-in" style="padding:0 0 8px">
                ${adBanner}

                <!-- DATE SELECTOR -->
                <div class="date-selector-bar">
                    <button class="date-nav-btn" onclick="DashboardPage._shiftDate(-1)" aria-label="Jour précédent">‹</button>
                    <button class="date-label-btn" onclick="DashboardPage._openDatePicker()">
                        <span>${dateLabel}</span>
                        <span class="date-chevron">▾</span>
                    </button>
                    <button class="date-nav-btn" onclick="DashboardPage._shiftDate(1)" aria-label="Jour suivant">›</button>
                    <input type="date" id="hidden-date-picker" value="${dateKey}" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0">
                </div>

                ${streak > 0 && isToday ? `
                    <div style="text-align:center;padding:8px">
                        <span class="streak-badge">🔥 ${streak} jour${streak > 1 ? 's' : ''} de suite</span>
                    </div>
                ` : ''}

                ${downloadBanner}

                <!-- CALORIES & MACROS — EN PREMIER -->
                <div class="card" style="padding:14px 16px;margin:0 16px 8px;position:relative">
                    <button onclick="DashboardPage.shareStats()" aria-label="Partager mes stats" title="Partager" style="position:absolute;top:10px;right:10px;background:var(--primary-light);border:none;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--primary);z-index:2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="11.49"/></svg>
                    </button>
                    <div class="circular-progress compact">
                        <canvas id="cal-ring" width="140" height="140"></canvas>
                        <div class="progress-text">
                            <span class="calories-value">${totals.calories}</span>
                            <span class="calories-label">/ ${goals.calories}</span>
                        </div>
                    </div>
                    <p style="text-align:center;color:var(--text-secondary);font-size:12px;margin-top:4px">
                        ${remaining > 0 ? `${remaining} kcal restantes` : 'Objectif atteint ! 💪'}<br>
                        <span style="font-size:11px;font-style:italic">${this._getCalorieMessage(pctCal)}</span>
                    </p>

                    <div class="macro-bars compact">
                        <div class="macro-bar">
                            <span class="macro-bar-label">Prot.</span>
                            <div class="macro-bar-track">
                                <div class="macro-bar-fill protein" style="width:${pctProt}%"></div>
                            </div>
                            <span class="macro-bar-value" style="color:var(--protein-color)">${Math.round(totals.protein)}/${goals.protein}g</span>
                        </div>
                        <div class="macro-bar">
                            <span class="macro-bar-label">Gluc.</span>
                            <div class="macro-bar-track">
                                <div class="macro-bar-fill carbs" style="width:${pctCarbs}%"></div>
                            </div>
                            <span class="macro-bar-value" style="color:var(--carbs-color)">${Math.round(totals.carbs)}/${goals.carbs}g</span>
                        </div>
                        <div class="macro-bar">
                            <span class="macro-bar-label">Lip.</span>
                            <div class="macro-bar-track">
                                <div class="macro-bar-fill fat" style="width:${pctFat}%"></div>
                            </div>
                            <span class="macro-bar-value" style="color:var(--fat-color)">${Math.round(totals.fat)}/${goals.fat}g</span>
                        </div>
                        <div class="macro-bar">
                            <span class="macro-bar-label">Fib.</span>
                            <div class="macro-bar-track">
                                <div class="macro-bar-fill fiber" style="width:${pctFiber}%"></div>
                            </div>
                            <span class="macro-bar-value" style="color:var(--fiber-color)">${Math.round(totals.fiber)}/${fiberGoal}g</span>
                        </div>
                    </div>
                </div>

                <!-- REPAS — section principale, plus grande -->
                <div style="margin:0 16px 8px">
                    ${mealsWithItems.map(([type, items]) =>
                        MealCard.render(type, items, true, 'dashboard')
                    ).join('')}
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px">
                        ${emptyMeals.map(([type]) => `
                            <button onclick="App.navigate('search',{meal:'${type}'})" aria-label="Ajouter un aliment au ${mealNames[type]}" class="empty-meal-btn" style="display:flex;align-items:center;gap:8px;padding:14px 14px;font-size:14px">
                                <span aria-hidden="true" style="font-size:18px">${mealIcons[type]}</span>
                                <span style="font-weight:600">+ ${mealNames[type]}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- QUICK ACTIONS (2×2 grid — water is fillable) -->
                <div class="quick-actions compact" style="margin:0 16px 8px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
                    <button class="quick-action-btn water-action-btn" onclick="DashboardPage.addWater()" oncontextmenu="event.preventDefault();DashboardPage.addWater(2);return false" style="position:relative;overflow:hidden;display:flex;align-items:center;gap:6px;justify-content:center;z-index:1">
                        <div class="water-fill-bg" style="position:absolute;bottom:0;left:0;width:100%;height:${waterPct}%;background:linear-gradient(180deg,rgba(79,195,247,0.35) 0%,rgba(2,136,209,0.45) 100%);transition:height 0.5s cubic-bezier(0.4,0,0.2,1);z-index:-1;border-radius:0 0 12px 12px">
                            ${waterPct > 0 ? '<svg style="position:absolute;top:-4px;left:0;width:200%;height:8px;animation:waveMove 2s linear infinite" viewBox="0 0 1200 8" preserveAspectRatio="none"><path d="M0 4C200 0 400 8 600 4C800 0 1000 8 1200 4V8H0Z" fill="rgba(79,195,247,0.4)"/></svg>' : ''}
                        </div>
                        <span class="icon">💧</span>
                        <span style="font-weight:600">${(water * 0.25).toFixed(2).replace(/\.?0+$/, '')}L</span>
                        <span style="font-size:10px;color:var(--text-secondary)">/ ${(waterGoal * 0.25).toFixed(2).replace(/\.?0+$/, '')}L</span>
                        ${water >= waterGoal ? '<span style="font-size:11px">✅</span>' : ''}
                    </button>
                    <button class="quick-action-btn gym-action-btn" onclick="${hasAccess ? "App.navigate('gym')" : "TrialService.showFeatureLockedPrompt('gym')"}" style="position:relative;overflow:hidden;display:flex;align-items:center;gap:6px;justify-content:center;z-index:1">
                        ${hasAccess && gymToday ? `<div style="position:absolute;bottom:0;left:0;width:100%;height:${gymDone ? '100' : '40'}%;background:linear-gradient(180deg,${gymType ? gymType.color + (gymDone ? '30' : '15') : 'rgba(76,175,80,0.15)'} 0%,${gymType ? gymType.color + (gymDone ? '45' : '25') : 'rgba(76,175,80,0.25)'} 100%);transition:height 0.5s cubic-bezier(0.4,0,0.2,1);z-index:-1;border-radius:0 0 12px 12px"></div>` : ''}
                        <span class="icon">${hasAccess && gymType ? gymType.icon : '🏋️'}</span>${!hasAccess ? 'Salle 🔒' : gymDone ? `<span style="font-weight:600">${gymType ? gymType.name : 'Fait'}</span> <span style="font-size:11px">✅</span>` : gymToday ? `<span style="font-weight:600">${gymType ? gymType.name : 'Planifié'}</span>` : 'Salle'}
                    </button>
                    <button class="quick-action-btn suppl-action-btn" onclick="${hasAccess ? "App.navigate('supplements')" : "TrialService.showFeatureLockedPrompt('supplements')"}" style="position:relative;overflow:hidden;display:flex;align-items:center;gap:6px;justify-content:center;z-index:1">
                        ${hasAccess && mySupplements.length > 0 ? `<div style="position:absolute;bottom:0;left:0;width:100%;height:${Math.min(100, Math.round((supplCount / mySupplements.length) * 100))}%;background:linear-gradient(180deg,rgba(0,188,212,0.25) 0%,rgba(0,151,167,0.4) 100%);transition:height 0.5s cubic-bezier(0.4,0,0.2,1);z-index:-1;border-radius:0 0 12px 12px"></div>` : ''}
                        <span class="icon">💊</span>${!hasAccess ? 'Compléments 🔒' : mySupplements.length > 0 ? `<span style="font-weight:600">${supplCount}/${mySupplements.length}</span>${supplAllDone ? ' <span style="font-size:11px">✅</span>' : ''}` : 'Compléments'}
                    </button>
                    <button class="quick-action-btn" onclick="${hasAccess ? "App.navigate('weight')" : "TrialService.showFeatureLockedPrompt('weight')"}" style="position:relative;overflow:hidden;display:flex;align-items:center;gap:6px;justify-content:center;z-index:1">
                        ${hasAccess && weightToday ? '<div style="position:absolute;bottom:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(245,158,11,0.2) 0%,rgba(245,158,11,0.35) 100%);z-index:-1;border-radius:0 0 12px 12px"></div>' : ''}
                        <span class="icon">⚖️</span>${!hasAccess ? 'Poids 🔒' : weightToday ? `<span style="font-weight:600">${weightToday.weight}kg</span> <span style="font-size:11px">✅</span>` : 'Poids'}
                    </button>
                </div>


                <!-- MICRO-NUTRIMENTS compact (top 4 lowest, clickable) -->
                ${microSummary}

                <!-- Daily Fun Fact -->
                <div class="card" style="padding:10px 16px;margin:4px 16px">
                    <div style="display:flex;align-items:flex-start;gap:8px">
                        <span style="font-size:18px;flex-shrink:0">💡</span>
                        <div>
                            <div style="font-size:10px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">Le savais-tu ?</div>
                            <div style="font-size:12px;color:var(--text-secondary);line-height:1.4">${this._getDailyFunFact()}</div>
                        </div>
                    </div>
                </div>

                <div style="text-align:center;padding:8px 16px;margin-bottom:8px">
                    <div style="font-size:10px;color:var(--text-secondary);opacity:0.6">OneFood ne remplace pas un avis médical. Consultez un professionnel de santé pour tout conseil nutritionnel personnalisé.</div>
                </div>

                <div id="dashboard-ad-slot"></div>
            </div>
        `;

        // Show ad banner for non-premium users
        if (typeof AnalyticsService !== 'undefined') {
            AnalyticsService.showBannerAd('dashboard-ad-slot');
        }

        Charts.createCalorieRing('cal-ring', totals.calories, goals.calories, {
            protein: totals.protein || 0,
            carbs: totals.carbs || 0,
            fat: totals.fat || 0
        });


        // Ensure FCM notifications are registered
        if (typeof NotificationService !== 'undefined') {
            NotificationService.ensureRegistered();
        }

        // Award daily XP if eligible (only for today)
        if (isToday) Creature.checkAndAwardXP();

        // Pop-up fun fact on first visit of the day
        if (isToday) this._showDailyPopup();

        // Daily lootbox
        if (isToday) this._checkDailyLootbox();

        // Render daily challenge
        if (isToday) this._renderDailyChallenge();
    },

    async shareStats() {
        try {
            const goals = Storage.getGoals();
            const totals = Storage.getDayTotals();
            const streak = Storage.getStreak() || 0;
            const cal = Math.round(totals.calories || 0);
            const goal = Math.round(goals.calories || 0);
            const streakText = streak > 0
                ? `, ${streak} jour${streak > 1 ? 's' : ''} de suite ! 💪`
                : ' 💪';
            const text = `🔥 Mon suivi OneFood aujourd'hui: ${cal} kcal / ${goal} objectif${streakText}`;
            const url = 'https://1food.fr';
            const shareData = {
                title: 'OneFood',
                text: text,
                url: url
            };

            App.haptic && App.haptic('light');

            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try {
                    await navigator.share(shareData);
                    return;
                } catch (err) {
                    // User cancelled or share failed — fall through to clipboard
                    if (err && err.name === 'AbortError') return;
                }
            } else if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    return;
                } catch (err) {
                    if (err && err.name === 'AbortError') return;
                }
            }

            // Fallback: copy to clipboard
            const fullText = `${text} ${url}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(fullText);
                App.showToast('📋 Copié dans le presse-papier !');
            } else {
                // Last-resort fallback using a hidden textarea
                const ta = document.createElement('textarea');
                ta.value = fullText;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); } catch (e) {}
                document.body.removeChild(ta);
                App.showToast('📋 Copié !');
            }
        } catch (err) {
            console.error('shareStats error', err);
            App.showToast('Erreur lors du partage');
        }
    },

    _showDailyPopup() {
        // Check if user disabled popup in settings
        const settings = Storage.getSettings();
        if (settings.dailyPopup === false) return;
        const today = Storage._dateKey();
        const shown = localStorage.getItem('ironfuel_daily_popup');
        if (shown === today) return;
        localStorage.setItem('ironfuel_daily_popup', today);
        const fact = this._getDailyFunFact();
        Modal.show(`
            <div style="text-align:center;padding:8px 0">
                <div style="font-size:48px;margin-bottom:12px">💡</div>
                <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Le savais-tu ?</div>
                <div style="font-size:15px;color:var(--text);line-height:1.5;margin-bottom:20px">${fact}</div>
                <button class="btn btn-primary" onclick="Modal.close()" style="width:100%;padding:12px;font-size:14px">C'est parti ! 🔥</button>
            </div>
        `);
    },


    // === DAILY LOOTBOX ===
    _checkDailyLootbox() {
        const today = Storage._dateKey();
        if (localStorage.getItem('onefood_lootbox') === today) return;
        // Only show after user has logged at least 1 meal today
        const log = Storage.getDayLog();
        if (!Object.values(log.meals).some(m => m.length > 0)) return;
        localStorage.setItem('onefood_lootbox', today);

        const rewards = [
            { emoji: '🪙', label: '+10 coins', action: () => Storage.addCoins(10) },
            { emoji: '🪙', label: '+20 coins', action: () => Storage.addCoins(20) },
            { emoji: '🪙', label: '+50 coins !', action: () => Storage.addCoins(50) },
            { emoji: '⚡', label: '+20 XP créature', action: () => Storage.addCreatureXP(20) },
            { emoji: '❄️', label: 'Freeze streak !', action: () => { const s = Storage.getCreatureStreak(); if (s.freezesOwned < 3) { s.freezesOwned++; Storage.setCreatureStreak(s); } else { Storage.addCoins(15); } } },
        ];
        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        reward.action();

        setTimeout(() => {
            Modal.show(`
                <div style="text-align:center;padding:12px 0">
                    <div style="font-size:56px;margin-bottom:8px;animation:creature-bounce 0.6s ease">${reward.emoji}</div>
                    <div style="font-size:18px;font-weight:800;margin-bottom:4px">Bonus du jour !</div>
                    <div style="font-size:15px;color:var(--primary);font-weight:700;margin-bottom:16px">${reward.label}</div>
                    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">Reviens chaque jour pour un nouveau bonus</p>
                    <button class="btn btn-primary" onclick="Modal.close()" style="width:100%">Merci ! 🎉</button>
                </div>
            `);
        }, 1500);
    },

    // === DAILY CHALLENGE ===
    _dailyChallenges: [
        { id: 'water6', text: 'Bois 6 verres d\'eau', check: () => Storage.getWater() >= 6, reward: 15 },
        { id: 'protein100', text: 'Atteins 100g de protéines', check: () => Storage.getDayTotals().protein >= 100, reward: 20 },
        { id: 'meals3', text: 'Log 3 repas aujourd\'hui', check: () => Object.values(Storage.getDayLog().meals).filter(m => m.length > 0).length >= 3, reward: 15 },
        { id: 'fiber20', text: 'Mange 20g de fibres', check: () => Storage.getDayTotals().fiber >= 20, reward: 20 },
        { id: 'cal80', text: 'Atteins 80% de ton objectif calorique', check: () => { const g = Storage.getGoals(), t = Storage.getDayTotals(); return g.calories > 0 && (t.calories / g.calories) >= 0.8; }, reward: 25 },
        { id: 'water_goal', text: 'Atteins ton objectif eau', check: () => { const g = Storage.getGoals(); return Storage.getWater() >= (g.water || 12); }, reward: 20 },
        { id: 'log_breakfast', text: 'Log ton petit-déjeuner', check: () => { const log = Storage.getDayLog(); return (log.meals.breakfast || []).length > 0; }, reward: 10 },
    ],

    _getTodayChallenge() {
        const day = new Date().getDate();
        return this._dailyChallenges[day % this._dailyChallenges.length];
    },

    _renderDailyChallenge() {
        const challenge = this._getTodayChallenge();
        const done = challenge.check();
        const today = Storage._dateKey();
        const claimed = localStorage.getItem('onefood_challenge_' + today);

        if (done && !claimed) {
            Storage.addCoins(challenge.reward);
            localStorage.setItem('onefood_challenge_' + today, '1');
            App.showToast(`🎯 Défi réussi ! +${challenge.reward} 🪙`);
        }

        const el = document.getElementById('daily-challenge');
        if (!el) {
            // Insert challenge card before the fun fact
            const funFact = document.querySelector('#dashboard-ad-slot')?.previousElementSibling;
            if (funFact) {
                const card = document.createElement('div');
                card.id = 'daily-challenge';
                card.className = 'card';
                card.style.cssText = 'padding:10px 16px;margin:4px 16px';
                funFact.parentNode.insertBefore(card, funFact);
            }
        }
        const container = document.getElementById('daily-challenge');
        if (!container) return;
        container.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px">
                <div style="font-size:22px">${done ? '✅' : '🎯'}</div>
                <div style="flex:1">
                    <div style="font-size:10px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px">Défi du jour</div>
                    <div style="font-size:13px;font-weight:600;${done ? 'text-decoration:line-through;opacity:0.6' : ''}">${challenge.text}</div>
                </div>
                <div style="font-size:12px;font-weight:700;color:${done ? 'var(--success)' : 'var(--accent)'}">${done ? 'Fait !' : '+' + challenge.reward + ' 🪙'}</div>
            </div>
        `;
    },

    // Daily motivations used by FCM notifications (daily-notification.js)
    _dailyMotivations: [
        "Chaque repas compte. Allez, on track ! 🔥",
        "Ton corps est une machine — donne-lui le bon carburant 💪",
        "Pas de raccourci, que de la régularité 🏆",
        "La discipline bat le talent quand le talent ne travaille pas ⚡",
        "T'as géré hier, fais pareil aujourd'hui 🎯",
        "Les résultats viennent avec la constance, pas la perfection 📈",
        "Ton futur toi te remerciera 🙏",
        "Un pas de plus vers ton objectif ! 🚀",
        "La nutrition c'est 80% du résultat — tu le sais déjà 🧠",
        "Mange bien, bouge bien, dors bien — le triangle d'or ⭐",
        "Les excuses brûlent 0 calories 😤",
        "Tu n'es pas au régime, tu construis un mode de vie 💎",
        "Petit-déj de champion ! N'oublie pas tes protéines 🍳",
        "L'eau c'est la vie — t'as bu tes 2L ? 💧",
        "Le meilleur investissement c'est toi-même 🏋️"
    ],

    _getDailyMotivation() {
        const now = new Date();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        return this._dailyMotivations[dayOfYear % this._dailyMotivations.length];
    },

    addWater(glasses) {
        glasses = glasses || 1;
        const date = App.getSelectedDate();
        const current = Storage.getWater(date);
        const goals = Storage.getGoals();
        const waterGoal = goals.water || 12;
        const maxGlasses = Math.min(waterGoal + 4, 20);
        if (current >= maxGlasses) {
            App.showToast(`Maximum atteint (${(maxGlasses * 0.25).toFixed(2).replace(/\.?0+$/, '')}L) 💧`);
            return;
        }
        const newCount = Math.min(current + glasses, maxGlasses);
        const addedMl = (newCount - current) * 250;
        Storage.setWater(newCount, date);
        if (App.isToday()) this._checkWaterBonus(newCount);
        App.haptic('light');
        App.showToast(`+${addedMl}ml 💧 (${(newCount * 0.25).toFixed(2).replace(/\.?0+$/, '')}L)`);
        this._updateWaterButton(newCount, waterGoal);
    },

    _updateWaterButton(water, waterGoal) {
        const btn = document.querySelector('.water-action-btn');
        if (!btn) return;
        const pct = Math.min(100, Math.round((water / waterGoal) * 100));
        const fill = btn.querySelector('.water-fill-bg');
        if (fill) {
            fill.style.height = pct + '%';
            if (pct > 0 && !fill.querySelector('svg')) {
                fill.innerHTML = '<svg style="position:absolute;top:-4px;left:0;width:200%;height:8px;animation:waveMove 2s linear infinite" viewBox="0 0 1200 8" preserveAspectRatio="none"><path d="M0 4C200 0 400 8 600 4C800 0 1000 8 1200 4V8H0Z" fill="rgba(79,195,247,0.4)"/></svg>';
            }
        }
        const spans = btn.querySelectorAll('span');
        if (spans[1]) spans[1].textContent = (water * 0.25).toFixed(2).replace(/\.?0+$/, '') + 'L';
        const check = btn.querySelector('span:last-child');
        if (water >= waterGoal && check && !check.textContent.includes('✅')) {
            const s = document.createElement('span');
            s.style.fontSize = '11px';
            s.textContent = '✅';
            btn.appendChild(s);
        }
    },

    setWater(count) {
        const date = App.getSelectedDate();
        const current = Storage.getWater(date);
        const goals = Storage.getGoals();
        const waterGoal = goals.water || 12;
        const maxGlasses = Math.min(waterGoal + 4, 20);
        if (count === current) {
            Storage.setWater(count - 1, date);
        } else {
            const capped = Math.min(count, maxGlasses);
            Storage.setWater(capped, date);
            if (App.isToday()) this._checkWaterBonus(capped);
        }
        this.render();
    },

    _checkWaterBonus(waterCount) {
        const goal = Storage.getGoals().water || 12;
        if (waterCount >= goal && !Storage.hasDailyWaterBonus()) {
            Storage.addCoins(10);
            Storage.setDailyWaterBonus();
            App.showToast('Objectif eau atteint ! +10 🪙');
            setTimeout(() => {
                const tank = document.querySelector('.water-tank');
                if (tank) {
                    tank.closest('.card')?.classList.add('water-goal-reached');
                    setTimeout(() => tank.closest('.card')?.classList.remove('water-goal-reached'), 1500);
                }
            }, 100);
        }
    },

    _showInstallPrompt() {
        // Check if we have a deferred install prompt (beforeinstallprompt)
        if (window._deferredInstallPrompt) {
            window._deferredInstallPrompt.prompt();
            window._deferredInstallPrompt.userChoice.then(choice => {
                if (choice.outcome === 'accepted') App.showToast('Installation en cours ! 🎉');
                window._deferredInstallPrompt = null;
            });
        } else {
            // Show manual instructions
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const msg = isIOS
                ? '1. Appuie sur le bouton Partager (📤) en haut à droite<br>2. Défile et appuie sur <b>"Sur l\'écran d\'accueil"</b>'
                : 'Appuie sur les 3 points (⋮) en haut à droite puis <b>"Installer l\'application"</b>';
            Modal.show(`
                <div style="text-align:center">
                    <div style="font-size:48px;margin-bottom:12px">📲</div>
                    <h3 style="margin-bottom:8px">Installer OneFood</h3>
                    <p style="color:var(--text-secondary);font-size:14px;line-height:1.5;margin-bottom:16px">${msg}</p>
                    <button class="btn btn-primary" onclick="Modal.close()" style="width:100%">Compris</button>
                </div>
            `);
        }
    },

    _renderMicroSummary(date) {
        const micros = MicronutrientService.estimateFromLog(date);
        // Get top 4 lowest nutrients (most important to highlight)
        const sorted = Object.entries(MicronutrientService.RDV)
            .filter(([, info]) => !info.isLimit)
            .map(([key, info]) => ({
                key, ...info,
                value: micros[key] || 0,
                pct: Math.round(((micros[key] || 0) / info.goal) * 100)
            }))
            .sort((a, b) => a.pct - b.pct)
            .slice(0, 4);

        const items = sorted.map(n => {
            const color = n.pct >= 80 ? 'var(--success)' : n.pct >= 40 ? 'var(--accent)' : 'var(--danger)';
            return `
                <div onclick="MicronutrientService.showInfoPage('${n.key}')" style="display:flex;align-items:center;gap:6px;cursor:pointer;flex:1;min-width:45%">
                    <span style="font-size:14px">${n.icon}</span>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:10px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.name}</div>
                        <div style="height:3px;border-radius:2px;background:var(--border);margin-top:2px;overflow:hidden">
                            <div style="width:${Math.min(n.pct, 100)}%;height:100%;background:${color};border-radius:2px"></div>
                        </div>
                    </div>
                    <span style="font-size:11px;color:${color};font-weight:700">${n.pct}%</span>
                </div>
            `;
        }).join('');

        return `
            <div class="card" onclick="MicronutrientService.showFullPanel(App.getSelectedDate())" style="padding:10px 16px;margin:0 16px 8px;cursor:pointer">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <span style="font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px">Micro-nutriments</span>
                    <span style="font-size:10px;color:var(--text-secondary)">Voir tout →</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px">
                    ${items}
                </div>
            </div>
        `;
    },

    _shiftDate(delta) {
        const d = new Date(App.getSelectedDate());
        d.setDate(d.getDate() + delta);
        // Subtle cross-fade transition while we swap the day
        const content = document.getElementById('page-content');
        if (content) {
            content.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
            content.style.opacity = '0.35';
            content.style.transform = `translateX(${delta > 0 ? '-8px' : '8px'})`;
            setTimeout(() => {
                App.setSelectedDate(App._localDateKey(d));
                requestAnimationFrame(() => {
                    content.style.opacity = '';
                    content.style.transform = '';
                });
            }, 90);
        } else {
            App.setSelectedDate(App._localDateKey(d));
        }
        App.haptic('light');
    },

    _openDatePicker() {
        const picker = document.getElementById('hidden-date-picker');
        if (!picker) return;
        // Make picker visible momentarily for interaction
        picker.style.pointerEvents = 'auto';
        picker.onchange = (e) => {
            App.setSelectedDate(e.target.value);
            picker.style.pointerEvents = 'none';
        };
        // Try native showPicker first, fallback to focus+click
        try {
            picker.showPicker();
        } catch (e) {
            picker.focus();
            picker.click();
        }
    },

    _getCalorieMessage(pct) {
        const messages = {
            low: [
                "T'as mangé ou t'as juste regardé le frigo ? 👀",
                "Même un hamster mange plus que ça 🐹",
                "Ton estomac a envoyé un SOS 🆘",
                "Y'a du vide dans ce ventre, non ? 😶",
                "Ton métabolisme fait grève 🪧",
                "On dirait que t'as oublié de manger 🤔",
                "C'est un jeûne ou t'es juste occupé ? 😂",
                "Allez, nourris la bête ! 🦁",
                "Même ta créature a faim là 😢",
                "Houston, on a un problème caloriqueee 🚀",
                "Ton corps mérite mieux que ça 💔",
                "Un petit snack ? Juste un ? 🥺",
                "Les calories se cachent, va les chercher 🔍",
                "Mode économie d'énergie activé 🔋",
                "Pas de fuel, pas de résultat 🏎️",
                "Faut manger pour grandir 📏",
                "Le frigo pleure de solitude 😭"
            ],
            quarter: [
                "C'est un bon début, continue ! 💪",
                "Le petit-déj c'est fait, reste le reste 😄",
                "1/4 du chemin, tu gères 🚀",
                "Premier repas validé, on enchaîne 🎬",
                "C'est un début de roi 👑",
                "T'as lancé la machine 🏗️",
                "Le premier pas est le plus dur 🦶",
                "On construit brique par brique 🧱",
                "Ton corps commence à sourire 😊",
                "Le moteur chauffe doucement 🔥",
                "Bien joué, la suite arrive 📦",
                "T'es dans le game maintenant 🎮",
                "La base est posée, on monte 🏔️",
                "Première victoire de la journée ✌️",
                "Continue sur cette lancée 🌊",
                "Y'a du potentiel, montre-le 💎",
                "Allez, 3 repas et c'est carré 📐"
            ],
            half: [
                "Mi-parcours, t'es sur la bonne voie ! 🎯",
                "La moitié, c'est déjà pas mal 👌",
                "Tu chauffes, continue comme ça 🔥",
                "Pile au milieu, t'es régulier 📊",
                "Le cap des 50%, c'est solide 🧊",
                "T'assures, un repas de plus et c'est bon 🍽️",
                "L'équilibre est là, bravo 🎭",
                "Tu gères comme un chef 👨‍🍳",
                "La route est droite, fonce 🛣️",
                "Demi-portion faite, demi-portion à venir 🔄",
                "T'es en mode croisière 🚢",
                "Le rythme est bon, garde-le 🥁",
                "Ton assiette te remercie 🙌",
                "50% du taf, 100% du talent 🌟",
                "La machine tourne bien ⚙️",
                "T'es sur les rails, prochain arrêt : objectif 🚂",
                "Halfway there, legend 🦸"
            ],
            almost: [
                "Presque ! Plus qu'un petit effort 💫",
                "Ton corps te remercie déjà 🙏",
                "Tu fais les choses bien 🏆",
                "Quasi parfait, un dernier snack ? 🥜",
                "C'est chaud, t'y es presque 🌡️",
                "La ligne d'arrivée est en vue 🏁",
                "Dernier sprint, t'es un warrior 🗡️",
                "95% du boulot est fait, respect 🫡",
                "Encore un tout petit peu 🤏",
                "T'es à deux doigts de la perf 🎯",
                "Le finish est proche, tiens bon 💪",
                "Ton assiette est quasi parfaite 🍽️",
                "Impressionnant, t'arrête pas maintenant 🦈",
                "Le boss final approche, t'es prêt 🎮",
                "C'est le moment de closer 🔐",
                "Objectif en approche, capitaine 🧑‍✈️",
                "Un fruit et c'est bouclé 🍎"
            ],
            goal: [
                "Objectif atteint, bravo champion ! 🏅",
                "Parfait, t'as tout géré aujourd'hui 💪",
                "Mission accomplie, GG ! 🎮",
                "100%, t'es un monstre 👹",
                "Pile dans le mille 🎯",
                "Journée parfaite, rien à redire 👏",
                "T'as atteint le Graal nutritionnel 🏆",
                "Ton corps est en mode turbo 🚀",
                "Félicitations, t'es au top ! ⭐",
                "C'est ça la discipline, respect 🫡",
                "Nutrition maîtrisée, résultats assurés 📈",
                "T'as cracké le code 🔓",
                "Journée modèle, prends-la en photo 📸",
                "Rien à ajouter, c'est parfait 💯",
                "Le plan est respecté, bravo 📋",
                "T'es une machine bien huilée ⚙️",
                "Champion du jour, sans conteste 🥇"
            ],
            over: [
                "T'as un peu forcé là non ? 😅",
                "Bon… demain on repart de zéro 🔄",
                "Le frigo t'a dit stop, écoute-le 🤫",
                "Surplus détecté, pas de panique 📡",
                "C'était un jour de triche ou quoi ? 🤭",
                "Un peu au-dessus, rien de grave 📊",
                "Le ventre dit merci, le plan dit oups 😬",
                "Allez, demain on rattrape 💪",
                "Un écart de temps en temps c'est humain 🤷",
                "Le corps pardonne, le plan aussi 🕊️",
                "C'est pas la fin du monde 🌍",
                "Un jour ne définit pas ta semaine 📅",
                "Respire, analyse, et on repart 🧘",
                "La perfection n'existe pas, la constance oui 📈",
                "Excess d'amour pour la bouffe 😍",
                "On note et on ajuste demain 📝",
                "C'est l'intention qui compte (un peu) 😄"
            ]
        };

        let pool;
        if (pct < 25) pool = messages.low;
        else if (pct < 50) pool = messages.quarter;
        else if (pct < 85) pool = messages.half;
        else if (pct < 100) pool = messages.almost;
        else if (pct <= 115) pool = messages.goal;
        else pool = messages.over;

        // Deterministic daily pick based on date
        const day = new Date().getDate();
        return pool[day % pool.length];
    }
};
