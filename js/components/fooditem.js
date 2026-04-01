const FoodItem = {
    render(item, mealType, dateStr) {
        // Show micronutrient badges for premium users
        const microBadges = (typeof MicronutrientService !== 'undefined' && typeof TrialService !== 'undefined' && TrialService.hasFullAccess())
            ? MicronutrientService.renderFoodMicros(item)
            : '';

        return `
            <div class="food-item" onclick="FoodItem.edit('${mealType}', ${item.id}, '${dateStr || ''}')" style="cursor:pointer">
                <div class="food-item-info">
                    <div class="food-item-name">${item.name}</div>
                    <div class="food-item-detail">
                        ${item.isRecipe ? `${item.recipeItems} aliments · ` : `${item.grams || item.qty || '—'}g · `}P:${Math.round(item.protein)}g · G:${Math.round(item.carbs)}g · L:${Math.round(item.fat)}g
                    </div>
                    ${microBadges}
                </div>
                <span class="food-item-calories">${item.calories} kcal</span>
                <button class="food-item-delete" onclick="event.stopPropagation();FoodItem.remove('${mealType}', ${item.id}, '${dateStr || ''}')" title="Supprimer" aria-label="Supprimer ${item.name}">
                    ✕
                </button>
                <button class="food-item-move" onclick="event.stopPropagation();FoodItem.showMoveModal('${mealType}', ${item.id}, '${dateStr || ''}')" title="Changer de repas" aria-label="Déplacer ${item.name}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:14px;padding:4px;margin-right:2px">
                    ↔
                </button>
            </div>
        `;
    },

    _parseDate(dateStr) {
        if (!dateStr) return undefined;
        const parts = dateStr.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]);
    },

    edit(mealType, entryId, dateStr) {
        const date = this._parseDate(dateStr);
        const log = Storage.getDayLog(date);
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
                    entryId: entryId,
                    dateStr: dateStr
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
            entryId: entryId,
            dateStr: dateStr
        });
    },

    showMoveModal(mealType, entryId, dateStr) {
        const meals = Storage.getMeals();
        const otherMeals = meals.filter(m => m.id !== mealType);
        if (otherMeals.length === 0) { App.showToast('Aucun autre repas disponible'); return; }

        Modal.show(`
            <div class="modal-title">Déplacer vers...</div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
                ${otherMeals.map(m => `
                    <button class="btn btn-outline" onclick="FoodItem.moveTo('${mealType}','${m.id}',${entryId},'${dateStr || ''}');Modal.close()" style="padding:14px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;justify-content:center">
                        <span>${m.icon}</span> ${m.name}
                    </button>
                `).join('')}
            </div>
        `);
    },

    moveTo(fromMeal, toMeal, entryId, dateStr) {
        const date = this._parseDate(dateStr);
        const log = Storage.getDayLog(date);
        const idx = log.meals[fromMeal]?.findIndex(f => f.id === entryId);
        if (idx === undefined || idx < 0) { App.showToast('Aliment introuvable'); return; }

        const entry = log.meals[fromMeal].splice(idx, 1)[0];
        if (!log.meals[toMeal]) log.meals[toMeal] = [];
        log.meals[toMeal].push(entry);
        Storage.setDayLog(log);

        const toName = Storage.getMeals().find(m => m.id === toMeal)?.name || toMeal;
        App.showToast(`Déplacé vers ${toName}`);
        App.haptic('light');

        if (App.currentPage === 'diary') DiaryPage.render();
        else if (App.currentPage === 'dashboard') DashboardPage.render();
    },

    remove(mealType, entryId, dateStr) {
        const date = this._parseDate(dateStr);
        Storage.removeFoodFromMeal(mealType, entryId, date);
        App.showToast('Aliment supprimé');
        if (App.currentPage === 'diary') {
            DiaryPage.render();
        } else if (App.currentPage === 'dashboard') {
            DashboardPage.render();
        }
    }
};
