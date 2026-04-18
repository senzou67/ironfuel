// ===== MEAL PLANNER PAGE =====
// Plan meals for the upcoming week, drag-and-drop foods/recipes
const MealPlannerPage = {
    _weekOffset: 0, // 0 = this week, 1 = next week, etc.
    _selectedDay: null,
    _selectedMeal: null,

    _getWeekStart(offset = 0) {
        const now = new Date();
        const day = now.getDay(); // 0=Sun, 1=Mon...
        const diff = (day === 0 ? -6 : 1 - day) + (offset * 7);
        const start = new Date(now);
        start.setDate(now.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        return start;
    },

    _getPlan() {
        return Storage._get('meal_plan', {}) || {};
    },

    _savePlan(plan) {
        Storage._set('meal_plan', plan);
        if (typeof SyncService !== 'undefined' && SyncService.autoSync) SyncService.autoSync();
    },

    _dateKey(date) {
        return App._localDateKey(date);
    },

    render() {
        if (!TrialService.hasFullAccess()) {
            TrialService.showFeatureLockedPrompt('mealplanner');
            return;
        }

        const weekStart = this._getWeekStart(this._weekOffset);
        const days = [];
        const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            days.push({ date: d, key: this._dateKey(d), name: dayNames[i], dayNum: d.getDate() });
        }

        const plan = this._getPlan();
        const mealTypes = [
            { id: 'breakfast', icon: '🌅', name: 'Petit-déj' },
            { id: 'lunch', icon: '☀️', name: 'Déjeuner' },
            { id: 'dinner', icon: '🌙', name: 'Dîner' },
            { id: 'snack', icon: '🍎', name: 'Collation' }
        ];

        // Week label
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const monthLabels = ['jan','fév','mars','avr','mai','juin','juil','août','sep','oct','nov','déc'];
        const weekLabel = this._weekOffset === 0 ? 'Cette semaine'
            : this._weekOffset === 1 ? 'Semaine prochaine'
            : `Sem. ${weekStart.getDate()} ${monthLabels[weekStart.getMonth()]} — ${weekEnd.getDate()} ${monthLabels[weekEnd.getMonth()]}`;

        const totalMeals = days.reduce((sum, day) => {
            const dayPlan = plan[day.key] || {};
            return sum + mealTypes.reduce((s, m) => s + ((dayPlan[m.id] || []).length), 0);
        }, 0);

        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="mealplanner-container fade-in" style="padding-bottom:20px">
                <div style="padding:16px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                        <button onclick="MealPlannerPage.shiftWeek(-1)" aria-label="Semaine précédente" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;width:36px;height:36px;cursor:pointer;color:var(--text);font-size:18px">‹</button>
                        <div style="text-align:center;flex:1;min-width:0">
                            <div style="font-size:15px;font-weight:700">${weekLabel}</div>
                            <div style="font-size:11px;color:var(--text-secondary)">${totalMeals} aliment${totalMeals > 1 ? 's' : ''} planifié${totalMeals > 1 ? 's' : ''}</div>
                        </div>
                        <button onclick="MealPlannerPage.shiftWeek(1)" aria-label="Semaine suivante" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;width:36px;height:36px;cursor:pointer;color:var(--text);font-size:18px">›</button>
                    </div>
                </div>

                <div style="padding:0 16px">
                    ${days.map(day => {
                        const dayPlan = plan[day.key] || {};
                        const isToday = day.key === App._localDateKey(new Date());
                        const isPast = day.date < new Date(new Date().setHours(0,0,0,0));
                        return `
                            <div class="card" style="margin-bottom:12px;padding:12px 14px;${isPast ? 'opacity:0.5' : ''}">
                                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                                    <div style="display:flex;align-items:center;gap:8px">
                                        <span style="font-weight:700;font-size:14px;${isToday ? 'color:var(--primary)' : ''}">${day.name}</span>
                                        <span style="font-size:12px;color:var(--text-secondary)">${day.dayNum}</span>
                                        ${isToday ? '<span style="font-size:10px;padding:2px 6px;background:var(--primary);color:white;border-radius:6px;font-weight:700">AUJOURD\'HUI</span>' : ''}
                                    </div>
                                    ${!isPast ? `<button onclick="MealPlannerPage.copyToDiary('${day.key}')" style="background:var(--primary-light);color:var(--primary);border:none;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer">→ Journal</button>` : ''}
                                </div>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                                    ${mealTypes.map(m => {
                                        const items = dayPlan[m.id] || [];
                                        return `
                                            <div onclick="MealPlannerPage.editMeal('${day.key}','${m.id}')" style="background:var(--bg);border:1px dashed var(--border);border-radius:8px;padding:6px 8px;cursor:pointer;min-height:50px">
                                                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
                                                    <span style="font-size:11px;font-weight:600;color:var(--text-secondary)">${m.icon} ${m.name}</span>
                                                    ${items.length > 0 ? `<span style="font-size:9px;padding:1px 5px;background:var(--primary-light);color:var(--primary);border-radius:4px;font-weight:700">${items.length}</span>` : ''}
                                                </div>
                                                <div style="font-size:10px;color:var(--text-secondary);line-height:1.3">
                                                    ${items.length === 0 ? '<span style="opacity:0.5">+ Ajouter</span>' : items.slice(0, 2).map(i => _esc(i.name)).join(', ') + (items.length > 2 ? ` +${items.length - 2}` : '')}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="padding:16px;text-align:center">
                    <p style="font-size:12px;color:var(--text-secondary);line-height:1.5">
                        💡 Planifie tes repas à l'avance pour atteindre plus facilement tes objectifs.<br>
                        Clique sur un repas pour l'éditer, ou sur "→ Journal" pour copier la journée.
                    </p>
                </div>
            </div>
        `;
    },

    shiftWeek(delta) {
        this._weekOffset = Math.max(0, Math.min(12, this._weekOffset + delta));
        this.render();
        App.haptic('light');
    },

    editMeal(dateKey, mealType) {
        const plan = this._getPlan();
        const items = (plan[dateKey] && plan[dateKey][mealType]) || [];
        const mealNames = { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', dinner: 'Dîner', snack: 'Collation' };

        Modal.show(`
            <div class="modal-title">${mealNames[mealType]}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">${new Date(dateKey).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>

            ${items.length > 0 ? `
                <div style="margin-bottom:12px">
                    ${items.map((item, i) => `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--bg);border-radius:8px;margin-bottom:6px">
                            <div style="flex:1;min-width:0">
                                <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(item.name)}</div>
                                <div style="font-size:11px;color:var(--text-secondary)">${item.grams || 100}g · ${item.calories || 0} kcal</div>
                            </div>
                            <button onclick="MealPlannerPage._removeItem('${dateKey}','${mealType}',${i})" style="background:none;border:none;color:var(--danger);font-size:18px;cursor:pointer;padding:4px 8px">✕</button>
                        </div>
                    `).join('')}
                </div>
            ` : '<p style="color:var(--text-secondary);font-size:13px;text-align:center;padding:16px">Aucun aliment planifié</p>'}

            <div style="display:flex;gap:8px">
                <button class="btn btn-primary" onclick="MealPlannerPage._addFromSearch('${dateKey}','${mealType}')" style="flex:1">+ Ajouter un aliment</button>
                <button class="btn btn-secondary" onclick="Modal.close()">Fermer</button>
            </div>
        `);
    },

    _addFromSearch(dateKey, mealType) {
        this._selectedDay = dateKey;
        this._selectedMeal = mealType;
        Modal.close();
        // Switch to search mode for meal planner
        SearchPage._plannerMode = { dateKey, mealType };
        App.navigate('search', { meal: mealType });
        App.showToast('Sélectionne un aliment pour le planifier');
    },

    addToPlan(food, grams) {
        if (!this._selectedDay || !this._selectedMeal) return;
        const plan = this._getPlan();
        if (!plan[this._selectedDay]) plan[this._selectedDay] = {};
        if (!plan[this._selectedDay][this._selectedMeal]) plan[this._selectedDay][this._selectedMeal] = [];

        const n = food.n ? FoodDB.getNutrition(food, grams) : null;
        plan[this._selectedDay][this._selectedMeal].push({
            name: food.name,
            foodId: food.id || null,
            grams,
            calories: n ? n.calories : (food.calories || 0),
            protein: n ? n.protein : (food.protein || 0),
            carbs: n ? n.carbs : (food.carbs || 0),
            fat: n ? n.fat : (food.fat || 0),
            fiber: n ? n.fiber : (food.fiber || 0)
        });

        this._savePlan(plan);
        App.showToast(`${food.name} planifié ✓`);
        App.haptic('success');

        // Clear planner mode and return
        SearchPage._plannerMode = null;
        this._selectedDay = null;
        this._selectedMeal = null;
        App.navigate('mealplanner');
    },

    _removeItem(dateKey, mealType, idx) {
        const plan = this._getPlan();
        if (plan[dateKey] && plan[dateKey][mealType]) {
            plan[dateKey][mealType].splice(idx, 1);
            this._savePlan(plan);
            this.editMeal(dateKey, mealType);
        }
    },

    copyToDiary(dateKey) {
        const plan = this._getPlan();
        const dayPlan = plan[dateKey];
        if (!dayPlan) { App.showToast('Rien à copier'); return; }

        const date = new Date(dateKey);
        let count = 0;
        Object.entries(dayPlan).forEach(([mealType, items]) => {
            items.forEach(item => {
                Storage.addFoodToMeal(mealType, { ...item }, date);
                count++;
            });
        });

        if (count > 0) {
            App.showToast(`✓ ${count} aliment${count > 1 ? 's' : ''} copié${count > 1 ? 's' : ''} au journal`);
            App.haptic('success');
        } else {
            App.showToast('Rien à copier');
        }
    }
};
