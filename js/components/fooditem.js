const FoodItem = {
    render(item, mealType) {
        // Show micronutrient badges for premium users
        const microBadges = (typeof MicronutrientService !== 'undefined' && typeof TrialService !== 'undefined' && TrialService.hasFullAccess())
            ? MicronutrientService.renderFoodMicros(item)
            : '';

        return `
            <div class="food-item" onclick="FoodItem.edit('${mealType}', ${item.id})" style="cursor:pointer">
                <div class="food-item-info">
                    <div class="food-item-name">${item.name}</div>
                    <div class="food-item-detail">
                        ${item.grams || item.qty || '—'}g · P:${Math.round(item.protein)}g · G:${Math.round(item.carbs)}g · L:${Math.round(item.fat)}g
                    </div>
                    ${microBadges}
                </div>
                <span class="food-item-calories">${item.calories} kcal</span>
                <button class="food-item-delete" onclick="event.stopPropagation();FoodItem.remove('${mealType}', ${item.id})" title="Supprimer" aria-label="Supprimer ${item.name}">
                    ✕
                </button>
            </div>
        `;
    },

    edit(mealType, entryId) {
        const log = Storage.getDayLog();
        const entry = log.meals[mealType].find(f => f.id === entryId);
        if (!entry) return;

        // If food is from DB, use DB modal
        if (entry.foodId) {
            const food = FoodDB.getById(entry.foodId);
            if (food) {
                Modal.showFoodModal(food, {
                    grams: entry.grams,
                    mealType: mealType,
                    editMode: true,
                    entryId: entryId
                });
                return;
            }
        }

        // Custom food — build a foodData object and show custom modal
        Modal.showCustomFoodModal({
            name: entry.name,
            calories: entry.calories,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
            fiber: entry.fiber || 0,
            weight_g: entry.grams
        }, {
            mealType: mealType,
            editMode: true,
            entryId: entryId
        });
    },

    remove(mealType, entryId) {
        Storage.removeFoodFromMeal(mealType, entryId);
        App.showToast('Aliment supprimé');
        // Refresh current page
        if (App.currentPage === 'diary') {
            DiaryPage.render();
        } else if (App.currentPage === 'dashboard') {
            DashboardPage.render();
        }
    }
};
