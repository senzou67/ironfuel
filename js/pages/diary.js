const DiaryPage = {
    render(params = {}) {
        const log = Storage.getDayLog();
        const totals = Storage.getDayTotals();
        const goals = Storage.getGoals();

        const content = document.getElementById('page-content');
        const mealEntries = Object.entries(log.meals);
        const midpoint = Math.ceil(mealEntries.length / 2);
        const mealsLeft = mealEntries.slice(0, midpoint);
        const mealsRight = mealEntries.slice(midpoint);

        content.innerHTML = `
            <div class="fade-in" style="padding-bottom:16px">
                <div class="card diary-summary">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <div>
                            <div style="font-size:24px;font-weight:700;color:var(--primary)">${totals.calories}</div>
                            <div style="font-size:12px;color:var(--text-secondary)">/ ${goals.calories} kcal</div>
                        </div>
                        <div class="nutrition-preview" style="margin:0;flex:1;max-width:280px">
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
        if (params.scrollTo) {
            const mealEl = document.getElementById('meal-' + params.scrollTo);
            if (mealEl) {
                setTimeout(() => mealEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }
        }
    }
};
