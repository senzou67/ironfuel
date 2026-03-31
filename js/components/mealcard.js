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

        return `
            <div class="meal-section fade-in${isCollapsed ? ' collapsed' : ''}" id="meal-section-${mealType}">
                <div class="meal-header" onclick="${headerClick}">
                    <div class="meal-header-left">
                        <span class="meal-icon" aria-hidden="true">${config.icon}</span>
                        <span class="meal-name">${config.name}</span>
                        ${items.length > 0 ? `<span class="meal-item-count" style="min-width:16px;text-align:center">${items.length}</span>` : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
                        ${showAdd ? `<button class="meal-add-btn" onclick="event.stopPropagation();App.navigate('${context === 'dashboard' ? 'diary' : 'search'}',{meal:'${mealType}'})" aria-label="Ajouter un aliment au ${config.name}">+</button>` : ''}
                        <span class="meal-calories">${totals.calories} kcal</span>
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
