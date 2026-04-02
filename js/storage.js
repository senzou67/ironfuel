const Storage = {
    _get(key, defaultVal) {
        try {
            const data = localStorage.getItem('nutritrack_' + key);
            return data ? JSON.parse(data) : defaultVal;
        } catch {
            return defaultVal;
        }
    },

    _set(key, value) {
        try {
            localStorage.setItem('nutritrack_' + key, JSON.stringify(value));
        } catch (e) {
            // QuotaExceededError — localStorage is full
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                console.error('localStorage quota exceeded for key:', key);
                // Try to free space by removing old log dates
                try {
                    const dates = this._get('log_dates', []);
                    if (dates.length > 90) {
                        const toRemove = dates.slice(0, dates.length - 90);
                        toRemove.forEach(d => {
                            try { localStorage.removeItem('nutritrack_log_' + d); } catch(x) {}
                        });
                        this._set('log_dates', dates.slice(-90));
                        // Retry original write
                        localStorage.setItem('nutritrack_' + key, JSON.stringify(value));
                        return;
                    }
                } catch(x) {}
                if (typeof App !== 'undefined' && App.showToast) {
                    App.showToast('Stockage plein — exporte tes données');
                }
            }
        }
    },

    // === PROFIL ===
    getProfile() {
        return this._get('profile', {
            name: '',
            age: 30,
            sex: 'male',
            height: 175,
            weight: 70,
            activity: 'moderate',
            goal: 'maintain'
        });
    },

    setProfile(profile) {
        this._set('profile', profile);
        // Recalculate goals when profile changes
        const goals = this.getGoals();
        if (!goals.custom) {
            const auto = NutritionService.calculateDailyNeeds(profile);
            goals.calories = auto.calories;
            goals.protein = auto.protein;
            goals.carbs = auto.carbs;
            goals.fat = auto.fat;
            this._set('goals', goals);
        }
        this._triggerSync();
    },

    // === OBJECTIFS ===
    getGoals() {
        return this._get('goals', {
            calories: 2000,
            protein: 150,
            carbs: 250,
            fat: 65,
            fiber: 25,
            water: 12, // 12 glasses of 250ml = 3L
            custom: false
        });
    },

    setGoals(goals) {
        this._set('goals', goals);
        this._triggerSync();
    },

    // === REPAS CONFIGURABLES ===
    _defaultMeals: [
        { id: 'breakfast', name: 'Petit-déjeuner', icon: '🌅', pct: 25 },
        { id: 'lunch', name: 'Déjeuner', icon: '☀️', pct: 35 },
        { id: 'dinner', name: 'Dîner', icon: '🌙', pct: 30 },
        { id: 'snack', name: 'Collation', icon: '🍎', pct: 10 }
    ],

    getMeals() {
        return this._get('user_meals', this._defaultMeals);
    },

    setMeals(meals) {
        this._set('user_meals', meals);
        this._triggerSync();
    },

    // === JOURNAL ALIMENTAIRE ===
    _dateKey(date) {
        if (!date) date = new Date();
        return App._localDateKey(date);
    },

    getDayLog(date) {
        const key = this._dateKey(date);
        const meals = this.getMeals();
        const defaultMeals = {};
        meals.forEach(m => defaultMeals[m.id] = []);
        const log = this._get('log_' + key, {
            date: key,
            meals: defaultMeals,
            water: 0
        });
        // Ensure all configured meals exist in log
        meals.forEach(m => { if (!log.meals[m.id]) log.meals[m.id] = []; });
        return log;
    },

    setDayLog(log) {
        this._set('log_' + log.date, log);
        this._updateLogDates(log.date);
        this._triggerSync();
    },

    addFoodToMeal(mealType, foodEntry, date) {
        const log = this.getDayLog(date);
        foodEntry.id = Date.now() + Math.random();
        log.meals[mealType].push(foodEntry);
        this.setDayLog(log);
        // Save to community food database (all foods with nutrition data)
        if (foodEntry.name && foodEntry.calories) {
            this._saveToCommunityDB(foodEntry);
        }
        return foodEntry;
    },

    _BANNED_WORDS: ['fuck','shit','merde','putain','bite','couille','porn','xxx','sex','nazi','hitler','drogue','drug','cocaine','heroin','weed','cannabis'],

    _isValidFood(food) {
        if (!food || !food.name || !food.calories) return false;
        const name = food.name.toLowerCase();
        // Reject banned words
        if (this._BANNED_WORDS.some(w => name.includes(w))) return false;
        // Reject suspiciously short or long names
        if (name.length < 2 || name.length > 100) return false;
        // Reject absurd nutrition values (per 100g equivalent)
        const g = food.grams || 100;
        const cal100 = (food.calories / g) * 100;
        if (cal100 < 0 || cal100 > 1000) return false; // Nothing exceeds 900 kcal/100g (pure fat)
        if (food.protein < 0 || food.carbs < 0 || food.fat < 0) return false;
        const macroTotal = ((food.protein || 0) + (food.carbs || 0) + (food.fat || 0));
        if (macroTotal <= 0) return false;
        // Reject if macros don't roughly match calories (±50%)
        const macroCal = (food.protein || 0) * 4 + (food.carbs || 0) * 4 + (food.fat || 0) * 9;
        if (macroCal > 0 && Math.abs(macroCal - food.calories) / food.calories > 0.5) return false;
        return true;
    },

    _saveToCommunityDB(food) {
        try {
            if (!this._isValidFood(food)) return;
            // Save locally
            const db = this._get('community_foods', []);
            const key = (food.barcode || food.name || '').toLowerCase().trim();
            if (!key || db.some(f => (f.barcode || f.name || '').toLowerCase().trim() === key)) return;
            const entry = {
                name: food.name.substring(0, 100),
                barcode: food.barcode || null,
                calories: Math.round(food.calories),
                protein: Math.round((food.protein || 0) * 10) / 10,
                carbs: Math.round((food.carbs || 0) * 10) / 10,
                fat: Math.round((food.fat || 0) * 10) / 10,
                fiber: Math.round((food.fiber || 0) * 10) / 10,
                grams: food.grams || 100,
                source: food.source || 'user',
                addedAt: new Date().toISOString()
            };
            db.push(entry);
            if (db.length > 500) db.splice(0, db.length - 500);
            this._set('community_foods', db);
            // Also push to cloud community DB (fire and forget)
            fetch('/.netlify/functions/community-foods?action=add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            }).catch(() => {});
        } catch {}
    },

    removeFoodFromMeal(mealType, entryId, date) {
        const log = this.getDayLog(date);
        log.meals[mealType] = log.meals[mealType].filter(f => f.id !== entryId);
        this.setDayLog(log);
    },

    updateFoodInMeal(mealType, entryId, updates, date) {
        const log = this.getDayLog(date);
        const idx = log.meals[mealType].findIndex(f => f.id === entryId);
        if (idx >= 0) {
            Object.assign(log.meals[mealType][idx], updates);
            this.setDayLog(log);
        }
    },

    // === EAU ===
    getWater(date) {
        const log = this.getDayLog(date);
        return log.water || 0;
    },

    setWater(count, date) {
        const log = this.getDayLog(date);
        log.water = count;
        this.setDayLog(log);
    },

    // === HISTORIQUE ===
    _updateLogDates(dateStr) {
        const dates = this._get('log_dates', []);
        if (!dates.includes(dateStr)) {
            dates.push(dateStr);
            dates.sort();
            this._set('log_dates', dates);
        }
    },

    getLogDates() {
        return this._get('log_dates', []);
    },

    getDayTotals(date) {
        const log = this.getDayLog(date);
        let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        Object.values(log.meals).forEach(meal => {
            meal.forEach(entry => {
                totals.calories += entry.calories || 0;
                totals.protein += entry.protein || 0;
                totals.carbs += entry.carbs || 0;
                totals.fat += entry.fat || 0;
                totals.fiber += entry.fiber || 0;
            });
        });
        return totals;
    },

    getMealTotals(mealType, date) {
        const log = this.getDayLog(date);
        let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        (log.meals[mealType] || []).forEach(entry => {
            totals.calories += entry.calories || 0;
            totals.protein += entry.protein || 0;
            totals.carbs += entry.carbs || 0;
            totals.fat += entry.fat || 0;
        });
        return totals;
    },

    getHistoryRange(days) {
        const results = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const totals = this.getDayTotals(d);
            results.push({
                date: this._dateKey(d),
                ...totals
            });
        }
        return results;
    },

    // === POIDS ===
    getWeightLog() {
        return this._get('weight_log', []);
    },

    addWeight(weight, date) {
        const log = this.getWeightLog();
        const key = this._dateKey(date);
        const existing = log.findIndex(e => e.date === key);
        if (existing >= 0) {
            log[existing].weight = weight;
        } else {
            log.push({ date: key, weight });
            log.sort((a, b) => a.date.localeCompare(b.date));
        }
        this._set('weight_log', log);
        this._triggerSync();
    },

    // === FAVORIS ===
    getFavorites() {
        return this._get('favorites', []);
    },

    toggleFavorite(foodId) {
        const favs = this.getFavorites();
        const idx = favs.indexOf(foodId);
        if (idx >= 0) {
            favs.splice(idx, 1);
        } else {
            favs.push(foodId);
        }
        this._set('favorites', favs);
        return idx < 0;
    },

    isFavorite(foodId) {
        return this.getFavorites().includes(foodId);
    },

    // === RÉCENTS ===
    getRecent() {
        return this._get('recent', []);
    },

    addRecent(foodId) {
        let recent = this.getRecent();
        recent = recent.filter(id => id !== foodId);
        recent.unshift(foodId);
        if (recent.length > 20) recent = recent.slice(0, 20);
        this._set('recent', recent);
    },

    // === PARAMÈTRES ===
    getSettings() {
        return this._get('settings', {
            apiKey: '',
            theme: 'auto',
            notifications: false
        });
    },

    setSettings(settings) {
        this._set('settings', settings);
        this._triggerSync();
    },

    getApiKey() {
        return this.getSettings().apiKey;
    },

    setApiKey(key) {
        const settings = this.getSettings();
        settings.apiKey = key;
        this.setSettings(settings);
    },

    getTheme() {
        return this.getSettings().theme;
    },

    setTheme(theme) {
        const settings = this.getSettings();
        settings.theme = theme;
        this.setSettings(settings);
        if (theme === 'auto') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    },

    // === STREAK ===
    _streakCache: null,
    _streakCacheDate: null,

    getStreak() {
        const today = this._dateKey();
        if (this._streakCache !== null && this._streakCacheDate === today) {
            return this._streakCache;
        }

        const dates = this.getLogDates();
        if (dates.length === 0) { this._streakCache = 0; this._streakCacheDate = today; return 0; }

        let streak = 0;
        const now = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const log = this.getDayLog(d);
            const hasEntries = Object.values(log.meals).some(m => m.length > 0);
            if (hasEntries) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        this._streakCache = streak;
        this._streakCacheDate = today;
        return streak;
    },

    invalidateStreakCache() {
        this._streakCache = null;
    },

    // === STATISTIQUES ALIMENTS (Favoris intelligents) ===
    getFoodStats() {
        return this._get('food_stats', {});
    },

    trackFoodUsage(foodId, mealType) {
        const stats = this.getFoodStats();
        const key = String(foodId);
        if (!stats[key]) {
            stats[key] = { count: 0, lastUsed: null, meals: {} };
        }
        stats[key].count++;
        stats[key].lastUsed = new Date().toISOString();
        stats[key].meals[mealType] = (stats[key].meals[mealType] || 0) + 1;
        this._set('food_stats', stats);
    },

    getTopFoods(mealType, limit = 10) {
        const stats = this.getFoodStats();
        const now = Date.now();

        let entries = Object.entries(stats).map(([foodId, s]) => {
            const daysSinceUse = (now - new Date(s.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
            const recencyWeight = Math.max(0, 1 - (daysSinceUse / 30));
            const mealRelevance = mealType && s.meals[mealType] ? (s.meals[mealType] / s.count) : 0.5;
            const score = s.count * (0.5 + recencyWeight) * (0.5 + mealRelevance);
            return { foodId: isNaN(Number(foodId)) ? foodId : parseInt(foodId), score, count: s.count };
        });

        entries.sort((a, b) => b.score - a.score);
        return entries.slice(0, limit);
    },

    getCurrentMealType() {
        const meals = this.getMeals();
        const hour = new Date().getHours();
        // Distribute meals across the day based on order
        const slots = [
            [6, 10], [11, 14], [14, 17], [17, 22], [22, 6]
        ];
        for (let i = 0; i < Math.min(meals.length, slots.length); i++) {
            const [start, end] = slots[i];
            if (start < end ? (hour >= start && hour < end) : (hour >= start || hour < end)) return meals[i].id;
        }
        return meals[meals.length - 1].id;
    },

    // === ALIMENTS PERSONNALISES ===
    getCustomFoods() {
        return this._get('custom_foods', []);
    },

    addCustomFood(food) {
        const foods = this.getCustomFoods();
        food.id = 'custom_' + Date.now();
        food.isCustom = true;
        foods.push(food);
        this._set('custom_foods', foods);
        return food;
    },

    deleteCustomFood(id) {
        const foods = this.getCustomFoods().filter(f => f.id !== id);
        this._set('custom_foods', foods);
    },

    // === VISION PROVIDER ===
    getVisionProvider() {
        return this.getSettings().visionProvider || 'auto';
    },

    setVisionProvider(provider) {
        const settings = this.getSettings();
        settings.visionProvider = provider;
        this.setSettings(settings);
    },

    getGeminiKey() {
        return this.getSettings().geminiKey || '';
    },

    setGeminiKey(key) {
        const settings = this.getSettings();
        settings.geminiKey = key;
        this.setSettings(settings);
    },

    // === IRONCOINS ===
    getCoins() {
        return this._get('coins', 0);
    },

    addCoins(amount) {
        // Double coins boost check
        if (amount > 0) {
            try {
                const boost = localStorage.getItem('onefood_double_coins');
                if (boost && new Date(boost) > new Date()) amount *= 2;
            } catch {}
        }
        const current = this.getCoins();
        this._set('coins', Math.max(0, current + amount));
        this._triggerSync();
        return Math.max(0, current + amount);
    },

    spendCoins(amount) {
        const current = this.getCoins();
        if (current < amount) return false;
        this._set('coins', current - amount);
        this._triggerSync();
        return true;
    },

    // === BOUTIQUE ===
    getOwnedItems() {
        return this._get('owned_items', []);
    },

    addOwnedItem(item) {
        const owned = this.getOwnedItems();
        if (!owned.find(i => i.id === item.id)) {
            owned.push(item);
            this._set('owned_items', owned);
            this._triggerSync();
        }
    },

    getEquippedItems() {
        return this._get('equipped_items', []);
    },

    equipItem(item) {
        let equipped = this.getEquippedItems();
        // Only one item per type
        equipped = equipped.filter(i => i.type !== item.type);
        equipped.push(item);
        this._set('equipped_items', equipped);
        this._triggerSync();
    },

    unequipItem(itemType) {
        let equipped = this.getEquippedItems();
        equipped = equipped.filter(i => i.type !== itemType);
        this._set('equipped_items', equipped);
        this._triggerSync();
    },

    isItemEquipped(itemId) {
        return this.getEquippedItems().some(i => i.id === itemId);
    },

    isItemOwned(itemId) {
        return this.getOwnedItems().some(i => i.id === itemId);
    },

    // === CREATURE ===
    getCreature() {
        return this._get('creature', null);
    },

    setCreature(creature) {
        this._set('creature', creature);
        this._triggerSync();
    },

    hasChosenStarter() {
        const c = this.getCreature();
        return !!(c && c.chosen);
    },

    getCreatureStreak() {
        return this._get('creature_streak', {
            current: 0,
            best: 0,
            lastActiveDate: null,
            freezesOwned: 0,
            freezesUsed: []
        });
    },

    setCreatureStreak(data) {
        this._set('creature_streak', data);
    },

    addCreatureXP(amount) {
        const creature = this.getCreature();
        if (!creature) return;
        creature.xp = (creature.xp || 0) + amount;
        // Update form based on XP thresholds
        if (creature.xp >= 8000) creature.form = 4;
        else if (creature.xp >= 2000) creature.form = 3;
        else if (creature.xp >= 500) creature.form = 2;
        else creature.form = 1;
        this.setCreature(creature);
        return creature;
    },

    hasXPBeenAwardedToday() {
        const today = this._dateKey();
        return this._get('creature_xp_last', '') === today;
    },

    markXPAwarded() {
        this._set('creature_xp_last', this._dateKey());
    },

    // === DAILY BONUS TRACKING ===
    hasDailyCalorieBonus() {
        const today = this._dateKey();
        return this._get('daily_cal_bonus', '') === today;
    },

    setDailyCalorieBonus() {
        this._set('daily_cal_bonus', this._dateKey());
    },

    hasDailyWaterBonus() {
        const today = this._dateKey();
        return this._get('daily_water_bonus', '') === today;
    },

    setDailyWaterBonus() {
        this._set('daily_water_bonus', this._dateKey());
    },

    hasDailySupplBonus() {
        return this._get('daily_suppl_bonus', '') === this._dateKey();
    },

    setDailySupplBonus() {
        this._set('daily_suppl_bonus', this._dateKey());
    },

    // === EXPORT ===
    exportData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('nutritrack_')) {
                data[key] = JSON.parse(localStorage.getItem(key));
            }
        }
        return data;
    },

    importData(data) {
        // Only import nutritrack_ keys and block sensitive overrides
        const blocked = ['nutritrack_firebase_config', 'nutritrack_trial', 'nutritrack_coins', 'nutritrack_owned_items', 'nutritrack_equipped_items', 'nutritrack_creature', 'nutritrack_creature_streak', 'nutritrack_auth_user', 'nutritrack_device_id', 'nutritrack_fcm_token'];
        Object.entries(data).forEach(([key, value]) => {
            if (!key.startsWith('nutritrack_')) return;
            if (blocked.includes(key)) return;
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch(e) {}
        });
    },

    clearAll() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('nutritrack_')) keys.push(key);
        }
        keys.forEach(k => localStorage.removeItem(k));
    },

    // === CLOUD SYNC TRIGGER ===
    // === RECETTES ===
    getRecipes() { return this._get('recipes', []); },
    saveRecipe(recipe) {
        const recipes = this.getRecipes();
        if (recipe.id) {
            const idx = recipes.findIndex(r => r.id === recipe.id);
            if (idx >= 0) recipes[idx] = recipe;
            else recipes.push(recipe);
        } else {
            recipe.id = Date.now();
            recipes.push(recipe);
        }
        this._set('recipes', recipes);
        this._triggerSync();
        return recipe;
    },
    deleteRecipe(id) {
        const recipes = this.getRecipes().filter(r => r.id !== id);
        this._set('recipes', recipes);
        this._triggerSync();
    },
    addRecipeToMeal(recipeId, mealType, date) {
        const recipe = this.getRecipes().find(r => r.id === recipeId);
        if (!recipe || !recipe.items.length) return;
        // Aggregate totals
        const totals = recipe.items.reduce((acc, item) => {
            acc.calories += item.calories || 0;
            acc.protein += item.protein || 0;
            acc.carbs += item.carbs || 0;
            acc.fat += item.fat || 0;
            acc.grams += item.grams || 0;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0, grams: 0 });
        // Add as single entry
        this.addFoodToMeal(mealType, {
            name: '📋 ' + recipe.name,
            grams: totals.grams,
            calories: Math.round(totals.calories),
            protein: Math.round(totals.protein * 10) / 10,
            carbs: Math.round(totals.carbs * 10) / 10,
            fat: Math.round(totals.fat * 10) / 10,
            isRecipe: true,
            recipeId: recipe.id,
            recipeItems: recipe.items.length,
            source: 'recipe'
        }, date);
    },

    _triggerSync() {
        if (typeof SyncService !== 'undefined' && SyncService.autoSync) {
            SyncService.autoSync();
        }
    }
};
