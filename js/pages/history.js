const HistoryPage = {
    period: 7,

    render() {
        const goals = Storage.getGoals();
        const data = Storage.getHistoryRange(this.period);
        const weightLog = Storage.getWeightLog();

        // Calculate averages
        const daysWithData = data.filter(d => d.calories > 0);
        const avgCal = daysWithData.length > 0
            ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
            : 0;
        const avgProt = daysWithData.length > 0
            ? Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length)
            : 0;
        const avgCarbs = daysWithData.length > 0
            ? Math.round(daysWithData.reduce((s, d) => s + d.carbs, 0) / daysWithData.length)
            : 0;
        const avgFat = daysWithData.length > 0
            ? Math.round(daysWithData.reduce((s, d) => s + d.fat, 0) / daysWithData.length)
            : 0;

        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="history-container fade-in">
                <div class="period-tabs">
                    <button class="period-tab ${this.period === 7 ? 'active' : ''}" onclick="HistoryPage.setPeriod(7)">7 jours</button>
                    <button class="period-tab ${this.period === 14 ? 'active' : ''}" onclick="HistoryPage.setPeriod(14)">14 jours</button>
                    <button class="period-tab ${this.period === 30 ? 'active' : ''}" onclick="HistoryPage.setPeriod(30)">30 jours</button>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-value">${avgCal}</div>
                        <div class="stat-card-label">Moy. calories</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-value">${daysWithData.length}</div>
                        <div class="stat-card-label">Jours suivis</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-value">${avgProt}g</div>
                        <div class="stat-card-label">Moy. protéines</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-value">${Storage.getStreak()}</div>
                        <div class="stat-card-label">Série 🔥</div>
                    </div>
                </div>

                <div class="history-charts-row">
                    <div class="chart-container">
                        <div class="card-title">Calories quotidiennes</div>
                        <div style="height:200px">
                            <canvas id="history-cal-chart"></canvas>
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="card-title">Répartition macros (moyenne)</div>
                        <div style="height:220px;display:flex;justify-content:center">
                            <canvas id="history-macro-chart" style="max-width:220px"></canvas>
                        </div>
                    </div>
                </div>

                ${weightLog.length > 0 ? `
                    <div class="chart-container">
                        <div class="card-title">Évolution du poids</div>
                        <div style="height:200px">
                            <canvas id="history-weight-chart"></canvas>
                        </div>
                    </div>
                ` : ''}

                <div class="card">
                    <div class="card-title">Suivi du poids</div>
                    <div style="margin-bottom:12px;font-size:14px;color:var(--text-secondary)">
                        Poids actuel : <strong style="color:var(--text);font-size:20px">${Storage.getProfile().weight || '—'} kg</strong>
                    </div>
                    <label for="weight-input" style="display:block;font-size:13px;color:var(--text-secondary);margin-bottom:8px">
                        Nouveau poids (kg)
                    </label>
                    <div style="display:flex;gap:10px;align-items:stretch">
                        <input type="number" class="form-input weight-input" id="weight-input"
                            placeholder="${Storage.getProfile().weight || '70.0'}"
                            step="0.1" min="30" max="300"
                            inputmode="decimal"
                            style="flex:1;min-width:0">
                        <button class="btn btn-primary" onclick="HistoryPage.addWeight()" style="padding:14px 24px;font-size:16px;white-space:nowrap;font-weight:700;border-radius:var(--radius);flex-shrink:0;width:auto">
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Render charts
        Charts.createCalorieHistory('history-cal-chart', data, goals.calories);
        Charts.createMacroChart('history-macro-chart', avgProt, avgCarbs, avgFat);
        if (weightLog.length > 0) {
            Charts.createWeightChart('history-weight-chart', weightLog.slice(-this.period));
        }
    },

    setPeriod(days) {
        this.period = days;
        this.render();
    },

    addWeight() {
        const input = document.getElementById('weight-input');
        const weight = parseFloat(input.value);
        if (!weight || weight < 30 || weight > 300) {
            App.showToast('Poids invalide');
            return;
        }
        Storage.addWeight(weight);
        // Also update profile
        const profile = Storage.getProfile();
        profile.weight = weight;
        Storage.setProfile(profile);

        App.showToast(`Poids enregistré : ${weight} kg`);
        this.render();
    }
};
