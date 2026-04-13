const Charts = {
    instances: {},

    _cssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    },

    destroy(id) {
        if (this.instances[id]) {
            this.instances[id].destroy();
            delete this.instances[id];
        }
    },

    destroyAll() {
        Object.keys(this.instances).forEach(id => this.destroy(id));
    },

    createCalorieRing(canvasId, consumed, goal, macros) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const proteinColor = this._cssVar('--protein-color') || '#3B82F6';
        const carbsColor = this._cssVar('--carbs-color') || '#F59E0B';
        const fatColor = this._cssVar('--fat-color') || '#EF4444';
        const primaryDark = this._cssVar('--primary-dark') || '#DC2626';
        const borderColor = this._cssVar('--border') || '#e0e0e0';

        let data, colors;
        if (macros && (macros.protein || macros.carbs || macros.fat)) {
            // Macro-segmented ring: protein (cal) + carbs (cal) + fat (cal) + remaining
            const protCal = (macros.protein || 0) * 4;
            const carbsCal = (macros.carbs || 0) * 4;
            const fatCal = (macros.fat || 0) * 9;
            const remaining = Math.max(goal - consumed, 0);
            data = [protCal, carbsCal, fatCal, remaining];
            colors = [proteinColor, carbsColor, fatColor, borderColor];
        } else {
            const remaining = Math.max(goal - consumed, 0);
            const color = consumed > goal ? fatColor : primaryDark;
            data = [consumed, remaining];
            colors = [color, borderColor];
        }

        this.instances[canvasId] = new Chart(canvas, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    borderRadius: 3
                }]
            },
            options: {
                cutout: '78%',
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { animateRotate: true, duration: 800 }
            }
        });
    },

    createCalorieHistory(canvasId, data, goal) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const labels = data.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        });

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? '#333' : '#eee';
        const textColor = isDark ? '#aaa' : '#666';

        this.instances[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Calories',
                    data: data.map(d => d.calories),
                    backgroundColor: data.map(d => d.calories > goal ? (this._cssVar('--fat-color') || '#EF4444') + '90' : (this._cssVar('--primary-dark') || '#DC2626') + '90'),
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.raw} kcal`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, maxRotation: 45 }
                    }
                }
            }
        });
    },

    createMacroChart(canvasId, protein, carbs, fat, fiber) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const total = protein + carbs + fat + (fiber || 0);
        if (total === 0) return;

        const proteinColor = this._cssVar('--protein-color') || '#3B82F6';
        const carbsColor = this._cssVar('--carbs-color') || '#F59E0B';
        const fatColor = this._cssVar('--fat-color') || '#EF4444';
        const fiberColor = this._cssVar('--fiber-color') || '#22C55E';

        const labels = ['Protéines', 'Glucides', 'Lipides'];
        const data = [protein, carbs, fat];
        const colors = [proteinColor, carbsColor, fatColor];
        if (fiber && fiber > 0) {
            labels.push('Fibres');
            data.push(fiber);
            colors.push(fiberColor);
        }

        this.instances[canvasId] = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '60%',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#aaa' : '#666'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => {
                                const pct = Math.round(ctx.raw / total * 100);
                                return `${ctx.label}: ${ctx.raw}g (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    createWeightChart(canvasId, data) {
        this.destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        if (!data || data.length === 0) return;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        this.instances[canvasId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.map(d => {
                    const date = new Date(d.date);
                    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                }),
                datasets: [{
                    label: 'Poids (kg)',
                    data: data.map(d => d.weight),
                    borderColor: this._cssVar('--primary-dark') || '#DC2626',
                    backgroundColor: (this._cssVar('--primary-dark') || '#DC2626') + '20',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: this._cssVar('--primary-dark') || '#DC2626'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        grid: { color: isDark ? '#333' : '#eee' },
                        ticks: { color: isDark ? '#aaa' : '#666' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: isDark ? '#aaa' : '#666' }
                    }
                }
            }
        });
    }
};
