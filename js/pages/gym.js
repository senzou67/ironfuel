const GymPage = {
    _currentMonth: null,
    _currentYear: null,

    // Workout types
    WORKOUT_TYPES: [
        { id: 'push', name: 'Push', icon: '🏋️', color: '#C62828' },
        { id: 'pull', name: 'Pull', icon: '💪', color: '#1E88E5' },
        { id: 'legs', name: 'Legs', icon: '🦵', color: '#4CAF50' },
        { id: 'cardio', name: 'Cardio', icon: '🏃', color: '#FF9800' },
        { id: 'full', name: 'Full Body', icon: '⚡', color: '#9C27B0' },
        { id: 'rest', name: 'Repos', icon: '😴', color: '#607D8B' }
    ],

    render() {
        // Auto-fill from routine if configured
        this._applyRoutine();
        const now = new Date();
        if (!this._currentMonth) this._currentMonth = now.getMonth();
        if (!this._currentYear) this._currentYear = now.getFullYear();

        const content = document.getElementById('page-content');
        const weekStats = this._getWeekStats();
        const monthStats = this._getMonthStats();

        content.innerHTML = `
            <div class="gym-container fade-in" style="padding:0 16px 16px">
                <!-- Weekly Summary -->
                <div class="card" style="padding:14px 16px;margin-bottom:12px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                        <span style="font-size:14px;font-weight:700">Cette semaine</span>
                        <span style="font-size:12px;color:var(--text-secondary)">${weekStats.done}/${weekStats.planned} séances</span>
                    </div>
                    <div style="display:flex;gap:4px">
                        ${this._renderWeekDots()}
                    </div>
                    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                        ${weekStats.types.map(t => `
                            <span style="font-size:11px;padding:3px 8px;border-radius:12px;background:${t.color}15;color:${t.color};font-weight:600">${t.icon} ${t.count}×</span>
                        `).join('')}
                    </div>
                </div>

                <!-- Month Stats -->
                <div style="display:flex;gap:8px;margin-bottom:12px">
                    <div class="card" style="flex:1;padding:12px;text-align:center">
                        <div style="font-size:24px;font-weight:800;color:var(--primary)">${monthStats.total}</div>
                        <div style="font-size:11px;color:var(--text-secondary)">séances ce mois</div>
                    </div>
                    <div class="card" style="flex:1;padding:12px;text-align:center">
                        <div style="font-size:24px;font-weight:800;color:var(--success)">${monthStats.streak}</div>
                        <div style="font-size:11px;color:var(--text-secondary)">meilleure série</div>
                    </div>
                    <div class="card" style="flex:1;padding:12px;text-align:center">
                        <div style="font-size:24px;font-weight:800;color:var(--carbs-color)">${monthStats.restDays}</div>
                        <div style="font-size:11px;color:var(--text-secondary)">jours repos</div>
                    </div>
                </div>

                <!-- Calendar -->
                <div class="card" style="padding:14px 12px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                        <button class="btn btn-outline" onclick="GymPage._prevMonth()" style="padding:6px 10px;font-size:14px">‹</button>
                        <span style="font-size:14px;font-weight:700">${this._getMonthName(this._currentMonth)} ${this._currentYear}</span>
                        <button class="btn btn-outline" onclick="GymPage._nextMonth()" style="padding:6px 10px;font-size:14px">›</button>
                    </div>
                    <div class="gym-calendar-grid">
                        <div class="gym-cal-header">Lun</div>
                        <div class="gym-cal-header">Mar</div>
                        <div class="gym-cal-header">Mer</div>
                        <div class="gym-cal-header">Jeu</div>
                        <div class="gym-cal-header">Ven</div>
                        <div class="gym-cal-header">Sam</div>
                        <div class="gym-cal-header">Dim</div>
                        ${this._renderCalendarDays()}
                    </div>
                </div>

                <!-- Today's Workout -->
                <div class="card gym-today-card" style="padding:14px 16px;margin-top:12px">
                    <div style="font-size:14px;font-weight:700;margin-bottom:10px">Aujourd'hui</div>
                    ${this._renderTodayWorkout()}
                </div>

                <!-- Workout Type Selector -->
                <div class="card" style="padding:14px 16px;margin-top:12px">
                    <div style="font-size:14px;font-weight:700;margin-bottom:10px">Enregistrer une séance</div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
                        ${this.WORKOUT_TYPES.map(t => `
                            <button class="gym-type-btn" onclick="GymPage.logWorkout('${t.id}')"
                                aria-label="Enregistrer une séance ${t.name}"
                                style="padding:12px 8px;border:2px solid ${t.color}30;border-radius:12px;background:${t.color}08;cursor:pointer;text-align:center;transition:all 0.2s">
                                <div style="font-size:24px;margin-bottom:4px" aria-hidden="true">${t.icon}</div>
                                <div style="font-size:12px;font-weight:600;color:${t.color}">${t.name}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Objectives -->
                <div class="card" style="padding:14px 16px;margin-top:12px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                        <span style="font-size:14px;font-weight:700">Objectifs</span>
                        <button class="btn btn-outline" onclick="GymPage._editGoals()" style="padding:4px 10px;font-size:11px">Modifier</button>
                    </div>
                    ${this._renderGoals()}
                </div>

                <!-- Routine hebdo -->
                <div class="card" style="padding:14px 16px;margin-top:12px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                        <span style="font-size:14px;font-weight:700">Routine hebdo</span>
                        <button class="btn btn-outline" onclick="GymPage._editRoutine()" style="padding:4px 10px;font-size:11px">Modifier</button>
                    </div>
                    ${this._renderRoutine()}
                </div>
            </div>
        `;
    },

    _renderWeekDots() {
        const today = new Date();
        const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
        const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        let html = '';

        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - dayOfWeek + i);
            const key = Storage._dateKey(d);
            const gym = Storage._get('gym_' + key, null);
            const isToday = i === dayOfWeek;
            const type = gym ? this.WORKOUT_TYPES.find(t => t.id === gym.type) : null;
            const color = type ? type.color : 'var(--border)';
            const isDone = gym && (gym.done || false);
            const hasGym = !!gym;

            let dotStyle, dotContent;
            if (isDone) {
                // Done: solid filled
                dotStyle = `background:${color};color:white`;
                dotContent = type ? type.icon : '✓';
            } else if (hasGym) {
                // Planned but not done: border only
                dotStyle = `border:2.5px solid ${color};background:${color}15;color:${color}`;
                dotContent = type ? type.icon : '○';
            } else {
                dotStyle = `border:2px solid ${isToday ? 'var(--primary)' : 'var(--border)'}`;
                dotContent = isToday ? '•' : '';
            }

            html += `
                <div style="flex:1;text-align:center" onclick="GymPage._selectDay('${key}')" role="button" aria-label="${days[i]} ${isDone ? 'fait' : hasGym ? 'planifié' : (isToday ? 'aujourd hui' : 'libre')}">
                    <div style="font-size:10px;color:var(--text-secondary);margin-bottom:4px">${days[i]}</div>
                    <div style="width:28px;height:28px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;
                        ${dotStyle};
                        font-size:${hasGym ? '14px' : '10px'};font-weight:600;cursor:pointer;transition:all 0.2s">
                        ${dotContent}
                    </div>
                </div>
            `;
        }
        return html;
    },

    _renderCalendarDays() {
        const firstDay = new Date(this._currentYear, this._currentMonth, 1);
        const lastDay = new Date(this._currentYear, this._currentMonth + 1, 0);
        const startPad = (firstDay.getDay() + 6) % 7; // Monday = 0
        const today = Storage._dateKey();

        let html = '';
        // Padding
        for (let i = 0; i < startPad; i++) {
            html += '<div class="gym-cal-day empty"></div>';
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const d = new Date(this._currentYear, this._currentMonth, day);
            const key = Storage._dateKey(d);
            const gym = Storage._get('gym_' + key, null);
            const isToday = key === today;
            const type = gym ? this.WORKOUT_TYPES.find(t => t.id === gym.type) : null;
            const isDone = gym && (gym.done || false);
            const color = type ? type.color : 'var(--primary)';

            let dayStyle = '';
            if (isDone) {
                dayStyle = `background:${color}30;border-color:${color};border-width:2px`;
            } else if (gym) {
                dayStyle = `background:${color}08;border-color:${color};border-style:dashed`;
            }

            html += `
                <div class="gym-cal-day ${isToday ? 'today' : ''} ${gym ? 'done' : ''}"
                     onclick="GymPage._selectDay('${key}')"
                     style="${dayStyle}">
                    <span class="gym-cal-num">${day}</span>
                    ${gym ? `<span style="font-size:10px;${isDone ? '' : 'opacity:0.5'}">${type ? type.icon : '✓'}</span>` : ''}
                </div>
            `;
        }
        return html;
    },

    _renderTodayWorkout() {
        const today = Storage._dateKey();
        const gym = Storage._get('gym_' + today, null);

        if (!gym) {
            return `<div style="text-align:center;padding:12px;color:var(--text-secondary);font-size:13px">
                Pas encore de séance aujourd'hui — choisis un type ci-dessous !
            </div>`;
        }

        const type = this.WORKOUT_TYPES.find(t => t.id === gym.type);
        const isDone = gym.done || false;
        return `
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:48px;height:48px;border-radius:12px;background:${type ? type.color : 'var(--primary)'}${isDone ? '30' : '15'};display:flex;align-items:center;justify-content:center;font-size:24px;${isDone ? `border:2px solid ${type ? type.color : 'var(--primary)'}` : ''}">
                    ${type ? type.icon : '✓'}
                </div>
                <div style="flex:1">
                    <div style="font-size:15px;font-weight:700">${type ? type.name : gym.type}</div>
                    <div style="font-size:12px;color:${isDone ? 'var(--success)' : 'var(--text-secondary)'}">${isDone ? 'Séance effectuée ✅' : 'Séance planifiée'}</div>
                </div>
                <button class="gym-done-btn" onclick="GymPage.toggleDone()" style="position:relative;overflow:visible;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:2px solid ${isDone ? 'var(--success)' : 'var(--primary)'};background:${isDone ? 'var(--success)' : 'transparent'};color:${isDone ? 'white' : 'var(--primary)'};transition:all 0.2s">${isDone ? '✓ Fait' : 'Fait ?'}</button>
                <button class="btn btn-outline" onclick="GymPage._removeToday()" aria-label="Supprimer la séance d'aujourd'hui" style="padding:6px 10px;font-size:11px;color:var(--danger);border-color:var(--danger)">✕</button>
            </div>
        `;
    },

    _renderGoals() {
        const goals = Storage._get('gym_goals', {
            perWeek: 4,
            types: ['push', 'pull', 'legs', 'cardio']
        });

        return `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span style="font-size:13px;color:var(--text-secondary)">Séances/semaine :</span>
                <span style="font-size:16px;font-weight:800;color:var(--primary)">${goals.perWeek}</span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${goals.types.map(tId => {
                    const t = this.WORKOUT_TYPES.find(wt => wt.id === tId);
                    return t ? `<span style="font-size:11px;padding:4px 8px;border-radius:10px;background:${t.color}15;color:${t.color};font-weight:600">${t.icon} ${t.name}</span>` : '';
                }).join('')}
            </div>
        `;
    },

    logWorkout(typeId, date) {
        const key = date || Storage._dateKey();
        const existing = Storage._get('gym_' + key, null);

        if (existing && existing.type === typeId && !date) {
            // Toggle off if same type
            Storage._set('gym_' + key, null);
            localStorage.removeItem('nutritrack_gym_' + key);
            App.showToast('Séance supprimée');
        } else {
            const done = existing ? (existing.done || false) : false;
            Storage._set('gym_' + key, { type: typeId, time: new Date().toISOString(), done });

            const type = this.WORKOUT_TYPES.find(t => t.id === typeId);
            const isNew = !existing;

            if (isNew) {
                App.showToast(`${type ? type.icon : '✓'} Séance planifiée !`);
                App.haptic('light');
            } else {
                App.showToast(`${type ? type.icon : '✓'} Séance ${type ? type.name : typeId} modifiée`);
            }
        }

        if (typeof SyncService !== 'undefined') SyncService.autoSync();
        this.render();
    },

    toggleDone() {
        const today = Storage._dateKey();
        const gym = Storage._get('gym_' + today, null);
        if (!gym) return;

        const wasDone = gym.done || false;
        gym.done = !wasDone;
        Storage._set('gym_' + today, gym);

        if (gym.done) {
            // Gratification on marking done
            Storage.addCoins(5);
            const type = this.WORKOUT_TYPES.find(t => t.id === gym.type);
            App.showToast(`${type ? type.icon : '✓'} Séance effectuée ! +5 🪙`);
            App.haptic('success');
            setTimeout(() => {
                const todayCard = document.querySelector('.gym-today-card');
                if (todayCard) {
                    todayCard.classList.add('gym-goal-reached');
                    setTimeout(() => todayCard.classList.remove('gym-goal-reached'), 1500);
                }
                // Floating coins on the done button
                const doneBtn = document.querySelector('.gym-done-btn');
                if (doneBtn) {
                    const coin = document.createElement('div');
                    coin.textContent = '+5 🪙';
                    coin.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:16px;font-weight:700;color:var(--primary);pointer-events:none;opacity:1;transition:all 0.8s ease-out;z-index:10';
                    doneBtn.style.position = 'relative';
                    doneBtn.appendChild(coin);
                    requestAnimationFrame(() => {
                        coin.style.top = '-10px';
                        coin.style.opacity = '0';
                    });
                    setTimeout(() => coin.remove(), 900);
                }
            }, 100);
        } else {
            // Undo: remove coins
            Storage.addCoins(-5);
            App.showToast('Séance marquée comme non effectuée');
            App.haptic('light');
        }

        if (typeof SyncService !== 'undefined') SyncService.autoSync();
        this.render();
    },

    _removeToday() {
        const today = Storage._dateKey();
        Storage._set('gym_' + today, null);
        localStorage.removeItem('nutritrack_gym_' + today);
        App.showToast('Séance supprimée');
        if (typeof SyncService !== 'undefined') SyncService.autoSync();
        this.render();
    },

    _getWeekStats() {
        const today = new Date();
        const dayOfWeek = (today.getDay() + 6) % 7;
        let done = 0;
        const typeCounts = {};

        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - dayOfWeek + i);
            const key = Storage._dateKey(d);
            const gym = Storage._get('gym_' + key, null);
            if (gym && gym.type !== 'rest') {
                if (gym.done) done++;
                typeCounts[gym.type] = (typeCounts[gym.type] || 0) + 1;
            }
        }

        const goals = Storage._get('gym_goals', { perWeek: 4 });
        const types = Object.entries(typeCounts).map(([id, count]) => {
            const t = this.WORKOUT_TYPES.find(wt => wt.id === id);
            return { id, count, icon: t?.icon || '✓', color: t?.color || '#999' };
        });

        return { done, planned: goals.perWeek, types };
    },

    _getMonthStats() {
        const firstDay = new Date(this._currentYear, this._currentMonth, 1);
        const lastDay = new Date(this._currentYear, this._currentMonth + 1, 0);
        let total = 0, streak = 0, maxStreak = 0, restDays = 0, currentStreak = 0;

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const d = new Date(this._currentYear, this._currentMonth, day);
            const key = Storage._dateKey(d);
            const gym = Storage._get('gym_' + key, null);

            if (gym) {
                if (gym.type === 'rest') {
                    restDays++;
                    currentStreak = 0;
                } else {
                    total++;
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                }
            } else {
                currentStreak = 0;
            }
        }

        return { total, streak: maxStreak, restDays };
    },

    _selectDay(key) {
        const gym = Storage._get('gym_' + key, null);
        const typeBtns = this.WORKOUT_TYPES.map(t => `
            <button class="btn btn-outline" onclick="GymPage.logWorkout('${t.id}','${key}');Modal.close()" style="padding:10px;text-align:center">
                <div style="font-size:20px">${t.icon}</div>
                <div style="font-size:11px;font-weight:600;color:${t.color}">${t.name}</div>
            </button>
        `).join('');

        Modal.show(`
            <div class="modal-title">${key}</div>
            ${gym ? `
                <p style="color:var(--text-secondary);margin-bottom:12px">
                    Séance : <strong>${this.WORKOUT_TYPES.find(t => t.id === gym.type)?.name || gym.type}</strong>
                </p>
            ` : ''}
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
                ${typeBtns}
            </div>
            ${gym ? `<button class="btn btn-outline" onclick="Storage._set('gym_${key}',null);localStorage.removeItem('nutritrack_gym_${key}');if(typeof SyncService!=='undefined')SyncService.autoSync();Modal.close();GymPage.render()" style="width:100%;color:var(--danger);border-color:var(--danger)">Supprimer</button>` : ''}
        `);
    },

    _editGoals() {
        const goals = Storage._get('gym_goals', { perWeek: 4, types: ['push', 'pull', 'legs', 'cardio'] });

        Modal.show(`
            <div class="modal-title">Objectifs salle</div>
            <div style="margin-bottom:16px">
                <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Séances par semaine</label>
                <input type="number" id="gym-goal-week" value="${goals.perWeek}" min="1" max="7" class="form-input" style="width:100%">
            </div>
            <div style="margin-bottom:16px">
                <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Types d'entraînement</label>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                    ${this.WORKOUT_TYPES.filter(t => t.id !== 'rest').map(t => `
                        <label style="display:flex;align-items:center;gap:4px;padding:6px 10px;border:1.5px solid ${goals.types.includes(t.id) ? t.color : 'var(--border)'};border-radius:10px;cursor:pointer;background:${goals.types.includes(t.id) ? t.color + '15' : 'transparent'}">
                            <input type="checkbox" value="${t.id}" ${goals.types.includes(t.id) ? 'checked' : ''} style="display:none" class="gym-goal-type">
                            <span style="font-size:12px">${t.icon} ${t.name}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <button class="btn btn-primary" onclick="GymPage._saveGoals()" style="width:100%">Enregistrer</button>
        `);

        // Toggle chips
        setTimeout(() => {
            document.querySelectorAll('.gym-goal-type').forEach(cb => {
                cb.parentElement.onclick = (e) => {
                    if (e.target === cb) return;
                    cb.checked = !cb.checked;
                    const t = this.WORKOUT_TYPES.find(wt => wt.id === cb.value);
                    cb.parentElement.style.borderColor = cb.checked ? t.color : 'var(--border)';
                    cb.parentElement.style.background = cb.checked ? t.color + '15' : 'transparent';
                };
            });
        }, 100);
    },

    _saveGoals() {
        const perWeek = parseInt(document.getElementById('gym-goal-week')?.value) || 4;
        const types = [];
        document.querySelectorAll('.gym-goal-type:checked').forEach(cb => types.push(cb.value));
        Storage._set('gym_goals', { perWeek, types: types.length > 0 ? types : ['push', 'pull', 'legs'] });
        if (typeof SyncService !== 'undefined') SyncService.autoSync();
        Modal.close();
        App.showToast('Objectifs mis à jour');
        this.render();
    },

    // === ROUTINE HEBDO ===
    _getRoutine() {
        return Storage._get('gym_routine', { lun: null, mar: null, mer: null, jeu: null, ven: null, sam: null, dim: null });
    },

    _renderRoutine() {
        const routine = this._getRoutine();
        const days = [['lun','Lun'],['mar','Mar'],['mer','Mer'],['jeu','Jeu'],['ven','Ven'],['sam','Sam'],['dim','Dim']];
        const hasRoutine = Object.values(routine).some(v => v);
        if (!hasRoutine) return '<p style="text-align:center;color:var(--text-secondary);font-size:13px">Aucune routine configurée</p>';
        return `<div style="display:flex;gap:4px">${days.map(([key, label]) => {
            const typeId = routine[key];
            const type = typeId ? this.WORKOUT_TYPES.find(t => t.id === typeId) : null;
            return `<div style="flex:1;text-align:center"><div style="font-size:10px;color:var(--text-secondary);margin-bottom:4px">${label}</div><div style="width:28px;height:28px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;${type ? `background:${type.color}20;border:1.5px solid ${type.color}` : 'border:1.5px dashed var(--border)'};font-size:${type ? '14px' : '10px'}">${type ? type.icon : '—'}</div></div>`;
        }).join('')}</div>`;
    },

    _editRoutine() {
        const routine = this._getRoutine();
        const days = [['lun','Lundi'],['mar','Mardi'],['mer','Mercredi'],['jeu','Jeudi'],['ven','Vendredi'],['sam','Samedi'],['dim','Dimanche']];
        const typeOptions = '<option value="">Repos</option>' + this.WORKOUT_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('');

        Modal.show(`
            <div class="modal-title">Routine hebdomadaire</div>
            <p style="color:var(--text-secondary);font-size:12px;margin-bottom:12px">Les séances seront pré-remplies chaque semaine automatiquement.</p>
            ${days.map(([key, label]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                    <span style="font-size:13px;font-weight:600;min-width:80px">${label}</span>
                    <select class="form-select gym-routine-select" data-day="${key}" style="flex:1;max-width:180px;padding:8px;font-size:13px">
                        ${typeOptions.replace(`value="${routine[key]}"`, `value="${routine[key]}" selected`)}
                    </select>
                </div>
            `).join('')}
            <button class="btn btn-primary" onclick="GymPage._saveRoutine()" style="width:100%;margin-top:12px">Enregistrer</button>
        `);
    },

    _saveRoutine() {
        const routine = {};
        document.querySelectorAll('.gym-routine-select').forEach(sel => {
            routine[sel.dataset.day] = sel.value || null;
        });
        Storage._set('gym_routine', routine);
        if (typeof SyncService !== 'undefined') SyncService.autoSync();
        Modal.close();
        App.showToast('Routine mise à jour !');
        // Auto-fill this week's sessions from routine
        this._applyRoutine();
        this.render();
    },

    _applyRoutine() {
        const routine = this._getRoutine();
        const dayKeys = ['lun','mar','mer','jeu','ven','sam','dim'];
        const today = new Date();
        const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - dayOfWeek + i);
            const key = Storage._dateKey(d);
            const existing = Storage._get('gym_' + key, null);
            if (!existing) {
                const routineDay = ['lun','mar','mer','jeu','ven','sam','dim'][i];
                const typeId = routine[routineDay];
                if (typeId) {
                    Storage._set('gym_' + key, { type: typeId, time: new Date().toISOString(), done: false });
                }
            }
        }
    },

    _prevMonth() {
        this._currentMonth--;
        if (this._currentMonth < 0) {
            this._currentMonth = 11;
            this._currentYear--;
        }
        this.render();
    },

    _nextMonth() {
        this._currentMonth++;
        if (this._currentMonth > 11) {
            this._currentMonth = 0;
            this._currentYear++;
        }
        this.render();
    },

    _getMonthName(m) {
        return ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][m];
    }
};
