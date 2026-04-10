// ===== CHAT IA — Describe what you ate and AI detects foods =====
const ChatPage = {
    _results: [],
    _loading: false,

    render() {
        const content = document.getElementById('page-content');
        const mealType = Storage.getCurrentMealType();
        const meals = Storage.getMeals();
        const mealName = meals.find(m => m.id === mealType)?.name || mealType;

        content.innerHTML = `
            <div class="chat-container fade-in" style="padding:0 16px 16px">
                <div class="card" style="padding:14px 16px;margin-bottom:12px">
                    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">
                        Décris ce que tu as mangé, l'IA détecte les aliments et quantités.
                    </div>
                    <div style="display:flex;gap:8px;align-items:stretch">
                        <textarea id="chat-input" placeholder="Ex: un poulet grillé avec du riz et une salade..."
                            style="flex:1;min-height:60px;font-size:15px;font-weight:500;padding:12px;border:1.5px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);resize:none;font-family:inherit"
                            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();ChatPage.analyze()}"></textarea>
                        <button id="chat-send-btn" class="btn btn-primary" onclick="ChatPage.analyze()"
                            style="flex:0 0 48px;width:48px;border-radius:12px;font-size:20px;display:flex;align-items:center;justify-content:center;padding:0">➤</button>
                    </div>
                </div>

                <div id="chat-results"></div>

                <div id="chat-meal-select" class="card" style="padding:14px 16px;display:none">
                    <div style="font-size:13px;font-weight:700;margin-bottom:8px">Ajouter au repas :</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px">
                        ${meals.map(m => `
                            <button class="btn ${m.id === mealType ? 'btn-primary' : 'btn-outline'}" onclick="ChatPage._selectMeal('${m.id}')" data-meal="${m.id}"
                                style="padding:6px 12px;font-size:12px;border-radius:20px">${m.icon} ${m.name}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    _selectedMeal: null,

    _selectMeal(mealId) {
        this._selectedMeal = mealId;
        document.querySelectorAll('[data-meal]').forEach(b => {
            b.className = b.dataset.meal === mealId ? 'btn btn-primary' : 'btn btn-outline';
        });
    },

    async analyze() {
        const input = document.getElementById('chat-input');
        const text = input?.value?.trim();
        if (!text) { App.showToast('Décris ce que tu as mangé'); return; }
        if (this._loading) return;
        // Filter suspicious input
        if (Storage._BANNED_WORDS && Storage._BANNED_WORDS.some(w => text.toLowerCase().includes(w))) {
            App.showToast('Contenu inapproprié détecté'); return;
        }

        this._loading = true;
        this._selectedMeal = this._selectedMeal || Storage.getCurrentMealType();
        const resultsEl = document.getElementById('chat-results');
        const sendBtn = document.getElementById('chat-send-btn');
        if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '⏳'; }

        resultsEl.innerHTML = `
            <div class="card" style="padding:20px;text-align:center">
                <div style="font-size:32px;margin-bottom:8px;animation:creature-bounce 0.8s ease infinite">🤖</div>
                <div style="font-size:13px;color:var(--text-secondary)">Analyse en cours...</div>
            </div>
        `;

        try {
            const user = typeof AuthService !== 'undefined' ? AuthService.getCurrentUser() : null;
            const headers = { 'Content-Type': 'application/json' };
            if (user) { try { headers['Authorization'] = 'Bearer ' + await user.getIdToken(); } catch {} }

            const res = await fetch('/api/analyze-text', {
                method: 'POST',
                headers,
                body: JSON.stringify({ text })
            });

            const data = await res.json();
            if (!res.ok || !data.foods || data.foods.length === 0) {
                resultsEl.innerHTML = `
                    <div class="card" style="padding:20px;text-align:center">
                        <div style="font-size:32px;margin-bottom:8px">🤔</div>
                        <div style="font-size:13px;color:var(--text-secondary)">${data.error || 'Aucun aliment détecté. Essaie avec plus de détails.'}</div>
                    </div>
                `;
                return;
            }

            this._results = data.foods;
            this._renderResults();

            // Show meal selector
            const mealSelect = document.getElementById('chat-meal-select');
            if (mealSelect) mealSelect.style.display = '';

        } catch (err) {
            resultsEl.innerHTML = `
                <div class="card" style="padding:20px;text-align:center">
                    <div style="font-size:32px;margin-bottom:8px">❌</div>
                    <div style="font-size:13px;color:var(--danger)">${err.message || 'Erreur réseau'}</div>
                </div>
            `;
        } finally {
            this._loading = false;
            if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '➤'; }
        }
    },

    _renderResults() {
        const resultsEl = document.getElementById('chat-results');
        if (!resultsEl) return;

        resultsEl.innerHTML = this._results.map((food, i) => `
            <div class="card" style="padding:12px 16px;margin-bottom:8px" id="chat-food-${i}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                    <div style="flex:1">
                        <div style="font-size:15px;font-weight:700">${_esc(food.name)}</div>
                        <div style="font-size:12px;color:var(--text-secondary)">~${food.weight_g}g ${food.source === 'usda' ? '<span style="color:var(--success);font-weight:600">USDA</span>' : food.source === 'openfoodfacts' ? '<span style="color:var(--success);font-weight:600">OFF</span>' : '<span style="opacity:0.6">estimé</span>'}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px">
                        <input type="number" value="${food.weight_g}" min="1" max="2000" style="width:60px;padding:6px 8px;text-align:center;font-size:14px;font-weight:600;border:1.5px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text)"
                            onchange="ChatPage._updateWeight(${i},this.value)" id="chat-weight-${i}">
                        <span style="font-size:12px;color:var(--text-secondary)">g</span>
                    </div>
                </div>
                <div class="nutrition-preview" style="margin:8px 0;grid-template-columns:repeat(5,1fr);gap:4px">
                    <div class="nutrition-item cal" style="padding:6px 4px">
                        <span class="nutrition-item-value" style="font-size:14px" id="chat-cal-${i}">${food.calories}</span>
                        <span class="nutrition-item-label">kcal</span>
                    </div>
                    <div class="nutrition-item prot" style="padding:6px 4px">
                        <span class="nutrition-item-value" style="font-size:14px" id="chat-prot-${i}">${food.protein}g</span>
                        <span class="nutrition-item-label">Prot.</span>
                    </div>
                    <div class="nutrition-item carb" style="padding:6px 4px">
                        <span class="nutrition-item-value" style="font-size:14px" id="chat-carbs-${i}">${food.carbs}g</span>
                        <span class="nutrition-item-label">Gluc.</span>
                    </div>
                    <div class="nutrition-item fat" style="padding:6px 4px">
                        <span class="nutrition-item-value" style="font-size:14px" id="chat-fat-${i}">${food.fat}g</span>
                        <span class="nutrition-item-label">Lip.</span>
                    </div>
                    <div class="nutrition-item fiber" style="padding:6px 4px">
                        <span class="nutrition-item-value" style="font-size:14px" id="chat-fiber-${i}">${food.fiber || 0}g</span>
                        <span class="nutrition-item-label">Fib.</span>
                    </div>
                </div>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-primary" onclick="ChatPage._addFood(${i})" style="flex:1;padding:8px;font-size:13px;border-radius:10px">Ajouter</button>
                    <button class="btn btn-outline" onclick="ChatPage._removeResult(${i})" style="padding:8px 12px;font-size:13px;border-radius:10px;color:var(--danger);border-color:var(--danger)">✕</button>
                </div>
            </div>
        `).join('') + (this._results.length > 1 ? `
            <button class="btn btn-primary" onclick="ChatPage._addAll()" style="width:100%;padding:12px;font-size:14px;font-weight:700;margin-top:4px">
                Tout ajouter (${this._results.length} aliments)
            </button>
        ` : '');
    },

    _updateWeight(idx, newWeight) {
        const food = this._results[idx];
        if (!food) return;
        const ratio = parseInt(newWeight) / food.weight_g;
        // Update display only, keep original data for ratio calculation
        const cal = document.getElementById('chat-cal-' + idx);
        const prot = document.getElementById('chat-prot-' + idx);
        const carbs = document.getElementById('chat-carbs-' + idx);
        const fat = document.getElementById('chat-fat-' + idx);
        const fiber = document.getElementById('chat-fiber-' + idx);
        if (cal) cal.textContent = Math.round(food.calories * ratio);
        if (prot) prot.textContent = (food.protein * ratio).toFixed(1) + 'g';
        if (carbs) carbs.textContent = (food.carbs * ratio).toFixed(1) + 'g';
        if (fat) fat.textContent = (food.fat * ratio).toFixed(1) + 'g';
        if (fiber) fiber.textContent = ((food.fiber || 0) * ratio).toFixed(1) + 'g';
    },

    _addFood(idx) {
        const food = this._results[idx];
        if (!food) return;
        const mealType = this._selectedMeal || Storage.getCurrentMealType();
        const weightInput = document.getElementById('chat-weight-' + idx);
        const newWeight = weightInput ? parseInt(weightInput.value) : food.weight_g;
        if (isNaN(newWeight) || newWeight < 1 || newWeight > 2000) {
            App.showToast('Poids invalide (1-2000g)');
            return;
        }
        const ratio = newWeight / food.weight_g;

        const entry = {
            name: food.name,
            grams: newWeight,
            calories: Math.round(food.calories * ratio),
            protein: Math.round(food.protein * ratio * 10) / 10,
            carbs: Math.round(food.carbs * ratio * 10) / 10,
            fat: Math.round(food.fat * ratio * 10) / 10,
            fiber: Math.round((food.fiber || 0) * ratio * 10) / 10,
            source: 'chat-ai'
        };

        Storage.addFoodToMeal(mealType, entry, App.getSelectedDate());
        if (App.isToday()) Storage.addCoins(5);
        App.haptic('success');
        App.showToast(`${food.name} ajouté ! +5 🪙`);

        // Remove from results and re-render
        this._results.splice(idx, 1);
        this._renderResults();

        if (this._results.length === 0) {
            const resultsEl = document.getElementById('chat-results');
            if (resultsEl) resultsEl.innerHTML = `
                <div class="card" style="padding:20px;text-align:center">
                    <div style="font-size:32px;margin-bottom:8px">✅</div>
                    <div style="font-size:13px;color:var(--success);font-weight:600">Tous les aliments ajoutés !</div>
                </div>
            `;
        }
    },

    _addAll() {
        while (this._results.length > 0) {
            this._addFood(0);
        }
    },

    _removeResult(idx) {
        this._results.splice(idx, 1);
        this._renderResults();
    }
};
