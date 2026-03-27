// ===== CREATURE SYSTEM =====
// 3 starters (fire/plant/water) × 4 evolution forms
// Pixel art PNG sprite-based rendering
const Creature = {
    FORMS: [
        { minDays: 0, label: 'Bébé' },
        { minDays: 10, label: 'Juvénile' },
        { minDays: 40, label: 'Adolescent' },
        { minDays: 100, label: 'Ultime' }
    ],

    NAMES: {
        fire:  ['Braisinge', 'Pyrosinge', 'Ignisinge', 'Volcanosinge'],
        plant: ['Feuillard', 'Foliarex', 'Sylvarex', 'Florasaure'],
        water: ['Aquarein', 'Torrentad', 'Marivigueur', 'Oceanforce']
    },

    PALETTES: {
        fire:  { main: '#E64A19', light: '#FF6D00', accent: '#FFAB00', dark: '#BF360C', bg1: '#FBE9E7', bg2: '#FFCCBC' },
        plant: { main: '#4CAF50', light: '#81C784', accent: '#C8E6C9', dark: '#2E7D32', bg1: '#E8F5E9', bg2: '#C8E6C9' },
        water: { main: '#1E88E5', light: '#64B5F6', accent: '#90CAF9', dark: '#0D47A1', bg1: '#E3F2FD', bg2: '#BBDEFB' }
    },

    TYPE_EMOJI: { fire: '🔥', plant: '🌿', water: '💧' },

    messages: {
        celebrating: [
            'MACHINE !', 'Objectif atteint ! 💪', 'Inarrêtable !',
            'BEAST MODE ! 🔥', 'No pain no gain !', 'Tu gères !'
        ],
        happy: [
            'On continue !', 'Bonne journée !', 'Feed the beast !',
            'Tu progresses ! 💪', 'Encore un effort !'
        ],
        encouraging: [
            'Allez, on mange !', 'N\'oublie pas ton repas !',
            'Ton compagnon a faim !', 'Ajoute un repas ! 🍽️'
        ]
    },

    getData() {
        return Storage.getCreature() || { type: 'fire', xp: 0, form: 1, chosen: false };
    },

    getActiveDays() {
        return (Storage.getLogDates() || []).length;
    },

    getForm() {
        const days = this.getActiveDays();
        if (days >= 100) return 3;
        if (days >= 40) return 2;
        if (days >= 10) return 1;
        return 0;
    },

    getMuscleProgress() {
        const days = this.getActiveDays();
        const form = this.getForm();
        const thresholds = [0, 10, 40, 100, 999];
        const min = thresholds[form];
        const max = thresholds[form + 1];
        return Math.min(1, (days - min) / (max - min));
    },

    getSpeciesName(type, form) {
        return this.NAMES[type]?.[form] || this.NAMES.fire[0];
    },

    getNextFormDays(form) {
        const thresholds = [10, 40, 100, null];
        return thresholds[form];
    },

    getMood() {
        const goals = Storage.getGoals();
        const totals = Storage.getDayTotals();
        const log = Storage.getDayLog();
        const mealsToday = Object.values(log.meals).filter(m => m.length > 0).length;
        const pct = goals.calories > 0 ? (totals.calories / goals.calories) * 100 : 0;
        if (pct >= 85 && pct <= 115 && mealsToday >= 3) return 'celebrating';
        if (pct >= 40 || mealsToday >= 2) return 'happy';
        return 'encouraging';
    },

    getMessage(mood) {
        const msgs = this.messages[mood] || this.messages.encouraging;
        return msgs[Math.floor(Math.random() * msgs.length)];
    },

    checkAndAwardXP() {
        if (!Storage.hasChosenStarter()) return;
        if (Storage.hasXPBeenAwardedToday()) return;
        const log = Storage.getDayLog();
        const hasMeal = Object.values(log.meals).some(m => m.length > 0);
        if (!hasMeal) return;

        const streak = Storage.getCreatureStreak();
        const today = App._localDateKey();

        if (streak.lastActiveDate) {
            const last = new Date(streak.lastActiveDate);
            const now = new Date(today);
            const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                streak.current++;
            } else if (diffDays === 2 && streak.freezesOwned > 0) {
                streak.freezesOwned--;
                streak.freezesUsed.push(streak.lastActiveDate);
                streak.current++;
            } else if (diffDays > 1) {
                streak.current = 1;
            }
        } else {
            streak.current = 1;
        }

        streak.lastActiveDate = today;
        if (streak.current > streak.best) streak.best = streak.current;
        if (streak.current > 0 && streak.current % 10 === 0 && TrialService.isPaid() && streak.freezesOwned < 1) {
            streak.freezesOwned++;
            App.showToast('🧊 Freeze gagné ! Tu peux rater 1 jour sans perdre ton streak');
        }
        Storage.setCreatureStreak(streak);

        const streakBonus = Math.min(10, Math.floor(streak.current * 0.5));
        const xp = 10 + streakBonus;
        Storage.addCreatureXP(xp);
        Storage.markXPAwarded();
        return { xp, streak };
    },

    // ============================================
    // PIXEL ART SPRITE SYSTEM — PNG images
    // ============================================
    buildSVG(size, options = {}) {
        const data = options.creatureData || this.getData();
        const type = data.type || 'fire';
        const form = data.form !== undefined ? data.form : this.getForm();
        const mood = options.mood || this.getMood();
        const src = '/assets/creatures/' + type + '_' + form + '.png';

        return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" class="creature-svg ' + (mood === 'celebrating' ? 'creature-bounce' : '') + '" style="overflow:visible;image-rendering:pixelated">'
            + '<g><animateTransform attributeName="transform" type="translate" values="0,0;0,-1;0,0" dur="2.5s" repeatCount="indefinite"/>'
            + '<image href="' + src + '" x="0" y="0" width="64" height="64" style="image-rendering:pixelated"/>'
            + '</g></svg>';
    },

    render() {
        const data = this.getData();
        if (!data.chosen) return '';

        const form = this.getForm();
        const speciesName = this.getSpeciesName(data.type, form);
        const playerName = Storage.getProfile().name || 'Dresseur';
        const mood = this.getMood();
        const message = this.getMessage(mood);
        const coins = Storage.getCoins();
        const days = this.getActiveDays();
        const nextDays = this.getNextFormDays(form);
        const pal = this.PALETTES[data.type];

        let xpInfo = '';
        if (nextDays) {
            const pct = Math.min(100, (days / nextDays) * 100);
            xpInfo = `<div class="creature-xp-mini"><div class="creature-xp-bar-mini"><div class="creature-xp-fill-mini" style="width:${pct}%;background:${pal.main}"></div></div><span>Jour ${days} / ${nextDays}</span></div>`;
        } else {
            xpInfo = `<div class="creature-xp-mini"><span>MAX — Jour ${days}</span></div>`;
        }

        return `
            <div class="card creature-card" onclick="App.navigate('avatar')" style="cursor:pointer;border-left:3px solid ${pal.main}">
                <div class="creature-card-inner">
                    <div class="creature-card-svg">${this.buildSVG(64, { mood })}</div>
                    <div class="creature-card-info">
                        <div class="creature-speech-bubble">${message}</div>
                        <div class="creature-card-name">${speciesName} <span style="opacity:0.6;font-size:11px">(${playerName})</span></div>
                        ${xpInfo}
                    </div>
                    <div class="creature-card-coins">${coins} 🪙</div>
                </div>
            </div>`;
    },

    _showStarterModal(callback) {
        const firePreview = this.buildSVG(80, { creatureData: { type: 'fire', xp: 0, form: 0, chosen: true }, mood: 'happy' });
        const plantPreview = this.buildSVG(80, { creatureData: { type: 'plant', xp: 0, form: 0, chosen: true }, mood: 'happy' });
        const waterPreview = this.buildSVG(80, { creatureData: { type: 'water', xp: 0, form: 0, chosen: true }, mood: 'happy' });

        Modal.show(`
            <div style="text-align:center">
                <div class="modal-title">Choisis ton compagnon !</div>
                <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">Il t'accompagnera dans ton aventure fitness.</p>
                <div class="starter-choice-grid">
                    <div class="starter-card" onclick="Creature._pickStarter('fire',${callback ? 'true' : 'false'})">
                        ${firePreview}
                        <div class="starter-name">Braisinge</div>
                        <div class="starter-type">🔥 Feu</div>
                    </div>
                    <div class="starter-card" onclick="Creature._pickStarter('plant',${callback ? 'true' : 'false'})">
                        ${plantPreview}
                        <div class="starter-name">Feuillard</div>
                        <div class="starter-type">🌿 Plante</div>
                    </div>
                    <div class="starter-card" onclick="Creature._pickStarter('water',${callback ? 'true' : 'false'})">
                        ${waterPreview}
                        <div class="starter-name">Aquarein</div>
                        <div class="starter-type">💧 Eau</div>
                    </div>
                </div>
            </div>
        `);
        this._starterCallback = callback;
    },

    _pickStarter(type, hasCallback) {
        Storage.setCreature({ type, xp: 0, form: 1, chosen: true });
        Storage.setCreatureStreak({ current: 0, best: 0, lastActiveDate: null, freezesOwned: 0, freezesUsed: [] });
        Modal.close();
        App.showToast(`${this.getSpeciesName(type, 0)} t'a choisi ! 🎉`);
        if (this._starterCallback) {
            this._starterCallback();
            this._starterCallback = null;
        }
    }
};

// Backward compat
const Avatar = Creature;
