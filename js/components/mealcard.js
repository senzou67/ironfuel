const MealCard = {
    getMealConfig(mealType) {
        const meals = Storage.getMeals();
        const m = meals.find(x => x.id === mealType);
        return m ? { name: m.name, icon: m.icon } : { name: mealType, icon: '🍽️' };
    },

    _collapsedKey: 'ironfuel_collapsed_meals',

    _getCollapsed() {
        try {
            return JSON.parse(localStorage.getItem(this._collapsedKey) || '{}');
        } catch { return {}; }
    },

    _setCollapsed(mealType, collapsed) {
        const state = this._getCollapsed();
        if (collapsed) state[mealType] = true;
        else delete state[mealType];
        localStorage.setItem(this._collapsedKey, JSON.stringify(state));
    },

    render(mealType, items, showAdd = true, context = 'diary') {
        const config = this.getMealConfig(mealType);
        const date = App.getSelectedDate();
        const totals = Storage.getMealTotals(mealType, date);
        const dateStr = App._localDateKey(date);
        const isCollapsed = this._getCollapsed()[mealType];

        const headerClick = `MealCard.toggleMeal('${mealType}')`;
        const hasContent = items.length > 0;
        const P = Math.round(totals.protein || 0);
        const G = Math.round(totals.carbs || 0);
        const L = Math.round(totals.fat || 0);
        const F = Math.round(totals.fiber || 0);

        return `
            <div class="meal-section fade-in${isCollapsed ? ' collapsed' : ''}" id="meal-section-${mealType}">
                <div class="meal-header" onclick="${headerClick}">
                    <div class="meal-header-left">
                        <span class="meal-icon" aria-hidden="true">${config.icon}</span>
                        <span class="meal-name">${config.name}</span>
                        ${hasContent ? `<span class="meal-item-count" style="min-width:16px;text-align:center">${items.length}</span>` : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:1;min-width:0">
                        ${hasContent ? `<button class="meal-share-btn" onclick="event.stopPropagation();MealCard.shareMeal('${mealType}','${dateStr}')" aria-label="Partager ${config.name}" title="Partager ce repas" style="background:var(--primary-light);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--primary);flex-shrink:0" type="button">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="11.49"/></svg>
                        </button>` : ''}
                        ${showAdd ? `<button class="meal-add-btn" onclick="event.stopPropagation();App.navigate('search',{meal:'${mealType}'})" aria-label="Ajouter un aliment au ${config.name}">+</button>` : ''}
                        <span class="meal-calories">${totals.calories} kcal</span>
                        <span class="meal-chevron">›</span>
                    </div>
                </div>
                ${hasContent ? `
                    <div class="meal-macros" style="display:flex;gap:6px;flex-wrap:wrap;padding:0 16px 8px;font-size:11px;color:var(--text-secondary)">
                        <span class="meal-macro-chip"><strong style="color:var(--protein-color,#3B82F6)">P·${P}g</strong></span>
                        <span class="meal-macro-chip"><strong style="color:var(--carbs-color,#F59E0B)">G·${G}g</strong></span>
                        <span class="meal-macro-chip"><strong style="color:var(--fat-color,#EF4444)">L·${L}g</strong></span>
                        ${F > 0 ? `<span class="meal-macro-chip"><strong style="color:var(--fiber-color,#34D399)">Fib·${F}g</strong></span>` : ''}
                    </div>
                ` : ''}
                <div class="meal-items" id="meal-${mealType}">
                    ${!hasContent ? `
                        <div class="food-item" style="justify-content:center;color:var(--text-secondary);font-size:13px;padding:16px">
                            Aucun aliment ajouté
                        </div>
                    ` : items.map(item => FoodItem.render(item, mealType, dateStr)).join('')}
                </div>
            </div>
        `;
    },

    async shareMeal(mealType, dateStr) {
        try {
            const config = this.getMealConfig(mealType);
            const date = dateStr ? (() => { const p = dateStr.split('-'); return new Date(p[0], p[1] - 1, p[2]); })() : new Date();
            const totals = Storage.getMealTotals(mealType, date);
            const log = Storage.getDayLog(date);
            // Actual food entries logged in this meal — passed to the share
            // card so the recipient sees the breakdown, not just the total.
            const items = (log.meals[mealType] || []).map(e => ({
                name: e.name,
                grams: e.grams || e.qty || 0,
                calories: e.calories || 0
            }));
            const profile = Storage.getProfile() || {};
            const authUser = (typeof AuthService !== 'undefined') ? AuthService.getCurrentUser() : null;
            const name = profile.name
                || (authUser && (authUser.displayName || (authUser.email || '').split('@')[0]))
                || 'Ton profil';
            const dateLabel = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

            if (typeof App !== 'undefined' && App.haptic) App.haptic('light');

            if (typeof ShareCard === 'undefined') {
                App.showToast('Chargement du partage… réessaie dans 1 s');
                return;
            }

            const result = await ShareCard.share({
                name,
                dateStr: dateLabel,
                calories: Math.round(totals.calories || 0),
                calorieGoal: 0,
                protein: totals.protein || 0,
                carbs: totals.carbs || 0,
                fat: totals.fat || 0,
                fiber: totals.fiber || 0,
                streak: 0,
                mealLabel: config.name,
                mealIcon: config.icon,
                items,
                text: `${config.icon} ${config.name} : ${Math.round(totals.calories || 0)} kcal sur OneFood`
            });
            if (result && result.downloaded) App.showToast('📸 Image téléchargée — partage-la où tu veux');
        } catch (err) {
            console.error('shareMeal error', err);
            App.showToast('Erreur lors du partage');
        }
    },

    toggleMeal(mealType) {
        const section = document.getElementById('meal-section-' + mealType);
        if (!section) return;
        const items = section.querySelector('.meal-items');
        const isCollapsed = section.classList.contains('collapsed');

        if (isCollapsed) {
            // Expand: show then animate
            section.classList.remove('collapsed');
            if (items) {
                items.style.opacity = '0';
                items.style.maxHeight = '0';
                items.style.overflow = 'hidden';
                items.style.transition = 'max-height 0.3s ease, opacity 0.2s ease';
                requestAnimationFrame(() => {
                    items.style.maxHeight = items.scrollHeight + 'px';
                    items.style.opacity = '1';
                    setTimeout(() => {
                        items.style.maxHeight = '';
                        items.style.overflow = '';
                        items.style.transition = '';
                        items.style.opacity = '';
                    }, 300);
                });
            }
        } else {
            // Collapse: animate then hide
            if (items) {
                items.style.maxHeight = items.scrollHeight + 'px';
                items.style.overflow = 'hidden';
                items.style.transition = 'max-height 0.3s ease, opacity 0.2s ease';
                requestAnimationFrame(() => {
                    items.style.maxHeight = '0';
                    items.style.opacity = '0';
                    setTimeout(() => {
                        section.classList.add('collapsed');
                        items.style.maxHeight = '';
                        items.style.overflow = '';
                        items.style.transition = '';
                        items.style.opacity = '';
                    }, 300);
                });
            } else {
                section.classList.add('collapsed');
            }
        }

        this._setCollapsed(mealType, !isCollapsed);
    }
};
