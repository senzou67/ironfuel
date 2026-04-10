const DiaryPage = {
    render(params = {}) {
        const date = App.getSelectedDate();
        const log = Storage.getDayLog(date);
        const totals = Storage.getDayTotals(date);
        const goals = Storage.getGoals();

        const dateLabel = App.getDateLabel();
        const dateKey = App._localDateKey(date);

        const content = document.getElementById('page-content');
        const mealEntries = Object.entries(log.meals);
        const midpoint = Math.ceil(mealEntries.length / 2);
        const mealsLeft = mealEntries.slice(0, midpoint);
        const mealsRight = mealEntries.slice(midpoint);

        content.innerHTML = `
            <div class="fade-in" style="padding-bottom:16px">
                <!-- DATE SELECTOR -->
                <div class="date-selector-bar">
                    <button class="date-nav-btn" onclick="DiaryPage._shiftDate(-1)" aria-label="Jour précédent">‹</button>
                    <button class="date-label-btn" onclick="DiaryPage._openDatePicker()">
                        <span>${dateLabel}</span>
                        <span class="date-chevron">▾</span>
                    </button>
                    <button class="date-nav-btn" onclick="DiaryPage._shiftDate(1)" aria-label="Jour suivant">›</button>
                    <input type="date" id="hidden-date-picker" value="${dateKey}" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0">
                </div>

                <div class="card diary-summary">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <div>
                            <div style="font-size:24px;font-weight:700;color:var(--primary)">${totals.calories}</div>
                            <div style="font-size:12px;color:var(--text-secondary)">/ ${goals.calories} kcal</div>
                        </div>
                        <div class="nutrition-preview" style="margin:0;flex:1;max-width:280px;grid-template-columns:repeat(4,1fr)">
                            <div class="nutrition-item prot">
                                <span class="nutrition-item-value">${Math.round(totals.protein)}g</span>
                                <span class="nutrition-item-label">Prot.</span>
                            </div>
                            <div class="nutrition-item carb">
                                <span class="nutrition-item-value">${Math.round(totals.carbs)}g</span>
                                <span class="nutrition-item-label">Gluc.</span>
                            </div>
                            <div class="nutrition-item fat">
                                <span class="nutrition-item-value">${Math.round(totals.fat)}g</span>
                                <span class="nutrition-item-label">Lip.</span>
                            </div>
                            <div class="nutrition-item fiber">
                                <span class="nutrition-item-value">${Math.round(totals.fiber || 0)}g</span>
                                <span class="nutrition-item-label">Fib.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="diary-grid">
                    <div>${mealsLeft.map(([type, items]) => MealCard.render(type, items)).join('')}</div>
                    <div>${mealsRight.map(([type, items]) => MealCard.render(type, items)).join('')}</div>
                </div>
            </div>
        `;

        // Scroll to specific meal if requested (from dashboard click)
        const scrollTarget = params.scrollTo || params.meal;
        if (scrollTarget) {
            const mealEl = document.getElementById('meal-' + scrollTarget) || document.getElementById('meal-section-' + scrollTarget);
            if (mealEl) {
                setTimeout(() => mealEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }
        }
    },

    _shiftDate(delta) {
        const d = new Date(App.getSelectedDate());
        d.setDate(d.getDate() + delta);
        App.setSelectedDate(App._localDateKey(d));
    },

    _openDatePicker() {
        const picker = document.getElementById('hidden-date-picker');
        if (!picker) return;
        picker.style.pointerEvents = 'auto';
        picker.onchange = (e) => {
            App.setSelectedDate(e.target.value);
            picker.style.pointerEvents = 'none';
        };
        try {
            picker.showPicker();
        } catch (e) {
            picker.focus();
            picker.click();
        }
    }
};
