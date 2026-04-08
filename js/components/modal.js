const Modal = {
    // Common portion sizes for intuitive selection
    PORTIONS: {
        // Fruits
        'banane': [{label:'Petite',g:90},{label:'Moyenne',g:120},{label:'Grande',g:150}],
        'pomme': [{label:'Petite',g:130},{label:'Moyenne',g:180},{label:'Grande',g:220}],
        'orange': [{label:'Petite',g:130},{label:'Moyenne',g:180},{label:'Grande',g:250}],
        'fraise': [{label:'Barquette',g:250},{label:'Poignée',g:100}],
        'raisin': [{label:'Grappe',g:150},{label:'Poignée',g:75}],
        'kiwi': [{label:'1 kiwi',g:75},{label:'2 kiwis',g:150}],
        'poire': [{label:'Petite',g:140},{label:'Moyenne',g:180}],
        'mangue': [{label:'1/2',g:150},{label:'1 entière',g:300}],
        'avocat': [{label:'1/2',g:75},{label:'1 entier',g:150}],
        // Pain & céréales
        'pain': [{label:'1 tranche',g:30},{label:'2 tranches',g:60},{label:'1/4 baguette',g:65}],
        'baguette': [{label:'1/4',g:65},{label:'1/2',g:125},{label:'Entière',g:250}],
        'pain de mie': [{label:'1 tranche',g:25},{label:'2 tranches',g:50}],
        'riz': [{label:'Petite portion',g:150},{label:'Moyenne',g:200},{label:'Grande',g:300}],
        'pâtes': [{label:'Petite portion',g:150},{label:'Moyenne',g:200},{label:'Grande',g:300}],
        'spaghetti': [{label:'Petite',g:150},{label:'Moyenne',g:200},{label:'Grande',g:300}],
        'flocons d\'avoine': [{label:'30g',g:30},{label:'50g',g:50},{label:'80g',g:80}],
        'muesli': [{label:'30g',g:30},{label:'50g',g:50}],
        'céréales': [{label:'30g',g:30},{label:'50g',g:50}],
        // Protéines
        'poulet': [{label:'1 filet',g:130},{label:'2 filets',g:260},{label:'Cuisse',g:180}],
        'blanc de poulet': [{label:'1 filet',g:130},{label:'2 filets',g:260}],
        'steak': [{label:'Petit',g:100},{label:'Moyen',g:150},{label:'Grand',g:200}],
        'saumon': [{label:'1 pavé',g:130},{label:'Grand pavé',g:180}],
        'thon': [{label:'1 boîte',g:80},{label:'1 pavé',g:150}],
        'oeuf': [{label:'1 oeuf',g:60},{label:'2 oeufs',g:120},{label:'3 oeufs',g:180}],
        'oeufs': [{label:'1',g:60},{label:'2',g:120},{label:'3',g:180}],
        'jambon': [{label:'1 tranche',g:30},{label:'2 tranches',g:60}],
        'whey': [{label:'1 scoop',g:30},{label:'2 scoops',g:60}],
        // Produits laitiers
        'lait': [{label:'1 verre',g:200},{label:'1 bol',g:300}],
        'yaourt': [{label:'1 pot',g:125},{label:'Yaourt grec',g:170}],
        'fromage': [{label:'1 portion',g:30},{label:'2 portions',g:60}],
        'beurre': [{label:'1 noix',g:10},{label:'1 tartine',g:15}],
        'beurre de cacahuète': [{label:'1 c. à soupe',g:15},{label:'2 c. à soupe',g:30}],
        'beurre de cacahuètes': [{label:'1 c. à soupe',g:15},{label:'2 c. à soupe',g:30}],
        'miel': [{label:'1 c. à café',g:10},{label:'1 c. à soupe',g:20}],
        // Légumes
        'tomate': [{label:'Petite',g:80},{label:'Moyenne',g:120},{label:'Grande',g:180}],
        'salade': [{label:'Petite',g:50},{label:'Grande',g:100}],
        'carotte': [{label:'1 carotte',g:80},{label:'2 carottes',g:160}],
        'poivron': [{label:'1/2',g:80},{label:'1 entier',g:160}],
        'courgette': [{label:'Petite',g:150},{label:'Moyenne',g:200}],
        'brocoli': [{label:'Portion',g:150},{label:'Grande',g:250}],
        'épinards': [{label:'Portion',g:100},{label:'Grande',g:200}],
        'haricots verts': [{label:'Portion',g:150},{label:'Grande',g:250}],
        'pomme de terre': [{label:'Petite',g:100},{label:'Moyenne',g:170},{label:'Grande',g:250}],
        'patate douce': [{label:'Petite',g:130},{label:'Moyenne',g:200}],
        // Autres
        'huile d\'olive': [{label:'1 c. à soupe',g:10},{label:'2 c. à soupe',g:20}],
        'chocolat': [{label:'2 carrés',g:20},{label:'4 carrés',g:40},{label:'1/2 tablette',g:50}],
        'amandes': [{label:'Poignée',g:20},{label:'Grande poignée',g:40}],
        'noix': [{label:'Poignée',g:20},{label:'Grande poignée',g:40}],
    },

    _getPortions(foodName) {
        if (!foodName) return null;
        const name = foodName.toLowerCase().trim();
        // Exact match
        if (this.PORTIONS[name]) return this.PORTIONS[name];
        // Partial match
        for (const [key, portions] of Object.entries(this.PORTIONS)) {
            if (name.includes(key) || key.includes(name)) return portions;
        }
        // Check user's saved portion preference
        const saved = Storage._get('portion_prefs', {});
        if (saved[name]) return [{ label: 'Ma portion', g: saved[name] }];
        return null;
    },

    _renderPortionButtons(foodName, currentGrams) {
        const portions = this._getPortions(foodName);
        if (!portions) return '';
        return `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">${portions.map(p =>
            `<button onclick="Modal._selectPortion(${p.g})" style="padding:6px 12px;border:1.5px solid ${p.g === currentGrams ? 'var(--primary)' : 'var(--border)'};border-radius:20px;background:${p.g === currentGrams ? 'var(--primary-light)' : 'transparent'};color:${p.g === currentGrams ? 'var(--primary)' : 'var(--text)'};font-size:12px;font-weight:600;cursor:pointer">${p.label} <span style="opacity:0.6">${p.g}g</span></button>`
        ).join('')}</div>`;
    },

    _onDirectInput(pickerId, val) {
        const grams = parseInt(val) || 1;
        const slider = document.getElementById(pickerId);
        if (slider) slider.value = Math.min(grams, 500);
        const input = document.getElementById('modal-grams');
        if (input) input.value = grams;
        const qtyEl = document.getElementById('modal-qty');
        const totalEl = document.getElementById('qty-total');
        if (qtyEl && this._currentUnitWeight) {
            qtyEl.value = Math.round((grams / this._currentUnitWeight) * 100) / 100;
        }
        if (totalEl) totalEl.textContent = grams + 'g';
        if (this._currentFoodId) this.updatePreview(this._currentFoodId);
        else this.updateCustomPreview();
    },

    _selectPortion(grams) {
        const input = document.getElementById('modal-grams');
        if (input) input.value = grams;
        const direct = document.getElementById('gram-wheel-direct');
        if (direct) direct.value = grams;
        const slider = document.getElementById('gram-wheel');
        if (slider) slider.value = Math.min(grams, 500);
        const qtyInput = document.getElementById('modal-qty');
        if (qtyInput && this._currentUnitWeight) {
            qtyInput.value = Math.round((grams / this._currentUnitWeight) * 100) / 100;
        }
        const totalEl = document.getElementById('qty-total');
        if (totalEl) totalEl.textContent = grams + 'g';
        if (this._currentFoodId) this.updatePreview(this._currentFoodId);
        else this.updateCustomPreview();
    },

    _savePortionPref(foodName, grams) {
        if (!foodName) return;
        const prefs = Storage._get('portion_prefs', {});
        prefs[foodName.toLowerCase().trim()] = grams;
        Storage._set('portion_prefs', prefs);
    },

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

        // Force-restart SVG animations (WebKit/iOS bug: animations don't start in innerHTML-injected SVGs)
        requestAnimationFrame(() => {
            overlay.querySelectorAll('svg').forEach(svg => {
                const parent = svg.parentNode;
                if (parent) {
                    const clone = svg.cloneNode(true);
                    parent.replaceChild(clone, svg);
                }
            });
        });

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
        return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0">
                <input type="range" id="${id}" min="1" max="500" value="${currentValue}" style="flex:1;accent-color:var(--primary)" oninput="Modal._onSliderChange('${id}',this.value)">
                <input type="number" id="${id}-direct" value="${currentValue}" min="1" max="2000" style="width:65px;padding:8px;text-align:center;font-size:16px;font-weight:700;border:1.5px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text)" oninput="Modal._onDirectInput('${id}',this.value)">
                <span style="font-size:11px;color:var(--text-secondary)">g</span>
            </div>
        `;
    },

    _onSliderChange(id, val) {
        const grams = parseInt(val) || 1;
        const direct = document.getElementById(id + '-direct');
        if (direct) direct.value = grams;
        const input = document.getElementById('modal-grams');
        if (input) input.value = grams;
        const qtyEl = document.getElementById('modal-qty');
        const totalEl = document.getElementById('qty-total');
        if (qtyEl && this._currentUnitWeight) {
            qtyEl.value = Math.round((grams / this._currentUnitWeight) * 100) / 100;
        }
        if (totalEl) totalEl.textContent = grams + 'g';
        // Update nutrition
        if (this._currentFoodId) this.updatePreview(this._currentFoodId);
        else this.updateCustomPreview();
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
                if (this._programmaticScroll) return;
                this._updateWheelActive(picker, itemH);
                const activeItem = picker.querySelector('.wheel-picker-item.active');
                if (activeItem && onChange) {
                    onChange(parseInt(activeItem.dataset.value));
                }
            }, 150);
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
        this._dateStr = options.dateStr || null;

        const mealNames = {};
        Storage.getMeals().forEach(m => mealNames[m.id] = m.name);

        const isRecipeMode = typeof SearchPage !== 'undefined' && !!SearchPage._recipeMode;
        const recipeName = isRecipeMode ? (Storage.getRecipes().find(r => r.id === SearchPage._recipeMode)?.name || 'recette') : '';
        const btnText = editMode ? 'Modifier' : isRecipeMode ? `Ajouter à "${recipeName}"` : 'Ajouter au journal';
        const btnAction = editMode ? `Modal.updateFood(${foodIdParam})` : `Modal.addFood(${foodIdParam})`;

        const content = `
            <div class="modal-title" style="display:flex;align-items:center;justify-content:space-between">
                <span>${food.name}</span>
                <button onclick="Modal.toggleFav(${foodIdParam})" id="fav-btn" style="background:none;border:none;font-size:24px;cursor:pointer">
                    ${isFav ? '\u2B50' : '\u2606'}
                </button>
            </div>
            ${!editMode && !isRecipeMode ? `
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
            <label class="form-label" style="margin-top:8px">Portion</label>
            ${this._renderPortionButtons(food.name, grams)}
            <details style="margin-bottom:4px">
                <summary style="font-size:12px;color:var(--text-secondary);cursor:pointer;margin-bottom:4px">Grammage précis</summary>
                ${this._renderWheelPicker(grams, 'gram-wheel')}
            </details>
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
                <div class="nutrition-item fiber">
                    <span class="nutrition-item-value" id="np-fiber">${nutrition.fiber || 0}g</span>
                    <span class="nutrition-item-label">Fibres</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="${btnAction}">
                ${btnText}
            </button>
        `;

        this._currentFoodId = food.id;
        this.show(content);

        // Init slider sync
        setTimeout(() => {
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
        this._dateStr = options.dateStr || null;

        const mealNames = {};
        Storage.getMeals().forEach(m => mealNames[m.id] = m.name);

        const baseWeight = foodData.weight_g || 100;
        const isRecipeMode = typeof SearchPage !== 'undefined' && !!SearchPage._recipeMode;
        const recipeName = isRecipeMode ? (Storage.getRecipes().find(r => r.id === SearchPage._recipeMode)?.name || 'recette') : '';
        const btnText = editMode ? 'Modifier' : isRecipeMode ? `Ajouter à "${recipeName}"` : 'Ajouter au journal';
        const btnAction = editMode ? 'Modal.updateCustomFood()' : 'Modal.addCustomFood()';

        const content = `
            <div class="modal-title">${foodData.name}</div>
            ${foodData.weight_g && !editMode ? `<p style="color:var(--text-secondary);margin-bottom:12px">Poids estim\u00e9 : ${foodData.weight_g}g</p>` : ''}
            ${!editMode && !isRecipeMode ? `
            <div class="form-group">
                <label class="form-label">Repas</label>
                <select class="form-select" id="modal-meal">
                    ${Object.entries(mealNames).map(([k, v]) =>
                        `<option value="${k}" ${k === mealType ? 'selected' : ''}>${v}</option>`
                    ).join('')}
                </select>
            </div>
            ` : '<input type="hidden" id="modal-meal" value="' + mealType + '">'}
            <label class="form-label">Portion</label>
            ${this._renderPortionButtons(foodData.name, baseWeight)}
            <details style="margin-bottom:4px">
                <summary style="font-size:12px;color:var(--text-secondary);cursor:pointer;margin-bottom:4px">Grammage précis</summary>
                ${this._renderWheelPicker(baseWeight, 'gram-wheel')}
            </details>
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
                <div class="nutrition-item fiber">
                    <span class="nutrition-item-value" id="np-fiber">${foodData.fiber || 0}g</span>
                    <span class="nutrition-item-label">Fibres</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="${btnAction}">
                ${btnText}
            </button>
        `;

        this._customFood = foodData;
        this._customBaseWeight = baseWeight;
        this.show(content);

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
        const directEl = document.getElementById('gram-wheel-direct');
        if (directEl) directEl.value = grams;
        const slider = document.getElementById('gram-wheel');
        if (slider) slider.value = Math.min(grams, 500);
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
        this._programmaticScroll = true;
        picker.scrollTo({ top: closestIdx * 40, behavior: 'smooth' });
        setTimeout(() => { this._programmaticScroll = false; }, 400);
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
        const fiberEl = document.getElementById('np-fiber');
        if (fiberEl) fiberEl.textContent = (n.fiber || 0) + 'g';
    },

    updateCustomPreview() {
        if (!this._customFood) return;
        const grams = parseInt(document.getElementById('modal-grams').value) || 100;
        const ratio = grams / this._customBaseWeight;
        document.getElementById('np-cal').textContent = Math.round(this._customFood.calories * ratio);
        document.getElementById('np-prot').textContent = Math.round(this._customFood.protein * ratio * 10) / 10 + 'g';
        document.getElementById('np-carb').textContent = Math.round(this._customFood.carbs * ratio * 10) / 10 + 'g';
        document.getElementById('np-fat').textContent = Math.round(this._customFood.fat * ratio * 10) / 10 + 'g';
        const fiberEl = document.getElementById('np-fiber');
        if (fiberEl) fiberEl.textContent = Math.round((this._customFood.fiber || 0) * ratio * 10) / 10 + 'g';
    },

    toggleFav(foodId) {
        const isFav = Storage.toggleFavorite(foodId);
        const btn = document.getElementById('fav-btn');
        if (btn) btn.textContent = isFav ? '\u2B50' : '\u2606';
    },

    _getModalDate() {
        if (this._dateStr) {
            const p = this._dateStr.split('-');
            return new Date(p[0], p[1] - 1, p[2]);
        }
        return App.selectedDate || undefined;
    },

    _isModalToday() {
        if (this._dateStr) {
            return this._dateStr === App._localDateKey(new Date());
        }
        return App.isToday();
    },

    // === ADD FOOD ===
    addFood(foodId) {
        const food = FoodDB.getById(foodId);
        if (!food) return;
        const grams = parseInt(document.getElementById('modal-grams').value) || 100;
        const mealType = document.getElementById('modal-meal').value;
        try { localStorage.setItem('onefood_last_meal', mealType); } catch {}
        const n = FoodDB.getNutrition(food, grams);

        // If in recipe mode, add to recipe instead of meal
        if (typeof SearchPage !== 'undefined' && SearchPage._recipeMode) {
            SearchPage._addFoodToRecipe(food, grams);
            this.close();
            return;
        }

        const date = this._getModalDate();
        Storage.addFoodToMeal(mealType, {
            foodId: food.id,
            name: food.name,
            grams,
            calories: n.calories,
            protein: n.protein,
            carbs: n.carbs,
            fat: n.fat,
            fiber: n.fiber
        }, date);

        Storage.addRecent(food.id);
        Storage.trackFoodUsage(food.id, mealType);

        // IronCoins: +5 per food added (only for today)
        if (this._isModalToday()) {
            Storage.addCoins(5);
            this._checkCalorieBonus();
        }

        this.close();
        App.showSuccessCheck();
        App.showToast(`${food.name} ajouté !${this._isModalToday() ? ' +5 \uD83E\uDE99' : ''}`);

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
        }, this._getModalDate());

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
        const ratio = grams / this._customBaseWeight;

        // If in recipe mode, add to recipe
        if (typeof SearchPage !== 'undefined' && SearchPage._recipeMode) {
            const recipe = Storage.getRecipes().find(r => r.id === SearchPage._recipeMode);
            if (recipe) {
                recipe.items.push({
                    name: this._customFood.name,
                    grams,
                    calories: Math.round(this._customFood.calories * ratio),
                    protein: Math.round(this._customFood.protein * ratio * 10) / 10,
                    carbs: Math.round(this._customFood.carbs * ratio * 10) / 10,
                    fat: Math.round(this._customFood.fat * ratio * 10) / 10,
                    fiber: Math.round((this._customFood.fiber || 0) * ratio * 10) / 10,
                });
                Storage.saveRecipe(recipe);
                App.showToast(`✓ ${this._customFood.name} ajouté à "${recipe.name}"`);
                this.close();
                SearchPage.render();
                return;
            }
        }

        const mealType = document.getElementById('modal-meal')?.value || Storage.getCurrentMealType();
        try { localStorage.setItem('onefood_last_meal', mealType); } catch {}

        Storage.addFoodToMeal(mealType, {
            name: this._customFood.name,
            grams,
            calories: Math.round(this._customFood.calories * ratio),
            protein: Math.round(this._customFood.protein * ratio * 10) / 10,
            carbs: Math.round(this._customFood.carbs * ratio * 10) / 10,
            fat: Math.round(this._customFood.fat * ratio * 10) / 10,
            fiber: Math.round((this._customFood.fiber || 0) * ratio * 10) / 10,
            barcode: this._customFood.barcode || null,
            source: this._customFood.source || 'custom',
            micros: this._customFood.micros ? Object.fromEntries(
                Object.entries(this._customFood.micros).map(([k, v]) => [k, Math.round((v || 0) * ratio * 10) / 10])
            ) : null
        }, this._getModalDate());

        Storage.trackFoodUsage(this._customFood.name, mealType);

        // IronCoins: +5 per food added (only for today)
        if (this._isModalToday()) {
            Storage.addCoins(5);
            this._checkCalorieBonus();
        }

        this.close();
        App.showSuccessCheck();
        App.showToast(`${this._customFood.name} ajouté !${this._isModalToday() ? ' +5 \uD83E\uDE99' : ''}`);

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
        }, this._getModalDate());

        this.close();
        App.showToast(`${this._customFood.name} modifié !`);

        if (App.currentPage === 'dashboard' || App.currentPage === 'diary') {
            App.navigate(App.currentPage);
        }
    },

    _checkCalorieBonus() {
        if (!this._isModalToday()) return;
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
