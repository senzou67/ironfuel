const VoicePage = {
    render() {
        const supported = SpeechService.isSupported();

        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="voice-container fade-in">
                ${!supported ? `
                    <div class="card" style="border-left:4px solid var(--danger);margin:0 0 16px;text-align:left;width:100%">
                        <p style="font-size:14px;color:var(--text-secondary)">
                            La reconnaissance vocale n'est pas supportée par votre navigateur.
                            Utilisez Chrome ou Edge pour cette fonctionnalité.
                        </p>
                    </div>
                ` : ''}

                <p style="color:var(--text-secondary);font-size:13px;margin-bottom:4px">
                    Exemple : "200g de poulet, 150g de riz, une banane"
                </p>

                <!-- Mic button with animated rings -->
                <div class="voice-btn-wrapper" id="voice-btn-wrapper">
                    <div class="voice-ring voice-ring-1" id="voice-ring-1"></div>
                    <div class="voice-ring voice-ring-2" id="voice-ring-2"></div>
                    <div class="voice-ring voice-ring-3" id="voice-ring-3"></div>
                    <button class="voice-btn" id="voice-btn" ${!supported ? 'disabled' : ''}>
                        🎤
                    </button>
                </div>

                <div class="voice-text" id="voice-text">
                    ${supported ? 'Maintenez pour parler' : 'Non disponible'}
                </div>

                <div class="voice-timer-bar" id="voice-timer-bar" style="display:none">
                    <div class="voice-timer-fill" id="voice-timer-fill"></div>
                    <span class="voice-timer-text" id="voice-timer-text">0s</span>
                </div>

                <div id="voice-result" style="display:none;width:100%"></div>
            </div>
        `;

        if (supported) {
            this._setupHoldToRecord();
        }
    },

    _timerInterval: null,
    _startTime: null,
    _isHolding: false,
    _isProcessing: false,

    _setupHoldToRecord() {
        const btn = document.getElementById('voice-btn');
        if (!btn) return;

        // Prevent context menu on long press
        btn.addEventListener('contextmenu', (e) => e.preventDefault());

        // Touch events (mobile) — Snap/WhatsApp style
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._startHold();
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this._endHold();
        });

        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this._cancelHold();
        });

        // Mouse events (desktop)
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this._startHold();
        });

        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this._endHold();
        });

        btn.addEventListener('mouseleave', () => {
            if (this._isHolding) this._endHold();
        });
    },

    async _startHold() {
        if (this._isHolding || this._isProcessing) return;
        this._isHolding = true;

        const btn = document.getElementById('voice-btn');
        const textEl = document.getElementById('voice-text');
        const resultEl = document.getElementById('voice-result');
        const wrapper = document.getElementById('voice-btn-wrapper');

        if (btn) btn.classList.add('recording');
        if (wrapper) wrapper.classList.add('recording');
        if (textEl) textEl.textContent = 'Accès micro...';
        if (resultEl) resultEl.style.display = 'none';

        // Vibrate feedback on mobile
        if (navigator.vibrate) navigator.vibrate(30);

        try {
            await SpeechService.startContinuous(
                // onInterim
                (text) => {
                    if (textEl) textEl.textContent = text;
                },
                // onError
                (error) => {
                    this._resetState();
                    if (textEl) textEl.textContent = error;
                    setTimeout(() => {
                        if (textEl && textEl.textContent === error) {
                            textEl.textContent = 'Maintenez pour parler';
                        }
                    }, 3000);
                }
            );
        } catch (e) {
            this._resetState();
            if (textEl) textEl.textContent = 'Erreur. Réessayez.';
            return;
        }

        // Only show recording state if speech actually started
        if (SpeechService.isListening && this._isHolding) {
            if (textEl) textEl.textContent = 'Parlez maintenant...';
            this._startTimer();
        } else if (this._isHolding) {
            // Speech didn't start but we're still holding — cleanup
            this._resetState();
            if (textEl) textEl.textContent = 'Erreur micro. Réessayez.';
        }
    },

    _endHold() {
        if (!this._isHolding) return;
        this._isHolding = false;

        const btn = document.getElementById('voice-btn');
        const textEl = document.getElementById('voice-text');
        const wrapper = document.getElementById('voice-btn-wrapper');

        this._stopTimer();
        if (btn) btn.classList.remove('recording');
        if (wrapper) wrapper.classList.remove('recording');

        // Vibrate feedback
        if (navigator.vibrate) navigator.vibrate(15);

        // Get accumulated text before stopping
        const fullText = SpeechService.getAccumulatedText();
        const lastInterim = textEl ? textEl.textContent : '';

        // Force stop recognition
        SpeechService.stop();

        // Use accumulated text, or fall back to displayed text
        const finalText = fullText || lastInterim;

        const ignoreTexts = [
            'Parlez maintenant...', 'Maintenez pour parler',
            'Accès micro...', 'Non disponible',
            'Erreur micro. Réessayez.', 'Erreur. Réessayez.'
        ];

        if (finalText && !ignoreTexts.includes(finalText)) {
            if (textEl) textEl.textContent = `"${finalText}"`;
            this._isProcessing = true;
            this.processVoiceInput(finalText);
        } else {
            if (textEl) textEl.textContent = 'Aucune voix détectée';
            setTimeout(() => {
                if (textEl && textEl.textContent === 'Aucune voix détectée') {
                    textEl.textContent = 'Maintenez pour parler';
                }
            }, 2000);
        }
    },

    _cancelHold() {
        if (!this._isHolding) return;
        this._resetState();
        SpeechService.stop();
        const textEl = document.getElementById('voice-text');
        if (textEl) textEl.textContent = 'Annulé';
        setTimeout(() => {
            if (textEl && textEl.textContent === 'Annulé') {
                textEl.textContent = 'Maintenez pour parler';
            }
        }, 1500);
    },

    _resetState() {
        this._isHolding = false;
        this._isProcessing = false;
        this._stopTimer();
        const btn = document.getElementById('voice-btn');
        const wrapper = document.getElementById('voice-btn-wrapper');
        if (btn) btn.classList.remove('recording');
        if (wrapper) wrapper.classList.remove('recording');
    },

    _startTimer() {
        this._startTime = Date.now();
        const timerBar = document.getElementById('voice-timer-bar');
        const timerFill = document.getElementById('voice-timer-fill');
        const timerText = document.getElementById('voice-timer-text');
        if (timerBar) timerBar.style.display = 'flex';

        const MAX_SECONDS = 30;
        this._timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this._startTime) / 1000);
            if (timerText) timerText.textContent = `${elapsed}s`;
            if (timerFill) timerFill.style.width = `${Math.min(100, (elapsed / MAX_SECONDS) * 100)}%`;

            // Auto-stop at 30s
            if (elapsed >= MAX_SECONDS) {
                this._endHold();
            }
        }, 500);
    },

    _stopTimer() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
        const timerBar = document.getElementById('voice-timer-bar');
        const timerFill = document.getElementById('voice-timer-fill');
        if (timerBar) timerBar.style.display = 'none';
        if (timerFill) timerFill.style.width = '0%';
    },

    processVoiceInput(text) {
        const allResults = SpeechService.findMultipleFoods(text);
        const resultEl = document.getElementById('voice-result');
        resultEl.style.display = 'block';

        if (allResults.length === 0) {
            const { parsed, results } = SpeechService.findFood(text);
            if (results.length === 0) {
                resultEl.innerHTML = `
                    <div class="card" style="text-align:left">
                        <p style="margin-bottom:12px">
                            <strong>Recherche :</strong> "${parsed.foodName}" (${parsed.weight}g)
                        </p>
                        <p style="color:var(--text-secondary);font-size:14px">
                            Aucun aliment trouvé dans la base de données.
                        </p>
                        <button class="btn btn-outline mt-16" onclick="App.navigate('search')" style="width:100%">
                            Recherche manuelle
                        </button>
                    </div>
                `;
                this._isProcessing = false;
                this._resetForNextRecording();
                return;
            }

            if (results.length === 1) {
                Modal.showFoodModal(results[0], { grams: parsed.weight });
                resultEl.innerHTML = `
                    <div class="card" style="text-align:left">
                        <p style="color:var(--primary);font-weight:600">${results[0].name} (${parsed.weight}g)</p>
                    </div>
                `;
                this._isProcessing = false;
                this._resetForNextRecording();
                return;
            }

            this._showSingleFoodResults(parsed, results);
            this._isProcessing = false;
            this._resetForNextRecording();
            return;
        }

        // Multiple foods detected
        resultEl.innerHTML = `
            <div style="text-align:left">
                <p style="margin-bottom:12px;font-size:14px;font-weight:600;color:var(--primary)">
                    ${allResults.length} aliment${allResults.length > 1 ? 's' : ''} détecté${allResults.length > 1 ? 's' : ''} :
                </p>
                ${allResults.map((r, i) => {
                    if (r.results.length === 0) {
                        return `
                            <div class="card" style="margin-bottom:8px;padding:12px;opacity:0.6;display:flex;justify-content:space-between;align-items:center">
                                <p style="font-size:13px;color:var(--text-secondary);margin:0">
                                    "${r.parsed.foodName}" (${r.parsed.weight}g) — non trouvé
                                </p>
                                <button onclick="App.navigate('search',{query:'${r.parsed.foodName.replace(/'/g, "\\'")}'})" style="background:var(--primary);color:white;border:none;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;white-space:nowrap">
                                    Chercher
                                </button>
                            </div>
                        `;
                    }
                    const food = r.results[0];
                    const cal = Math.round(food.n[0] * r.parsed.weight / 100);
                    const prot = Math.round(food.n[1] * r.parsed.weight / 100);
                    return `
                        <div class="card" style="margin-bottom:8px;padding:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="VoicePage.selectFood(${food.id}, ${r.parsed.weight})">
                            <div style="flex:1;min-width:0">
                                <div style="font-weight:600;font-size:14px">${food.name}</div>
                                <div style="font-size:12px;color:var(--text-secondary)">${r.parsed.weight}g — ${prot}g prot.</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                                <span style="font-weight:700;color:var(--primary)">${cal} kcal</span>
                                <span style="font-size:16px;opacity:0.5" title="Modifier">✏️</span>
                                <button onclick="event.stopPropagation();VoicePage.removeFromPending(${i})" style="background:none;border:none;font-size:16px;cursor:pointer;opacity:0.5;padding:4px" title="Retirer">❌</button>
                            </div>
                        </div>
                    `;
                }).join('')}
                <button class="btn btn-primary mt-16" onclick="VoicePage.addAllFoods()" style="width:100%">
                    Ajouter tout (${allResults.filter(r => r.results.length > 0).length} aliments)
                </button>
            </div>
        `;

        this._pendingFoods = allResults.filter(r => r.results.length > 0);
        this._isProcessing = false;
        this._resetForNextRecording();
    },

    // After processing, reset text so user can record again
    _resetForNextRecording() {
        const textEl = document.getElementById('voice-text');
        setTimeout(() => {
            if (textEl && !this._isHolding) {
                // Don't reset if there are results showing
                const resultEl = document.getElementById('voice-result');
                if (resultEl && resultEl.style.display !== 'none') return;
                textEl.textContent = 'Maintenez pour parler';
            }
        }, 4000);
    },

    _pendingFoods: [],

    _showSingleFoodResults(parsed, results) {
        const resultEl = document.getElementById('voice-result');
        resultEl.innerHTML = `
            <div style="text-align:left">
                <p style="margin-bottom:12px;font-size:14px;color:var(--text-secondary)">
                    Résultats pour "${parsed.foodName}" (${parsed.weight}g) :
                </p>
                ${results.slice(0, 5).map(food => `
                    <div class="search-result-item" onclick="VoicePage.selectFood(${food.id}, ${parsed.weight})">
                        <div class="result-info">
                            <div class="result-name">${food.name}</div>
                            <div class="result-detail">
                                P:${food.n[1]}g · G:${food.n[2]}g · L:${food.n[3]}g /100g
                            </div>
                        </div>
                        <span class="result-cal">${food.n[0]} kcal</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    _getMealTypeByTime() {
        return Storage.getCurrentMealType();
    },

    addAllFoods() {
        if (!this._pendingFoods || this._pendingFoods.length === 0) return;

        const mealType = this._getMealTypeByTime();
        let added = 0;
        for (const r of this._pendingFoods) {
            if (r.results.length > 0) {
                const food = r.results[0];
                const n = {
                    calories: Math.round(food.n[0] * r.parsed.weight / 100),
                    protein: Math.round(food.n[1] * r.parsed.weight / 100),
                    carbs: Math.round(food.n[2] * r.parsed.weight / 100),
                    fat: Math.round(food.n[3] * r.parsed.weight / 100)
                };
                Storage.addFoodToMeal(mealType, {
                    foodId: food.id,
                    name: food.name,
                    grams: r.parsed.weight,
                    calories: n.calories,
                    protein: n.protein,
                    carbs: n.carbs,
                    fat: n.fat
                });
                Storage.addCoins(5);
                added++;
            }
        }

        if (added > 0) {
            App.showSuccessCheck();
            App.showToast(`${added} aliment${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''} !`);
            this._pendingFoods = [];

            const resultEl = document.getElementById('voice-result');
            const textEl = document.getElementById('voice-text');
            if (resultEl) resultEl.style.display = 'none';
            if (textEl) textEl.textContent = 'Maintenez pour parler';
        }
    },

    removeFromPending(index) {
        if (!this._pendingFoods) return;
        this._pendingFoods.splice(index, 1);
        // Re-render the pending list
        const resultEl = document.getElementById('voice-result');
        if (this._pendingFoods.length === 0) {
            resultEl.innerHTML = '<p style="color:var(--text-secondary);font-size:13px">Tous les aliments ont été retirés.</p>';
            return;
        }
        // Rebuild the display
        resultEl.innerHTML = `
            <div style="text-align:left">
                <p style="margin-bottom:12px;font-size:14px;font-weight:600;color:var(--primary)">
                    ${this._pendingFoods.length} aliment${this._pendingFoods.length > 1 ? 's' : ''} :
                </p>
                ${this._pendingFoods.map((r, i) => {
                    const food = r.results[0];
                    const cal = Math.round(food.n[0] * r.parsed.weight / 100);
                    const prot = Math.round(food.n[1] * r.parsed.weight / 100);
                    return `
                        <div class="card" style="margin-bottom:8px;padding:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="VoicePage.selectFood(${food.id}, ${r.parsed.weight})">
                            <div style="flex:1;min-width:0">
                                <div style="font-weight:600;font-size:14px">${food.name}</div>
                                <div style="font-size:12px;color:var(--text-secondary)">${r.parsed.weight}g — ${prot}g prot.</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                                <span style="font-weight:700;color:var(--primary)">${cal} kcal</span>
                                <span style="font-size:16px;opacity:0.5">✏️</span>
                                <button onclick="event.stopPropagation();VoicePage.removeFromPending(${i})" style="background:none;border:none;font-size:16px;cursor:pointer;opacity:0.5;padding:4px">❌</button>
                            </div>
                        </div>
                    `;
                }).join('')}
                <button class="btn btn-primary mt-16" onclick="VoicePage.addAllFoods()" style="width:100%">
                    Ajouter tout (${this._pendingFoods.length} aliments)
                </button>
            </div>
        `;
    },

    selectFood(foodId, weight) {
        const food = FoodDB.getById(foodId);
        if (food) {
            Modal.showFoodModal(food, { grams: weight });
        }
    }
};
