const Modal = {
    show(content, options = {}) {
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-handle"></div>
                ${content}
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => overlay.classList.add('show'));

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                Modal.close();
                if (options.onClose) options.onClose();
            }
        });

        // Swipe-down to close (drag the handle or top area)
        const modalContent = overlay.querySelector('.modal-content');
        const handle = overlay.querySelector('.modal-handle');
        if (modalContent && handle) {
            let startY = 0, currentY = 0, isDragging = false;

            const onStart = (e) => {
                // Allow drag from handle area (top 80px) — easier to reach the pull bar
                const touch = e.touches ? e.touches[0] : e;
                const rect = modalContent.getBoundingClientRect();
                if (touch.clientY - rect.top > 80) return;
                isDragging = true;
                startY = touch.clientY;
                currentY = 0;
                modalContent.style.transition = 'none';
            };

            const onMove = (e) => {
                if (!isDragging) return;
                const touch = e.touches ? e.touches[0] : e;
                currentY = Math.max(0, touch.clientY - startY);
                modalContent.style.transform = `translateY(${currentY}px)`;
                // Dim overlay proportionally
                overlay.style.background = `rgba(0,0,0,${0.5 * (1 - currentY / 400)})`;
            };

            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                modalContent.style.transition = 'transform 0.3s ease';
                if (currentY > 80) {
                    // Close
                    modalContent.style.transform = 'translateY(100%)';
                    setTimeout(() => {
                        Modal.close();
                        if (options.onClose) options.onClose();
                    }, 200);
                } else {
                    // Snap back
                    modalContent.style.transform = 'translateY(0)';
                    overlay.style.background = '';
                }
            };

            modalContent.addEventListener('touchstart', onStart, { passive: true });
            modalContent.addEventListener('touchmove', onMove, { passive: true });
            modalContent.addEventListener('touchend', onEnd);
            // Mouse support for desktop
            modalContent.addEventListener('mousedown', onStart);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);

            // Store cleanup references to avoid memory leak
            overlay._swipeCleanup = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onEnd);
            };
        }

        return overlay;
    },

    close() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            // Clean up document-level listeners to prevent memory leak
            if (overlay._swipeCleanup) overlay._swipeCleanup();
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    },

    // === WHEEL PICKER HELPER ===
    _renderWheelPicker(currentValue, id) {
        // Generate steps: 1-50 by 1, 50-200 by 5, 200-500 by 10, 500-2000 by 50
        const steps = [];
        for (let v = 1; v <= 50; v++) steps.push(v);
        for (let v = 55; v <= 200; v += 5) steps.push(v);
        for (let v = 210; v <= 500; v += 10) steps.push(v);
        for (let v = 550; v <= 2000; v += 50) steps.push(v);

        const items = steps.map(v => `<div class="wheel-picker-item" data-value="${v}">${v}</div>`).join('');

        return `
            <div class="wheel-picker-container" id="${id}-container">
                <div class="wheel-picker-mask wheel-picker-mask-top"></div>
                <div class="wheel-picker-highlight"></div>
                <div class="wheel-picker-unit">g</div>
                <div class="wheel-picker" id="${id}" data-current="${currentValue}">
                    ${items}
                </div>
                <div class="wheel-picker-mask wheel-picker-mask-bottom"></div>
            </div>
        `;
    },

    _initWheelPicker(id, onChange) {
        const picker = document.getElementById(id);
        if (!picker) return;

        const items = picker.querySelectorAll('.wheel-picker-item');
        const itemH = 40;
        const currentVal = parseInt(picker.dataset.current) || 100;

        // Find closest item to currentVal
        let closestIdx = 0;
        let closestDist = Infinity;
        items.forEach((item, i) => {
            const dist = Math.abs(parseInt(item.dataset.value) - currentVal);
            if (dist < closestDist) { closestDist = dist; closestIdx = i; }
        });

        // Scroll to the correct position (center the item)
        setTimeout(() => {
            picker.scrollTop = closestIdx * itemH;
            this._updateWheelActive(picker, itemH);
        }, 50);

        let scrollTimer;
        picker.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this._updateWheelActive(picker, itemH);
                const activeItem = picker.querySelector('.wheel-picker-item.active');
                if (activeItem && onChange) {
                    onChange(parseInt(activeItem.dataset.value));
                }
            }, 50);
        });
    },

    _updateWheelActive(picker, itemH) {
        const centerOffset = picker.scrollTop + picker.clientHeight / 2 - itemH / 2;
        const items = picker.querySelectorAll('.wheel-picker-item');
        items.forEach((item, i) => {
            const itemCenter = i * itemH + itemH / 2;
            const dist = Math.abs(centerOffset + itemH / 2 - itemCenter);
            if (dist < itemH / 2) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    // === FOOD MODAL (DB items) ===
    showFoodModal(food, options = {}) {
        const unitWeight = FoodDB.getUnitWeight(food);
        const grams = options.grams || unitWeight;
        const mealType = options.mealType || 'lunch';
        const nutrition = FoodDB.getNutrition(food, grams);
        const isFav = Storage.isFavorite(food.id);
        const isCustom = typeof food.id === 'string' && food.id.startsWith('custom_');
        const foodIdParam = isCustom ? `'${food.id}'` : food.id;
        const editMode = options.editMode || false;
        const entryId = options.entryId || null;

        this._currentUnitWeight = unitWeight;
        this._editMode = editMode;
        this._editEntryId = entryId;
        this._editMealType = mealType;

        const mealNames = {
            breakfast: 'Petit-d\u00e9jeuner',
            lunch: 'D\u00e9jeuner',
            dinner: 'D\u00eener',
            snack: 'Collation'
        };

        const btnText = editMode ? 'Modifier' : 'Ajouter au journal';
        const btnAction = editMode ? `Modal.updateFood(${foodIdParam})` : `Modal.addFood(${foodIdParam})`;

        const content = `
            <div class="modal-title" style="display:flex;align-items:center;justify-content:space-between">
                <span>${food.name}</span>
                <button onclick="Modal.toggleFav(${foodIdParam})" id="fav-btn" style="background:none;border:none;font-size:24px;cursor:pointer">
                    ${isFav ? '\u2B50' : '\u2606'}
                </button>
            </div>
            ${!editMode ? `
            <div class="form-group">
                <label class="form-label">Repas</label>
                <select class="form-select" id="modal-meal">
                    ${Object.entries(mealNames).map(([k, v]) =>
                        `<option value="${k}" ${k === mealType ? 'selected' : ''}>${v}</option>`
                    ).join('')}
                </select>
            </div>
            ` : '<input type="hidden" id="modal-meal" value="' + mealType + '">'}
            <div class="quantity-input">
                <label class="form-label">Quantit\u00e9</label>
                <div class="qty-row">
                    <button onclick="Modal.adjustQty(-1)">-</button>
                    <input type="number" id="modal-qty" value="${Math.max(1, Math.round(grams / unitWeight))}" min="1" max="50" step="0.01" oninput="Modal.updateFromQty(${foodIdParam})">
                    <span class="qty-label">x ${unitWeight}g = <span id="qty-total">${grams}g</span></span>
                    <button onclick="Modal.adjustQty(1)">+</button>
                </div>
            </div>
            <label class="form-label" style="margin-top:8px">Grammage</label>
            ${this._renderWheelPicker(grams, 'gram-wheel')}
            <input type="hidden" id="modal-grams" value="${grams}">
            <div class="nutrition-preview" id="modal-nutrition">
                <div class="nutrition-item cal">
                    <span class="nutrition-item-value" id="np-cal">${nutrition.calories}</span>
                    <span class="nutrition-item-label">Calories</span>
                </div>
                <div class="nutrition-item prot">
                    <span class="nutrition-item-value" id="np-prot">${nutrition.protein}g</span>
                    <span class="nutrition-item-label">Prot\u00e9ines</span>
                </div>
                <div class="nutrition-item carb">
                    <span class="nutrition-item-value" id="np-carb">${nutrition.carbs}g</span>
                    <span class="nutrition-item-label">Glucides</span>
                </div>
                <div class="nutrition-item fat">
                    <span class="nutrition-item-value" id="np-fat">${nutrition.fat}g</span>
                    <span class="nutrition-item-label">Lipides</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="${btnAction}">
                ${btnText}
            </button>
        `;

        this._currentFoodId = food.id;
        this.show(content);

        // Init wheel picker
        setTimeout(() => {
            this._initWheelPicker('gram-wheel', (val) => {
                document.getElementById('modal-grams').value = val;
                // Sync quantity field with wheel picker value
                const qtyEl = document.getElementById('modal-qty');
                const totalEl = document.getElementById('qty-total');
                if (qtyEl && this._currentUnitWeight) {
                    qtyEl.value = Math.round((val / this._currentUnitWeight) * 100) / 100;
                }
                if (totalEl) totalEl.textContent = val + 'g';
                this.updatePreview(food.id);
            });
        }, 100);
    },

    // === CUSTOM FOOD MODAL (AI/barcode/online) ===
    showCustomFoodModal(foodData, options = {}) {
        const mealType = options.mealType || 'lunch';
        const editMode = options.editMode || false;
        const entryId = options.entryId || null;

        this._editMode = editMode;
        this._editEntryId = entryId;
        this._editMealType = mealType;

        const mealNames = {
            breakfast: 'Petit-d\u00e9jeuner',
            lunch: 'D\u00e9jeuner',
            dinner: 'D\u00eener',
            snack: 'Collation'
        };

        const baseWeight = foodData.weight_g || 100;
        const btnText = editMode ? 'Modifier' : 'Ajouter au journal';
        const btnAction = editMode ? 'Modal.updateCustomFood()' : 'Modal.addCustomFood()';

        const content = `
            <div class="modal-title">${foodData.name}</div>
            ${foodData.weight_g && !editMode ? `<p style="color:var(--text-secondary);margin-bottom:12px">Poids estim\u00e9 : ${foodData.weight_g}g</p>` : ''}
            ${!editMode ? `
            <div class="form-group">
                <label class="form-label">Repas</label>
                <select class="form-select" id="modal-meal">
                    ${Object.entries(mealNames).map(([k, v]) =>
                        `<option value="${k}" ${k === mealType ? 'selected' : ''}>${v}</option>`
                    ).join('')}
                </select>
            </div>
            ` : '<input type="hidden" id="modal-meal" value="' + mealType + '">'}
            <label class="form-label">Grammage</label>
            ${this._renderWheelPicker(baseWeight, 'gram-wheel')}
            <input type="hidden" id="modal-grams" value="${baseWeight}">
            <div class="nutrition-preview" id="modal-nutrition">
                <div class="nutrition-item cal">
                    <span class="nutrition-item-value" id="np-cal">${foodData.calories}</span>
                    <span class="nutrition-item-label">Calories</span>
                </div>
                <div class="nutrition-item prot">
                    <span class="nutrition-item-value" id="np-prot">${foodData.protein}g</span>
                    <span class="nutrition-item-label">Proteines</span>
                </div>
                <div class="nutrition-item carb">
                    <span class="nutrition-item-value" id="np-carb">${foodData.carbs}g</span>
                    <span class="nutrition-item-label">Glucides</span>
                </div>
                <div class="nutrition-item fat">
                    <span class="nutrition-item-value" id="np-fat">${foodData.fat}g</span>
                    <span class="nutrition-item-label">Lipides</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="${btnAction}">
                ${btnText}
            </button>
        `;

        this._customFood = foodData;
        this._customBaseWeight = baseWeight;
        this.show(content);

        // Init wheel picker
        setTimeout(() => {
            this._initWheelPicker('gram-wheel', (val) => {
                document.getElementById('modal-grams').value = val;
                this.updateCustomPreview();
            });
        }, 100);
    },

    // === QUANTITY ADJUSTERS ===
    adjustQty(delta) {
        const input = document.getElementById('modal-qty');
        if (!input) return;
        let val = parseFloat(input.value) + delta;
        if (val < 1) val = 1;
        if (val > 50) val = 50;
        input.value = val;
        this.updateFromQty(this._currentFoodId);
    },

    updateFromQty(foodId) {
        const qty = parseFloat(document.getElementById('modal-qty').value) || 1;
        const grams = Math.round(qty * this._currentUnitWeight);
        document.getElementById('modal-grams').value = grams;
        const totalEl = document.getElementById('qty-total');
        if (totalEl) totalEl.textContent = grams + 'g';
        // Sync wheel picker position
        this._scrollWheelTo('gram-wheel', grams);
        this.updatePreview(foodId);
    },

    _scrollWheelTo(id, value) {
        const picker = document.getElementById(id);
        if (!picker) return;
        const items = picker.querySelectorAll('.wheel-picker-item');
        let closestIdx = 0, closestDist = Infinity;
        items.forEach((item, i) => {
            const dist = Math.abs(parseInt(item.dataset.value) - value);
            if (dist < closestDist) { closestDist = dist; closestIdx = i; }
        });
        picker.scrollTo({ top: closestIdx * 40, behavior: 'smooth' });
    },

    adjustCustomQty(delta) {
        const input = document.getElementById('modal-custom-qty');
        if (!input) return;
        let val = parseFloat(input.value) + delta;
        if (val < 1) val = 1;
        if (val > 50) val = 50;
        input.value = val;
        this.updateFromCustomQty();
    },

    updateFromCustomQty() {
        const qty = parseFloat(document.getElementById('modal-custom-qty').value) || 1;
        const grams = Math.round(qty * this._customBaseWeight);
        document.getElementById('modal-grams').value = grams;
        const totalEl = document.getElementById('qty-total');
        if (totalEl) totalEl.textContent = grams + 'g';
        this.updateCustomPreview();
    },

    adjustGrams(delta) {
        const input = document.getElementById('modal-grams');
        if (!input) return;
        let val = parseInt(input.value) + delta;
        if (val < 1) val = 1;
        if (val > 2000) val = 2000;
        input.value = val;
        this.updatePreview(this._currentFoodId);
    },

    adjustCustomGrams(delta) {
        const input = document.getElementById('modal-grams');
        if (!input) return;
        let val = parseInt(input.value) + delta;
        if (val < 1) val = 1;
        if (val > 2000) val = 2000;
        input.value = val;
        this.updateCustomPreview();
    },

    updatePreview(foodId) {
        const food = FoodDB.getById(foodId);
        if (!food) return;
        const grams = parseInt(document.getElementById('modal-grams').value) || 100;
        const n = FoodDB.getNutrition(food, grams);
        document.getElementById('np-cal').textContent = n.calories;
        document.getElementById('np-prot').textContent = n.protein + 'g';
        document.getElementById('np-carb').textContent = n.carbs + 'g';
        document.getElementById('np-fat').textContent = n.fat + 'g';
    },

    updateCustomPreview() {
        if (!this._customFood) return;
        const grams = parseInt(document.getElementById('modal-grams').value) || 100;
        const ratio = grams / this._customBaseWeight;
        document.getElementById('np-cal').textContent = Math.round(this._customFood.calories * ratio);
        document.getElementById('np-prot').textContent = Math.round(this._customFood.protein * ratio * 10) / 10 + 'g';
        document.getElementById('np-carb').textContent = Math.round(this._customFood.carbs * ratio * 10) / 10 + 'g';
        document.getElementById('np-fat').textContent = Math.round(this._customFood.fat * ratio * 10) / 10 + 'g';
    },

    toggleFav(foodId) {
        const isFav = Storage.toggleFavorite(foodId);
        const btn = document.getElementById('fav-btn');
        if (btn) btn.textContent = isFav ? '\u2B50' : '\u2606';
    },

    // === ADD FOOD ===
    addFood(foodId) {
        const food = FoodDB.getById(foodId);
        if (!food) return;
        const grams = parseInt(document.getElementById('modal-grams').value) || 100;
        const mealType = document.getElementById('modal-meal').value;
        const n = FoodDB.getNutrition(food, grams);

        Storage.addFoodToMeal(mealType, {
            foodId: food.id,
            name: food.name,
            grams,
            calories: n.calories,
            protein: n.protein,
            carbs: n.carbs,
            fat: n.fat,
            fiber: n.fiber
        });

        Storage.addRecent(food.id);
        Storage.trackFoodUsage(food.id, mealType);

        // IronCoins: +5 per food added
        Storage.addCoins(5);
        this._checkCalorieBonus();

        this.close();
        App.showSuccessCheck();
        App.showToast(`${food.name} ajouté ! +5 \uD83E\uDE99`);

        if (App.currentPage === 'dashboard' || App.currentPage === 'diary') {
            App.navigate(App.currentPage);
        }
    },

    // === UPDATE FOOD (edit mode) ===
    updateFood(foodId) {
        const food = FoodDB.getById(foodId);
        if (!food) return;
        const grams = parseInt(document.getElementById('modal-grams').value) || 100;
        const n = FoodDB.getNutrition(food, grams);

        Storage.updateFoodInMeal(this._editMealType, this._editEntryId, {
            grams,
            calories: n.calories,
            protein: n.protein,
            carbs: n.carbs,
            fat: n.fat,
            fiber: n.fiber
        });

        this.close();
        App.showToast(`${food.name} modifié !`);

        if (App.currentPage === 'dashboard' || App.currentPage === 'diary') {
            App.navigate(App.currentPage);
        }
    },

    // === ADD CUSTOM FOOD ===
    addCustomFood() {
        if (!this._customFood) return;
        const grams = parseInt(document.getElementById('modal-grams').value) || 100;
        const mealType = document.getElementById('modal-meal').value;
        const ratio = grams / this._customBaseWeight;

        Storage.addFoodToMeal(mealType, {
            name: this._customFood.name,
            grams,
            calories: Math.round(this._customFood.calories * ratio),
            protein: Math.round(this._customFood.protein * ratio * 10) / 10,
            carbs: Math.round(this._customFood.carbs * ratio * 10) / 10,
            fat: Math.round(this._customFood.fat * ratio * 10) / 10,
            fiber: Math.round((this._customFood.fiber || 0) * ratio * 10) / 10
        });

        Storage.trackFoodUsage(this._customFood.name, mealType);

        // IronCoins: +5 per food added
        Storage.addCoins(5);
        this._checkCalorieBonus();

        this.close();
        App.showSuccessCheck();
        App.showToast(`${this._customFood.name} ajouté ! +5 \uD83E\uDE99`);

        if (App.currentPage === 'dashboard' || App.currentPage === 'diary') {
            App.navigate(App.currentPage);
        }
    },

    // === UPDATE CUSTOM FOOD (edit mode) ===
    updateCustomFood() {
        if (!this._customFood) return;
        const grams = parseInt(document.getElementById('modal-grams').value) || 100;
        const ratio = grams / this._customBaseWeight;

        Storage.updateFoodInMeal(this._editMealType, this._editEntryId, {
            grams,
            calories: Math.round(this._customFood.calories * ratio),
            protein: Math.round(this._customFood.protein * ratio * 10) / 10,
            carbs: Math.round(this._customFood.carbs * ratio * 10) / 10,
            fat: Math.round(this._customFood.fat * ratio * 10) / 10,
            fiber: Math.round((this._customFood.fiber || 0) * ratio * 10) / 10
        });

        this.close();
        App.showToast(`${this._customFood.name} modifié !`);

        if (App.currentPage === 'dashboard' || App.currentPage === 'diary') {
            App.navigate(App.currentPage);
        }
    },

    _checkCalorieBonus() {
        if (Storage.hasDailyCalorieBonus()) return;
        const goals = Storage.getGoals();
        const totals = Storage.getDayTotals();
        if (totals.calories >= goals.calories * 0.85 && totals.calories <= goals.calories * 1.15) {
            Storage.setDailyCalorieBonus();
            Storage.addCoins(10);
            setTimeout(() => App.showToast('Objectif calories atteint ! +10 \uD83E\uDE99'), 1500);
        }
    }
};
