const DashboardPage = {
    // Daily fun facts about nutrition (rotates daily based on day of year)
    _funFacts: [
        "Le brocoli contient plus de vitamine C que l'orange 🥦",
        "Manger des protéines au petit-déj réduit les fringales de 60% 🍳",
        "Le corps humain est composé à 60% d'eau 💧",
        "Les amandes sont la noix la plus riche en protéines 🥜",
        "Le chocolat noir (70%+) est riche en antioxydants 🍫",
        "1kg de muscle brûle ~13 kcal/jour au repos, 1kg de graisse ~4.5 kcal 💪",
        "La banane contient autant de potassium que 2 verres de lait 🍌",
        "Manger lentement active la satiété 20min plus tôt 🐌",
        "Les œufs sont l'une des meilleures sources de choline pour le cerveau 🧠",
        "La patate douce a un index glycémique plus bas que la pomme de terre 🍠",
        "Dormir 7-9h augmente la récupération musculaire de 40% 😴",
        "Les fibres nourrissent les bonnes bactéries intestinales 🦠",
        "L'avocat contient plus de potassium que la banane 🥑",
        "Le saumon est l'une des meilleures sources d'oméga-3 🐟",
        "Manger des légumes verts avant les glucides réduit le pic de glycémie 🥬",
        "Le thé vert booste le métabolisme de 3-4% 🍵",
        "Les myrtilles sont l'un des aliments les plus riches en antioxydants 🫐",
        "La créatine est le complément le plus étudié et prouvé en musculation ⚡",
        "Boire de l'eau avant un repas aide à manger 75 kcal de moins 🥤",
        "La whey est digérée en 30min, la caséine en 6-7h 🥛",
        "100g de poulet = 31g de protéines, un des meilleurs ratios 🍗",
        "Le stress chronique augmente le cortisol → stockage de graisse abdominale 😤",
        "Les noix du Brésil sont la meilleure source de sélénium 🌰",
        "Manger des protéines à chaque repas stabilise l'énergie toute la journée ⚡",
        "Le curcuma est l'anti-inflammatoire naturel le plus puissant 🟡",
        "La vitamine D est produite par le soleil — 15min/jour suffisent ☀️",
        "Les lentilles contiennent autant de fer que la viande rouge 🫘",
        "Un déficit de 500 kcal/jour = ~0.5kg de perte par semaine 📉",
        "Le magnésium aide à réduire les crampes et améliore le sommeil 💤",
        "La caféine améliore les performances sportives de 3-5% ☕"
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
        const goals = Storage.getGoals();
        const totals = Storage.getDayTotals();
        const log = Storage.getDayLog();
        const streak = Storage.getStreak();
        const water = Storage.getWater();
        const waterGoal = goals.water || 12;
        const isPremium = TrialService.isPaid();
        const isOnSite = !window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone && !window.matchMedia('(display-mode: fullscreen)').matches;

        const pctCal = Math.min(Math.round((totals.calories / goals.calories) * 100), 150);
        const pctProt = goals.protein ? Math.min(Math.round((totals.protein / goals.protein) * 100), 100) : 0;
        const pctCarbs = goals.carbs ? Math.min(Math.round((totals.carbs / goals.carbs) * 100), 100) : 0;
        const pctFat = goals.fat ? Math.min(Math.round((totals.fat / goals.fat) * 100), 100) : 0;
        const fiberGoal = goals.fiber || 25;
        const pctFiber = fiberGoal ? Math.min(Math.round((totals.fiber / fiberGoal) * 100), 100) : 0;

        const remaining = Math.max(goals.calories - totals.calories, 0);
        const waterPct = Math.min(Math.round((water / waterGoal) * 100), 100);

        // Weight data for mini widget
        const weightLog = Storage.getWeightLog();
        const currentWeight = Storage.getProfile().weight || 0;
        const lastWeight = weightLog.length >= 2 ? weightLog[weightLog.length - 2].weight : currentWeight;
        const weightDiff = currentWeight - lastWeight;
        const weightTrend = weightDiff > 0 ? '+' : '';
        const hasWeightData = weightLog.length > 0;

        // Separate meals with items from empty meals
        const mealsWithItems = Object.entries(log.meals).filter(([, items]) => items.length > 0);
        const emptyMeals = Object.entries(log.meals).filter(([, items]) => items.length === 0);

        const mealIcons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
        const mealNames = { breakfast: 'Petit-déj', lunch: 'Déjeuner', dinner: 'Dîner', snack: 'Collation' };

        const content = document.getElementById('page-content');

        // Non-premium: subtle ad banner at top
        const adBanner = !isPremium && !TrialService.isTrialActive() ? `
            <div class="trial-banner" onclick="App.navigate('settings')" style="background:linear-gradient(135deg,var(--primary),#FF6D3A);color:white;padding:10px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between">
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
            ? this._renderMicroSummary()
            : '';

        content.innerHTML = `
            <div class="fade-in stagger-in" style="padding:0 0 8px">
                ${adBanner}
                ${streak > 0 ? `
                    <div style="text-align:center;padding:8px">
                        <span class="streak-badge">🔥 ${streak} jour${streak > 1 ? 's' : ''} de suite</span>
                    </div>
                ` : ''}

                ${downloadBanner}

                <!-- CALORIES & MACROS — EN PREMIER -->
                <div class="card" style="padding:14px 16px;margin:0 16px 8px">
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
                            <span class="macro-bar-label">P</span>
                            <div class="macro-bar-track">
                                <div class="macro-bar-fill protein" style="width:${pctProt}%"></div>
                            </div>
                            <span class="macro-bar-value" style="color:var(--protein-color)">${Math.round(totals.protein)}/${goals.protein}g</span>
                        </div>
                        <div class="macro-bar">
                            <span class="macro-bar-label">G</span>
                            <div class="macro-bar-track">
                                <div class="macro-bar-fill carbs" style="width:${pctCarbs}%"></div>
                            </div>
                            <span class="macro-bar-value" style="color:var(--carbs-color)">${Math.round(totals.carbs)}/${goals.carbs}g</span>
                        </div>
                        <div class="macro-bar">
                            <span class="macro-bar-label">L</span>
                            <div class="macro-bar-track">
                                <div class="macro-bar-fill fat" style="width:${pctFat}%"></div>
                            </div>
                            <span class="macro-bar-value" style="color:var(--fat-color)">${Math.round(totals.fat)}/${goals.fat}g</span>
                        </div>
                        <div class="macro-bar">
                            <span class="macro-bar-label">F</span>
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

                <!-- QUICK ACTIONS — only Salle & Compléments (Photo IA, Vocal, Recherche are in + tab) -->
                <div class="quick-actions compact" style="margin:0 16px 8px;display:flex;gap:8px">
                    <button class="quick-action-btn" onclick="App.navigate('gym')" style="flex:1">
                        <span class="icon">🏋️</span>Salle
                    </button>
                    <button class="quick-action-btn" onclick="App.navigate('supplements')" style="flex:1">
                        <span class="icon">💊</span>Compléments
                    </button>
                    <button class="quick-action-btn" onclick="App.navigate('weight')" style="flex:1">
                        <span class="icon">⚖️</span>Poids
                    </button>
                </div>

                <!-- HYDRATATION -->
                <div class="card water-tracker-card" style="padding:12px 16px;margin:0 16px 8px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                        <span style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:4px">
                            <svg width="16" height="16" viewBox="0 0 24 24" style="flex-shrink:0"><defs><linearGradient id="glassHdr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4FC3F7"/><stop offset="100%" stop-color="#0288D1"/></linearGradient></defs><path d="M6 3h12l-1.5 15a3 3 0 01-3 2.5h-3A3 3 0 017.5 18L6 3z" fill="url(#glassHdr)" opacity="0.85"/><path d="M7 5h10" stroke="white" stroke-width="1" opacity="0.4"/></svg>
                            Hydratation
                        </span>
                        <span style="font-size:13px;font-weight:700;color:var(--primary)">${(water * 0.25).toFixed(water * 0.25 % 1 === 0 ? 0 : 1)}L / ${(waterGoal * 0.25).toFixed(waterGoal * 0.25 % 1 === 0 ? 0 : 1)}L</span>
                    </div>
                    <div class="water-progress-bar">
                        <div class="water-progress-fill" style="width:${waterPct}%"></div>
                    </div>
                    <div class="water-glasses">
                        ${Array.from({length: waterGoal}, (_, i) => `
                            <button class="water-glass ${i < water ? 'filled' : ''}" onclick="DashboardPage.setWater(${i + 1})" title="${((i + 1) * 0.25).toFixed(2).replace(/\.?0+$/, '')}L" aria-label="Verre ${i + 1} sur ${waterGoal}${i < water ? ', bu' : ', vide'}" role="checkbox" aria-checked="${i < water}">
                                <svg width="20" height="26" viewBox="0 0 20 26" class="glass-svg">
                                    <path d="M4 2h12l-1.2 18a2.5 2.5 0 01-2.5 2.2H7.7A2.5 2.5 0 015.2 20L4 2z" fill="${i < water ? 'none' : 'var(--surface-alt, #2a2a2a)'}" stroke="${i < water ? '#0288D1' : 'var(--border)'}" stroke-width="1"/>
                                    ${i < water ? `<defs><linearGradient id="wfill${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4FC3F7"/><stop offset="100%" stop-color="#0288D1"/></linearGradient></defs><path d="M5.2 8h9.6l-0.8 12a2 2 0 01-2 1.8H8A2 2 0 016 20L5.2 8z" fill="url(#wfill${i})"/><path d="M5.8 10h8.4" stroke="white" stroke-width="0.6" opacity="0.35"/>` : ''}
                                </svg>
                            </button>
                        `).join('')}
                        <button class="water-add-btn" onclick="DashboardPage.addWater()" aria-label="Ajouter un verre d'eau">
                            <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="var(--primary)" opacity="0.15" stroke="var(--primary)" stroke-width="1.5"/><line x1="10" y1="5" x2="10" y2="15" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="10" x2="15" y2="10" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/></svg>
                        </button>
                    </div>
                    ${water >= waterGoal ? '<div style="text-align:center;font-size:11px;color:var(--success);margin-top:4px">Objectif atteint ! 🎉</div>' : ''}
                </div>

                <!-- WEIGHT MINI WIDGET -->
                <div class="card weight-mini-card" onclick="App.navigate('weight')" style="padding:10px 16px;margin:0 16px 8px;cursor:pointer">
                    <div style="display:flex;align-items:center;justify-content:space-between">
                        <div style="display:flex;align-items:center;gap:8px">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3a4.5 4.5 0 00-9 0"/><rect x="4" y="7" width="16" height="14" rx="2"/><path d="M12 12v3"/><circle cx="12" cy="12" r="1"/></svg>
                            <span style="font-size:13px;font-weight:600">Poids</span>
                        </div>
                        <div style="display:flex;align-items:baseline;gap:6px">
                            <span style="font-size:20px;font-weight:800;color:var(--text)">${currentWeight}<span style="font-size:12px;font-weight:500"> kg</span></span>
                            ${hasWeightData && weightLog.length >= 2 ? `
                                <span style="font-size:11px;font-weight:600;color:${weightDiff <= 0 ? 'var(--success)' : 'var(--danger)'}">${weightTrend}${weightDiff.toFixed(1)}</span>
                            ` : ''}
                        </div>
                    </div>
                    ${hasWeightData && weightLog.length >= 2 ? `
                        <div style="margin-top:6px;height:30px">
                            <canvas id="weight-mini-chart" height="30"></canvas>
                        </div>
                    ` : `
                        <div style="text-align:center;font-size:11px;color:var(--text-secondary);margin-top:4px">
                            Enregistre ton poids →
                        </div>
                    `}
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

        // Render weight mini chart
        if (weightLog.length >= 2) {
            this._renderWeightMiniChart(weightLog.slice(-7));
        }

        // Ensure FCM notifications are registered
        if (typeof NotificationService !== 'undefined') {
            NotificationService.ensureRegistered();
        }

        // Award daily XP if eligible
        Creature.checkAndAwardXP();
    },

    _renderWeightMiniChart(data) {
        const canvas = document.getElementById('weight-mini-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.parentElement.offsetWidth;
        const h = 30;
        canvas.width = w * (window.devicePixelRatio || 1);
        canvas.height = h * (window.devicePixelRatio || 1);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

        const weights = data.map(d => d.weight);
        const min = Math.min(...weights) - 0.5;
        const max = Math.max(...weights) + 0.5;
        const range = max - min || 1;

        ctx.beginPath();
        ctx.strokeStyle = 'var(--primary)';
        const computedStyle = getComputedStyle(document.documentElement);
        ctx.strokeStyle = computedStyle.getPropertyValue('--primary').trim() || '#E64A19';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        weights.forEach((weight, i) => {
            const x = (i / (weights.length - 1)) * w;
            const y = h - ((weight - min) / range) * (h - 4) - 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw last point
        const lastX = w;
        const lastY = h - ((weights[weights.length - 1] - min) / range) * (h - 4) - 2;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
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

    addWater() {
        const current = Storage.getWater();
        const goals = Storage.getGoals();
        const waterGoal = goals.water || 12; // default 3L = 12 glasses of 250ml
        const maxGlasses = Math.min(waterGoal + 4, 20); // Allow a few extra but cap at 5L (20 glasses)
        if (current >= maxGlasses) {
            App.showToast(`Maximum atteint (${(maxGlasses * 0.25).toFixed(1)}L) 💧`);
            return;
        }
        const newCount = current + 1;
        Storage.setWater(newCount);
        this._checkWaterBonus(newCount);
        App.showToast(`+250ml 💧 (${(newCount * 0.25).toFixed(newCount * 0.25 % 1 === 0 ? 0 : 1)}L)`);
        this.render();
    },

    setWater(count) {
        const current = Storage.getWater();
        const goals = Storage.getGoals();
        const waterGoal = goals.water || 12;
        const maxGlasses = Math.min(waterGoal + 4, 20);
        if (count === current) {
            Storage.setWater(count - 1);
        } else {
            const capped = Math.min(count, maxGlasses);
            Storage.setWater(capped);
            this._checkWaterBonus(capped);
        }
        this.render();
        // Animate the filled glass
        setTimeout(() => {
            const glasses = document.querySelectorAll('.water-glass.filled');
            const lastGlass = glasses[glasses.length - 1];
            if (lastGlass) {
                lastGlass.classList.add('just-filled');
                setTimeout(() => lastGlass.classList.remove('just-filled'), 400);
            }
        }, 50);
    },

    _checkWaterBonus(waterCount) {
        const goal = Storage.getGoals().water || 12; // 12 glasses of 250ml = 3L (consistent with render)
        if (waterCount >= goal && !Storage.hasDailyWaterBonus()) {
            Storage.addCoins(10);
            Storage.setDailyWaterBonus();
            App.showToast('Objectif eau atteint ! +10 🪙');
            // R2: Confetti animation on water goal
            setTimeout(() => {
                const waterCard = document.querySelector('.water-glasses');
                if (waterCard) {
                    waterCard.closest('.card')?.classList.add('water-goal-reached');
                    setTimeout(() => waterCard.closest('.card')?.classList.remove('water-goal-reached'), 1500);
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
                ? 'Appuie sur le bouton Partager (📤) puis "Sur l\'écran d\'accueil"'
                : 'Appuie sur les 3 points (⋮) en haut puis "Installer l\'application"';
            Modal.show(`
                <div style="text-align:center">
                    <div style="font-size:48px;margin-bottom:12px">📲</div>
                    <h3 style="margin-bottom:8px">Installer IronFuel</h3>
                    <p style="color:var(--text-secondary);font-size:14px;line-height:1.5;margin-bottom:16px">${msg}</p>
                    <button class="btn btn-primary" onclick="Modal.close()" style="width:100%">Compris</button>
                </div>
            `);
        }
    },

    _renderMicroSummary() {
        const micros = MicronutrientService.estimateFromLog();
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
                    <span style="font-size:9px;color:${color};font-weight:700">${n.pct}%</span>
                </div>
            `;
        }).join('');

        return `
            <div class="card" onclick="MicronutrientService.showFullPanel()" style="padding:10px 16px;margin:0 16px 8px;cursor:pointer">
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

    _getCalorieMessage(pct) {
        const messages = {
            low: [
                "T'as mangé ou t'as juste regardé le frigo ? 👀",
                "Même un hamster mange plus que ça 🐹",
                "Ton estomac a envoyé un SOS 🆘"
            ],
            quarter: [
                "C'est un bon début, continue ! 💪",
                "Le petit-déj c'est fait, reste le reste 😄",
                "1/4 du chemin, tu gères 🚀"
            ],
            half: [
                "Mi-parcours, t'es sur la bonne voie ! 🎯",
                "La moitié, c'est déjà pas mal 👌",
                "Tu chauffes, continue comme ça 🔥"
            ],
            almost: [
                "Presque ! Plus qu'un petit effort 💫",
                "Ton corps te remercie déjà 🙏",
                "Tu fais les choses bien 🏆"
            ],
            goal: [
                "Objectif atteint, bravo champion ! 🏅",
                "Parfait, t'as tout géré aujourd'hui 💪",
                "Mission accomplie, GG ! 🎮"
            ],
            over: [
                "T'as un peu forcé là non ? 😅",
                "Bon… demain on repart de zéro 🔄",
                "Le frigo t'a dit stop, écoute-le 🤫"
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
