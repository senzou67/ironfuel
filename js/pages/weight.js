// ===== WEIGHT TRACKING PAGE =====
// Dedicated weight page — same style as Gym & Supplements
const WeightPage = {
    render() {
        const weightLog = Storage.getWeightLog();
        const profile = Storage.getProfile();
        const currentWeight = profile.weight || 0;
        const goals = Storage.getGoals();

        // Stats
        const hasData = weightLog.length > 0;
        const startWeight = hasData ? weightLog[0].weight : currentWeight;
        const latestWeight = hasData ? weightLog[weightLog.length - 1].weight : currentWeight;
        const totalChange = latestWeight - startWeight;
        const last7 = weightLog.slice(-7);
        const weekChange = last7.length >= 2 ? last7[last7.length - 1].weight - last7[0].weight : 0;
        const minWeight = hasData ? Math.min(...weightLog.map(w => w.weight)) : 0;
        const maxWeight = hasData ? Math.max(...weightLog.map(w => w.weight)) : 0;

        const weekChangeHTML = hasData && weightLog.length >= 2 ? `
            <div style="font-size:12px;color:${weekChange <= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:600;margin-top:2px">
                ${weekChange > 0 ? '+' : ''}${weekChange.toFixed(1)} kg cette semaine
            </div>` : '';

        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="weight-container fade-in" style="padding:0 16px 16px">
                <!-- Current Weight Card -->
                <div class="card" style="padding:14px 16px;margin-bottom:12px">
                    <div style="display:flex;align-items:center;justify-content:space-between">
                        <div>
                            <div style="font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px">Poids actuel</div>
                            <div style="font-size:32px;font-weight:900;color:var(--text);line-height:1.2">${latestWeight}<span style="font-size:14px;font-weight:500;color:var(--text-secondary)"> kg</span></div>
                            ${weekChangeHTML}
                        </div>
                        <button class="btn btn-primary" onclick="WeightPage._showAddWeight()" style="border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;padding:0;font-size:22px">+</button>
                    </div>
                </div>

                <!-- Quick Stats -->
                ${hasData ? `
                <div style="display:flex;gap:8px;margin-bottom:12px">
                    <div class="card" style="flex:1;padding:12px;text-align:center">
                        <div style="font-size:22px;font-weight:800;color:var(--primary)">${weightLog.length}</div>
                        <div style="font-size:11px;color:var(--text-secondary)">pesées</div>
                    </div>
                    <div class="card" style="flex:1;padding:12px;text-align:center">
                        <div style="font-size:22px;font-weight:800;color:var(--success)">${minWeight}</div>
                        <div style="font-size:11px;color:var(--text-secondary)">min (kg)</div>
                    </div>
                    <div class="card" style="flex:1;padding:12px;text-align:center">
                        <div style="font-size:22px;font-weight:800;color:var(--accent)">${maxWeight}</div>
                        <div style="font-size:11px;color:var(--text-secondary)">max (kg)</div>
                    </div>
                </div>
                ` : ''}

                <!-- Weight Chart -->
                <div class="card" style="padding:14px 16px;margin-bottom:12px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                        <span style="font-size:14px;font-weight:700">Évolution</span>
                        <div style="display:flex;gap:6px">
                            <button class="btn btn-outline weight-range-btn ${this._range === 7 || !this._range ? 'active' : ''}" onclick="WeightPage._setRange(7)" style="padding:4px 10px;font-size:11px">7j</button>
                            <button class="btn btn-outline weight-range-btn ${this._range === 30 ? 'active' : ''}" onclick="WeightPage._setRange(30)" style="padding:4px 10px;font-size:11px">30j</button>
                            <button class="btn btn-outline weight-range-btn ${this._range === 90 ? 'active' : ''}" onclick="WeightPage._setRange(90)" style="padding:4px 10px;font-size:11px">90j</button>
                            <button class="btn btn-outline weight-range-btn ${this._range === 365 ? 'active' : ''}" onclick="WeightPage._setRange(365)" style="padding:4px 10px;font-size:11px">1an</button>
                        </div>
                    </div>
                    ${hasData && weightLog.length >= 2 ? `
                        <div style="height:180px">
                            <canvas id="weight-chart" height="180"></canvas>
                        </div>
                    ` : `
                        <div style="text-align:center;padding:30px;color:var(--text-secondary);font-size:13px">
                            <div style="font-size:40px;margin-bottom:8px">📊</div>
                            Enregistre au moins 2 pesées pour voir le graphique
                        </div>
                    `}
                </div>

                <!-- Weight History -->
                <div class="card" style="padding:14px 16px">
                    <div style="font-size:14px;font-weight:700;margin-bottom:10px">Historique</div>
                    ${hasData ? `
                        <div style="max-height:300px;overflow-y:auto">
                            ${weightLog.slice().reverse().map((entry, i, arr) => {
                                const prev = i < arr.length - 1 ? arr[i + 1].weight : entry.weight;
                                const diff = entry.weight - prev;
                                const d = new Date(entry.date);
                                const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                                return `
                                    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
                                        <span style="font-size:13px;color:var(--text-secondary)">${dateStr}</span>
                                        <div style="display:flex;align-items:baseline;gap:8px">
                                            <span style="font-size:15px;font-weight:700">${entry.weight} kg</span>
                                            ${i < arr.length - 1 ? `
                                                <span style="font-size:11px;font-weight:600;color:${diff <= 0 ? 'var(--success)' : 'var(--danger)'}">${diff > 0 ? '+' : ''}${diff.toFixed(1)}</span>
                                            ` : ''}
                                        </div>
                                        <button onclick="WeightPage._deleteEntry('${entry.date}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:13px;padding:4px">✕</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:13px">
                            Aucune pesée enregistrée
                        </div>
                    `}
                </div>
            </div>
        `;

        // Render chart
        if (hasData && weightLog.length >= 2) {
            this._renderChart(weightLog);
        }
    },

    _range: 30,

    _setRange(days) {
        this._range = days;
        this.render();
    },

    _renderChart(weightLog) {
        const range = this._range || 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - range);
        const filtered = weightLog.filter(w => new Date(w.date) >= cutoff);
        if (filtered.length < 2) return;

        const canvas = document.getElementById('weight-chart');
        if (!canvas) return;

        Charts.createWeightChart('weight-chart', filtered);
    },

    _showAddWeight() {
        const profile = Storage.getProfile();
        const current = profile.weight || 70;

        Modal.show(`
            <div style="text-align:center">
                <div style="font-size:40px;margin-bottom:8px">⚖️</div>
                <h3 style="margin-bottom:16px">Enregistrer mon poids</h3>
                <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px">
                    <button onclick="WeightPage._adjustWeight(-0.1)" class="btn btn-outline" style="padding:8px 14px;font-size:18px">−</button>
                    <div>
                        <input type="number" id="weight-input" value="${current}" step="0.1" min="30" max="300" style="width:100px;font-size:28px;font-weight:800;text-align:center;border:2px solid var(--primary);border-radius:12px;padding:8px;background:var(--surface);color:var(--text)">
                        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">kg</div>
                    </div>
                    <button onclick="WeightPage._adjustWeight(0.1)" class="btn btn-outline" style="padding:8px 14px;font-size:18px">+</button>
                </div>
                <input type="date" id="weight-date" value="${App._localDateKey()}" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;background:var(--surface);color:var(--text);margin-bottom:16px">
                <button class="btn btn-primary" onclick="WeightPage._saveWeight()" style="width:100%;padding:12px;font-size:15px">Enregistrer</button>
            </div>
        `);
    },

    _adjustWeight(delta) {
        const input = document.getElementById('weight-input');
        if (!input) return;
        const val = parseFloat(input.value) || 70;
        input.value = (val + delta).toFixed(1);
    },

    _saveWeight() {
        const input = document.getElementById('weight-input');
        const dateInput = document.getElementById('weight-date');
        if (!input) return;

        const weight = parseFloat(input.value);
        if (isNaN(weight) || weight < 30 || weight > 300) {
            App.showToast('Poids invalide');
            return;
        }

        const date = dateInput ? new Date(dateInput.value) : new Date();
        Storage.addWeight(weight, date);

        // Also update profile weight
        const profile = Storage.getProfile();
        profile.weight = weight;
        Storage.setProfile(profile);

        Modal.close();
        App.showToast(`Poids enregistré : ${weight} kg ⚖️`);
        Storage.addCoins(3);
        this.render();
    },

    _deleteEntry(dateStr) {
        const log = Storage.getWeightLog().filter(w => w.date !== dateStr);
        Storage._set('weight_log', log);
        App.showToast('Pesée supprimée');
        this.render();
    }
};
