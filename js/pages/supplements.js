// ===== SUPPLEMENTS PAGE =====
// Track daily supplements — similar to Gym page
const SupplementsPage = {
    _esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; },
    // Common supplements database
    SUPPLEMENTS: [
        { id: 'whey', name: 'Whey Protéine', icon: '🥛', category: 'protéines', unit: 'scoop' },
        { id: 'creatine', name: 'Créatine', icon: '⚡', category: 'performance', unit: 'g', defaultDose: 5 },
        { id: 'omega3', name: 'Oméga-3', icon: '🐟', category: 'santé', unit: 'gélule', defaultDose: 1 },
        { id: 'vitd', name: 'Vitamine D', icon: '☀️', category: 'vitamines', unit: 'goutte', defaultDose: 4 },
        { id: 'vitc', name: 'Vitamine C', icon: '🍊', category: 'vitamines', unit: 'comprimé', defaultDose: 1 },
        { id: 'magnesium', name: 'Magnésium', icon: '💤', category: 'minéraux', unit: 'gélule', defaultDose: 1 },
        { id: 'zinc', name: 'Zinc', icon: '🛡️', category: 'minéraux', unit: 'comprimé', defaultDose: 1 },
        { id: 'bcaa', name: 'BCAA', icon: '💪', category: 'performance', unit: 'scoop', defaultDose: 1 },
        { id: 'multivit', name: 'Multivitamines', icon: '💊', category: 'vitamines', unit: 'comprimé', defaultDose: 1 },
        { id: 'iron', name: 'Fer', icon: '🩸', category: 'minéraux', unit: 'comprimé', defaultDose: 1 },
        { id: 'collagen', name: 'Collagène', icon: '✨', category: 'santé', unit: 'scoop', defaultDose: 1 },
        { id: 'probiotic', name: 'Probiotiques', icon: '🦠', category: 'santé', unit: 'gélule', defaultDose: 1 },
        { id: 'caffeine', name: 'Caféine', icon: '☕', category: 'performance', unit: 'comprimé', defaultDose: 1 },
        { id: 'ashwagandha', name: 'Ashwagandha', icon: '🌿', category: 'santé', unit: 'gélule', defaultDose: 1 },
        { id: 'casein', name: 'Caséine', icon: '🌙', category: 'protéines', unit: 'scoop', defaultDose: 1 },
        { id: 'glutamine', name: 'Glutamine', icon: '🔄', category: 'performance', unit: 'g', defaultDose: 5 }
    ],

    render() {
        const today = Storage._dateKey();
        const takenToday = Storage._get('suppl_' + today, []);
        const mySupplements = Storage._get('my_supplements', []);
        const content = document.getElementById('page-content');

        content.innerHTML = `
            <div class="supplements-container fade-in" style="padding:0 16px 16px">
                <!-- Today's Supplements -->
                <div class="card" style="padding:14px 16px;margin-bottom:12px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                        <span style="font-size:14px;font-weight:700">Aujourd'hui</span>
                        <span class="suppl-today-count" style="font-size:12px;color:var(--text-secondary)">${takenToday.length} pris</span>
                    </div>
                    ${takenToday.length > 0 ? `
                        <div style="display:flex;flex-wrap:wrap;gap:6px">
                            ${takenToday.map(s => {
                                const info = this.SUPPLEMENTS.find(x => x.id === s.id) || s;
                                return `
                                    <div style="display:flex;align-items:center;gap:4px;padding:6px 10px;border-radius:10px;background:var(--primary-light);font-size:12px;font-weight:600;color:var(--primary)">
                                        <span>${info.icon || '💊'}</span>
                                        <span>${this._esc(info.name || s.name)}</span>
                                        <button onclick="SupplementsPage._removeTaken('${s.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;padding:0 2px">✕</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div style="text-align:center;padding:12px;color:var(--text-secondary);font-size:13px">
                            Aucun complément pris aujourd'hui
                        </div>
                    `}
                </div>

                <!-- My Supplement Plan -->
                <div class="card" style="padding:14px 16px;margin-bottom:12px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                        <span style="font-size:14px;font-weight:700">Mon plan</span>
                        <button class="btn btn-outline" onclick="SupplementsPage._editPlan()" style="padding:4px 10px;font-size:11px">Modifier</button>
                    </div>
                    ${mySupplements.length > 0 ? `
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                            ${mySupplements.map(s => {
                                const info = this.SUPPLEMENTS.find(x => x.id === s.id) || s;
                                const taken = takenToday.some(t => t.id === s.id);
                                return `
                                    <button onclick="SupplementsPage.toggleTaken('${s.id}')"
                                        style="padding:12px 10px;border:2px solid ${taken ? 'var(--primary)' : 'var(--border)'};border-radius:12px;background:${taken ? 'var(--primary-light)' : 'var(--surface)'};cursor:pointer;text-align:center;transition:all 0.2s">
                                        <div style="font-size:24px;margin-bottom:4px">${info.icon || '💊'}</div>
                                        <div style="font-size:12px;font-weight:600;color:${taken ? 'var(--primary)' : 'var(--text)'}">${this._esc(info.name || s.name)}</div>
                                        <div style="font-size:10px;color:var(--text-secondary);margin-top:2px">${s.dose || info.defaultDose || 1} ${info.unit || s.unit || ''}</div>
                                        ${taken ? '<div style="font-size:10px;color:var(--primary);margin-top:2px">✓ Pris</div>' : ''}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div style="text-align:center;padding:16px;color:var(--text-secondary);font-size:13px">
                            <div style="font-size:32px;margin-bottom:8px">💊</div>
                            <p>Ajoute tes compléments quotidiens</p>
                            <button class="btn btn-primary" onclick="SupplementsPage._editPlan()" style="margin-top:10px;font-size:13px;padding:8px 20px">Configurer mon plan</button>
                        </div>
                    `}
                </div>

                <!-- Quick Add from library -->
                <div class="card" style="padding:14px 16px">
                    <div style="font-size:14px;font-weight:700;margin-bottom:10px">Prise rapide</div>
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
                        ${this.SUPPLEMENTS.slice(0, 8).map(s => `
                            <button onclick="SupplementsPage.quickTake('${s.id}')"
                                style="padding:8px 4px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface);cursor:pointer;text-align:center;transition:all 0.2s">
                                <div style="font-size:20px">${s.icon}</div>
                                <div style="font-size:10px;font-weight:500;color:var(--text-secondary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Custom supplement add -->
                <div class="card" style="padding:14px 16px;margin-top:12px">
                    <div style="font-size:14px;font-weight:700;margin-bottom:10px">Ajouter un complément</div>
                    <div style="display:flex;gap:8px;align-items:stretch">
                        <input type="text" id="custom-suppl-name"
                               placeholder="Ex: Spiruline..."
                               class="form-input"
                               style="flex:1 1 0%;min-width:0;font-size:16px;font-weight:600;padding:12px 14px;min-height:48px;border-radius:12px;color:#212121;background:#fff">
                        <button class="btn btn-primary" onclick="SupplementsPage._addCustom()"
                                style="flex:0 0 48px;width:48px;padding:0;font-size:20px;min-height:48px;border-radius:12px;font-weight:700;display:flex;align-items:center;justify-content:center">+</button>
                    </div>
                </div>

                <!-- Stats -->
                <div class="card" style="padding:14px 16px;margin-top:12px">
                    <div style="font-size:14px;font-weight:700;margin-bottom:10px">Historique (7 derniers jours)</div>
                    ${this._renderWeekHistory()}
                </div>
            </div>
        `;
    },

    toggleTaken(id) {
        const today = Storage._dateKey();
        let taken = Storage._get('suppl_' + today, []);
        const idx = taken.findIndex(t => t.id === id);
        const btn = event?.target?.closest('button');
        if (idx >= 0) {
            taken.splice(idx, 1);
            App.showToast('Complément retiré');
            App.haptic('light');
            if (btn) {
                btn.style.border = '2px solid var(--border)';
                btn.style.background = 'var(--surface)';
                const checkEl = btn.querySelector('[data-check]');
                if (checkEl) checkEl.remove();
            }
        } else {
            const info = this.SUPPLEMENTS.find(x => x.id === id) || { id, name: id };
            taken.push({ id, name: info.name, time: new Date().toISOString() });
            Storage.addCoins(2);
            App.haptic('success');
            // Visual gratification on button
            if (btn) {
                btn.style.border = '2px solid var(--primary)';
                btn.style.background = 'var(--primary-light)';
                btn.style.transform = 'scale(1.08)';
                setTimeout(() => { btn.style.transform = 'scale(1)'; }, 200);
                // Add check mark
                if (!btn.querySelector('[data-check]')) {
                    const check = document.createElement('div');
                    check.setAttribute('data-check', '1');
                    check.style.cssText = 'font-size:10px;color:var(--primary);margin-top:2px';
                    check.textContent = '✓ Pris';
                    btn.appendChild(check);
                }
                // Floating +2 coins animation
                const coin = document.createElement('div');
                coin.textContent = '+2 🪙';
                coin.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:16px;font-weight:700;color:var(--primary);pointer-events:none;opacity:1;transition:all 0.8s ease-out;z-index:10';
                btn.style.position = 'relative';
                btn.appendChild(coin);
                requestAnimationFrame(() => {
                    coin.style.top = '-10px';
                    coin.style.opacity = '0';
                });
                setTimeout(() => coin.remove(), 900);
            }
            App.showToast(`${info.icon || '💊'} ${info.name} pris ! +2 🪙`);
        }
        Storage._set('suppl_' + today, taken);
        this._checkSupplBonus(taken);
        if (typeof SyncService !== 'undefined') SyncService.autoSync();
        // Update today count without full re-render
        const countEl = document.querySelector('.suppl-today-count');
        if (countEl) countEl.textContent = taken.length + ' pris';
    },

    quickTake(id) {
        const today = Storage._dateKey();
        let taken = Storage._get('suppl_' + today, []);
        if (taken.some(t => t.id === id)) {
            App.showToast('Déjà pris aujourd\'hui');
            return;
        }
        const info = this.SUPPLEMENTS.find(x => x.id === id);
        taken.push({ id, name: info.name, time: new Date().toISOString() });
        Storage._set('suppl_' + today, taken);
        Storage.addCoins(2);
        App.haptic('success');
        App.showToast(`${info.icon} ${info.name} pris ! +2 🪙`);
        this._checkSupplBonus(taken);
        if (typeof SyncService !== 'undefined') SyncService.autoSync();
        this.render();
    },

    _removeTaken(id) {
        const today = Storage._dateKey();
        let taken = Storage._get('suppl_' + today, []);
        taken = taken.filter(t => t.id !== id);
        Storage._set('suppl_' + today, taken);
        App.showToast('Complément retiré');
        this.render();
    },

    _checkSupplBonus(taken) {
        if (Storage.hasDailySupplBonus()) return;
        const mySupplements = Storage._get('my_supplements', []);
        if (mySupplements.length === 0) return;
        const allTaken = mySupplements.every(s => taken.some(t => t.id === s.id));
        if (allTaken) {
            Storage.addCoins(10);
            Storage.setDailySupplBonus();
            App.haptic('success');
            App.showToast('Tous les compléments pris ! +10 🪙 💊✅');
        }
    },

    _addCustom() {
        const input = document.getElementById('custom-suppl-name');
        const name = input?.value?.trim();
        if (!name) {
            App.showToast('Entre un nom de complément');
            return;
        }
        const id = 'custom_' + Date.now();
        const today = Storage._dateKey();
        let taken = Storage._get('suppl_' + today, []);
        taken.push({ id, name, time: new Date().toISOString(), custom: true });
        Storage._set('suppl_' + today, taken);

        // Also add to custom supplements list for future use
        let customs = Storage._get('custom_supplements', []);
        if (!customs.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            customs.push({ id, name, icon: '💊', unit: '', custom: true });
            Storage._set('custom_supplements', customs);
        }

        App.showToast(`💊 ${name} ajouté !`);
        Storage.addCoins(2);
        if (typeof SyncService !== 'undefined') SyncService.autoSync();
        this.render();
    },

    _editPlan() {
        const mySupplements = Storage._get('my_supplements', []);
        const customs = Storage._get('custom_supplements', []);
        const allSupplements = [...this.SUPPLEMENTS, ...customs];

        const html = allSupplements.map(s => {
            const planEntry = mySupplements.find(ms => ms.id === s.id);
            const inPlan = !!planEntry;
            const dose = planEntry ? planEntry.dose : (s.defaultDose || 1);
            const isCustom = s.custom || customs.some(c => c.id === s.id);
            return `
                <div class="suppl-plan-item" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1.5px solid ${inPlan ? 'var(--primary)' : 'var(--border)'};border-radius:12px;background:${inPlan ? 'var(--primary-light)' : 'transparent'};margin-bottom:6px;cursor:pointer">
                    <input type="checkbox" value="${s.id}" ${inPlan ? 'checked' : ''} class="suppl-plan-check" style="display:none">
                    <span style="font-size:20px">${s.icon || '💊'}</span>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:4px">
                            ${s.name}
                            ${isCustom ? '<span style="font-size:9px;padding:1px 5px;border-radius:4px;background:var(--accent);color:white">Perso</span>' : ''}
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;flex-shrink:0" onclick="event.stopPropagation()">
                        <input type="number" class="suppl-dose-input" data-id="${s.id}" value="${dose}" min="1" max="99" style="width:42px;padding:4px 6px;font-size:13px;font-weight:600;text-align:center;border:1.5px solid var(--border);border-radius:8px;background:var(--surface)">
                        <span style="font-size:11px;color:var(--text-secondary)">${s.unit || ''}</span>
                    </div>
                </div>
            `;
        }).join('');

        Modal.show(`
            <div class="modal-title">Mon plan compléments</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">Coche les compléments et ajuste la posologie.</div>
            <div style="max-height:50vh;overflow-y:auto;margin-bottom:12px" id="suppl-plan-list">
                ${html}
            </div>
            <button class="btn btn-primary" onclick="SupplementsPage._savePlan()" style="width:100%">Enregistrer</button>
        `);

        // Toggle chips on click
        setTimeout(() => {
            document.querySelectorAll('.suppl-plan-item').forEach(item => {
                item.onclick = (e) => {
                    if (e.target.classList.contains('suppl-dose-input')) return;
                    const cb = item.querySelector('.suppl-plan-check');
                    cb.checked = !cb.checked;
                    item.style.borderColor = cb.checked ? 'var(--primary)' : 'var(--border)';
                    item.style.background = cb.checked ? 'var(--primary-light)' : 'transparent';
                };
            });
        }, 100);
    },

    _savePlan() {
        const selected = [];
        document.querySelectorAll('.suppl-plan-check:checked').forEach(cb => {
            const id = cb.value;
            const info = this.SUPPLEMENTS.find(x => x.id === id) || Storage._get('custom_supplements', []).find(x => x.id === id) || { id };
            const doseInput = document.querySelector(`.suppl-dose-input[data-id="${id}"]`);
            const dose = doseInput ? parseInt(doseInput.value) || 1 : (info.defaultDose || 1);
            selected.push({ id, name: info.name, dose, unit: info.unit || '' });
        });
        Storage._set('my_supplements', selected);
        if (typeof SyncService !== 'undefined') SyncService.autoSync();
        Modal.close();
        App.showToast('Plan mis à jour !');
        this.render();
    },

    _renderWeekHistory() {
        const today = new Date();
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        let html = '<div style="display:flex;gap:4px">';
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = Storage._dateKey(d);
            const taken = Storage._get('suppl_' + key, []);
            const count = taken.length;
            const isToday = i === 0;
            html += `
                <div style="flex:1;text-align:center">
                    <div style="font-size:10px;color:var(--text-secondary);margin-bottom:4px">${days[d.getDay()]}</div>
                    <div style="width:28px;height:28px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;
                        ${count > 0 ? 'background:var(--primary);color:white' : `border:2px solid ${isToday ? 'var(--primary)' : 'var(--border)'}`};
                        font-size:11px;font-weight:700">
                        ${count > 0 ? count : (isToday ? '•' : '')}
                    </div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }
};
