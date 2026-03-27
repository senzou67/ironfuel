// ===== CREATURE SYSTEM =====
// 3 starters (fire/plant/water) × 4 evolution forms, with progressive muscle
// Pixel art sprite-based rendering
const Creature = {
    // Evolution thresholds (day-based: active days logged)
    FORMS: [
        { minDays: 0, label: 'Bébé' },
        { minDays: 10, label: 'Juvénile' },
        { minDays: 40, label: 'Adolescent' },
        { minDays: 100, label: 'Ultime' }
    ],

    // Species names per type per form
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

    // Motivational messages
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

    // === DATA GETTERS ===
    getData() {
        return Storage.getCreature() || { type: 'fire', xp: 0, form: 1, chosen: false };
    },

    // Get active days count (number of days with at least one logged meal)
    getActiveDays() {
        return (Storage.getLogDates() || []).length;
    },

    getForm(xpOrDays) {
        // Use active days for evolution
        const days = this.getActiveDays();
        if (days >= 100) return 3;
        if (days >= 40) return 2;
        if (days >= 10) return 1;
        return 0;
    },

    getMuscleProgress(xpOrDays) {
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

    // === MOOD ===
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

    // === XP & STREAK ===
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
        // Premium: 1 freeze every 10 days of streak (max 1 at a time)
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
    // PIXEL ART SPRITE SYSTEM
    // ============================================
    // Color map: character -> color per type
    // '.' = transparent, 'O' = outline, 'M' = main, 'L' = light, 'H' = highlight, 'D' = dark, 'W' = white, 'E' = eye/black
    SPRITE_PALETTES: {
        fire:  { O: '#222222', M: '#E64A19', L: '#FF8A50', H: '#FFD180', D: '#8B1A00', W: '#FFFFFF', E: '#111111' },
        plant: { O: '#222222', M: '#4CAF50', L: '#81C784', H: '#C8E6C9', D: '#1B5E20', W: '#FFFFFF', E: '#111111' },
        water: { O: '#222222', M: '#1E88E5', L: '#64B5F6', H: '#BBDEFB', D: '#0D47A1', W: '#FFFFFF', E: '#111111' }
    },

    PIXEL_SIZE: 3,

    // ============================================
    // SPRITE DEFINITIONS — 12 sprites (3 types × 4 forms)
    // Each sprite is an array of strings, each string is a row
    // ============================================
    SPRITES: {
        // ========== FIRE TYPE — Chimchar→Monferno→Infernape inspired ==========
        fire: [
            // Form 0: Braisinge — Chimchar-like: cute chimp, upright, flame tail, happy (12×14)
            [
                '....OHHO....',
                '...OHHHLO...',
                '..OOMMMOO...',
                '..OMWEWEOO..',
                '..OMMLMMO...',
                '..OMMMMMO...',
                '...OLLLLO...',
                '..OOMMMMOO..',
                '..OM.OMMO.MO',
                '..OO.OMMO.OO',
                '.....OMMO...',
                '.....ODDO...',
                '....OHHHO...',
                '.....OHHO...',
            ],
            // Form 1: Pyrosinge — Monferno-like: martial pose, flame on head, athletic (16×18)
            [
                '......OHHHHO........',
                '.....OHHLLLHO.......',
                '....OHHLLLHHO.......',
                '....OOMMMMMOO.......',
                '...OMWEMOWEMOO......',
                '...OMMMDDMMMO.......',
                '...OMMMMMMMO........',
                '....OLLLLLLO........',
                '...OOMMMMMMOO.......',
                '..OHMOMMMMO.MO.....',
                '..OHMO.OMMO..MO....',
                '..OHO..OMMO..OO....',
                '.......OMMO.........',
                '......ODMDO.........',
                '......OO.OO.........',
                '..........OHHHHO....',
                '...........OHHHO....',
                '............OHO.....',
            ],
            // Form 2: Ignisinge — Between Monferno/Infernape: fierce, flame crown growing (20×22)
            [
                '.....OHHHHHO............',
                '....OHHLLLHHHO..........',
                '...OHHLLLLLHHO..........',
                '...OHHLLLLHHO...........',
                '...OOOMMMMMMOOO.........',
                '..OOMWEMOMWEMOO.........',
                '..OOMMMDDDDMOO.........',
                '..OOMMMMMMMMMOO.........',
                '...OOLLLLLLLOO..........',
                '..OOMMMMMMMMMOO.........',
                '.OHM.OMMMMMMO.MHO......',
                '.OHM..OMMMMMO..MHO.....',
                '.OHO..OMMMMMO..OHO.....',
                '......OMMMLMMO.........',
                '......OMMMMMO...........',
                '.......ODMDO............',
                '.......OD.DO............',
                '.......OO.OO............',
                '..........OHHHHHO.......',
                '...........OHHHHO.......',
                '............OHHHO.......',
                '.............OHO........',
            ],
            // Form 3: Volcanosinge — Infernape-like: full flame crown/mane, martial master (24×26)
            [
                '......OHHHHHHHO...............',
                '.....OHHLLLLLHHHO.............',
                '....OHHLLLLLLLHHO.............',
                '...OHHHLLLLLLLHHHO............',
                '...OHHHLLLLLLHHHHO............',
                '...OHHHOOMMMMOOHHHO...........',
                '....OOOMWWEMWWEMOOO...........',
                '....OOMMMMDDDMMMOO...........',
                '....OOMMMMMMMMMOO.............',
                '....OOOLLLLLLLLOOO............',
                '...OOMMMMMMMMMMMOO............',
                '..OHMM.OMMMMMMO.MMHO.........',
                '..OHMM..OMMMMMO..MMHO........',
                '.OHHMO..OMMMMMO..OMHHO.......',
                '.OHHO...OMMMMMMO...OHHO......',
                '.OHO....OMMLMMMO....OHO......',
                '........OMMMMMO...............',
                '.........ODMDO................',
                '........ODD.DDO...............',
                '........OOO.OOO...............',
                '..............OHHHHHHO........',
                '...............OHHHHHO........',
                '................OHHHHO........',
                '..................OHO.........',
            ],
        ],

        // ========== PLANT TYPE — Treecko→Grovyle→Sceptile inspired ==========
        plant: [
            // Form 0: Feuillard — Treecko-like: small gecko upright, big eyes, leaf tail, confident (12×14)
            [
                '...OOMOO....',
                '..OMWEWEO...',
                '..OMWEWEO...',
                '..OMMMMMO...',
                '..OMLLLMO...',
                '...OMMMO....',
                '...OMLMO....',
                '..OOMMMOO...',
                '..OM.O.MO...',
                '..OD.O.DO...',
                '..OO...OO...',
                '.....OHHO...',
                '....OHHHO...',
                '.....OHO....',
            ],
            // Form 1: Foliarex — Grovyle-like: sleek, fast, leaf blades on arms, athletic (16×18)
            [
                '..OHHHO.............',
                '..OHHLHO............',
                '...OOMMMOO..........',
                '..OMWEMWEMO.........',
                '..OMMMMMMMO.........',
                '..OMMLLLMMO.........',
                '...OMMMMO...........',
                'OHHOMLMMO...........',
                'OHHO.MMMO...........',
                '.OHO.OMMMOOHH......',
                '......OMMO..OHH....',
                '......OMMO...OHO...',
                '.....ODMDO..........',
                '.....OD.DO..........',
                '.....OO.OO.........',
                '.......OHHHO.......',
                '........OHHO.......',
                '.........OO........',
            ],
            // Form 2: Sylvarex — Between Grovyle/Sceptile: muscular, bigger leaf crest (20×22)
            [
                '...OHHHHHO..............',
                '..OHHLLLHHO.............',
                '..OHHLLHHO..............',
                '...OOOMMMMOOO...........',
                '..OOMWEMOWEMOO..........',
                '..OOMMMMMMMOO...........',
                '..OOMMLLLMMOO...........',
                '...OOMMMMMOO............',
                'OHHOOMMLMMOO............',
                'OHHHO.MMMMMOO..........',
                '.OHHO.OMMMMMOOHH.......',
                '..OHO..OMMMMO.OHHO.....',
                '.......OMMMMO..OHO.....',
                '......ODMMMDO...........',
                '......OD..DO............',
                '......OD..DO............',
                '......OO..OO............',
                '.........OHHHHO.........',
                '..........OHHHO.........',
                '...........OHHO.........',
                '............OHO.........',
            ],
            // Form 3: Florasaure — Sceptile-like: tall, powerful, leaf blade tail, seed pods, regal (24×26)
            [
                '.....OHHHHHHO...............',
                '....OHHLLLLLHO..............',
                '...OHHHLLLLLHHO.............',
                '...OHHHLLLLHHO..............',
                '....OOOOMMMMMMOOO..........',
                '...OOMWWEMOWWEMOO..........',
                '...OOMMMMDDMMMMOO..........',
                '...OOMMMMMMMMMOO...........',
                '...OOMMLLLLLMMOO...........',
                '....OOMMMMMMMOO............',
                'OHHHOOMMMMMMMOO............',
                'OHHHO.OMMLMMMO.............',
                '.OHHO..OMMMMMMOHHH.........',
                '..OHO..OMMMMMO.OHHO........',
                '........OMMMMO..OHHO.......',
                '.......ODMMMDO...OHO.......',
                '.......ODD.DDO.............',
                '.......OOO.OOO.............',
                '.............OHHO...........',
                '............OHHHO...........',
                '...........OHHMHHO..........',
                '..........OHH.MHHO.........',
                '..........OHO.OHHO.........',
                '.........OHO...OHO.........',
                '.........OO.....OO.........',
            ],
        ],

        // ========== WATER TYPE — Eevee/Vaporeon inspired ==========
        water: [
            // Form 0: Aquarein — Eevee-like kitten, water-themed, fin ears, cute (12×14)
            [
                '.OHO....OHO.',
                '.OMMO..OMMO.',
                '..OOMMMOO...',
                '..OMWEWEOO..',
                '..OMMLLMO...',
                '..OMMMMMO...',
                '...OMLMO....',
                '...OMLMO....',
                '..OOMMMOO...',
                '..OM...MO...',
                '..OD...DO...',
                '..OO...OO...',
                '.......OHO..',
                '.......OO...',
            ],
            // Form 1: Torrentad — Young Vaporeon: sleek, fins developing, athletic (16×18)
            [
                '.OHHO......OHHO.',
                '.OHMMO....OMMHO.',
                '..OOMMO..OMMOO..',
                '..OOMMMMMMMOO...',
                '..OMWEMOWEMOO...',
                '..OMMMLLLMMOO...',
                '..OMMMMMMMMO....',
                '...OMMLLLMMO....',
                '...OMMMMMMOO....',
                '..OOMMLMMOO.....',
                '..OD..OMMO..DO..',
                '..OD..OMMO..DO..',
                '..OO..ODDO..OO..',
                '......OO.OO.....',
                '........OHHHO...',
                '.........OHHO...',
                '..........OHO...',
                '..........OO....',
            ],
            // Form 2: Marivigueur — Athletic Vaporeon: full fins, tail fin, water collar (20×22)
            [
                '..OHHO........OHHO..',
                '..OHHMOO....OOMHHO..',
                '...OMMMO....OMMMO...',
                '..OHOOMMMMMMOOHOO...',
                '..OHHOMMMMMMOHHOO...',
                '...OOOMWEMOWEOOO....',
                '...OOMMMMLMMMMOO....',
                '..OHMMLLLLLMMHOO....',
                '..OHOMMMMMMMMOHOO...',
                '...OOMMMMMMMMOO.....',
                '...OOMMLLLMMOO......',
                '...OOMMMMMMOO.......',
                '...OD..OMMO..DO.....',
                '...OD..OMMO..DO.....',
                '...OO..ODDO..OO.....',
                '......OO..OO........',
                '.........OHHHHO.....',
                '..........OHHHO.....',
                '...........OHHO.....',
                '............OHO.....',
                '............OO......',
            ],
            // Form 3: Oceanforce — Majestic Vaporeon: mermaid tail, flowing fins, regal (24×26)
            [
                '..OHHHO..........OHHHO..',
                '..OHHMMOO......OOMMHHO..',
                '...OHMMMO......OMMMHO...',
                '..OHHOOMMMMMMMMOOHHO....',
                '..OHHHOMMMMMMMMOHHHHO...',
                '...OHHOOMMMMMMOOHHO.....',
                '...OOOMWWEMOWWEMOO......',
                '..OHMMMMLLLLLMMMHOO.....',
                '..OHHMMMMMMMMMMHHO......',
                '..OHHMMLLLLLMMHHO.......',
                '...OOMMMMMMMMOO.........',
                '...OOMMMMMMMOO..........',
                '...OOMMLLLMMOO..........',
                '...OOMMMMMMOO...........',
                '....OD..OMMO..DO........',
                '....OD..OMMO..DO........',
                '....OO..ODDO..OO........',
                '........OO..OO..........',
                '..........OHHHHO........',
                '..........OHHHHHO.......',
                '.........OHHLLLHHO......',
                '........OHHLLLLLHO......',
                '........OHHLLLLHO.......',
                '.........OHHHHHO........',
                '..........OOOO..........',
            ],
        ],
    },

    // ============================================
    // SPRITE RENDERER — converts sprite map to SVG <rect> elements
    // ============================================
    _renderSprite(type, form) {
        const sprite = this.SPRITES[type]?.[form];
        if (!sprite) return '';

        const pal = this.SPRITE_PALETTES[type];
        const ps = this.PIXEL_SIZE; // pixel size = 3
        let rects = '';

        // Calculate sprite dimensions to center it
        const spriteH = sprite.length;
        const spriteW = Math.max(...sprite.map(r => r.length));

        // Center the sprite in the 32×32 grid
        const offsetX = Math.floor((32 - spriteW) / 2);
        const offsetY = Math.floor((32 - spriteH) / 2);

        for (let y = 0; y < sprite.length; y++) {
            const row = sprite[y];
            for (let x = 0; x < row.length; x++) {
                const ch = row[x];
                if (ch === '.') continue;

                let color = null;
                switch (ch) {
                    case 'O': color = pal.O; break;
                    case 'M': color = pal.M; break;
                    case 'L': color = pal.L; break;
                    case 'H': color = pal.H; break;
                    case 'D': color = pal.D; break;
                    case 'W': color = pal.W; break;
                    case 'E': color = pal.E; break;
                    default: continue;
                }

                const px = (offsetX + x) * ps;
                const py = (offsetY + y) * ps;
                rects += `<rect x="${px}" y="${py}" width="${ps}" height="${ps}" fill="${color}"/>`;
            }
        }

        return rects;
    },

    // === MAIN SVG BUILDER ===
    buildSVG(size, options = {}) {
        const data = options.creatureData || this.getData();
        const type = data.type || 'fire';
        const form = data.form !== undefined ? data.form : this.getForm();
        const mood = options.mood || this.getMood();

        let svg = `<svg viewBox="0 0 96 96" width="${size}" height="${size}" class="creature-svg ${mood === 'celebrating' ? 'creature-bounce' : ''}" style="overflow:visible">`;

        // Idle breathing animation — subtle translateY
        svg += `<g>`;
        svg += `<animateTransform attributeName="transform" type="translate" values="0,0;0,-1;0,0" dur="2.5s" repeatCount="indefinite"/>`;

        // Render the pixel sprite
        svg += this._renderSprite(type, form);

        svg += `</g>`;
        svg += '</svg>';
        return svg;
    },

    // === DASHBOARD COMPACT CARD ===
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

    // === STARTER CHOICE MODAL (for migration / fallback) ===
    _showStarterModal(callback) {
        const firePreview = this.buildSVG(80, { creatureData: { type: 'fire', xp: 0, form: 1, chosen: true }, mood: 'happy', previewItems: [] });
        const plantPreview = this.buildSVG(80, { creatureData: { type: 'plant', xp: 0, form: 1, chosen: true }, mood: 'happy', previewItems: [] });
        const waterPreview = this.buildSVG(80, { creatureData: { type: 'water', xp: 0, form: 1, chosen: true }, mood: 'happy', previewItems: [] });

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
