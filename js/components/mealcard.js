const MealCard = {
    mealConfig: {
        breakfast: { name: 'Petit-déjeuner', icon: '🌅' },
        lunch: { name: 'Déjeuner', icon: '☀️' },
        dinner: { name: 'Dîner', icon: '🌙' },
        snack: { name: 'Collation', icon: '🍎' }
    },

    _collapsedKey: 'ironfuel_collapsed_meals',

    _getCollapsed() {
        try {
            return JSON.parse(sessionStorage.getItem(this._collapsedKey) || '{}');
        } catch { return {}; }
    },

    _setCollapsed(mealType, collapsed) {
        const state = this._getCollapsed();
        if (collapsed) state[mealType] = true;
        else delete state[mealType];
        sessionStorage.setItem(this._collapsedKey, JSON.stringify(state));
    },

    render(mealType, items, showAdd = true, context = 'diary') {
        const config = this.mealConfig[mealType];
        const date = App.getSelectedDate();
        const totals = Storage.getMealTotals(mealType, date);
        const dateStr = App._localDateKey(date);
        const isCollapsed = this._getCollapsed()[mealType];

        const headerClick = `MealCard.toggleMeal('${mealType}')`;

        return `
            <div class="meal-section fade-in${isCollapsed ? ' collapsed' : ''}" id="meal-section-${mealType}">
                <div class="meal-header" onclick="${headerClick}">
                    <div class="meal-header-left">
                        <span class="meal-icon" aria-hidden="true">${config.icon}</span>
                        <span class="meal-name">${config.name}</span>
                        <span class="meal-item-count">${items.length > 0 ? items.length : ''}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px">
                        <span class="meal-calories">${totals.calories} kcal</span>
                        ${showAdd ? `<button class="meal-add-btn" onclick="event.stopPropagation();App.navigate('search',{meal:'${mealType}'})" aria-label="Ajouter un aliment au ${config.name}">+</button>` : ''}
                        <span class="meal-chevron">›</span>
                    </div>
                </div>
                <div class="meal-items" id="meal-${mealType}">
                    ${items.length === 0 ? `
                        <div class="food-item" style="justify-content:center;color:var(--text-secondary);font-size:13px;padding:16px">
                            Aucun aliment ajouté
                        </div>
                    ` : items.map(item => FoodItem.render(item, mealType, dateStr)).join('')}
                </div>
            </div>
        `;
    },

    toggleMeal(mealType) {
        const section = document.getElementById('meal-section-' + mealType);
        if (section) {
            const nowCollapsed = section.classList.toggle('collapsed');
            this._setCollapsed(mealType, nowCollapsed);
        }
    }
};
