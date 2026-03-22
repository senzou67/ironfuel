const MealCard = {
    mealConfig: {
        breakfast: { name: 'Petit-déjeuner', icon: '🌅' },
        lunch: { name: 'Déjeuner', icon: '☀️' },
        dinner: { name: 'Dîner', icon: '🌙' },
        snack: { name: 'Collation', icon: '🍎' }
    },

    render(mealType, items, showAdd = true, context = 'diary') {
        const config = this.mealConfig[mealType];
        const totals = Storage.getMealTotals(mealType);

        const headerClick = context === 'dashboard'
            ? `App.navigate('diary',{scrollTo:'${mealType}'})`
            : `MealCard.toggleMeal('${mealType}')`;

        return `
            <div class="meal-section fade-in">
                <div class="meal-header" onclick="${headerClick}">
                    <div class="meal-header-left">
                        <span class="meal-icon" aria-hidden="true">${config.icon}</span>
                        <span class="meal-name">${config.name}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px">
                        <span class="meal-calories">${totals.calories} kcal</span>
                        ${showAdd ? `<button class="meal-add-btn" onclick="event.stopPropagation();App.navigate('search',{meal:'${mealType}'})" aria-label="Ajouter un aliment au ${config.name}">+</button>` : ''}
                    </div>
                </div>
                <div class="meal-items" id="meal-${mealType}">
                    ${items.length === 0 ? `
                        <div class="food-item" style="justify-content:center;color:var(--text-secondary);font-size:13px;padding:16px">
                            Aucun aliment ajouté
                        </div>
                    ` : items.map(item => FoodItem.render(item, mealType)).join('')}
                </div>
            </div>
        `;
    },

    toggleMeal(mealType) {
        const el = document.getElementById('meal-' + mealType);
        if (el) {
            el.style.display = el.style.display === 'none' ? '' : 'none';
        }
    }
};
