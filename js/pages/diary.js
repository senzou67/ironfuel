const DiaryPage = {
    _scrollByDate: {}, // preserve scroll per-date

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

        // Detect empty day — no items in any meal
        const isEmpty = mealEntries.every(([, items]) => items.length === 0);

        const pctCal = goals.calories ? Math.min(100, Math.round((totals.calories / goals.calories) * 100)) : 0;

        content.innerHTML = `
            <div class="fade-in" style="padding-bottom:16px">
                <!-- DATE SELECTOR -->
                <div class="date-selector-bar">
                    <button class="date-nav-btn" onclick="DiaryPage._shiftDate(-1)" aria-label="Jour précédent" type="button">‹</button>
                    <button class="date-label-btn" onclick="DiaryPage._openDatePicker()" type="button" aria-label="Choisir une date">
                        <span>${dateLabel}</span>
                        <span class="date-chevron" aria-hidden="true">▾</span>
                    </button>
                    <button class="date-nav-btn" onclick="DiaryPage._shiftDate(1)" aria-label="Jour suivant" type="button">›</button>
                    <input type="date" id="hidden-date-picker" value="${dateKey}" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0">
                </div>

                <div class="card diary-summary">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
                        <div>
                            <div style="font-size:24px;font-weight:700;color:var(--primary)">${totals.calories}</div>
                            <div style="font-size:12px;color:var(--text-secondary)">/ ${goals.calories} kcal <span style="opacity:0.7">· ${pctCal}%</span></div>
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

                ${isEmpty ? `
                    <div class="empty-state">
                        <div class="empty-state-icon" aria-hidden="true">🍽️</div>
                        <div class="empty-state-text">Aucun aliment pour ${dateLabel}.<br>Commence par ajouter ton premier repas !</div>
                        <button type="button" class="btn btn-primary" onclick="App.navigate('search')">
                            + Ajouter un aliment
                        </button>
                    </div>
                ` : `
                    <div class="diary-grid">
                        <div>${mealsLeft.map(([type, items]) => MealCard.render(type, items)).join('')}</div>
                        <div>${mealsRight.map(([type, items]) => MealCard.render(type, items)).join('')}</div>
                    </div>
                `}
            </div>
        `;

        // Scroll restoration per date (or scroll-to-meal if requested)
        const scrollTarget = params.scrollTo || params.meal;
        if (scrollTarget) {
            const mealEl = document.getElementById('meal-' + scrollTarget) || document.getElementById('meal-section-' + scrollTarget);
            if (mealEl) {
                requestAnimationFrame(() => mealEl.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            }
        } else {
            // Restore previous scroll position for this date
            const saved = this._scrollByDate[dateKey];
            if (typeof saved === 'number') {
                requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: 'auto' }));
            }
        }

        // Track scroll position for this date (debounced)
        if (this._scrollHandler) window.removeEventListener('scroll', this._scrollHandler);
        let scrollRaf = 0;
        this._scrollHandler = () => {
            if (scrollRaf) return;
            scrollRaf = requestAnimationFrame(() => {
                this._scrollByDate[dateKey] = window.scrollY || window.pageYOffset || 0;
                scrollRaf = 0;
            });
        };
        window.addEventListener('scroll', this._scrollHandler, { passive: true });
    },

    cleanup() {
        if (this._scrollHandler) {
            window.removeEventListener('scroll', this._scrollHandler);
            this._scrollHandler = null;
        }
    },

    _shiftDate(delta) {
        const d = new Date(App.getSelectedDate());
        d.setDate(d.getDate() + delta);
        // Subtle transition: fade the content before swap
        const content = document.getElementById('page-content');
        if (content) {
            content.style.opacity = '0.35';
            content.style.transition = 'opacity 0.18s ease';
            setTimeout(() => {
                App.setSelectedDate(App._localDateKey(d));
                requestAnimationFrame(() => {
                    content.style.opacity = '';
                });
            }, 80);
        } else {
            App.setSelectedDate(App._localDateKey(d));
        }
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
