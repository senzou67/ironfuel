// ===== CREATURE SYSTEM =====
// 3 starters (fire/plant/water) × 4 evolution forms, with progressive muscle
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
        fire:  ['Flamoussin', 'Flamador', 'Flamigor', 'Infernox'],
        plant: ['Herbachat', 'Verdifelin', 'Sylvatigre', 'Floracolosse'],
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
        const today = new Date().toISOString().split('T')[0];

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

    // === BODY PARAMS (cosmetics adapt to these) ===
    _getBodyParams(type, form, mp) {
        const bases = {
            fire: [
                { headY: 30, headR: 18, bodyY: 55, bodyW: 22, bodyH: 20, shoulderW: 18, neckY: 42, feetY: 80, armY: 52, scale: 0.7 },
                { headY: 25, headR: 16, bodyY: 50, bodyW: 24, bodyH: 26, shoulderW: 22, neckY: 38, feetY: 82, armY: 46, scale: 0.85 },
                { headY: 20, headR: 15, bodyY: 46, bodyW: 26, bodyH: 32, shoulderW: 28, neckY: 33, feetY: 85, armY: 42, scale: 0.95 },
                { headY: 16, headR: 14, bodyY: 42, bodyW: 30, bodyH: 38, shoulderW: 34, neckY: 28, feetY: 88, armY: 38, scale: 1.0 }
            ],
            plant: [
                { headY: 32, headR: 17, bodyY: 56, bodyW: 20, bodyH: 18, shoulderW: 16, neckY: 44, feetY: 78, armY: 53, scale: 0.7 },
                { headY: 26, headR: 15, bodyY: 50, bodyW: 23, bodyH: 26, shoulderW: 22, neckY: 38, feetY: 82, armY: 46, scale: 0.85 },
                { headY: 20, headR: 14, bodyY: 45, bodyW: 26, bodyH: 32, shoulderW: 28, neckY: 33, feetY: 85, armY: 42, scale: 0.95 },
                { headY: 16, headR: 14, bodyY: 42, bodyW: 30, bodyH: 38, shoulderW: 34, neckY: 28, feetY: 88, armY: 38, scale: 1.0 }
            ],
            water: [
                { headY: 34, headR: 19, bodyY: 58, bodyW: 24, bodyH: 18, shoulderW: 20, neckY: 46, feetY: 80, armY: 55, scale: 0.7 },
                { headY: 26, headR: 16, bodyY: 50, bodyW: 24, bodyH: 26, shoulderW: 23, neckY: 38, feetY: 82, armY: 46, scale: 0.85 },
                { headY: 20, headR: 15, bodyY: 45, bodyW: 27, bodyH: 32, shoulderW: 29, neckY: 33, feetY: 85, armY: 42, scale: 0.95 },
                { headY: 16, headR: 14, bodyY: 42, bodyW: 30, bodyH: 38, shoulderW: 34, neckY: 28, feetY: 88, armY: 38, scale: 1.0 }
            ]
        };
        const b = bases[type]?.[form] || bases.fire[0];
        return {
            headY: b.headY, headR: b.headR, bodyY: b.bodyY,
            bodyW: b.bodyW + mp * 4, bodyH: b.bodyH + mp * 2,
            shoulderW: b.shoulderW + mp * 4, neckY: b.neckY,
            feetY: b.feetY, armY: b.armY,
            armThick: 3 + form * 1.5 + mp * 2,
            legThick: 3 + form * 1.5 + mp * 1.5,
            scale: b.scale, cx: 50
        };
    },

    // === MAIN SVG BUILDER ===
    buildSVG(size, options = {}) {
        const data = options.creatureData || this.getData();
        const type = data.type || 'fire';
        const form = this.getForm();
        const mp = this.getMuscleProgress();
        const mood = options.mood || this.getMood();
        const pal = this.PALETTES[type];
        const bp = this._getBodyParams(type, form, mp);
        const equipped = options.previewItems || Storage.getEquippedItems();

        // Widen viewBox for wings/auras so they don't clip
        const hasWings = equipped.some(i => i.type === 'wings');
        const hasAura = equipped.some(i => i.type === 'aura');
        // Always use padded viewBox — CSS aura glow needs space even without equipped aura items
        const vb = (hasWings || hasAura) ? '-15 -10 130 120' : '-10 -5 120 110';
        let svg = `<svg viewBox="${vb}" width="${size}" height="${size}" class="creature-svg ${mood === 'celebrating' ? 'creature-bounce' : ''}" style="overflow:visible">`;

        // Premium check for brilliance/aura effects (always shown in shop preview)
        const isPremium = options.previewItems || typeof TrialService === 'undefined' || TrialService.hasFullAccess();

        // Auras — rendered BEHIND everything as ambient background (premium/trial, always in shop preview)
        const auraItem = equipped.find(i => i.type === 'aura');
        if (auraItem && isPremium) {
            svg += this._renderAura(auraItem.id, bp, type, form);
        }

        // Wings — rendered BEHIND the creature body
        const wingsItem = equipped.find(i => i.type === 'wings');
        if (wingsItem) {
            svg += this._renderWings(wingsItem.id, bp, type);
        }

        // Cape renders BEHIND the creature
        const clothesItem = equipped.find(i => i.type === 'clothes');
        if (clothesItem && clothesItem.id === 'clothes_cape') {
            svg += this._renderClothes(clothesItem.id, bp, pal, type);
        }

        // Build creature body
        if (type === 'fire') svg += this._buildFire(form, mp, bp, pal, mood);
        else if (type === 'plant') svg += this._buildPlant(form, mp, bp, pal, mood);
        else svg += this._buildWater(form, mp, bp, pal, mood);

        // Cosmetic overlays (clothes except cape which is already rendered behind)
        if (clothesItem && clothesItem.id !== 'clothes_cape') {
            svg += this._renderClothes(clothesItem.id, bp, pal, type);
        }
        // Cape clasp renders OVER the creature (neck clasp only)
        if (clothesItem && clothesItem.id === 'clothes_cape') {
            svg += this._renderCapeClasp(bp);
        }

        // Per-item specific brilliance for clothes + wings (always active, no premium gate for animations)
        if (clothesItem) svg += this._renderItemBrilliance(clothesItem.id, bp, type, form);
        if (wingsItem) svg += this._renderItemBrilliance(wingsItem.id, bp, type, form);

        const petItem = equipped.find(i => i.type === 'pet');
        if (petItem) {
            svg += this._renderPet(petItem.id, bp);
            // Per-item effects for high-tier pets (phoenix+)
            svg += this._renderPetEffects(petItem.id, bp);
        }

        svg += '</svg>';
        return svg;
    },

    // ============================================
    // FIRE CREATURE — Raptor/Phoenix lineage
    // Flames, feathered wings, ember patterns, fire gem
    // ============================================
    _buildFire(form, mp, bp, pal, mood) {
        let s = '';
        const cx = bp.cx;

        if (form === 0) {
            // Flamoussin — Feisty chick, spiky tuft, wing stubs, ember belly, attitude
            // Body — angular egg
            s += `<polygon points="${cx - bp.bodyW},${bp.bodyY - 4} ${cx - bp.bodyW + 4},${bp.bodyY + bp.bodyH} ${cx + bp.bodyW - 4},${bp.bodyY + bp.bodyH} ${cx + bp.bodyW},${bp.bodyY - 4} ${cx},${bp.bodyY - bp.bodyH + 2}" fill="${pal.main}" />`;
            // Belly ember patch — angular
            s += `<polygon points="${cx - bp.bodyW + 6},${bp.bodyY} ${cx},${bp.bodyY + bp.bodyH - 3} ${cx + bp.bodyW - 6},${bp.bodyY}" fill="${pal.accent}" opacity="0.5" />`;
            // Ember spots on body
            s += `<circle cx="${cx - bp.bodyW + 5}" cy="${bp.bodyY + 3}" r="1.5" fill="${pal.light}" opacity="0.4"><animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="0.2;0.6;0.2" /></circle>`;
            s += `<circle cx="${cx + bp.bodyW - 5}" cy="${bp.bodyY + 5}" r="1.5" fill="${pal.light}" opacity="0.4"><animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0.2;0.6;0.2" /></circle>`;
            // Tail ember — multi-flame, animated (render BEHIND body)
            s += `<polygon points="${cx + 5},${bp.bodyY + bp.bodyH - 3} ${cx + 12},${bp.bodyY + bp.bodyH + 4} ${cx + 9},${bp.bodyY + bp.bodyH - 2} ${cx + 16},${bp.bodyY + bp.bodyH + 1}" fill="${pal.light}" opacity="0.7"><animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="0.5;0.9;0.5" /></polygon>`;
            s += `<polygon points="${cx + 8},${bp.bodyY + bp.bodyH - 1} ${cx + 14},${bp.bodyY + bp.bodyH + 5} ${cx + 11},${bp.bodyY + bp.bodyH}" fill="${pal.accent}" opacity="0.4"><animate attributeName="opacity" dur="0.7s" repeatCount="indefinite" values="0.3;0.7;0.3" /></polygon>`;
            // Wing stubs — angular, feathered edges
            s += `<path d="M${cx - bp.bodyW} ${bp.bodyY - 2} L${cx - bp.bodyW - 6} ${bp.bodyY - 1} L${cx - bp.bodyW - 9} ${bp.bodyY + 3} L${cx - bp.bodyW - 7} ${bp.bodyY + 6} L${cx - bp.bodyW - 3} ${bp.bodyY + 8} L${cx - bp.bodyW + 1} ${bp.bodyY + 5}" fill="${pal.dark}" opacity="0.6" />`;
            s += `<path d="M${cx + bp.bodyW} ${bp.bodyY - 2} L${cx + bp.bodyW + 6} ${bp.bodyY - 1} L${cx + bp.bodyW + 9} ${bp.bodyY + 3} L${cx + bp.bodyW + 7} ${bp.bodyY + 6} L${cx + bp.bodyW + 3} ${bp.bodyY + 8} L${cx + bp.bodyW - 1} ${bp.bodyY + 5}" fill="${pal.dark}" opacity="0.6" />`;
            // Feather lines on stubs
            s += `<line x1="${cx - bp.bodyW - 2}" y1="${bp.bodyY + 1}" x2="${cx - bp.bodyW - 7}" y2="${bp.bodyY + 4}" stroke="${pal.main}" stroke-width="0.5" opacity="0.4" />`;
            s += `<line x1="${cx + bp.bodyW + 2}" y1="${bp.bodyY + 1}" x2="${cx + bp.bodyW + 7}" y2="${bp.bodyY + 4}" stroke="${pal.main}" stroke-width="0.5" opacity="0.4" />`;
            // Head — angular
            s += `<polygon points="${cx - bp.headR},${bp.headY + 4} ${cx - bp.headR + 3},${bp.headY - bp.headR + 2} ${cx},${bp.headY - bp.headR} ${cx + bp.headR - 3},${bp.headY - bp.headR + 2} ${cx + bp.headR},${bp.headY + 4} ${cx},${bp.headY + 6}" fill="${pal.main}" />`;
            // Spiky flame tuft — 4 animated spikes
            s += `<polygon points="${cx - 5},${bp.headY - bp.headR + 2} ${cx - 3},${bp.headY - bp.headR - 10} ${cx - 1},${bp.headY - bp.headR}" fill="${pal.light}"><animate attributeName="points" dur="0.8s" repeatCount="indefinite" values="${cx - 5},${bp.headY - bp.headR + 2} ${cx - 3},${bp.headY - bp.headR - 10} ${cx - 1},${bp.headY - bp.headR};${cx - 6},${bp.headY - bp.headR + 2} ${cx - 3},${bp.headY - bp.headR - 13} ${cx - 1},${bp.headY - bp.headR};${cx - 5},${bp.headY - bp.headR + 2} ${cx - 3},${bp.headY - bp.headR - 10} ${cx - 1},${bp.headY - bp.headR}" /></polygon>`;
            s += `<polygon points="${cx - 1},${bp.headY - bp.headR + 1} ${cx + 1},${bp.headY - bp.headR - 14} ${cx + 3},${bp.headY - bp.headR + 1}" fill="${pal.accent}"><animate attributeName="points" dur="0.6s" repeatCount="indefinite" values="${cx - 1},${bp.headY - bp.headR + 1} ${cx + 1},${bp.headY - bp.headR - 14} ${cx + 3},${bp.headY - bp.headR + 1};${cx - 1},${bp.headY - bp.headR + 1} ${cx + 1},${bp.headY - bp.headR - 18} ${cx + 4},${bp.headY - bp.headR + 1};${cx - 1},${bp.headY - bp.headR + 1} ${cx + 1},${bp.headY - bp.headR - 14} ${cx + 3},${bp.headY - bp.headR + 1}" /></polygon>`;
            s += `<polygon points="${cx + 3},${bp.headY - bp.headR + 2} ${cx + 5},${bp.headY - bp.headR - 9} ${cx + 7},${bp.headY - bp.headR + 2}" fill="${pal.light}" opacity="0.7"><animate attributeName="opacity" dur="0.7s" repeatCount="indefinite" values="0.5;0.9;0.5" /></polygon>`;
            s += `<polygon points="${cx + 6},${bp.headY - bp.headR + 3} ${cx + 7},${bp.headY - bp.headR - 5} ${cx + 9},${bp.headY - bp.headR + 3}" fill="${pal.accent}" opacity="0.5" />`;
            // Fire gem on forehead
            s += `<polygon points="${cx},${bp.headY - 5} ${cx - 2.5},${bp.headY - 2} ${cx},${bp.headY + 0.5} ${cx + 2.5},${bp.headY - 2}" fill="${pal.accent}" opacity="0.8"><animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0.6;1;0.6" /></polygon>`;
            s += this._drawEyes(cx, bp.headY, bp.headR * 0.5, mood, 'round');
            // Sharp beak — two-tone
            s += `<polygon points="${cx - 3},${bp.headY + 3} ${cx},${bp.headY + 8} ${cx + 3},${bp.headY + 3}" fill="${pal.dark}" />`;
            s += `<line x1="${cx - 2}" y1="${bp.headY + 4}" x2="${cx + 2}" y2="${bp.headY + 4}" stroke="${pal.main}" stroke-width="0.5" opacity="0.5" />`;
            // Thin legs with 3-claw feet
            s += `<line x1="${cx - 6}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 8}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="2.5" stroke-linecap="round" />`;
            s += `<line x1="${cx + 6}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 8}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="2.5" stroke-linecap="round" />`;
            s += `<path d="M${cx - 13} ${bp.feetY + 2} L${cx - 8} ${bp.feetY} L${cx - 5} ${bp.feetY + 2}" fill="none" stroke="${pal.dark}" stroke-width="1.5" />`;
            s += `<line x1="${cx - 8}" y1="${bp.feetY}" x2="${cx - 9}" y2="${bp.feetY + 3}" stroke="${pal.dark}" stroke-width="1.2" />`;
            s += `<path d="M${cx + 5} ${bp.feetY + 2} L${cx + 8} ${bp.feetY} L${cx + 13} ${bp.feetY + 2}" fill="none" stroke="${pal.dark}" stroke-width="1.5" />`;
            s += `<line x1="${cx + 8}" y1="${bp.feetY}" x2="${cx + 9}" y2="${bp.feetY + 3}" stroke="${pal.dark}" stroke-width="1.2" />`;
            // Rising ember particle
            s += `<circle cx="${cx + 3}" cy="${bp.headY - bp.headR - 8}" r="1" fill="${pal.accent}" opacity="0.5"><animate attributeName="cy" dur="2s" repeatCount="indefinite" values="${bp.headY - bp.headR - 8};${bp.headY - bp.headR - 16};${bp.headY - bp.headR - 8}" /><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.5;0;0.5" /></circle>`;

        } else if (form === 1) {
            // Flamador — Taller raptor, real feathered wings, flame crest, ember markings, fire gem
            // Body — angular V-taper
            s += `<polygon points="${cx - bp.shoulderW},${bp.bodyY - 8} ${cx - 7},${bp.bodyY + bp.bodyH + 2} ${cx + 7},${bp.bodyY + bp.bodyH + 2} ${cx + bp.shoulderW},${bp.bodyY - 8}" fill="${pal.main}" />`;
            // Chest plate — lighter angular
            s += `<polygon points="${cx - bp.bodyW + 5},${bp.bodyY - 2} ${cx},${bp.bodyY + bp.bodyH - 2} ${cx + bp.bodyW - 5},${bp.bodyY - 2}" fill="${pal.accent}" opacity="0.35" />`;
            // Ember/heat scale markings on sides
            for (let i = 0; i < 4; i++) {
                const sy = bp.bodyY - 3 + i * 6;
                s += `<polygon points="${cx - bp.shoulderW + 2},${sy} ${cx - bp.shoulderW + 5},${sy - 2.5} ${cx - bp.shoulderW + 8},${sy}" fill="${pal.light}" opacity="0.15" />`;
                s += `<polygon points="${cx + bp.shoulderW - 2},${sy} ${cx + bp.shoulderW - 5},${sy - 2.5} ${cx + bp.shoulderW - 8},${sy}" fill="${pal.light}" opacity="0.15" />`;
            }
            // Pec line
            if (mp > 0.2) {
                s += `<path d="M${cx - bp.bodyW + 6} ${bp.bodyY - 2} Q${cx} ${bp.bodyY + 4} ${cx + bp.bodyW - 6} ${bp.bodyY - 2}" fill="none" stroke="${pal.dark}" stroke-width="0.6" opacity="${mp * 0.4}" />`;
                s += `<line x1="${cx}" y1="${bp.bodyY - 1}" x2="${cx}" y2="${bp.bodyY + 10}" stroke="${pal.dark}" stroke-width="0.6" opacity="${mp * 0.4}" />`;
            }
            // Wings — real feathered structure, partially spread
            // Left wing — 4 feather segments
            s += `<path d="M${cx - bp.shoulderW} ${bp.armY} L${cx - bp.shoulderW - 10} ${bp.armY - 12} L${cx - bp.shoulderW - 18} ${bp.armY - 8} L${cx - bp.shoulderW - 14} ${bp.armY - 2} L${cx - bp.shoulderW - 20} ${bp.armY + 2} L${cx - bp.shoulderW - 16} ${bp.armY + 6} L${cx - bp.shoulderW - 12} ${bp.armY + 4} L${cx - bp.shoulderW} ${bp.armY + 9}" fill="${pal.main}" stroke="${pal.dark}" stroke-width="0.4" />`;
            s += `<path d="M${cx + bp.shoulderW} ${bp.armY} L${cx + bp.shoulderW + 10} ${bp.armY - 12} L${cx + bp.shoulderW + 18} ${bp.armY - 8} L${cx + bp.shoulderW + 14} ${bp.armY - 2} L${cx + bp.shoulderW + 20} ${bp.armY + 2} L${cx + bp.shoulderW + 16} ${bp.armY + 6} L${cx + bp.shoulderW + 12} ${bp.armY + 4} L${cx + bp.shoulderW} ${bp.armY + 9}" fill="${pal.main}" stroke="${pal.dark}" stroke-width="0.4" />`;
            // Feather detail lines
            s += `<line x1="${cx - bp.shoulderW - 3}" y1="${bp.armY + 1}" x2="${cx - bp.shoulderW - 13}" y2="${bp.armY - 8}" stroke="${pal.dark}" stroke-width="0.4" opacity="0.3" />`;
            s += `<line x1="${cx - bp.shoulderW - 5}" y1="${bp.armY + 3}" x2="${cx - bp.shoulderW - 17}" y2="${bp.armY - 3}" stroke="${pal.dark}" stroke-width="0.4" opacity="0.3" />`;
            s += `<line x1="${cx + bp.shoulderW + 3}" y1="${bp.armY + 1}" x2="${cx + bp.shoulderW + 13}" y2="${bp.armY - 8}" stroke="${pal.dark}" stroke-width="0.4" opacity="0.3" />`;
            s += `<line x1="${cx + bp.shoulderW + 5}" y1="${bp.armY + 3}" x2="${cx + bp.shoulderW + 17}" y2="${bp.armY - 3}" stroke="${pal.dark}" stroke-width="0.4" opacity="0.3" />`;
            // Flame tips on wing edges
            s += `<polygon points="${cx - bp.shoulderW - 18},${bp.armY - 8} ${cx - bp.shoulderW - 22},${bp.armY - 12} ${cx - bp.shoulderW - 16},${bp.armY - 5}" fill="${pal.light}" opacity="0.7"><animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="0.4;0.8;0.4" /></polygon>`;
            s += `<polygon points="${cx + bp.shoulderW + 18},${bp.armY - 8} ${cx + bp.shoulderW + 22},${bp.armY - 12} ${cx + bp.shoulderW + 16},${bp.armY - 5}" fill="${pal.light}" opacity="0.7"><animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="0.4;0.8;0.4" /></polygon>`;
            // Head — angular
            s += `<polygon points="${cx - bp.headR},${bp.headY + 4} ${cx - bp.headR + 3},${bp.headY - bp.headR + 1} ${cx},${bp.headY - bp.headR - 1} ${cx + bp.headR - 3},${bp.headY - bp.headR + 1} ${cx + bp.headR},${bp.headY + 4} ${cx},${bp.headY + 6}" fill="${pal.main}" />`;
            // Flame crest — 5 animated spikes
            for (let i = -2; i <= 2; i++) {
                const fx = cx + i * 3.5, fh = 12 + (2 - Math.abs(i)) * 5;
                s += `<polygon points="${fx - 2},${bp.headY - bp.headR + 2} ${fx},${bp.headY - bp.headR - fh} ${fx + 2},${bp.headY - bp.headR + 2}" fill="${Math.abs(i) % 2 === 0 ? pal.light : pal.accent}"><animate attributeName="points" dur="${0.5 + Math.abs(i) * 0.15}s" repeatCount="indefinite" values="${fx - 2},${bp.headY - bp.headR + 2} ${fx},${bp.headY - bp.headR - fh} ${fx + 2},${bp.headY - bp.headR + 2};${fx - 3},${bp.headY - bp.headR + 2} ${fx},${bp.headY - bp.headR - fh - 4} ${fx + 3},${bp.headY - bp.headR + 2};${fx - 2},${bp.headY - bp.headR + 2} ${fx},${bp.headY - bp.headR - fh} ${fx + 2},${bp.headY - bp.headR + 2}" /></polygon>`;
            }
            // Fire gem
            s += `<polygon points="${cx},${bp.headY - 4} ${cx - 3},${bp.headY} ${cx},${bp.headY + 2} ${cx + 3},${bp.headY}" fill="${pal.accent}" opacity="0.8"><animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0.6;1;0.6" /></polygon>`;
            s += this._drawEyes(cx, bp.headY, bp.headR * 0.45, mood, 'sharp');
            // Beak — angular
            s += `<polygon points="${cx - 3},${bp.headY + 3} ${cx},${bp.headY + 8} ${cx + 3},${bp.headY + 3}" fill="${pal.dark}" />`;
            // Tail flame — multi-tongue (render BEHIND legs)
            s += `<polygon points="${cx + 5},${bp.bodyY + bp.bodyH} ${cx + 14},${bp.bodyY + bp.bodyH + 6} ${cx + 10},${bp.bodyY + bp.bodyH - 2} ${cx + 18},${bp.bodyY + bp.bodyH + 3} ${cx + 15},${bp.bodyY + bp.bodyH - 3} ${cx + 22},${bp.bodyY + bp.bodyH}" fill="${pal.light}" opacity="0.7"><animate attributeName="opacity" dur="0.4s" repeatCount="indefinite" values="0.5;0.9;0.5" /></polygon>`;
            s += `<polygon points="${cx + 8},${bp.bodyY + bp.bodyH + 1} ${cx + 13},${bp.bodyY + bp.bodyH + 8} ${cx + 17},${bp.bodyY + bp.bodyH + 1}" fill="${pal.accent}" opacity="0.4"><animate attributeName="opacity" dur="0.6s" repeatCount="indefinite" values="0.3;0.6;0.3" /></polygon>`;
            // Muscular legs with scale texture
            s += `<line x1="${cx - 7}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 9}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            s += `<line x1="${cx + 7}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 9}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            // Leg scale marks
            for (let i = 0; i < 3; i++) {
                const ly = bp.feetY - 5 - i * 4;
                s += `<line x1="${cx - 10}" y1="${ly}" x2="${cx - 7}" y2="${ly}" stroke="${pal.main}" stroke-width="0.5" opacity="0.3" />`;
                s += `<line x1="${cx + 7}" y1="${ly}" x2="${cx + 10}" y2="${ly}" stroke="${pal.main}" stroke-width="0.5" opacity="0.3" />`;
            }
            // Talons — 3 sharp claws
            s += `<path d="M${cx - 14} ${bp.feetY + 3} L${cx - 9} ${bp.feetY} L${cx - 5} ${bp.feetY + 2}" fill="none" stroke="${pal.dark}" stroke-width="1.8" />`;
            s += `<line x1="${cx - 9}" y1="${bp.feetY}" x2="${cx - 10}" y2="${bp.feetY + 5}" stroke="${pal.dark}" stroke-width="1.5" />`;
            s += `<path d="M${cx + 5} ${bp.feetY + 2} L${cx + 9} ${bp.feetY} L${cx + 14} ${bp.feetY + 3}" fill="none" stroke="${pal.dark}" stroke-width="1.8" />`;
            s += `<line x1="${cx + 9}" y1="${bp.feetY}" x2="${cx + 10}" y2="${bp.feetY + 5}" stroke="${pal.dark}" stroke-width="1.5" />`;
            // Rising embers
            s += `<circle cx="${cx - 5}" cy="${bp.armY - 15}" r="1" fill="${pal.light}" opacity="0.4"><animate attributeName="cy" dur="2.5s" repeatCount="indefinite" values="${bp.armY - 10};${bp.armY - 22};${bp.armY - 10}" /><animate attributeName="opacity" dur="2.5s" repeatCount="indefinite" values="0.4;0;0.4" /></circle>`;
            s += `<circle cx="${cx + 7}" cy="${bp.armY - 12}" r="0.8" fill="${pal.accent}" opacity="0.3"><animate attributeName="cy" dur="3s" repeatCount="indefinite" values="${bp.armY - 8};${bp.armY - 20};${bp.armY - 8}" /><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.3;0;0.3" /></circle>`;

        } else if (form === 2) {
            // Flamigor — Athletic phoenix, large feathered wings with flame edges, six-pack, ember tattoos, brow ridge
            // Body — sharp V-taper
            s += `<polygon points="${cx - bp.shoulderW},${bp.bodyY - 10} ${cx - 9},${bp.bodyY + bp.bodyH} ${cx + 9},${bp.bodyY + bp.bodyH} ${cx + bp.shoulderW},${bp.bodyY - 10}" fill="${pal.main}" />`;
            // Chest plate
            s += `<polygon points="${cx - bp.bodyW + 6},${bp.bodyY - 4} ${cx},${bp.bodyY + bp.bodyH - 3} ${cx + bp.bodyW - 6},${bp.bodyY - 4}" fill="${pal.accent}" opacity="0.3" />`;
            // Pec definition
            s += `<path d="M${cx - bp.bodyW + 7} ${bp.bodyY - 2} Q${cx} ${bp.bodyY + 4} ${cx + bp.bodyW - 7} ${bp.bodyY - 2}" fill="none" stroke="${pal.dark}" stroke-width="0.7" opacity="0.3" />`;
            s += `<line x1="${cx}" y1="${bp.bodyY - 2}" x2="${cx}" y2="${bp.bodyY + 6}" stroke="${pal.dark}" stroke-width="0.6" opacity="0.3" />`;
            // Six-pack
            if (mp > 0.1) {
                for (let i = 0; i < 3; i++) { const ay = bp.bodyY + 8 + i * 5; s += `<line x1="${cx - 5}" y1="${ay}" x2="${cx + 5}" y2="${ay}" stroke="${pal.dark}" stroke-width="0.7" opacity="${0.15 + mp * 0.25}" />`; }
                s += `<line x1="${cx}" y1="${bp.bodyY + 6}" x2="${cx}" y2="${bp.bodyY + bp.bodyH - 3}" stroke="${pal.dark}" stroke-width="0.5" opacity="${mp * 0.3}" />`;
            }
            // Ember chevron markings on sides
            for (let i = 0; i < 5; i++) {
                const sy = bp.bodyY - 5 + i * 6;
                s += `<path d="M${cx - bp.shoulderW + 1} ${sy} L${cx - bp.shoulderW + 5} ${sy - 3} L${cx - bp.shoulderW + 9} ${sy}" fill="${pal.light}" opacity="0.12" />`;
                s += `<path d="M${cx + bp.shoulderW - 1} ${sy} L${cx + bp.shoulderW - 5} ${sy - 3} L${cx + bp.shoulderW - 9} ${sy}" fill="${pal.light}" opacity="0.12" />`;
            }
            // Flame tattoo on sides
            s += `<path d="M${cx - bp.shoulderW + 3} ${bp.bodyY + 6} Q${cx - bp.shoulderW + 8} ${bp.bodyY + 3} ${cx - bp.shoulderW + 12} ${bp.bodyY + 6} Q${cx - bp.shoulderW + 16} ${bp.bodyY + 9} ${cx - bp.shoulderW + 19} ${bp.bodyY + 5}" fill="none" stroke="${pal.light}" stroke-width="0.7" opacity="0.25" />`;
            s += `<path d="M${cx + bp.shoulderW - 3} ${bp.bodyY + 6} Q${cx + bp.shoulderW - 8} ${bp.bodyY + 3} ${cx + bp.shoulderW - 12} ${bp.bodyY + 6} Q${cx + bp.shoulderW - 16} ${bp.bodyY + 9} ${cx + bp.shoulderW - 19} ${bp.bodyY + 5}" fill="none" stroke="${pal.light}" stroke-width="0.7" opacity="0.25" />`;
            // Large feathered wings — multi-segment with feather details
            s += `<path d="M${cx - bp.shoulderW} ${bp.armY - 2} L${cx - bp.shoulderW - 8} ${bp.armY - 16} L${cx - bp.shoulderW - 16} ${bp.armY - 22} L${cx - bp.shoulderW - 22} ${bp.armY - 14} L${cx - bp.shoulderW - 18} ${bp.armY - 4} L${cx - bp.shoulderW - 24} ${bp.armY + 2} L${cx - bp.shoulderW - 20} ${bp.armY + 8} L${cx - bp.shoulderW - 14} ${bp.armY + 5} L${cx - bp.shoulderW} ${bp.armY + 10}" fill="${pal.main}" />`;
            s += `<path d="M${cx + bp.shoulderW} ${bp.armY - 2} L${cx + bp.shoulderW + 8} ${bp.armY - 16} L${cx + bp.shoulderW + 16} ${bp.armY - 22} L${cx + bp.shoulderW + 22} ${bp.armY - 14} L${cx + bp.shoulderW + 18} ${bp.armY - 4} L${cx + bp.shoulderW + 24} ${bp.armY + 2} L${cx + bp.shoulderW + 20} ${bp.armY + 8} L${cx + bp.shoulderW + 14} ${bp.armY + 5} L${cx + bp.shoulderW} ${bp.armY + 10}" fill="${pal.main}" />`;
            // Feather ray lines
            for (let i = 0; i < 4; i++) {
                const r = 0.3 + i * 0.05;
                s += `<line x1="${cx - bp.shoulderW - 3 - i * 3}" y1="${bp.armY + 3 - i * 2}" x2="${cx - bp.shoulderW - 10 - i * 4}" y2="${bp.armY - 8 - i * 4}" stroke="${pal.dark}" stroke-width="0.4" opacity="${r}" />`;
                s += `<line x1="${cx + bp.shoulderW + 3 + i * 3}" y1="${bp.armY + 3 - i * 2}" x2="${cx + bp.shoulderW + 10 + i * 4}" y2="${bp.armY - 8 - i * 4}" stroke="${pal.dark}" stroke-width="0.4" opacity="${r}" />`;
            }
            // Flame tips on wing tips — animated
            s += `<polygon points="${cx - bp.shoulderW - 22},${bp.armY - 14} ${cx - bp.shoulderW - 28},${bp.armY - 19} ${cx - bp.shoulderW - 20},${bp.armY - 10}" fill="${pal.light}" opacity="0.7"><animate attributeName="opacity" dur="0.35s" repeatCount="indefinite" values="0.4;0.9;0.4" /></polygon>`;
            s += `<polygon points="${cx - bp.shoulderW - 24},${bp.armY + 2} ${cx - bp.shoulderW - 29},${bp.armY - 3} ${cx - bp.shoulderW - 22},${bp.armY + 5}" fill="${pal.accent}" opacity="0.5"><animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="0.3;0.7;0.3" /></polygon>`;
            s += `<polygon points="${cx + bp.shoulderW + 22},${bp.armY - 14} ${cx + bp.shoulderW + 28},${bp.armY - 19} ${cx + bp.shoulderW + 20},${bp.armY - 10}" fill="${pal.light}" opacity="0.7"><animate attributeName="opacity" dur="0.35s" repeatCount="indefinite" values="0.4;0.9;0.4" /></polygon>`;
            s += `<polygon points="${cx + bp.shoulderW + 24},${bp.armY + 2} ${cx + bp.shoulderW + 29},${bp.armY - 3} ${cx + bp.shoulderW + 22},${bp.armY + 5}" fill="${pal.accent}" opacity="0.5"><animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="0.3;0.7;0.3" /></polygon>`;
            // Head — angular with brow ridge
            s += `<polygon points="${cx - bp.headR - 1},${bp.headY + 5} ${cx - bp.headR + 3},${bp.headY - bp.headR} ${cx},${bp.headY - bp.headR - 2} ${cx + bp.headR - 3},${bp.headY - bp.headR} ${cx + bp.headR + 1},${bp.headY + 5} ${cx},${bp.headY + 7}" fill="${pal.main}" />`;
            // Brow ridge
            s += `<path d="M${cx - bp.headR} ${bp.headY - bp.headR + 4} L${cx - 3} ${bp.headY - bp.headR + 1} L${cx + 3} ${bp.headY - bp.headR + 1} L${cx + bp.headR} ${bp.headY - bp.headR + 4}" fill="${pal.dark}" opacity="0.2" />`;
            // Flame crest — 5 spikes, taller
            for (let i = -2; i <= 2; i++) {
                const fx = cx + i * 3.5, fh = 14 + (2 - Math.abs(i)) * 7;
                s += `<polygon points="${fx - 2},${bp.headY - bp.headR + 3} ${fx},${bp.headY - bp.headR - fh} ${fx + 2},${bp.headY - bp.headR + 3}" fill="${Math.abs(i) % 2 === 0 ? pal.light : pal.accent}"><animate attributeName="points" dur="${0.4 + Math.abs(i) * 0.1}s" repeatCount="indefinite" values="${fx - 2},${bp.headY - bp.headR + 3} ${fx},${bp.headY - bp.headR - fh} ${fx + 2},${bp.headY - bp.headR + 3};${fx - 3},${bp.headY - bp.headR + 3} ${fx},${bp.headY - bp.headR - fh - 5} ${fx + 3},${bp.headY - bp.headR + 3};${fx - 2},${bp.headY - bp.headR + 3} ${fx},${bp.headY - bp.headR - fh} ${fx + 2},${bp.headY - bp.headR + 3}" /></polygon>`;
            }
            // Fire gem — larger
            s += `<polygon points="${cx},${bp.headY - 5} ${cx - 3.5},${bp.headY - 1} ${cx},${bp.headY + 2} ${cx + 3.5},${bp.headY - 1}" fill="${pal.accent}" opacity="0.9"><animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="0.7;1;0.7" /></polygon>`;
            s += `<polygon points="${cx},${bp.headY - 4} ${cx - 2},${bp.headY - 1} ${cx},${bp.headY + 0.5} ${cx + 2},${bp.headY - 1}" fill="white" opacity="0.3" />`;
            s += this._drawEyes(cx, bp.headY, bp.headR * 0.4, mood, 'fierce');
            // Sharp beak
            s += `<polygon points="${cx - 4},${bp.headY + 3} ${cx},${bp.headY + 9} ${cx + 4},${bp.headY + 3}" fill="${pal.dark}" />`;
            // Flame tail — multi-tongue, animated (render BEHIND legs)
            s += `<polygon points="${cx},${bp.bodyY + bp.bodyH} ${cx + 8},${bp.bodyY + bp.bodyH + 6} ${cx + 15},${bp.bodyY + bp.bodyH - 2} ${cx + 20},${bp.bodyY + bp.bodyH + 7} ${cx + 26},${bp.bodyY + bp.bodyH - 4}" fill="${pal.light}" opacity="0.6"><animate attributeName="opacity" dur="0.4s" repeatCount="indefinite" values="0.4;0.8;0.4" /></polygon>`;
            s += `<polygon points="${cx + 4},${bp.bodyY + bp.bodyH + 1} ${cx + 12},${bp.bodyY + bp.bodyH + 9} ${cx + 19},${bp.bodyY + bp.bodyH + 1}" fill="${pal.accent}" opacity="0.35"><animate attributeName="opacity" dur="0.6s" repeatCount="indefinite" values="0.2;0.5;0.2" /></polygon>`;
            // Powerful legs with scale rings
            s += `<line x1="${cx - 8}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 10}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            s += `<line x1="${cx + 8}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 10}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            for (let i = 0; i < 4; i++) { const ly = bp.feetY - 3 - i * 3; s += `<line x1="${cx - 11}" y1="${ly}" x2="${cx - 8}" y2="${ly}" stroke="${pal.main}" stroke-width="0.5" opacity="0.3" /><line x1="${cx + 8}" y1="${ly}" x2="${cx + 11}" y2="${ly}" stroke="${pal.main}" stroke-width="0.5" opacity="0.3" />`; }
            // 3-claw raptor talons
            for (const side of [-1, 1]) {
                const fx = cx + side * 10;
                s += `<path d="M${fx - side * 6} ${bp.feetY + 4} L${fx} ${bp.feetY - 1} L${fx + side * 6} ${bp.feetY + 4}" fill="none" stroke="${pal.dark}" stroke-width="2" />`;
                s += `<line x1="${fx}" y1="${bp.feetY - 1}" x2="${fx}" y2="${bp.feetY + 5}" stroke="${pal.dark}" stroke-width="1.5" />`;
            }
            // Rising embers
            for (let i = 0; i < 3; i++) {
                const ex = cx - 8 + i * 8, ed = 2 + i * 0.8;
                s += `<circle cx="${ex}" cy="${bp.armY - 20}" r="${0.8 + i * 0.3}" fill="${i % 2 === 0 ? pal.light : pal.accent}" opacity="0.3"><animate attributeName="cy" dur="${ed}s" repeatCount="indefinite" values="${bp.armY - 16};${bp.armY - 28};${bp.armY - 16}" /><animate attributeName="opacity" dur="${ed}s" repeatCount="indefinite" values="0.3;0;0.3" /></circle>`;
            }

        } else {
            // Infernox — FLYING phoenix god, MASSIVE spread wings with feather detail and flame edges,
            // armored chest, crown of fire, fire gem, ember trail, scale armor
            // Body — raised, powerful, armored
            s += `<polygon points="${cx - bp.shoulderW},${bp.bodyY - 10} ${cx - bp.shoulderW + 3},${bp.bodyY + bp.bodyH * 0.4} ${cx - 11},${bp.bodyY + bp.bodyH - 3} ${cx + 11},${bp.bodyY + bp.bodyH - 3} ${cx + bp.shoulderW - 3},${bp.bodyY + bp.bodyH * 0.4} ${cx + bp.shoulderW},${bp.bodyY - 10}" fill="${pal.main}" />`;
            // Chest armor plate — angular
            s += `<polygon points="${cx - bp.bodyW + 6},${bp.bodyY - 5} ${cx},${bp.bodyY + 8} ${cx + bp.bodyW - 6},${bp.bodyY - 5}" fill="${pal.dark}" opacity="0.25" />`;
            // Pec definition
            s += `<path d="M${cx - bp.bodyW + 7} ${bp.bodyY - 3} Q${cx} ${bp.bodyY + 3} ${cx + bp.bodyW - 7} ${bp.bodyY - 3}" fill="none" stroke="${pal.dark}" stroke-width="0.8" opacity="0.35" />`;
            s += `<line x1="${cx}" y1="${bp.bodyY - 3}" x2="${cx}" y2="${bp.bodyY + 6}" stroke="${pal.dark}" stroke-width="0.7" opacity="0.35" />`;
            // Eight-pack
            for (let i = 0; i < 4; i++) { const ay = bp.bodyY + 8 + i * 5; s += `<line x1="${cx - 5}" y1="${ay}" x2="${cx + 5}" y2="${ay}" stroke="${pal.dark}" stroke-width="0.8" opacity="0.4" />`; }
            s += `<line x1="${cx}" y1="${bp.bodyY + 6}" x2="${cx}" y2="${bp.bodyY + bp.bodyH - 6}" stroke="${pal.dark}" stroke-width="0.7" opacity="0.35" />`;
            // Ember scale armor on sides
            for (let i = 0; i < 6; i++) {
                const sy = bp.bodyY - 6 + i * 6;
                s += `<path d="M${cx - bp.shoulderW + 1} ${sy} L${cx - bp.shoulderW + 4} ${sy - 3} L${cx - bp.shoulderW + 7} ${sy}" fill="${pal.light}" opacity="0.1" />`;
                s += `<path d="M${cx + bp.shoulderW - 1} ${sy} L${cx + bp.shoulderW - 4} ${sy - 3} L${cx + bp.shoulderW - 7} ${sy}" fill="${pal.light}" opacity="0.1" />`;
            }
            // Flame tattoo pattern
            s += `<path d="M${cx - bp.shoulderW + 3} ${bp.bodyY + 6} Q${cx - bp.shoulderW + 9} ${bp.bodyY + 2} ${cx - bp.shoulderW + 14} ${bp.bodyY + 6} Q${cx - bp.shoulderW + 19} ${bp.bodyY + 10} ${cx - bp.shoulderW + 23} ${bp.bodyY + 5}" fill="none" stroke="${pal.light}" stroke-width="0.8" opacity="0.25" />`;
            s += `<path d="M${cx + bp.shoulderW - 3} ${bp.bodyY + 6} Q${cx + bp.shoulderW - 9} ${bp.bodyY + 2} ${cx + bp.shoulderW - 14} ${bp.bodyY + 6} Q${cx + bp.shoulderW - 19} ${bp.bodyY + 10} ${cx + bp.shoulderW - 23} ${bp.bodyY + 5}" fill="none" stroke="${pal.light}" stroke-width="0.8" opacity="0.25" />`;
            // MASSIVE flame wings — fully spread, multi-feather segments
            // Left wing
            s += `<path d="M${cx - bp.shoulderW} ${bp.armY - 3} L${cx - bp.shoulderW - 6} ${bp.armY - 18} L${cx - bp.shoulderW - 14} ${bp.armY - 28} L${cx - bp.shoulderW - 22} ${bp.armY - 22} L${cx - bp.shoulderW - 18} ${bp.armY - 12} L${cx - bp.shoulderW - 26} ${bp.armY - 6} L${cx - bp.shoulderW - 22} ${bp.armY + 2} L${cx - bp.shoulderW - 28} ${bp.armY + 6} L${cx - bp.shoulderW - 20} ${bp.armY + 10} L${cx - bp.shoulderW - 14} ${bp.armY + 7} L${cx - bp.shoulderW} ${bp.armY + 12}" fill="${pal.main}" />`;
            // Right wing
            s += `<path d="M${cx + bp.shoulderW} ${bp.armY - 3} L${cx + bp.shoulderW + 6} ${bp.armY - 18} L${cx + bp.shoulderW + 14} ${bp.armY - 28} L${cx + bp.shoulderW + 22} ${bp.armY - 22} L${cx + bp.shoulderW + 18} ${bp.armY - 12} L${cx + bp.shoulderW + 26} ${bp.armY - 6} L${cx + bp.shoulderW + 22} ${bp.armY + 2} L${cx + bp.shoulderW + 28} ${bp.armY + 6} L${cx + bp.shoulderW + 20} ${bp.armY + 10} L${cx + bp.shoulderW + 14} ${bp.armY + 7} L${cx + bp.shoulderW} ${bp.armY + 12}" fill="${pal.main}" />`;
            // Feather ray details on wings
            for (let i = 0; i < 5; i++) {
                const r = 0.2 + i * 0.05;
                s += `<line x1="${cx - bp.shoulderW - 2 - i * 3}" y1="${bp.armY + 4 - i * 2}" x2="${cx - bp.shoulderW - 8 - i * 5}" y2="${bp.armY - 10 - i * 4}" stroke="${pal.dark}" stroke-width="0.4" opacity="${r}" />`;
                s += `<line x1="${cx + bp.shoulderW + 2 + i * 3}" y1="${bp.armY + 4 - i * 2}" x2="${cx + bp.shoulderW + 8 + i * 5}" y2="${bp.armY - 10 - i * 4}" stroke="${pal.dark}" stroke-width="0.4" opacity="${r}" />`;
            }
            // Flame edges on ALL wing tips — animated
            const wingPts = [[-14, -28], [-26, -6], [-28, 6]];
            for (let i = 0; i < wingPts.length; i++) {
                const [wx, wy] = wingPts[i];
                const awx = bp.shoulderW + Math.abs(wx), awy = bp.armY + wy;
                s += `<polygon points="${cx - awx},${awy} ${cx - awx - 5},${awy - 5} ${cx - awx + 2},${awy + 3}" fill="${pal.light}" opacity="0.7"><animate attributeName="opacity" dur="${0.3 + i * 0.12}s" repeatCount="indefinite" values="0.4;0.9;0.4" /></polygon>`;
                s += `<polygon points="${cx + awx},${awy} ${cx + awx + 5},${awy - 5} ${cx + awx - 2},${awy + 3}" fill="${pal.light}" opacity="0.7"><animate attributeName="opacity" dur="${0.3 + i * 0.12}s" repeatCount="indefinite" values="0.4;0.9;0.4" /></polygon>`;
            }
            // Secondary flame glow behind wings
            s += `<polygon points="${cx - bp.shoulderW - 16},${bp.armY - 26} ${cx - bp.shoulderW - 20},${bp.armY - 32} ${cx - bp.shoulderW - 12},${bp.armY - 24}" fill="${pal.accent}" opacity="0.4"><animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="0.2;0.6;0.2" /></polygon>`;
            s += `<polygon points="${cx + bp.shoulderW + 16},${bp.armY - 26} ${cx + bp.shoulderW + 20},${bp.armY - 32} ${cx + bp.shoulderW + 12},${bp.armY - 24}" fill="${pal.accent}" opacity="0.4"><animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="0.2;0.6;0.2" /></polygon>`;
            // Head — angular warrior
            s += `<polygon points="${cx - bp.headR - 2},${bp.headY + 5} ${cx - bp.headR + 2},${bp.headY - bp.headR + 1} ${cx},${bp.headY - bp.headR - 2} ${cx + bp.headR - 2},${bp.headY - bp.headR + 1} ${cx + bp.headR + 2},${bp.headY + 5} ${cx + 2},${bp.headY + 8} ${cx - 2},${bp.headY + 8}" fill="${pal.main}" />`;
            // Armored brow ridge
            s += `<path d="M${cx - bp.headR} ${bp.headY - bp.headR + 4} L${cx - 3} ${bp.headY - bp.headR + 1} L${cx + 3} ${bp.headY - bp.headR + 1} L${cx + bp.headR} ${bp.headY - bp.headR + 4}" fill="${pal.dark}" opacity="0.25" />`;
            // Crown of flames — 7 massive spikes
            for (let i = -3; i <= 3; i++) {
                const fx = cx + i * 3.5, fh = 16 + (3 - Math.abs(i)) * 5;
                s += `<polygon points="${fx - 2},${bp.headY - bp.headR + 3} ${fx},${bp.headY - bp.headR - fh} ${fx + 2},${bp.headY - bp.headR + 3}" fill="${Math.abs(i) % 2 === 0 ? pal.light : pal.accent}" opacity="0.9"><animate attributeName="points" dur="${0.3 + Math.abs(i) * 0.08}s" repeatCount="indefinite" values="${fx - 2},${bp.headY - bp.headR + 3} ${fx},${bp.headY - bp.headR - fh} ${fx + 2},${bp.headY - bp.headR + 3};${fx - 3},${bp.headY - bp.headR + 3} ${fx},${bp.headY - bp.headR - fh - 5} ${fx + 3},${bp.headY - bp.headR + 3};${fx - 2},${bp.headY - bp.headR + 3} ${fx},${bp.headY - bp.headR - fh} ${fx + 2},${bp.headY - bp.headR + 3}" /></polygon>`;
            }
            // Fire gem — large, glowing
            s += `<polygon points="${cx},${bp.headY - 6} ${cx - 4},${bp.headY - 1} ${cx},${bp.headY + 3} ${cx + 4},${bp.headY - 1}" fill="${pal.accent}"><animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="0.8;1;0.8" /></polygon>`;
            s += `<polygon points="${cx},${bp.headY - 5} ${cx - 2.5},${bp.headY - 1} ${cx},${bp.headY + 1.5} ${cx + 2.5},${bp.headY - 1}" fill="white" opacity="0.4" />`;
            // Glowing eyes
            s += this._drawEyes(cx, bp.headY, bp.headR * 0.35, mood, 'glowing');
            // Sharp beak with flame edge
            s += `<polygon points="${cx - 4},${bp.headY + 4} ${cx},${bp.headY + 10} ${cx + 4},${bp.headY + 4}" fill="${pal.dark}" />`;
            s += `<line x1="${cx - 2}" y1="${bp.headY + 6}" x2="${cx + 2}" y2="${bp.headY + 6}" stroke="${pal.main}" stroke-width="0.5" opacity="0.4" />`;
            // Fire tail — massive multi-flame
            s += `<polygon points="${cx},${bp.bodyY + bp.bodyH - 3} ${cx + 6},${bp.bodyY + bp.bodyH + 6} ${cx + 14},${bp.bodyY + bp.bodyH - 4} ${cx + 20},${bp.bodyY + bp.bodyH + 10} ${cx + 28},${bp.bodyY + bp.bodyH - 6}" fill="${pal.light}" opacity="0.6"><animate attributeName="opacity" dur="0.35s" repeatCount="indefinite" values="0.4;0.8;0.4" /></polygon>`;
            s += `<polygon points="${cx + 4},${bp.bodyY + bp.bodyH} ${cx + 12},${bp.bodyY + bp.bodyH + 12} ${cx + 22},${bp.bodyY + bp.bodyH + 2}" fill="${pal.accent}" opacity="0.35"><animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="0.2;0.5;0.2" /></polygon>`;
            s += `<polygon points="${cx - 3},${bp.bodyY + bp.bodyH - 2} ${cx - 8},${bp.bodyY + bp.bodyH + 5} ${cx + 2},${bp.bodyY + bp.bodyH + 1}" fill="${pal.light}" opacity="0.3"><animate attributeName="opacity" dur="0.6s" repeatCount="indefinite" values="0.2;0.5;0.2" /></polygon>`;
            // Legs — powerful, armored with scale rings
            s += `<line x1="${cx - 10}" y1="${bp.bodyY + bp.bodyH - 3}" x2="${cx - 12}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick + 2}" stroke-linecap="round" />`;
            s += `<line x1="${cx + 10}" y1="${bp.bodyY + bp.bodyH - 3}" x2="${cx + 12}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick + 2}" stroke-linecap="round" />`;
            for (let i = 0; i < 4; i++) { const ly = bp.feetY - 3 - i * 3; s += `<line x1="${cx - 13}" y1="${ly}" x2="${cx - 10}" y2="${ly}" stroke="${pal.main}" stroke-width="0.6" opacity="0.3" /><line x1="${cx + 10}" y1="${ly}" x2="${cx + 13}" y2="${ly}" stroke="${pal.main}" stroke-width="0.6" opacity="0.3" />`; }
            // Massive raptor talons
            for (const side of [-1, 1]) {
                const fx = cx + side * 12;
                s += `<path d="M${fx - side * 7} ${bp.feetY + 4} L${fx} ${bp.feetY - 2} L${fx + side * 7} ${bp.feetY + 4}" fill="none" stroke="${pal.dark}" stroke-width="2.5" />`;
                s += `<line x1="${fx}" y1="${bp.feetY - 2}" x2="${fx}" y2="${bp.feetY + 6}" stroke="${pal.dark}" stroke-width="2" />`;
            }
            // Rising ember particles
            for (let i = 0; i < 4; i++) {
                const ex = cx - 10 + i * 7, ed = 2 + i * 0.7;
                s += `<circle cx="${ex}" cy="${bp.armY - 25}" r="${0.8 + i * 0.2}" fill="${i % 2 === 0 ? pal.light : pal.accent}" opacity="0.3"><animate attributeName="cy" dur="${ed}s" repeatCount="indefinite" values="${bp.armY - 18};${bp.armY - 35};${bp.armY - 18}" /><animate attributeName="opacity" dur="${ed}s" repeatCount="indefinite" values="0.3;0;0.3" /></circle>`;
            }
        }
        return s;
    },

    // ============================================
    // PLANT CREATURE — Feline/Floral lineage
    // Roots, vines, thorns, bark armor, flower crown
    // ============================================
    _buildPlant(form, mp, bp, pal, mood) {
        let s = '';
        const cx = bp.cx;

        if (form === 0) {
            // Herbachat — Round kitten with leaf ears, flower bud, leaf collar, root paws, vine tail
            // Body — angular with belly patch
            s += `<polygon points="${cx - bp.bodyW},${bp.bodyY - 3} ${cx - bp.bodyW + 4},${bp.bodyY + bp.bodyH} ${cx + bp.bodyW - 4},${bp.bodyY + bp.bodyH} ${cx + bp.bodyW},${bp.bodyY - 3} ${cx},${bp.bodyY - bp.bodyH + 3}" fill="${pal.main}" />`;
            // Lighter belly
            s += `<polygon points="${cx - bp.bodyW + 6},${bp.bodyY + 2} ${cx},${bp.bodyY + bp.bodyH - 3} ${cx + bp.bodyW - 6},${bp.bodyY + 2}" fill="${pal.light}" opacity="0.4" />`;
            // Leaf vein pattern on body sides
            s += `<path d="M${cx - bp.bodyW + 3} ${bp.bodyY} Q${cx - bp.bodyW + 6} ${bp.bodyY + 5} ${cx - bp.bodyW + 3} ${bp.bodyY + 10}" fill="none" stroke="${pal.dark}" stroke-width="0.5" opacity="0.3" />`;
            s += `<path d="M${cx + bp.bodyW - 3} ${bp.bodyY} Q${cx + bp.bodyW - 6} ${bp.bodyY + 5} ${cx + bp.bodyW - 3} ${bp.bodyY + 10}" fill="none" stroke="${pal.dark}" stroke-width="0.5" opacity="0.3" />`;
            // Small thorn bumps on back
            s += `<polygon points="${cx - 4},${bp.bodyY - bp.bodyH + 4} ${cx - 3},${bp.bodyY - bp.bodyH - 1} ${cx - 2},${bp.bodyY - bp.bodyH + 4}" fill="${pal.dark}" opacity="0.4" />`;
            s += `<polygon points="${cx + 2},${bp.bodyY - bp.bodyH + 4} ${cx + 3},${bp.bodyY - bp.bodyH - 2} ${cx + 4},${bp.bodyY - bp.bodyH + 4}" fill="${pal.dark}" opacity="0.4" />`;
            // Head — angular cat face
            s += `<polygon points="${cx - bp.headR},${bp.headY + 4} ${cx - bp.headR + 3},${bp.headY - bp.headR + 2} ${cx},${bp.headY - bp.headR} ${cx + bp.headR - 3},${bp.headY - bp.headR + 2} ${cx + bp.headR},${bp.headY + 4} ${cx},${bp.headY + 6}" fill="${pal.main}" />`;
            // Leaf ears — pointed, with vein detail
            s += `<polygon points="${cx - 14},${bp.headY - 13} ${cx - 7},${bp.headY - bp.headR} ${cx - 16},${bp.headY - bp.headR + 6}" fill="${pal.main}" />`;
            s += `<polygon points="${cx + 14},${bp.headY - 13} ${cx + 7},${bp.headY - bp.headR} ${cx + 16},${bp.headY - bp.headR + 6}" fill="${pal.main}" />`;
            s += `<line x1="${cx - 13}" y1="${bp.headY - 12}" x2="${cx - 10}" y2="${bp.headY - bp.headR + 3}" stroke="${pal.dark}" stroke-width="0.5" opacity="0.5" />`;
            s += `<line x1="${cx - 12}" y1="${bp.headY - 10}" x2="${cx - 14}" y2="${bp.headY - bp.headR + 5}" stroke="${pal.dark}" stroke-width="0.3" opacity="0.3" />`;
            s += `<line x1="${cx + 13}" y1="${bp.headY - 12}" x2="${cx + 10}" y2="${bp.headY - bp.headR + 3}" stroke="${pal.dark}" stroke-width="0.5" opacity="0.5" />`;
            s += `<line x1="${cx + 12}" y1="${bp.headY - 10}" x2="${cx + 14}" y2="${bp.headY - bp.headR + 5}" stroke="${pal.dark}" stroke-width="0.3" opacity="0.3" />`;
            // Flower bud on top — closed petals
            s += `<polygon points="${cx - 3},${bp.headY - bp.headR - 1} ${cx - 1},${bp.headY - bp.headR - 7} ${cx + 1},${bp.headY - bp.headR - 1}" fill="#E91E63" opacity="0.7" />`;
            s += `<polygon points="${cx - 1},${bp.headY - bp.headR - 1} ${cx + 1},${bp.headY - bp.headR - 8} ${cx + 3},${bp.headY - bp.headR - 1}" fill="#F06292" opacity="0.7" />`;
            s += `<circle cx="${cx}" cy="${bp.headY - bp.headR - 2}" r="2" fill="#FFE082" />`;
            // Stem for bud
            s += `<line x1="${cx}" y1="${bp.headY - bp.headR}" x2="${cx}" y2="${bp.headY - bp.headR - 1}" stroke="${pal.dark}" stroke-width="1" />`;
            // Leaf collar — spiky leaves, alternating sizes
            for (let i = -3; i <= 3; i++) {
                const lx = cx + i * 5, lh = Math.abs(i) % 2 === 0 ? 7 : 5;
                s += `<polygon points="${lx},${bp.neckY - 2} ${lx - 3},${bp.neckY + lh} ${lx + 3},${bp.neckY + lh}" fill="${pal.dark}" opacity="0.55" />`;
            }
            s += this._drawEyes(cx, bp.headY, bp.headR * 0.45, mood, 'cat');
            // Tiny cat nose + whiskers
            s += `<polygon points="${cx - 1},${bp.headY + 2} ${cx},${bp.headY + 4} ${cx + 1},${bp.headY + 2}" fill="${pal.dark}" />`;
            s += `<line x1="${cx - 3}" y1="${bp.headY + 3}" x2="${cx - 10}" y2="${bp.headY + 1}" stroke="${pal.dark}" stroke-width="0.4" />`;
            s += `<line x1="${cx + 3}" y1="${bp.headY + 3}" x2="${cx + 10}" y2="${bp.headY + 1}" stroke="${pal.dark}" stroke-width="0.4" />`;
            s += `<line x1="${cx - 3}" y1="${bp.headY + 4}" x2="${cx - 9}" y2="${bp.headY + 4}" stroke="${pal.dark}" stroke-width="0.4" />`;
            s += `<line x1="${cx + 3}" y1="${bp.headY + 4}" x2="${cx + 9}" y2="${bp.headY + 4}" stroke="${pal.dark}" stroke-width="0.4" />`;
            // Vine tail with leaf tip (render BEHIND legs)
            s += `<path d="M${cx + bp.bodyW - 3} ${bp.bodyY} Q${cx + bp.bodyW + 10} ${bp.bodyY - 8} ${cx + bp.bodyW + 7} ${bp.bodyY - 14}" fill="none" stroke="${pal.main}" stroke-width="2.5" stroke-linecap="round"><animate attributeName="d" dur="2.5s" repeatCount="indefinite" values="M${cx + bp.bodyW - 3} ${bp.bodyY} Q${cx + bp.bodyW + 10} ${bp.bodyY - 8} ${cx + bp.bodyW + 7} ${bp.bodyY - 14};M${cx + bp.bodyW - 3} ${bp.bodyY} Q${cx + bp.bodyW + 12} ${bp.bodyY - 10} ${cx + bp.bodyW + 8} ${bp.bodyY - 16};M${cx + bp.bodyW - 3} ${bp.bodyY} Q${cx + bp.bodyW + 10} ${bp.bodyY - 8} ${cx + bp.bodyW + 7} ${bp.bodyY - 14}" /></path>`;
            s += `<polygon points="${cx + bp.bodyW + 4},${bp.bodyY - 14} ${cx + bp.bodyW + 7},${bp.bodyY - 20} ${cx + bp.bodyW + 10},${bp.bodyY - 14}" fill="${pal.accent}" />`;
            // Stubby legs with root-like paw feet
            s += `<line x1="${cx - 6}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 7}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="3" stroke-linecap="round" />`;
            s += `<line x1="${cx + 6}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 7}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="3" stroke-linecap="round" />`;
            // Root paw feet — 3 little roots
            s += `<path d="M${cx - 11} ${bp.feetY + 3} L${cx - 7} ${bp.feetY} L${cx - 4} ${bp.feetY + 2}" fill="none" stroke="${pal.dark}" stroke-width="1.2" />`;
            s += `<line x1="${cx - 7}" y1="${bp.feetY}" x2="${cx - 8}" y2="${bp.feetY + 4}" stroke="${pal.dark}" stroke-width="1" />`;
            s += `<path d="M${cx + 4} ${bp.feetY + 2} L${cx + 7} ${bp.feetY} L${cx + 11} ${bp.feetY + 3}" fill="none" stroke="${pal.dark}" stroke-width="1.2" />`;
            s += `<line x1="${cx + 7}" y1="${bp.feetY}" x2="${cx + 8}" y2="${bp.feetY + 4}" stroke="${pal.dark}" stroke-width="1" />`;
            // Small floating leaf particle
            s += `<polygon points="${cx - 12},${bp.headY - 8} ${cx - 10},${bp.headY - 11} ${cx - 8},${bp.headY - 8}" fill="${pal.accent}" opacity="0.4"><animate attributeName="cy" dur="3s" repeatCount="indefinite" values="0;-3;0" /><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.4;0.1;0.4" /></polygon>`;

        } else if (form === 1) {
            // Verdifelin — Semi-bipedal, opening flower, vine markings, thorn shoulders, root feet
            // Body — angular V-taper
            s += `<polygon points="${cx - bp.shoulderW},${bp.bodyY - 6} ${cx - 7},${bp.bodyY + bp.bodyH + 2} ${cx + 7},${bp.bodyY + bp.bodyH + 2} ${cx + bp.shoulderW},${bp.bodyY - 6}" fill="${pal.main}" />`;
            s += `<polygon points="${cx - bp.bodyW + 5},${bp.bodyY} ${cx},${bp.bodyY + bp.bodyH - 2} ${cx + bp.bodyW - 5},${bp.bodyY}" fill="${pal.light}" opacity="0.3" />`;
            // Vine markings on body sides — S-curves
            s += `<path d="M${cx - bp.shoulderW + 3} ${bp.armY} Q${cx - bp.shoulderW + 8} ${bp.armY + 8} ${cx - bp.shoulderW + 3} ${bp.armY + 16} Q${cx - bp.shoulderW + 8} ${bp.armY + 22} ${cx - bp.shoulderW + 4} ${bp.armY + 28}" fill="none" stroke="${pal.dark}" stroke-width="0.8" opacity="0.4" />`;
            s += `<path d="M${cx + bp.shoulderW - 3} ${bp.armY} Q${cx + bp.shoulderW - 8} ${bp.armY + 8} ${cx + bp.shoulderW - 3} ${bp.armY + 16} Q${cx + bp.shoulderW - 8} ${bp.armY + 22} ${cx + bp.shoulderW - 4} ${bp.armY + 28}" fill="none" stroke="${pal.dark}" stroke-width="0.8" opacity="0.4" />`;
            // Small leaves growing off vine markings
            s += `<polygon points="${cx - bp.shoulderW + 7},${bp.armY + 8} ${cx - bp.shoulderW + 10},${bp.armY + 5} ${cx - bp.shoulderW + 10},${bp.armY + 8}" fill="${pal.accent}" opacity="0.3" />`;
            s += `<polygon points="${cx + bp.shoulderW - 7},${bp.armY + 8} ${cx + bp.shoulderW - 10},${bp.armY + 5} ${cx + bp.shoulderW - 10},${bp.armY + 8}" fill="${pal.accent}" opacity="0.3" />`;
            // Thorn spikes on shoulders
            s += `<polygon points="${cx - bp.shoulderW},${bp.armY - 2} ${cx - bp.shoulderW - 4},${bp.armY - 8} ${cx - bp.shoulderW + 2},${bp.armY - 4}" fill="${pal.dark}" opacity="0.5" />`;
            s += `<polygon points="${cx + bp.shoulderW},${bp.armY - 2} ${cx + bp.shoulderW + 4},${bp.armY - 8} ${cx + bp.shoulderW - 2},${bp.armY - 4}" fill="${pal.dark}" opacity="0.5" />`;
            // Head — angular cat
            s += `<polygon points="${cx - bp.headR},${bp.headY + 5} ${cx - bp.headR + 3},${bp.headY - bp.headR + 1} ${cx},${bp.headY - bp.headR - 1} ${cx + bp.headR - 3},${bp.headY - bp.headR + 1} ${cx + bp.headR},${bp.headY + 5} ${cx},${bp.headY + 7}" fill="${pal.main}" />`;
            // Pointed ears — larger with veins
            s += `<polygon points="${cx - 14},${bp.headY - 15} ${cx - 6},${bp.headY - bp.headR} ${cx - 16},${bp.headY - bp.headR + 6}" fill="${pal.main}" />`;
            s += `<polygon points="${cx + 14},${bp.headY - 15} ${cx + 6},${bp.headY - bp.headR} ${cx + 16},${bp.headY - bp.headR + 6}" fill="${pal.main}" />`;
            s += `<line x1="${cx - 13}" y1="${bp.headY - 14}" x2="${cx - 10}" y2="${bp.headY - bp.headR + 3}" stroke="${pal.dark}" stroke-width="0.5" opacity="0.4" />`;
            s += `<line x1="${cx + 13}" y1="${bp.headY - 14}" x2="${cx + 10}" y2="${bp.headY - bp.headR + 3}" stroke="${pal.dark}" stroke-width="0.5" opacity="0.4" />`;
            // Opening flower — 4 petals visible
            s += `<polygon points="${cx - 6},${bp.headY - bp.headR - 2} ${cx - 4},${bp.headY - bp.headR - 12} ${cx - 1},${bp.headY - bp.headR - 4}" fill="#E91E63" opacity="0.7" />`;
            s += `<polygon points="${cx + 1},${bp.headY - bp.headR - 4} ${cx + 4},${bp.headY - bp.headR - 13} ${cx + 6},${bp.headY - bp.headR - 2}" fill="#F06292" opacity="0.7" />`;
            s += `<polygon points="${cx - 3},${bp.headY - bp.headR - 3} ${cx},${bp.headY - bp.headR - 10} ${cx + 3},${bp.headY - bp.headR - 3}" fill="#F48FB1" opacity="0.8" />`;
            s += `<polygon points="${cx - 5},${bp.headY - bp.headR - 3} ${cx - 7},${bp.headY - bp.headR - 8} ${cx - 2},${bp.headY - bp.headR - 5}" fill="#EC407A" opacity="0.5" />`;
            s += `<circle cx="${cx}" cy="${bp.headY - bp.headR - 4}" r="2.5" fill="#FFE082" />`;
            // Leaf mane — more detailed
            for (let i = -3; i <= 3; i++) {
                const lx = cx + i * 5, lh = 6 + (3 - Math.abs(i)) * 2, a = i * 12;
                s += `<polygon points="${lx},${bp.neckY - 3} ${lx - 3},${bp.neckY + lh} ${lx + 3},${bp.neckY + lh}" fill="${pal.dark}" opacity="0.5" transform="rotate(${a} ${lx} ${bp.neckY + 2})" />`;
            }
            s += this._drawEyes(cx, bp.headY, bp.headR * 0.42, mood, 'cat');
            s += `<polygon points="${cx - 1.5},${bp.headY + 2} ${cx},${bp.headY + 4} ${cx + 1.5},${bp.headY + 2}" fill="${pal.dark}" />`;
            s += `<line x1="${cx - 4}" y1="${bp.headY + 3}" x2="${cx - 12}" y2="${bp.headY + 1}" stroke="${pal.dark}" stroke-width="0.4" />`;
            s += `<line x1="${cx + 4}" y1="${bp.headY + 3}" x2="${cx + 12}" y2="${bp.headY + 1}" stroke="${pal.dark}" stroke-width="0.4" />`;
            // Arms with vine spiral and claw paws
            const al = 13 + mp * 5;
            s += `<line x1="${cx - bp.shoulderW}" y1="${bp.armY}" x2="${cx - bp.shoulderW - al}" y2="${bp.armY + 8}" stroke="${pal.main}" stroke-width="${bp.armThick}" stroke-linecap="round" />`;
            s += `<line x1="${cx + bp.shoulderW}" y1="${bp.armY}" x2="${cx + bp.shoulderW + al}" y2="${bp.armY + 8}" stroke="${pal.main}" stroke-width="${bp.armThick}" stroke-linecap="round" />`;
            // Vine spiral wrapping
            s += `<path d="M${cx - bp.shoulderW - 2} ${bp.armY + 1} Q${cx - bp.shoulderW - al / 2} ${bp.armY + 5} ${cx - bp.shoulderW - al + 2} ${bp.armY + 4}" fill="none" stroke="${pal.dark}" stroke-width="0.6" opacity="0.4" />`;
            s += `<path d="M${cx + bp.shoulderW + 2} ${bp.armY + 1} Q${cx + bp.shoulderW + al / 2} ${bp.armY + 5} ${cx + bp.shoulderW + al - 2} ${bp.armY + 4}" fill="none" stroke="${pal.dark}" stroke-width="0.6" opacity="0.4" />`;
            // Claw paws — 3 claws
            for (const side of [-1, 1]) {
                const px = cx + side * (bp.shoulderW + al);
                s += `<line x1="${px}" y1="${bp.armY + 8}" x2="${px + side * 3}" y2="${bp.armY + 12}" stroke="${pal.dark}" stroke-width="1.2" />`;
                s += `<line x1="${px}" y1="${bp.armY + 8}" x2="${px}" y2="${bp.armY + 13}" stroke="${pal.dark}" stroke-width="1.2" />`;
                s += `<line x1="${px}" y1="${bp.armY + 8}" x2="${px - side * 2}" y2="${bp.armY + 12}" stroke="${pal.dark}" stroke-width="1.2" />`;
            }
            // Vine tail with leaf (render BEHIND legs)
            s += `<path d="M${cx + 8} ${bp.bodyY + bp.bodyH - 5} Q${cx + 22} ${bp.bodyY + bp.bodyH - 14} ${cx + 17} ${bp.bodyY + bp.bodyH - 22}" fill="none" stroke="${pal.main}" stroke-width="2.5" stroke-linecap="round" />`;
            s += `<polygon points="${cx + 17},${bp.bodyY + bp.bodyH - 15} ${cx + 20},${bp.bodyY + bp.bodyH - 19} ${cx + 19},${bp.bodyY + bp.bodyH - 14}" fill="${pal.dark}" opacity="0.4" />`;
            s += `<polygon points="${cx + 14},${bp.bodyY + bp.bodyH - 22} ${cx + 17},${bp.bodyY + bp.bodyH - 30} ${cx + 20},${bp.bodyY + bp.bodyH - 22}" fill="${pal.accent}" />`;
            // Legs with bark texture
            s += `<line x1="${cx - 7}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 9}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            s += `<line x1="${cx + 7}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 9}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            // Bark ring marks on legs
            for (let i = 0; i < 3; i++) { const ly = bp.feetY - 3 - i * 4; s += `<line x1="${cx - 10}" y1="${ly}" x2="${cx - 7}" y2="${ly}" stroke="${pal.main}" stroke-width="0.5" opacity="0.3" /><line x1="${cx + 7}" y1="${ly}" x2="${cx + 10}" y2="${ly}" stroke="${pal.main}" stroke-width="0.5" opacity="0.3" />`; }
            // Root feet — spreading
            s += `<path d="M${cx - 14} ${bp.feetY + 3} L${cx - 9} ${bp.feetY} L${cx - 5} ${bp.feetY + 2}" fill="none" stroke="${pal.dark}" stroke-width="1.5" />`;
            s += `<line x1="${cx - 9}" y1="${bp.feetY}" x2="${cx - 10}" y2="${bp.feetY + 5}" stroke="${pal.dark}" stroke-width="1.2" />`;
            s += `<path d="M${cx + 5} ${bp.feetY + 2} L${cx + 9} ${bp.feetY} L${cx + 14} ${bp.feetY + 3}" fill="none" stroke="${pal.dark}" stroke-width="1.5" />`;
            s += `<line x1="${cx + 9}" y1="${bp.feetY}" x2="${cx + 10}" y2="${bp.feetY + 5}" stroke="${pal.dark}" stroke-width="1.2" />`;

        } else if (form === 2) {
            // Sylvatigre — Bipedal tiger-cat, flower bloom crown, vine-wrapped arms, thorny shoulder pads,
            // leaf cape, bark chest plate, root claws, tiger stripes
            // Body — muscular V-taper
            s += `<polygon points="${cx - bp.shoulderW},${bp.bodyY - 8} ${cx - 9},${bp.bodyY + bp.bodyH} ${cx + 9},${bp.bodyY + bp.bodyH} ${cx + bp.shoulderW},${bp.bodyY - 8}" fill="${pal.main}" />`;
            // Bark chest plate
            s += `<polygon points="${cx - bp.bodyW + 7},${bp.bodyY - 3} ${cx},${bp.bodyY + bp.bodyH - 4} ${cx + bp.bodyW - 7},${bp.bodyY - 3}" fill="${pal.dark}" opacity="0.15" />`;
            // Pec line
            s += `<path d="M${cx - bp.bodyW + 8} ${bp.bodyY - 2} Q${cx} ${bp.bodyY + 3} ${cx + bp.bodyW - 8} ${bp.bodyY - 2}" fill="none" stroke="${pal.dark}" stroke-width="0.6" opacity="0.25" />`;
            s += `<line x1="${cx}" y1="${bp.bodyY - 1}" x2="${cx}" y2="${bp.bodyY + 5}" stroke="${pal.dark}" stroke-width="0.5" opacity="0.25" />`;
            // Six-pack
            if (mp > 0.15) {
                for (let i = 0; i < 3; i++) { const ay = bp.bodyY + 7 + i * 5; s += `<line x1="${cx - 5}" y1="${ay}" x2="${cx + 5}" y2="${ay}" stroke="${pal.dark}" stroke-width="0.7" opacity="${0.15 + mp * 0.2}" />`; }
                s += `<line x1="${cx}" y1="${bp.bodyY + 5}" x2="${cx}" y2="${bp.bodyY + bp.bodyH - 3}" stroke="${pal.dark}" stroke-width="0.5" opacity="${mp * 0.25}" />`;
            }
            // Tiger stripe markings — angular
            for (let i = 0; i < 4; i++) {
                const sy = bp.bodyY - 4 + i * 7;
                s += `<path d="M${cx - bp.shoulderW + 3 + i} ${sy} L${cx - bp.shoulderW + 7 + i} ${sy + 4}" stroke="${pal.dark}" stroke-width="1.2" opacity="0.35" stroke-linecap="round" />`;
                s += `<path d="M${cx + bp.shoulderW - 3 - i} ${sy} L${cx + bp.shoulderW - 7 - i} ${sy + 4}" stroke="${pal.dark}" stroke-width="1.2" opacity="0.35" stroke-linecap="round" />`;
            }
            // Vine pattern on torso
            s += `<path d="M${cx - bp.shoulderW + 3} ${bp.bodyY + 4} Q${cx - bp.shoulderW + 9} ${bp.bodyY} ${cx - bp.shoulderW + 14} ${bp.bodyY + 4} Q${cx - bp.shoulderW + 19} ${bp.bodyY + 8} ${cx - bp.shoulderW + 23} ${bp.bodyY + 3}" fill="none" stroke="${pal.dark}" stroke-width="0.6" opacity="0.2" />`;
            s += `<path d="M${cx + bp.shoulderW - 3} ${bp.bodyY + 4} Q${cx + bp.shoulderW - 9} ${bp.bodyY} ${cx + bp.shoulderW - 14} ${bp.bodyY + 4} Q${cx + bp.shoulderW - 19} ${bp.bodyY + 8} ${cx + bp.shoulderW - 23} ${bp.bodyY + 3}" fill="none" stroke="${pal.dark}" stroke-width="0.6" opacity="0.2" />`;
            // Thorny shoulder pads
            s += `<polygon points="${cx - bp.shoulderW},${bp.armY - 3} ${cx - bp.shoulderW - 5},${bp.armY - 12} ${cx - bp.shoulderW + 3},${bp.armY - 5}" fill="${pal.dark}" opacity="0.5" />`;
            s += `<polygon points="${cx - bp.shoulderW - 2},${bp.armY - 5} ${cx - bp.shoulderW - 8},${bp.armY - 10} ${cx - bp.shoulderW + 1},${bp.armY - 7}" fill="${pal.dark}" opacity="0.35" />`;
            s += `<polygon points="${cx + bp.shoulderW},${bp.armY - 3} ${cx + bp.shoulderW + 5},${bp.armY - 12} ${cx + bp.shoulderW - 3},${bp.armY - 5}" fill="${pal.dark}" opacity="0.5" />`;
            s += `<polygon points="${cx + bp.shoulderW + 2},${bp.armY - 5} ${cx + bp.shoulderW + 8},${bp.armY - 10} ${cx + bp.shoulderW - 1},${bp.armY - 7}" fill="${pal.dark}" opacity="0.35" />`;
            // Leaf cape flowing behind
            s += `<path d="M${cx - bp.shoulderW + 3} ${bp.neckY} Q${cx - bp.shoulderW - 10} ${bp.bodyY + bp.bodyH * 0.5} ${cx - bp.shoulderW - 5} ${bp.feetY + 5}" fill="${pal.dark}" opacity="0.3"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M${cx - bp.shoulderW + 3} ${bp.neckY} Q${cx - bp.shoulderW - 10} ${bp.bodyY + bp.bodyH * 0.5} ${cx - bp.shoulderW - 5} ${bp.feetY + 5};M${cx - bp.shoulderW + 3} ${bp.neckY} Q${cx - bp.shoulderW - 13} ${bp.bodyY + bp.bodyH * 0.5} ${cx - bp.shoulderW - 7} ${bp.feetY + 5};M${cx - bp.shoulderW + 3} ${bp.neckY} Q${cx - bp.shoulderW - 10} ${bp.bodyY + bp.bodyH * 0.5} ${cx - bp.shoulderW - 5} ${bp.feetY + 5}" /></path>`;
            s += `<path d="M${cx + bp.shoulderW - 3} ${bp.neckY} Q${cx + bp.shoulderW + 10} ${bp.bodyY + bp.bodyH * 0.5} ${cx + bp.shoulderW + 5} ${bp.feetY + 5}" fill="${pal.dark}" opacity="0.3"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M${cx + bp.shoulderW - 3} ${bp.neckY} Q${cx + bp.shoulderW + 10} ${bp.bodyY + bp.bodyH * 0.5} ${cx + bp.shoulderW + 5} ${bp.feetY + 5};M${cx + bp.shoulderW - 3} ${bp.neckY} Q${cx + bp.shoulderW + 13} ${bp.bodyY + bp.bodyH * 0.5} ${cx + bp.shoulderW + 7} ${bp.feetY + 5};M${cx + bp.shoulderW - 3} ${bp.neckY} Q${cx + bp.shoulderW + 10} ${bp.bodyY + bp.bodyH * 0.5} ${cx + bp.shoulderW + 5} ${bp.feetY + 5}" /></path>`;
            // Leaf vein on cape
            s += `<line x1="${cx - bp.shoulderW}" y1="${bp.neckY + 5}" x2="${cx - bp.shoulderW - 4}" y2="${bp.feetY}" stroke="${pal.main}" stroke-width="0.4" opacity="0.3" />`;
            s += `<line x1="${cx + bp.shoulderW}" y1="${bp.neckY + 5}" x2="${cx + bp.shoulderW + 4}" y2="${bp.feetY}" stroke="${pal.main}" stroke-width="0.4" opacity="0.3" />`;
            // Head — angular
            s += `<polygon points="${cx - bp.headR - 1},${bp.headY + 5} ${cx - bp.headR + 3},${bp.headY - bp.headR} ${cx},${bp.headY - bp.headR - 2} ${cx + bp.headR - 3},${bp.headY - bp.headR} ${cx + bp.headR + 1},${bp.headY + 5} ${cx},${bp.headY + 7}" fill="${pal.main}" />`;
            // Pointed fierce ears with leaf veins
            s += `<polygon points="${cx - 15},${bp.headY - 17} ${cx - 6},${bp.headY - bp.headR} ${cx - 17},${bp.headY - bp.headR + 6}" fill="${pal.main}" />`;
            s += `<polygon points="${cx + 15},${bp.headY - 17} ${cx + 6},${bp.headY - bp.headR} ${cx + 17},${bp.headY - bp.headR + 6}" fill="${pal.main}" />`;
            s += `<line x1="${cx - 14}" y1="${bp.headY - 16}" x2="${cx - 10}" y2="${bp.headY - bp.headR + 3}" stroke="${pal.dark}" stroke-width="0.5" opacity="0.3" />`;
            s += `<line x1="${cx + 14}" y1="${bp.headY - 16}" x2="${cx + 10}" y2="${bp.headY - bp.headR + 3}" stroke="${pal.dark}" stroke-width="0.5" opacity="0.3" />`;
            // LARGE flower bloom crown — 6 petals
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                const px = cx + Math.cos(angle) * 9, py = bp.headY - bp.headR - 7 + Math.sin(angle) * 6;
                s += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="5.5" ry="3.5" fill="${i % 2 === 0 ? '#E91E63' : '#F06292'}" opacity="0.8" transform="rotate(${(i * 60).toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})" />`;
            }
            s += `<circle cx="${cx}" cy="${bp.headY - bp.headR - 7}" r="3.5" fill="#FFE082" />`;
            s += `<circle cx="${cx}" cy="${bp.headY - bp.headR - 7}" r="2" fill="#FFC107" />`;
            s += this._drawEyes(cx, bp.headY, bp.headR * 0.38, mood, 'fierce_cat');
            s += `<polygon points="${cx - 1.5},${bp.headY + 1} ${cx},${bp.headY + 3.5} ${cx + 1.5},${bp.headY + 1}" fill="${pal.dark}" />`;
            s += `<line x1="${cx - 4}" y1="${bp.headY + 2}" x2="${cx - 13}" y2="${bp.headY}" stroke="${pal.dark}" stroke-width="0.5" />`;
            s += `<line x1="${cx + 4}" y1="${bp.headY + 2}" x2="${cx + 13}" y2="${bp.headY}" stroke="${pal.dark}" stroke-width="0.5" />`;
            // Vine-wrapped muscular arms with thorns
            const al = 16 + mp * 5;
            s += `<line x1="${cx - bp.shoulderW}" y1="${bp.armY}" x2="${cx - bp.shoulderW - al}" y2="${bp.armY + 5}" stroke="${pal.main}" stroke-width="${bp.armThick}" stroke-linecap="round" />`;
            s += `<line x1="${cx + bp.shoulderW}" y1="${bp.armY}" x2="${cx + bp.shoulderW + al}" y2="${bp.armY + 5}" stroke="${pal.main}" stroke-width="${bp.armThick}" stroke-linecap="round" />`;
            // Vine wrapping with thorns
            s += `<path d="M${cx - bp.shoulderW - 2} ${bp.armY} Q${cx - bp.shoulderW - al * 0.35} ${bp.armY + 5} ${cx - bp.shoulderW - al * 0.6} ${bp.armY + 2} Q${cx - bp.shoulderW - al * 0.8} ${bp.armY + 6} ${cx - bp.shoulderW - al + 2} ${bp.armY + 3}" fill="none" stroke="${pal.dark}" stroke-width="0.7" opacity="0.45" />`;
            s += `<path d="M${cx + bp.shoulderW + 2} ${bp.armY} Q${cx + bp.shoulderW + al * 0.35} ${bp.armY + 5} ${cx + bp.shoulderW + al * 0.6} ${bp.armY + 2} Q${cx + bp.shoulderW + al * 0.8} ${bp.armY + 6} ${cx + bp.shoulderW + al - 2} ${bp.armY + 3}" fill="none" stroke="${pal.dark}" stroke-width="0.7" opacity="0.45" />`;
            // Thorns on arms
            s += `<polygon points="${cx - bp.shoulderW - al * 0.4},${bp.armY + 3} ${cx - bp.shoulderW - al * 0.4 - 2},${bp.armY - 2} ${cx - bp.shoulderW - al * 0.4 + 1},${bp.armY + 1}" fill="${pal.dark}" opacity="0.4" />`;
            s += `<polygon points="${cx + bp.shoulderW + al * 0.4},${bp.armY + 3} ${cx + bp.shoulderW + al * 0.4 + 2},${bp.armY - 2} ${cx + bp.shoulderW + al * 0.4 - 1},${bp.armY + 1}" fill="${pal.dark}" opacity="0.4" />`;
            // Sharp root claws
            for (const side of [-1, 1]) {
                const px = cx + side * (bp.shoulderW + al);
                s += `<line x1="${px}" y1="${bp.armY + 5}" x2="${px + side * 4}" y2="${bp.armY + 11}" stroke="${pal.dark}" stroke-width="1.3" />`;
                s += `<line x1="${px}" y1="${bp.armY + 5}" x2="${px}" y2="${bp.armY + 12}" stroke="${pal.dark}" stroke-width="1.3" />`;
                s += `<line x1="${px}" y1="${bp.armY + 5}" x2="${px - side * 3}" y2="${bp.armY + 11}" stroke="${pal.dark}" stroke-width="1.3" />`;
            }
            // Vine tail with thorn and leaf (render BEFORE legs so it appears behind)
            s += `<path d="M${cx + 10} ${bp.bodyY + bp.bodyH - 8} Q${cx + 24} ${bp.bodyY + bp.bodyH - 16} ${cx + 19} ${bp.bodyY + bp.bodyH - 28}" fill="none" stroke="${pal.main}" stroke-width="3" stroke-linecap="round" />`;
            s += `<polygon points="${cx + 20},${bp.bodyY + bp.bodyH - 18} ${cx + 23},${bp.bodyY + bp.bodyH - 22} ${cx + 22},${bp.bodyY + bp.bodyH - 17}" fill="${pal.dark}" opacity="0.4" />`;
            s += `<polygon points="${cx + 16},${bp.bodyY + bp.bodyH - 28} ${cx + 19},${bp.bodyY + bp.bodyH - 36} ${cx + 22},${bp.bodyY + bp.bodyH - 28}" fill="${pal.accent}"><animate attributeName="points" dur="2s" repeatCount="indefinite" values="${cx + 16},${bp.bodyY + bp.bodyH - 28} ${cx + 19},${bp.bodyY + bp.bodyH - 36} ${cx + 22},${bp.bodyY + bp.bodyH - 28};${cx + 15},${bp.bodyY + bp.bodyH - 28} ${cx + 19},${bp.bodyY + bp.bodyH - 38} ${cx + 23},${bp.bodyY + bp.bodyH - 28};${cx + 16},${bp.bodyY + bp.bodyH - 28} ${cx + 19},${bp.bodyY + bp.bodyH - 36} ${cx + 22},${bp.bodyY + bp.bodyH - 28}" /></polygon>`;
            // Strong legs with bark texture
            s += `<line x1="${cx - 8}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 10}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            s += `<line x1="${cx + 8}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 10}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            for (let i = 0; i < 4; i++) { const ly = bp.feetY - 3 - i * 3; s += `<line x1="${cx - 11}" y1="${ly}" x2="${cx - 8}" y2="${ly}" stroke="${pal.main}" stroke-width="0.5" opacity="0.3" /><line x1="${cx + 8}" y1="${ly}" x2="${cx + 11}" y2="${ly}" stroke="${pal.main}" stroke-width="0.5" opacity="0.3" />`; }
            // Root feet — multi-root spread
            for (const side of [-1, 1]) {
                const fx = cx + side * 10;
                s += `<path d="M${fx - side * 6} ${bp.feetY + 4} L${fx} ${bp.feetY} L${fx + side * 6} ${bp.feetY + 4}" fill="none" stroke="${pal.dark}" stroke-width="2" />`;
                s += `<line x1="${fx}" y1="${bp.feetY}" x2="${fx + side * 1}" y2="${bp.feetY + 5}" stroke="${pal.dark}" stroke-width="1.5" />`;
                s += `<line x1="${fx + side * 4}" y1="${bp.feetY + 2}" x2="${fx + side * 5}" y2="${bp.feetY + 6}" stroke="${pal.dark}" stroke-width="1" opacity="0.6" />`;
            }
            // Floating leaf particles
            s += `<polygon points="${cx - 15},${bp.headY - 10} ${cx - 13},${bp.headY - 13} ${cx - 11},${bp.headY - 10}" fill="${pal.accent}" opacity="0.3"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.3;0.05;0.3" /></polygon>`;

        } else {
            // Floracolosse — Massive beast, GIANT sunflower crown, full bark armor, root feet,
            // vine arms with thorns, moss patches, leaf cape, tail with flower
            // Body — massive trunk
            s += `<polygon points="${cx - bp.shoulderW},${bp.bodyY - 10} ${cx - bp.shoulderW + 3},${bp.bodyY + bp.bodyH * 0.4} ${cx - 12},${bp.bodyY + bp.bodyH} ${cx + 12},${bp.bodyY + bp.bodyH} ${cx + bp.shoulderW - 3},${bp.bodyY + bp.bodyH * 0.4} ${cx + bp.shoulderW},${bp.bodyY - 10}" fill="${pal.main}" />`;
            // Bark armor chest plate
            s += `<polygon points="${cx - bp.bodyW + 6},${bp.bodyY - 5} ${cx},${bp.bodyY + bp.bodyH - 4} ${cx + bp.bodyW - 6},${bp.bodyY - 5}" fill="${pal.dark}" opacity="0.18" />`;
            // Pec definition
            s += `<path d="M${cx - bp.bodyW + 8} ${bp.bodyY - 3} Q${cx} ${bp.bodyY + 4} ${cx + bp.bodyW - 8} ${bp.bodyY - 3}" fill="none" stroke="${pal.dark}" stroke-width="0.8" opacity="0.3" />`;
            s += `<line x1="${cx}" y1="${bp.bodyY - 2}" x2="${cx}" y2="${bp.bodyY + 6}" stroke="${pal.dark}" stroke-width="0.7" opacity="0.3" />`;
            // Eight-pack
            for (let i = 0; i < 4; i++) { const ay = bp.bodyY + 8 + i * 5; s += `<line x1="${cx - 6}" y1="${ay}" x2="${cx + 6}" y2="${ay}" stroke="${pal.dark}" stroke-width="0.7" opacity="0.35" />`; }
            s += `<line x1="${cx}" y1="${bp.bodyY + 6}" x2="${cx}" y2="${bp.bodyY + bp.bodyH - 5}" stroke="${pal.dark}" stroke-width="0.6" opacity="0.3" />`;
            // Bark texture — horizontal rings
            for (let i = 0; i < 5; i++) {
                const by = bp.bodyY - 5 + i * 7;
                s += `<path d="M${cx - bp.shoulderW + 4} ${by} Q${cx} ${by + 2} ${cx + bp.shoulderW - 4} ${by}" fill="none" stroke="${pal.dark}" stroke-width="0.5" opacity="0.2" />`;
            }
            // Tiger stripes — angular
            for (let i = 0; i < 5; i++) {
                const sy = bp.bodyY - 6 + i * 7;
                s += `<path d="M${cx - bp.shoulderW + 2 + i} ${sy} L${cx - bp.shoulderW + 6 + i} ${sy + 4}" stroke="${pal.dark}" stroke-width="1.3" opacity="0.3" stroke-linecap="round" />`;
                s += `<path d="M${cx + bp.shoulderW - 2 - i} ${sy} L${cx + bp.shoulderW - 6 - i} ${sy + 4}" stroke="${pal.dark}" stroke-width="1.3" opacity="0.3" stroke-linecap="round" />`;
            }
            // Moss patches on body
            s += `<circle cx="${cx - bp.shoulderW + 6}" cy="${bp.bodyY + 14}" r="2" fill="${pal.accent}" opacity="0.2" />`;
            s += `<circle cx="${cx + bp.shoulderW - 7}" cy="${bp.bodyY + 10}" r="2.5" fill="${pal.accent}" opacity="0.2" />`;
            // Vine tattoo pattern
            s += `<path d="M${cx - bp.shoulderW + 3} ${bp.bodyY + 5} Q${cx - bp.shoulderW + 10} ${bp.bodyY + 1} ${cx - bp.shoulderW + 16} ${bp.bodyY + 5} Q${cx - bp.shoulderW + 22} ${bp.bodyY + 9} ${cx - bp.shoulderW + 26} ${bp.bodyY + 4}" fill="none" stroke="${pal.dark}" stroke-width="0.7" opacity="0.2" />`;
            s += `<path d="M${cx + bp.shoulderW - 3} ${bp.bodyY + 5} Q${cx + bp.shoulderW - 10} ${bp.bodyY + 1} ${cx + bp.shoulderW - 16} ${bp.bodyY + 5} Q${cx + bp.shoulderW - 22} ${bp.bodyY + 9} ${cx + bp.shoulderW - 26} ${bp.bodyY + 4}" fill="none" stroke="${pal.dark}" stroke-width="0.7" opacity="0.2" />`;
            // MASSIVE thorn shoulder pads — multi-spike
            s += `<polygon points="${cx - bp.shoulderW},${bp.armY - 3} ${cx - bp.shoulderW - 6},${bp.armY - 14} ${cx - bp.shoulderW + 3},${bp.armY - 5}" fill="${pal.dark}" opacity="0.55" />`;
            s += `<polygon points="${cx - bp.shoulderW - 3},${bp.armY - 5} ${cx - bp.shoulderW - 10},${bp.armY - 12} ${cx - bp.shoulderW + 1},${bp.armY - 7}" fill="${pal.dark}" opacity="0.4" />`;
            s += `<polygon points="${cx - bp.shoulderW + 4},${bp.armY - 4} ${cx - bp.shoulderW + 2},${bp.armY - 10} ${cx - bp.shoulderW + 6},${bp.armY - 6}" fill="${pal.dark}" opacity="0.3" />`;
            s += `<polygon points="${cx + bp.shoulderW},${bp.armY - 3} ${cx + bp.shoulderW + 6},${bp.armY - 14} ${cx + bp.shoulderW - 3},${bp.armY - 5}" fill="${pal.dark}" opacity="0.55" />`;
            s += `<polygon points="${cx + bp.shoulderW + 3},${bp.armY - 5} ${cx + bp.shoulderW + 10},${bp.armY - 12} ${cx + bp.shoulderW - 1},${bp.armY - 7}" fill="${pal.dark}" opacity="0.4" />`;
            s += `<polygon points="${cx + bp.shoulderW - 4},${bp.armY - 4} ${cx + bp.shoulderW - 2},${bp.armY - 10} ${cx + bp.shoulderW - 6},${bp.armY - 6}" fill="${pal.dark}" opacity="0.3" />`;
            // Leaf cape — with veins
            s += `<path d="M${cx - bp.shoulderW + 3} ${bp.neckY} Q${cx - bp.shoulderW - 12} ${bp.bodyY + bp.bodyH * 0.5} ${cx - bp.shoulderW - 6} ${bp.feetY + 6}" fill="${pal.dark}" opacity="0.3"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M${cx - bp.shoulderW + 3} ${bp.neckY} Q${cx - bp.shoulderW - 12} ${bp.bodyY + bp.bodyH * 0.5} ${cx - bp.shoulderW - 6} ${bp.feetY + 6};M${cx - bp.shoulderW + 3} ${bp.neckY} Q${cx - bp.shoulderW - 15} ${bp.bodyY + bp.bodyH * 0.5} ${cx - bp.shoulderW - 8} ${bp.feetY + 6};M${cx - bp.shoulderW + 3} ${bp.neckY} Q${cx - bp.shoulderW - 12} ${bp.bodyY + bp.bodyH * 0.5} ${cx - bp.shoulderW - 6} ${bp.feetY + 6}" /></path>`;
            s += `<path d="M${cx + bp.shoulderW - 3} ${bp.neckY} Q${cx + bp.shoulderW + 12} ${bp.bodyY + bp.bodyH * 0.5} ${cx + bp.shoulderW + 6} ${bp.feetY + 6}" fill="${pal.dark}" opacity="0.3"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M${cx + bp.shoulderW - 3} ${bp.neckY} Q${cx + bp.shoulderW + 12} ${bp.bodyY + bp.bodyH * 0.5} ${cx + bp.shoulderW + 6} ${bp.feetY + 6};M${cx + bp.shoulderW - 3} ${bp.neckY} Q${cx + bp.shoulderW + 15} ${bp.bodyY + bp.bodyH * 0.5} ${cx + bp.shoulderW + 8} ${bp.feetY + 6};M${cx + bp.shoulderW - 3} ${bp.neckY} Q${cx + bp.shoulderW + 12} ${bp.bodyY + bp.bodyH * 0.5} ${cx + bp.shoulderW + 6} ${bp.feetY + 6}" /></path>`;
            // Cape leaf veins
            s += `<line x1="${cx - bp.shoulderW}" y1="${bp.neckY + 8}" x2="${cx - bp.shoulderW - 5}" y2="${bp.feetY + 2}" stroke="${pal.main}" stroke-width="0.4" opacity="0.25" />`;
            s += `<line x1="${cx + bp.shoulderW}" y1="${bp.neckY + 8}" x2="${cx + bp.shoulderW + 5}" y2="${bp.feetY + 2}" stroke="${pal.main}" stroke-width="0.4" opacity="0.25" />`;
            // Head — angular warrior cat
            s += `<polygon points="${cx - bp.headR - 2},${bp.headY + 5} ${cx - bp.headR + 2},${bp.headY - bp.headR + 1} ${cx},${bp.headY - bp.headR - 2} ${cx + bp.headR - 2},${bp.headY - bp.headR + 1} ${cx + bp.headR + 2},${bp.headY + 5} ${cx + 2},${bp.headY + 8} ${cx - 2},${bp.headY + 8}" fill="${pal.main}" />`;
            // GIANT pointed ears
            s += `<polygon points="${cx - 16},${bp.headY - 19} ${cx - 6},${bp.headY - bp.headR} ${cx - 18},${bp.headY - bp.headR + 7}" fill="${pal.main}" />`;
            s += `<polygon points="${cx + 16},${bp.headY - 19} ${cx + 6},${bp.headY - bp.headR} ${cx + 18},${bp.headY - bp.headR + 7}" fill="${pal.main}" />`;
            s += `<line x1="${cx - 15}" y1="${bp.headY - 18}" x2="${cx - 10}" y2="${bp.headY - bp.headR + 4}" stroke="${pal.dark}" stroke-width="0.5" opacity="0.3" />`;
            s += `<line x1="${cx + 15}" y1="${bp.headY - 18}" x2="${cx + 10}" y2="${bp.headY - bp.headR + 4}" stroke="${pal.dark}" stroke-width="0.5" opacity="0.3" />`;
            // GIANT SUNFLOWER CROWN — 8 petals
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
                const px = cx + Math.cos(angle) * 12, py = bp.headY - bp.headR - 9 + Math.sin(angle) * 9;
                const col = i % 3 === 0 ? '#E91E63' : i % 3 === 1 ? '#F06292' : '#FF8A80';
                s += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="6.5" ry="4" fill="${col}" opacity="0.85" transform="rotate(${(i * 45).toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})"><animate attributeName="rx" dur="${2 + i * 0.2}s" repeatCount="indefinite" values="6.5;7.5;6.5" /></ellipse>`;
            }
            s += `<circle cx="${cx}" cy="${bp.headY - bp.headR - 9}" r="5.5" fill="#FFE082" />`;
            s += `<circle cx="${cx}" cy="${bp.headY - bp.headR - 9}" r="3.5" fill="#FFC107" />`;
            s += `<circle cx="${cx}" cy="${bp.headY - bp.headR - 9}" r="1.5" fill="#FF8F00" />`;
            // Glowing green eyes
            s += this._drawEyes(cx, bp.headY, bp.headR * 0.35, mood, 'glowing_green');
            // Jaw with slight snarl
            s += `<polygon points="${cx - 2},${bp.headY + 2} ${cx},${bp.headY + 5} ${cx + 2},${bp.headY + 2}" fill="${pal.dark}" />`;
            s += `<path d="M${cx - bp.headR + 2} ${bp.headY + 5} L${cx} ${bp.headY + 8} L${cx + bp.headR - 2} ${bp.headY + 5}" fill="none" stroke="${pal.dark}" stroke-width="0.6" opacity="0.3" />`;
            // Huge vine-wrapped arms with bark bracers and thorns
            const al = 20 + mp * 6;
            s += `<line x1="${cx - bp.shoulderW}" y1="${bp.armY}" x2="${cx - bp.shoulderW - al}" y2="${bp.armY + 4}" stroke="${pal.main}" stroke-width="${bp.armThick + 3}" stroke-linecap="round" />`;
            s += `<line x1="${cx + bp.shoulderW}" y1="${bp.armY}" x2="${cx + bp.shoulderW + al}" y2="${bp.armY + 4}" stroke="${pal.main}" stroke-width="${bp.armThick + 3}" stroke-linecap="round" />`;
            // Vine wrapping on arms
            s += `<path d="M${cx - bp.shoulderW - 2} ${bp.armY} Q${cx - bp.shoulderW - al * 0.25} ${bp.armY + 5} ${cx - bp.shoulderW - al * 0.5} ${bp.armY + 1} Q${cx - bp.shoulderW - al * 0.75} ${bp.armY + 6} ${cx - bp.shoulderW - al + 3} ${bp.armY + 2}" fill="none" stroke="${pal.dark}" stroke-width="0.8" opacity="0.4" />`;
            s += `<path d="M${cx + bp.shoulderW + 2} ${bp.armY} Q${cx + bp.shoulderW + al * 0.25} ${bp.armY + 5} ${cx + bp.shoulderW + al * 0.5} ${bp.armY + 1} Q${cx + bp.shoulderW + al * 0.75} ${bp.armY + 6} ${cx + bp.shoulderW + al - 3} ${bp.armY + 2}" fill="none" stroke="${pal.dark}" stroke-width="0.8" opacity="0.4" />`;
            // Thorns on arm vines
            s += `<polygon points="${cx - bp.shoulderW - al * 0.3},${bp.armY + 3} ${cx - bp.shoulderW - al * 0.3 - 2},${bp.armY - 3} ${cx - bp.shoulderW - al * 0.3 + 1},${bp.armY + 1}" fill="${pal.dark}" opacity="0.4" />`;
            s += `<polygon points="${cx - bp.shoulderW - al * 0.65},${bp.armY + 3} ${cx - bp.shoulderW - al * 0.65 - 2},${bp.armY - 2} ${cx - bp.shoulderW - al * 0.65 + 1},${bp.armY + 1}" fill="${pal.dark}" opacity="0.35" />`;
            s += `<polygon points="${cx + bp.shoulderW + al * 0.3},${bp.armY + 3} ${cx + bp.shoulderW + al * 0.3 + 2},${bp.armY - 3} ${cx + bp.shoulderW + al * 0.3 - 1},${bp.armY + 1}" fill="${pal.dark}" opacity="0.4" />`;
            s += `<polygon points="${cx + bp.shoulderW + al * 0.65},${bp.armY + 3} ${cx + bp.shoulderW + al * 0.65 + 2},${bp.armY - 2} ${cx + bp.shoulderW + al * 0.65 - 1},${bp.armY + 1}" fill="${pal.dark}" opacity="0.35" />`;
            // Bark bracers
            s += `<rect x="${cx - bp.shoulderW - al + 1}" y="${bp.armY - 2}" width="9" height="7" rx="1" fill="${pal.dark}" opacity="0.35" />`;
            s += `<rect x="${cx + bp.shoulderW + al - 10}" y="${bp.armY - 2}" width="9" height="7" rx="1" fill="${pal.dark}" opacity="0.35" />`;
            // Massive root claws
            for (const side of [-1, 1]) {
                const px = cx + side * (bp.shoulderW + al);
                s += `<line x1="${px}" y1="${bp.armY + 4}" x2="${px + side * 5}" y2="${bp.armY + 11}" stroke="${pal.dark}" stroke-width="1.5" />`;
                s += `<line x1="${px}" y1="${bp.armY + 4}" x2="${px + side * 1}" y2="${bp.armY + 12}" stroke="${pal.dark}" stroke-width="1.5" />`;
                s += `<line x1="${px}" y1="${bp.armY + 4}" x2="${px - side * 3}" y2="${bp.armY + 11}" stroke="${pal.dark}" stroke-width="1.5" />`;
            }
            // Massive vine tail with thorns and flower (render BEFORE legs so it appears behind)
            s += `<path d="M${cx + 12} ${bp.bodyY + bp.bodyH - 10} Q${cx + 28} ${bp.bodyY + bp.bodyH - 20} ${cx + 22} ${bp.bodyY + bp.bodyH - 35}" fill="none" stroke="${pal.main}" stroke-width="4" stroke-linecap="round" />`;
            // Thorns on tail
            s += `<polygon points="${cx + 22},${bp.bodyY + bp.bodyH - 16} ${cx + 26},${bp.bodyY + bp.bodyH - 21} ${cx + 24},${bp.bodyY + bp.bodyH - 15}" fill="${pal.dark}" opacity="0.4" />`;
            s += `<polygon points="${cx + 24},${bp.bodyY + bp.bodyH - 24} ${cx + 27},${bp.bodyY + bp.bodyH - 29} ${cx + 25},${bp.bodyY + bp.bodyH - 23}" fill="${pal.dark}" opacity="0.35" />`;
            // Flower on tail tip
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                const px = cx + 22 + Math.cos(angle) * 6, py = bp.bodyY + bp.bodyH - 38 + Math.sin(angle) * 4;
                s += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="4.5" ry="2.5" fill="${i % 2 === 0 ? '#E91E63' : '#F48FB1'}" transform="rotate(${(i * 72).toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})" />`;
            }
            s += `<circle cx="${cx + 22}" cy="${bp.bodyY + bp.bodyH - 38}" r="3" fill="#FFE082" />`;
            // Tree trunk legs with bark rings
            s += `<line x1="${cx - 10}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 12}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick + 2}" stroke-linecap="round" />`;
            s += `<line x1="${cx + 10}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 12}" y2="${bp.feetY}" stroke="${pal.dark}" stroke-width="${bp.legThick + 2}" stroke-linecap="round" />`;
            for (let i = 0; i < 5; i++) { const ly = bp.feetY - 2 - i * 3; s += `<line x1="${cx - 13}" y1="${ly}" x2="${cx - 10}" y2="${ly}" stroke="${pal.main}" stroke-width="0.5" opacity="0.3" /><line x1="${cx + 10}" y1="${ly}" x2="${cx + 13}" y2="${ly}" stroke="${pal.main}" stroke-width="0.5" opacity="0.3" />`; }
            // Massive root feet — spreading multi-root
            for (const side of [-1, 1]) {
                const fx = cx + side * 12;
                s += `<path d="M${fx - side * 7} ${bp.feetY + 4} L${fx} ${bp.feetY} L${fx + side * 7} ${bp.feetY + 5}" fill="none" stroke="${pal.dark}" stroke-width="2.5" />`;
                s += `<line x1="${fx}" y1="${bp.feetY}" x2="${fx + side * 2}" y2="${bp.feetY + 7}" stroke="${pal.dark}" stroke-width="2" />`;
                s += `<line x1="${fx + side * 5}" y1="${bp.feetY + 3}" x2="${fx + side * 7}" y2="${bp.feetY + 7}" stroke="${pal.dark}" stroke-width="1.5" opacity="0.6" />`;
                s += `<line x1="${fx - side * 5}" y1="${bp.feetY + 2}" x2="${fx - side * 6}" y2="${bp.feetY + 6}" stroke="${pal.dark}" stroke-width="1.2" opacity="0.5" />`;
            }
            // Floating leaf/petal particles
            for (let i = 0; i < 2; i++) {
                const lx = cx - 14 + i * 28, ld = 3 + i * 1.5;
                s += `<polygon points="${lx},${bp.headY - 12} ${lx + 2},${bp.headY - 15} ${lx + 4},${bp.headY - 12}" fill="${pal.accent}" opacity="0.25"><animate attributeName="opacity" dur="${ld}s" repeatCount="indefinite" values="0.25;0.05;0.25" /></polygon>`;
            }
        }
        return s;
    },

    // ============================================
    // WATER CREATURE
    // ============================================
    // ============================================
    // WATER CREATURE — Amphibian/Sea warrior lineage
    // Fins, scales, dorsal crests, webbed features
    // ============================================
    _buildWater(form, mp, bp, pal, mood) {
        let s = '';
        const cx = bp.cx;

        if (form === 0) {
            // Aquarein — Chunky tadpole-frog, big protruding eyes, fin bump, webbed toes
            // Body — slightly angular egg shape
            s += `<polygon points="${cx - bp.bodyW},${bp.bodyY - 2} ${cx - bp.bodyW + 4},${bp.bodyY + bp.bodyH} ${cx + bp.bodyW - 4},${bp.bodyY + bp.bodyH} ${cx + bp.bodyW},${bp.bodyY - 2} ${cx},${bp.bodyY - bp.bodyH + 4}" fill="${pal.main}" />`;
            // Belly — lighter angular patch
            s += `<polygon points="${cx - bp.bodyW + 6},${bp.bodyY + 2} ${cx - bp.bodyW + 8},${bp.bodyY + bp.bodyH - 3} ${cx + bp.bodyW - 8},${bp.bodyY + bp.bodyH - 3} ${cx + bp.bodyW - 6},${bp.bodyY + 2}" fill="${pal.accent}" opacity="0.5" />`;
            // Scale patches on sides
            for (let i = 0; i < 3; i++) {
                const sy = bp.bodyY + 2 + i * 5;
                s += `<path d="M${cx - bp.bodyW + 2} ${sy} L${cx - bp.bodyW + 5} ${sy - 2} L${cx - bp.bodyW + 5} ${sy + 2} Z" fill="${pal.dark}" opacity="0.2" />`;
                s += `<path d="M${cx + bp.bodyW - 2} ${sy} L${cx + bp.bodyW - 5} ${sy - 2} L${cx + bp.bodyW - 5} ${sy + 2} Z" fill="${pal.dark}" opacity="0.2" />`;
            }
            // Small dorsal fin bump
            s += `<polygon points="${cx - 3},${bp.bodyY - bp.bodyH + 5} ${cx},${bp.bodyY - bp.bodyH - 4} ${cx + 3},${bp.bodyY - bp.bodyH + 5}" fill="${pal.light}" />`;
            // Head — wide angular frog head
            s += `<polygon points="${cx - bp.headR - 4},${bp.headY + 4} ${cx - bp.headR},${bp.headY - bp.headR + 2} ${cx},${bp.headY - bp.headR} ${cx + bp.headR},${bp.headY - bp.headR + 2} ${cx + bp.headR + 4},${bp.headY + 4} ${cx},${bp.headY + 6}" fill="${pal.main}" />`;
            // Protruding eyes — big, on top of head like a frog
            s += `<circle cx="${cx - 9}" cy="${bp.headY - bp.headR + 1}" r="7" fill="${pal.main}" />`;
            s += `<circle cx="${cx + 9}" cy="${bp.headY - bp.headR + 1}" r="7" fill="${pal.main}" />`;
            s += `<circle cx="${cx - 9}" cy="${bp.headY - bp.headR}" r="5.5" fill="white" />`;
            s += `<circle cx="${cx + 9}" cy="${bp.headY - bp.headR}" r="5.5" fill="white" />`;
            s += `<circle cx="${cx - 8}" cy="${bp.headY - bp.headR}" r="3.5" fill="${pal.dark}" />`;
            s += `<circle cx="${cx + 10}" cy="${bp.headY - bp.headR}" r="3.5" fill="${pal.dark}" />`;
            s += `<circle cx="${cx - 7}" cy="${bp.headY - bp.headR - 1}" r="1.2" fill="white" />`;
            s += `<circle cx="${cx + 11}" cy="${bp.headY - bp.headR - 1}" r="1.2" fill="white" />`;
            // Water drop gem on forehead
            s += `<path d="M${cx} ${bp.headY - 4} L${cx - 2.5} ${bp.headY} L${cx} ${bp.headY + 2} L${cx + 2.5} ${bp.headY}" fill="${pal.accent}" opacity="0.8"><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.5;0.9;0.5" /></path>`;
            // Wide mouth
            s += `<path d="M${cx - 7} ${bp.headY + 3} L${cx} ${bp.headY + 5} L${cx + 7} ${bp.headY + 3}" fill="none" stroke="${pal.dark}" stroke-width="0.8" />`;
            // Small arm stubs with webbed ends
            s += `<line x1="${cx - bp.bodyW}" y1="${bp.bodyY}" x2="${cx - bp.bodyW - 7}" y2="${bp.bodyY + 4}" stroke="${pal.main}" stroke-width="2.5" stroke-linecap="round" />`;
            s += `<line x1="${cx + bp.bodyW}" y1="${bp.bodyY}" x2="${cx + bp.bodyW + 7}" y2="${bp.bodyY + 4}" stroke="${pal.main}" stroke-width="2.5" stroke-linecap="round" />`;
            // Webbed hands — 3 little fingers spread
            s += `<path d="M${cx - bp.bodyW - 7} ${bp.bodyY + 4} L${cx - bp.bodyW - 11} ${bp.bodyY + 2} L${cx - bp.bodyW - 10} ${bp.bodyY + 5} L${cx - bp.bodyW - 12} ${bp.bodyY + 7}" fill="none" stroke="${pal.light}" stroke-width="1" />`;
            s += `<path d="M${cx + bp.bodyW + 7} ${bp.bodyY + 4} L${cx + bp.bodyW + 11} ${bp.bodyY + 2} L${cx + bp.bodyW + 10} ${bp.bodyY + 5} L${cx + bp.bodyW + 12} ${bp.bodyY + 7}" fill="none" stroke="${pal.light}" stroke-width="1" />`;
            // Tail — tadpole-like (render BEFORE legs so it appears behind)
            s += `<path d="M${cx + 5} ${bp.bodyY + bp.bodyH - 4} Q${cx + 16} ${bp.bodyY + bp.bodyH} ${cx + 14} ${bp.bodyY + bp.bodyH + 6}" fill="none" stroke="${pal.light}" stroke-width="2.5" stroke-linecap="round"><animate attributeName="d" dur="1.5s" repeatCount="indefinite" values="M${cx + 5} ${bp.bodyY + bp.bodyH - 4} Q${cx + 16} ${bp.bodyY + bp.bodyH} ${cx + 14} ${bp.bodyY + bp.bodyH + 6};M${cx + 5} ${bp.bodyY + bp.bodyH - 4} Q${cx + 18} ${bp.bodyY + bp.bodyH + 3} ${cx + 12} ${bp.bodyY + bp.bodyH + 8};M${cx + 5} ${bp.bodyY + bp.bodyH - 4} Q${cx + 16} ${bp.bodyY + bp.bodyH} ${cx + 14} ${bp.bodyY + bp.bodyH + 6}" /></path>`;
            // Short legs with webbed feet
            s += `<line x1="${cx - 7}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 9}" y2="${bp.feetY}" stroke="${pal.main}" stroke-width="3" stroke-linecap="round" />`;
            s += `<line x1="${cx + 7}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 9}" y2="${bp.feetY}" stroke="${pal.main}" stroke-width="3" stroke-linecap="round" />`;
            // 3-toe webbed feet
            s += `<path d="M${cx - 14} ${bp.feetY + 2} L${cx - 9} ${bp.feetY} L${cx - 4} ${bp.feetY + 2}" fill="none" stroke="${pal.light}" stroke-width="1.5" />`;
            s += `<path d="M${cx - 12} ${bp.feetY + 1} L${cx - 9} ${bp.feetY + 3} L${cx - 6} ${bp.feetY + 1}" fill="${pal.light}" opacity="0.3" />`;
            s += `<path d="M${cx + 4} ${bp.feetY + 2} L${cx + 9} ${bp.feetY} L${cx + 14} ${bp.feetY + 2}" fill="none" stroke="${pal.light}" stroke-width="1.5" />`;
            s += `<path d="M${cx + 6} ${bp.feetY + 1} L${cx + 9} ${bp.feetY + 3} L${cx + 12} ${bp.feetY + 1}" fill="${pal.light}" opacity="0.3" />`;
            // Bubble
            s += `<circle cx="${cx - 14}" cy="${bp.headY - 5}" r="1.5" fill="${pal.accent}" opacity="0.4"><animate attributeName="cy" dur="2s" repeatCount="indefinite" values="${bp.headY - 5};${bp.headY - 12};${bp.headY - 5}" /><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.4;0;0.4" /></circle>`;

        } else if (form === 1) {
            // Torrentad — Standing frog-warrior, dorsal fin, webbed hands, scale patches, bicep bumps
            // Body — angular torso with V-taper
            s += `<polygon points="${cx - bp.shoulderW},${bp.bodyY - 6} ${cx - 8},${bp.bodyY + bp.bodyH + 2} ${cx + 8},${bp.bodyY + bp.bodyH + 2} ${cx + bp.shoulderW},${bp.bodyY - 6}" fill="${pal.main}" />`;
            // Belly plate — angular lighter section
            s += `<polygon points="${cx - bp.bodyW + 6},${bp.bodyY} ${cx - 5},${bp.bodyY + bp.bodyH} ${cx + 5},${bp.bodyY + bp.bodyH} ${cx + bp.bodyW - 6},${bp.bodyY}" fill="${pal.accent}" opacity="0.4" />`;
            // Scale pattern on torso sides
            for (let i = 0; i < 4; i++) {
                const sy = bp.bodyY - 2 + i * 6;
                s += `<polygon points="${cx - bp.shoulderW + 2},${sy} ${cx - bp.shoulderW + 5},${sy - 2.5} ${cx - bp.shoulderW + 8},${sy}" fill="${pal.dark}" opacity="0.15" />`;
                s += `<polygon points="${cx + bp.shoulderW - 2},${sy} ${cx + bp.shoulderW - 5},${sy - 2.5} ${cx + bp.shoulderW - 8},${sy}" fill="${pal.dark}" opacity="0.15" />`;
            }
            // Dorsal fin — single tall fin on back
            s += `<polygon points="${cx - 2},${bp.bodyY - 8} ${cx},${bp.bodyY - 20} ${cx + 3},${bp.bodyY - 8}" fill="${pal.light}" stroke="${pal.dark}" stroke-width="0.4" />`;
            s += `<line x1="${cx}" y1="${bp.bodyY - 18}" x2="${cx + 1}" y2="${bp.bodyY - 9}" stroke="${pal.dark}" stroke-width="0.3" opacity="0.4" />`;
            // Head — wider, angular frog
            s += `<polygon points="${cx - bp.headR - 2},${bp.headY + 5} ${cx - bp.headR + 2},${bp.headY - bp.headR + 1} ${cx},${bp.headY - bp.headR - 1} ${cx + bp.headR - 2},${bp.headY - bp.headR + 1} ${cx + bp.headR + 2},${bp.headY + 5} ${cx},${bp.headY + 7}" fill="${pal.main}" />`;
            // Protruding eyes — slightly smaller, more angular
            s += `<polygon points="${cx - 10},${bp.headY - bp.headR - 3} ${cx - 14},${bp.headY - bp.headR + 2} ${cx - 6},${bp.headY - bp.headR + 2}" fill="${pal.main}" />`;
            s += `<polygon points="${cx + 10},${bp.headY - bp.headR - 3} ${cx + 14},${bp.headY - bp.headR + 2} ${cx + 6},${bp.headY - bp.headR + 2}" fill="${pal.main}" />`;
            s += `<circle cx="${cx - 10}" cy="${bp.headY - bp.headR}" r="4.5" fill="white" />`;
            s += `<circle cx="${cx + 10}" cy="${bp.headY - bp.headR}" r="4.5" fill="white" />`;
            s += `<circle cx="${cx - 9}" cy="${bp.headY - bp.headR}" r="3" fill="${pal.dark}" />`;
            s += `<circle cx="${cx + 11}" cy="${bp.headY - bp.headR}" r="3" fill="${pal.dark}" />`;
            s += `<circle cx="${cx - 8}" cy="${bp.headY - bp.headR - 1}" r="1" fill="white" />`;
            s += `<circle cx="${cx + 12}" cy="${bp.headY - bp.headR - 1}" r="1" fill="white" />`;
            // Jaw line
            s += `<path d="M${cx - bp.headR} ${bp.headY + 3} L${cx} ${bp.headY + 6} L${cx + bp.headR} ${bp.headY + 3}" fill="none" stroke="${pal.dark}" stroke-width="0.7" />`;
            // Water drop gem
            s += `<path d="M${cx} ${bp.headY - 3} L${cx - 3} ${bp.headY + 1} L${cx} ${bp.headY + 3} L${cx + 3} ${bp.headY + 1}" fill="${pal.accent}" opacity="0.7" />`;
            // Arms with bicep definition
            const al = 14 + mp * 5;
            s += `<line x1="${cx - bp.shoulderW}" y1="${bp.armY}" x2="${cx - bp.shoulderW - al}" y2="${bp.armY + 6}" stroke="${pal.main}" stroke-width="${bp.armThick}" stroke-linecap="round" />`;
            s += `<line x1="${cx + bp.shoulderW}" y1="${bp.armY}" x2="${cx + bp.shoulderW + al}" y2="${bp.armY + 6}" stroke="${pal.main}" stroke-width="${bp.armThick}" stroke-linecap="round" />`;
            // Bicep bumps
            if (mp > 0.2) {
                s += `<circle cx="${cx - bp.shoulderW - 5}" cy="${bp.armY + 1}" r="${2 + mp * 2}" fill="${pal.main}" />`;
                s += `<circle cx="${cx + bp.shoulderW + 5}" cy="${bp.armY + 1}" r="${2 + mp * 2}" fill="${pal.main}" />`;
            }
            // Webbed hands — 3 spread fingers
            s += `<path d="M${cx - bp.shoulderW - al} ${bp.armY + 6} L${cx - bp.shoulderW - al - 5} ${bp.armY + 3} L${cx - bp.shoulderW - al - 3} ${bp.armY + 7} L${cx - bp.shoulderW - al - 6} ${bp.armY + 9}" fill="none" stroke="${pal.light}" stroke-width="1.2" />`;
            s += `<path d="M${cx + bp.shoulderW + al} ${bp.armY + 6} L${cx + bp.shoulderW + al + 5} ${bp.armY + 3} L${cx + bp.shoulderW + al + 3} ${bp.armY + 7} L${cx + bp.shoulderW + al + 6} ${bp.armY + 9}" fill="none" stroke="${pal.light}" stroke-width="1.2" />`;
            // Legs — thick amphibian legs
            s += `<line x1="${cx - 7}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 10}" y2="${bp.feetY}" stroke="${pal.main}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            s += `<line x1="${cx + 7}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 10}" y2="${bp.feetY}" stroke="${pal.main}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            // Webbed feet — wider
            s += `<path d="M${cx - 16} ${bp.feetY + 1} L${cx - 10} ${bp.feetY - 1} L${cx - 4} ${bp.feetY + 1}" fill="none" stroke="${pal.light}" stroke-width="1.5" />`;
            s += `<polygon points="${cx - 14},${bp.feetY} ${cx - 10},${bp.feetY + 3} ${cx - 6},${bp.feetY}" fill="${pal.light}" opacity="0.25" />`;
            s += `<path d="M${cx + 4} ${bp.feetY + 1} L${cx + 10} ${bp.feetY - 1} L${cx + 16} ${bp.feetY + 1}" fill="none" stroke="${pal.light}" stroke-width="1.5" />`;
            s += `<polygon points="${cx + 6},${bp.feetY} ${cx + 10},${bp.feetY + 3} ${cx + 14},${bp.feetY}" fill="${pal.light}" opacity="0.25" />`;

        } else if (form === 2) {
            // Marivigueur — Athletic swimmer, prominent dorsal fin crest, scale armor, fin-blade forearms, six-pack
            // Body — strong V-taper torso
            s += `<polygon points="${cx - bp.shoulderW},${bp.bodyY - 8} ${cx - 9},${bp.bodyY + bp.bodyH} ${cx + 9},${bp.bodyY + bp.bodyH} ${cx + bp.shoulderW},${bp.bodyY - 8}" fill="${pal.main}" />`;
            // Belly plate
            s += `<polygon points="${cx - bp.bodyW + 8},${bp.bodyY - 2} ${cx - 6},${bp.bodyY + bp.bodyH - 2} ${cx + 6},${bp.bodyY + bp.bodyH - 2} ${cx + bp.bodyW - 8},${bp.bodyY - 2}" fill="${pal.accent}" opacity="0.35" />`;
            // Six-pack definition
            if (mp > 0.1) {
                for (let i = 0; i < 3; i++) {
                    const ay = bp.bodyY + 4 + i * 5;
                    s += `<line x1="${cx - 4}" y1="${ay}" x2="${cx + 4}" y2="${ay}" stroke="${pal.dark}" stroke-width="0.6" opacity="${0.15 + mp * 0.25}" />`;
                }
                s += `<line x1="${cx}" y1="${bp.bodyY + 2}" x2="${cx}" y2="${bp.bodyY + bp.bodyH - 4}" stroke="${pal.dark}" stroke-width="0.5" opacity="${mp * 0.3}" />`;
            }
            // Scale rows on sides — chevron pattern
            for (let i = 0; i < 5; i++) {
                const sy = bp.bodyY - 4 + i * 6;
                s += `<path d="M${cx - bp.shoulderW + 1} ${sy} L${cx - bp.shoulderW + 5} ${sy - 3} L${cx - bp.shoulderW + 9} ${sy}" fill="none" stroke="${pal.dark}" stroke-width="0.5" opacity="0.2" />`;
                s += `<path d="M${cx + bp.shoulderW - 1} ${sy} L${cx + bp.shoulderW - 5} ${sy - 3} L${cx + bp.shoulderW - 9} ${sy}" fill="none" stroke="${pal.dark}" stroke-width="0.5" opacity="0.2" />`;
            }
            // Dorsal fin crest — tall, multi-segment
            s += `<polygon points="${cx - 3},${bp.bodyY - 10} ${cx - 1},${bp.bodyY - 26} ${cx + 1},${bp.bodyY - 22} ${cx + 3},${bp.bodyY - 28} ${cx + 5},${bp.bodyY - 10}" fill="${pal.light}" stroke="${pal.dark}" stroke-width="0.4" />`;
            s += `<line x1="${cx}" y1="${bp.bodyY - 24}" x2="${cx + 1}" y2="${bp.bodyY - 12}" stroke="${pal.dark}" stroke-width="0.3" opacity="0.3" />`;
            s += `<line x1="${cx + 3}" y1="${bp.bodyY - 26}" x2="${cx + 3}" y2="${bp.bodyY - 12}" stroke="${pal.dark}" stroke-width="0.3" opacity="0.3" />`;
            // Shoulder fin spikes
            s += `<polygon points="${cx - bp.shoulderW},${bp.armY - 3} ${cx - bp.shoulderW - 6},${bp.armY - 10} ${cx - bp.shoulderW - 2},${bp.armY - 5}" fill="${pal.light}" opacity="0.7" />`;
            s += `<polygon points="${cx + bp.shoulderW},${bp.armY - 3} ${cx + bp.shoulderW + 6},${bp.armY - 10} ${cx + bp.shoulderW + 2},${bp.armY - 5}" fill="${pal.light}" opacity="0.7" />`;
            // Head — angular, more defined jaw
            s += `<polygon points="${cx - bp.headR - 1},${bp.headY + 5} ${cx - bp.headR + 3},${bp.headY - bp.headR} ${cx},${bp.headY - bp.headR - 2} ${cx + bp.headR - 3},${bp.headY - bp.headR} ${cx + bp.headR + 1},${bp.headY + 5} ${cx},${bp.headY + 7}" fill="${pal.main}" />`;
            // Brow ridge — angular
            s += `<path d="M${cx - bp.headR} ${bp.headY - bp.headR + 3} L${cx - 3} ${bp.headY - bp.headR + 1} L${cx + 3} ${bp.headY - bp.headR + 1} L${cx + bp.headR} ${bp.headY - bp.headR + 3}" fill="${pal.dark}" opacity="0.2" />`;
            // Eyes — fierce, sharper
            s += this._drawEyes(cx, bp.headY, bp.headR * 0.45, mood, 'sharp');
            // Jaw line with teeth hint
            s += `<path d="M${cx - bp.headR} ${bp.headY + 3} L${cx - 3} ${bp.headY + 6} L${cx} ${bp.headY + 5} L${cx + 3} ${bp.headY + 6} L${cx + bp.headR} ${bp.headY + 3}" fill="none" stroke="${pal.dark}" stroke-width="0.8" />`;
            // Water gem — larger
            s += `<polygon points="${cx},${bp.headY - 5} ${cx - 3},${bp.headY - 1} ${cx},${bp.headY + 2} ${cx + 3},${bp.headY - 1}" fill="${pal.accent}" opacity="0.8"><animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0.6;1;0.6" /></polygon>`;
            // Arms with fin blades
            const al = 17 + mp * 5;
            s += `<line x1="${cx - bp.shoulderW}" y1="${bp.armY}" x2="${cx - bp.shoulderW - al}" y2="${bp.armY + 4}" stroke="${pal.main}" stroke-width="${bp.armThick}" stroke-linecap="round" />`;
            s += `<line x1="${cx + bp.shoulderW}" y1="${bp.armY}" x2="${cx + bp.shoulderW + al}" y2="${bp.armY + 4}" stroke="${pal.main}" stroke-width="${bp.armThick}" stroke-linecap="round" />`;
            // Fin blade on forearms
            s += `<polygon points="${cx - bp.shoulderW - al / 2},${bp.armY + 2} ${cx - bp.shoulderW - al / 2 - 3},${bp.armY - 6} ${cx - bp.shoulderW - al / 2 + 4},${bp.armY + 2}" fill="${pal.light}" opacity="0.6" />`;
            s += `<polygon points="${cx + bp.shoulderW + al / 2},${bp.armY + 2} ${cx + bp.shoulderW + al / 2 + 3},${bp.armY - 6} ${cx + bp.shoulderW + al / 2 - 4},${bp.armY + 2}" fill="${pal.light}" opacity="0.6" />`;
            // Webbed fists
            s += `<polygon points="${cx - bp.shoulderW - al - 4},${bp.armY + 2} ${cx - bp.shoulderW - al},${bp.armY + 5} ${cx - bp.shoulderW - al + 3},${bp.armY + 2} ${cx - bp.shoulderW - al - 1},${bp.armY + 8}" fill="${pal.light}" opacity="0.5" />`;
            s += `<polygon points="${cx + bp.shoulderW + al + 4},${bp.armY + 2} ${cx + bp.shoulderW + al},${bp.armY + 5} ${cx + bp.shoulderW + al - 3},${bp.armY + 2} ${cx + bp.shoulderW + al + 1},${bp.armY + 8}" fill="${pal.light}" opacity="0.5" />`;
            // Powerful legs
            s += `<line x1="${cx - 9}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 11}" y2="${bp.feetY}" stroke="${pal.main}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            s += `<line x1="${cx + 9}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 11}" y2="${bp.feetY}" stroke="${pal.main}" stroke-width="${bp.legThick}" stroke-linecap="round" />`;
            // Webbed feet — wide, swimmer style
            s += `<polygon points="${cx - 18},${bp.feetY + 1} ${cx - 11},${bp.feetY - 1} ${cx - 4},${bp.feetY + 1} ${cx - 11},${bp.feetY + 4}" fill="${pal.light}" opacity="0.35" />`;
            s += `<path d="M${cx - 18} ${bp.feetY + 1} L${cx - 11} ${bp.feetY - 1} L${cx - 4} ${bp.feetY + 1}" fill="none" stroke="${pal.light}" stroke-width="1.5" />`;
            s += `<polygon points="${cx + 4},${bp.feetY + 1} ${cx + 11},${bp.feetY - 1} ${cx + 18},${bp.feetY + 1} ${cx + 11},${bp.feetY + 4}" fill="${pal.light}" opacity="0.35" />`;
            s += `<path d="M${cx + 4} ${bp.feetY + 1} L${cx + 11} ${bp.feetY - 1} L${cx + 18} ${bp.feetY + 1}" fill="none" stroke="${pal.light}" stroke-width="1.5" />`;
            // Water swirl aura
            s += `<circle cx="${cx}" cy="${bp.bodyY}" r="${bp.shoulderW + 10}" fill="none" stroke="${pal.accent}" stroke-width="0.5" opacity="0.2"><animate attributeName="r" dur="2s" repeatCount="indefinite" values="${bp.shoulderW + 8};${bp.shoulderW + 13};${bp.shoulderW + 8}" /></circle>`;

        } else {
            // Oceanforce — Colossal sea warrior, full trident head crest, scale armor, fin blades, barrel chest, wave tattoos
            // Body — massive barrel torso
            s += `<polygon points="${cx - bp.shoulderW},${bp.bodyY - 10} ${cx - bp.shoulderW + 2},${bp.bodyY + bp.bodyH * 0.4} ${cx - 11},${bp.bodyY + bp.bodyH} ${cx + 11},${bp.bodyY + bp.bodyH} ${cx + bp.shoulderW - 2},${bp.bodyY + bp.bodyH * 0.4} ${cx + bp.shoulderW},${bp.bodyY - 10}" fill="${pal.main}" />`;
            // Chest plate — angular, armored
            s += `<polygon points="${cx - bp.bodyW + 6},${bp.bodyY - 4} ${cx - 7},${bp.bodyY + bp.bodyH - 3} ${cx + 7},${bp.bodyY + bp.bodyH - 3} ${cx + bp.bodyW - 6},${bp.bodyY - 4}" fill="${pal.accent}" opacity="0.3" />`;
            // Pec definition
            s += `<path d="M${cx - bp.bodyW + 8} ${bp.bodyY - 1} Q${cx} ${bp.bodyY + 3} ${cx + bp.bodyW - 8} ${bp.bodyY - 1}" fill="none" stroke="${pal.dark}" stroke-width="0.7" opacity="0.3" />`;
            s += `<line x1="${cx}" y1="${bp.bodyY - 2}" x2="${cx}" y2="${bp.bodyY + 5}" stroke="${pal.dark}" stroke-width="0.6" opacity="0.3" />`;
            // Eight-pack abs
            for (let i = 0; i < 4; i++) {
                const ay = bp.bodyY + 7 + i * 5;
                s += `<line x1="${cx - 5}" y1="${ay}" x2="${cx + 5}" y2="${ay}" stroke="${pal.dark}" stroke-width="0.7" opacity="0.35" />`;
            }
            s += `<line x1="${cx}" y1="${bp.bodyY + 5}" x2="${cx}" y2="${bp.bodyY + bp.bodyH - 4}" stroke="${pal.dark}" stroke-width="0.6" opacity="0.3" />`;
            // Scale armor — rows of chevron scales all over body
            for (let i = 0; i < 6; i++) {
                const sy = bp.bodyY - 6 + i * 6;
                s += `<path d="M${cx - bp.shoulderW + 1} ${sy} L${cx - bp.shoulderW + 4} ${sy - 3} L${cx - bp.shoulderW + 7} ${sy}" fill="${pal.dark}" opacity="0.12" />`;
                s += `<path d="M${cx + bp.shoulderW - 1} ${sy} L${cx + bp.shoulderW - 4} ${sy - 3} L${cx + bp.shoulderW - 7} ${sy}" fill="${pal.dark}" opacity="0.12" />`;
                if (i % 2 === 0) {
                    s += `<path d="M${cx - bp.shoulderW + 4} ${sy} L${cx - bp.shoulderW + 8} ${sy - 3} L${cx - bp.shoulderW + 12} ${sy}" fill="${pal.dark}" opacity="0.08" />`;
                    s += `<path d="M${cx + bp.shoulderW - 4} ${sy} L${cx + bp.shoulderW - 8} ${sy - 3} L${cx + bp.shoulderW - 12} ${sy}" fill="${pal.dark}" opacity="0.08" />`;
                }
            }
            // Wave tattoo lines on sides
            s += `<path d="M${cx - bp.shoulderW + 3} ${bp.bodyY + 8} Q${cx - bp.shoulderW + 8} ${bp.bodyY + 5} ${cx - bp.shoulderW + 12} ${bp.bodyY + 8} Q${cx - bp.shoulderW + 16} ${bp.bodyY + 11} ${cx - bp.shoulderW + 20} ${bp.bodyY + 8}" fill="none" stroke="${pal.accent}" stroke-width="0.7" opacity="0.3" />`;
            s += `<path d="M${cx + bp.shoulderW - 3} ${bp.bodyY + 8} Q${cx + bp.shoulderW - 8} ${bp.bodyY + 5} ${cx + bp.shoulderW - 12} ${bp.bodyY + 8} Q${cx + bp.shoulderW - 16} ${bp.bodyY + 11} ${cx + bp.shoulderW - 20} ${bp.bodyY + 8}" fill="none" stroke="${pal.accent}" stroke-width="0.7" opacity="0.3" />`;
            // TRIDENT HEAD CREST — 3 massive spikes from back of head
            s += `<polygon points="${cx},${bp.headY - bp.headR - 2} ${cx - 2},${bp.headY - bp.headR - 22} ${cx + 2},${bp.headY - bp.headR - 2}" fill="${pal.light}" stroke="${pal.dark}" stroke-width="0.5" />`;
            s += `<polygon points="${cx - 6},${bp.headY - bp.headR} ${cx - 9},${bp.headY - bp.headR - 16} ${cx - 4},${bp.headY - bp.headR}" fill="${pal.light}" stroke="${pal.dark}" stroke-width="0.4" />`;
            s += `<polygon points="${cx + 6},${bp.headY - bp.headR} ${cx + 9},${bp.headY - bp.headR - 16} ${cx + 4},${bp.headY - bp.headR}" fill="${pal.light}" stroke="${pal.dark}" stroke-width="0.4" />`;
            // Side head fins — swept back
            s += `<polygon points="${cx - bp.headR - 1},${bp.headY - 2} ${cx - bp.headR - 12},${bp.headY - 8} ${cx - bp.headR - 10},${bp.headY - 2} ${cx - bp.headR - 14},${bp.headY + 2} ${cx - bp.headR - 1},${bp.headY + 3}" fill="${pal.light}" opacity="0.7" />`;
            s += `<polygon points="${cx + bp.headR + 1},${bp.headY - 2} ${cx + bp.headR + 12},${bp.headY - 8} ${cx + bp.headR + 10},${bp.headY - 2} ${cx + bp.headR + 14},${bp.headY + 2} ${cx + bp.headR + 1},${bp.headY + 3}" fill="${pal.light}" opacity="0.7" />`;
            // Dorsal back fin — tall multi-segment
            s += `<polygon points="${cx - 4},${bp.bodyY - 12} ${cx - 2},${bp.bodyY - 30} ${cx + 1},${bp.bodyY - 24} ${cx + 3},${bp.bodyY - 32} ${cx + 5},${bp.bodyY - 26} ${cx + 6},${bp.bodyY - 12}" fill="${pal.light}" stroke="${pal.dark}" stroke-width="0.4" opacity="0.8"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.7;0.9;0.7" /></polygon>`;
            // Fin ray details
            for (let i = 0; i < 3; i++) {
                const fx = cx - 1 + i * 3;
                s += `<line x1="${fx}" y1="${bp.bodyY - 28 + i * 3}" x2="${fx}" y2="${bp.bodyY - 13}" stroke="${pal.dark}" stroke-width="0.3" opacity="0.3" />`;
            }
            // Head — angular warrior face
            s += `<polygon points="${cx - bp.headR - 2},${bp.headY + 5} ${cx - bp.headR + 2},${bp.headY - bp.headR + 1} ${cx},${bp.headY - bp.headR - 2} ${cx + bp.headR - 2},${bp.headY - bp.headR + 1} ${cx + bp.headR + 2},${bp.headY + 5} ${cx + 2},${bp.headY + 8} ${cx - 2},${bp.headY + 8}" fill="${pal.main}" />`;
            // Armored brow ridge
            s += `<path d="M${cx - bp.headR} ${bp.headY - bp.headR + 4} L${cx - 3} ${bp.headY - bp.headR + 1} L${cx + 3} ${bp.headY - bp.headR + 1} L${cx + bp.headR} ${bp.headY - bp.headR + 4}" fill="${pal.dark}" opacity="0.25" />`;
            // Eyes — glowing fierce
            s += this._drawEyes(cx, bp.headY, bp.headR * 0.45, mood, 'glowing');
            // Jaw with visible lower jaw / underbite
            s += `<polygon points="${cx - bp.headR + 1},${bp.headY + 4} ${cx - 4},${bp.headY + 7} ${cx - 2},${bp.headY + 9} ${cx + 2},${bp.headY + 9} ${cx + 4},${bp.headY + 7} ${cx + bp.headR - 1},${bp.headY + 4}" fill="${pal.dark}" opacity="0.15" />`;
            // Two small fangs
            s += `<line x1="${cx - 4}" y1="${bp.headY + 6}" x2="${cx - 3}" y2="${bp.headY + 9}" stroke="white" stroke-width="1" stroke-linecap="round" />`;
            s += `<line x1="${cx + 4}" y1="${bp.headY + 6}" x2="${cx + 3}" y2="${bp.headY + 9}" stroke="white" stroke-width="1" stroke-linecap="round" />`;
            // Trident gem on forehead — animated glow
            s += `<polygon points="${cx},${bp.headY - 6} ${cx - 4},${bp.headY - 1} ${cx},${bp.headY + 3} ${cx + 4},${bp.headY - 1}" fill="${pal.accent}"><animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0.7;1;0.7" /></polygon>`;
            s += `<polygon points="${cx},${bp.headY - 5} ${cx - 2.5},${bp.headY - 1} ${cx},${bp.headY + 1.5} ${cx + 2.5},${bp.headY - 1}" fill="white" opacity="0.4" />`;
            // Massive arms with fin blade extensions
            const al = 20 + mp * 6;
            s += `<line x1="${cx - bp.shoulderW}" y1="${bp.armY}" x2="${cx - bp.shoulderW - al}" y2="${bp.armY + 3}" stroke="${pal.main}" stroke-width="${bp.armThick + 3}" stroke-linecap="round" />`;
            s += `<line x1="${cx + bp.shoulderW}" y1="${bp.armY}" x2="${cx + bp.shoulderW + al}" y2="${bp.armY + 3}" stroke="${pal.main}" stroke-width="${bp.armThick + 3}" stroke-linecap="round" />`;
            // Forearm fin blades — large
            s += `<polygon points="${cx - bp.shoulderW - al * 0.3},${bp.armY + 1} ${cx - bp.shoulderW - al * 0.5},${bp.armY - 10} ${cx - bp.shoulderW - al * 0.7},${bp.armY + 1}" fill="${pal.light}" opacity="0.6" />`;
            s += `<polygon points="${cx + bp.shoulderW + al * 0.3},${bp.armY + 1} ${cx + bp.shoulderW + al * 0.5},${bp.armY - 10} ${cx + bp.shoulderW + al * 0.7},${bp.armY + 1}" fill="${pal.light}" opacity="0.6" />`;
            // Scale texture on arms
            s += `<path d="M${cx - bp.shoulderW - 4} ${bp.armY} L${cx - bp.shoulderW - 8} ${bp.armY - 2} L${cx - bp.shoulderW - 12} ${bp.armY}" fill="none" stroke="${pal.dark}" stroke-width="0.4" opacity="0.2" />`;
            s += `<path d="M${cx + bp.shoulderW + 4} ${bp.armY} L${cx + bp.shoulderW + 8} ${bp.armY - 2} L${cx + bp.shoulderW + 12} ${bp.armY}" fill="none" stroke="${pal.dark}" stroke-width="0.4" opacity="0.2" />`;
            // Massive webbed fists
            s += `<polygon points="${cx - bp.shoulderW - al - 5},${bp.armY} ${cx - bp.shoulderW - al},${bp.armY + 4} ${cx - bp.shoulderW - al + 4},${bp.armY} ${cx - bp.shoulderW - al},${bp.armY + 10}" fill="${pal.light}" opacity="0.5" />`;
            s += `<polygon points="${cx + bp.shoulderW + al + 5},${bp.armY} ${cx + bp.shoulderW + al},${bp.armY + 4} ${cx + bp.shoulderW + al - 4},${bp.armY} ${cx + bp.shoulderW + al},${bp.armY + 10}" fill="${pal.light}" opacity="0.5" />`;
            // Tail — thick, finned (render BEFORE legs so it appears behind)
            s += `<path d="M${cx + 6} ${bp.bodyY + bp.bodyH - 5} L${cx + 18} ${bp.bodyY + bp.bodyH + 3} L${cx + 14} ${bp.bodyY + bp.bodyH - 5} L${cx + 22} ${bp.bodyY + bp.bodyH - 2}" fill="${pal.light}" opacity="0.6"><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.5;0.7;0.5" /></path>`;
            // Powerful legs
            s += `<line x1="${cx - 10}" y1="${bp.bodyY + bp.bodyH}" x2="${cx - 13}" y2="${bp.feetY}" stroke="${pal.main}" stroke-width="${bp.legThick + 2}" stroke-linecap="round" />`;
            s += `<line x1="${cx + 10}" y1="${bp.bodyY + bp.bodyH}" x2="${cx + 13}" y2="${bp.feetY}" stroke="${pal.main}" stroke-width="${bp.legThick + 2}" stroke-linecap="round" />`;
            // Leg fin spikes
            s += `<polygon points="${cx - 12},${bp.feetY - 10} ${cx - 16},${bp.feetY - 16} ${cx - 14},${bp.feetY - 8}" fill="${pal.light}" opacity="0.5" />`;
            s += `<polygon points="${cx + 12},${bp.feetY - 10} ${cx + 16},${bp.feetY - 16} ${cx + 14},${bp.feetY - 8}" fill="${pal.light}" opacity="0.5" />`;
            // Massive webbed feet
            s += `<polygon points="${cx - 21},${bp.feetY + 1} ${cx - 13},${bp.feetY - 2} ${cx - 5},${bp.feetY + 1} ${cx - 13},${bp.feetY + 5}" fill="${pal.light}" opacity="0.35" />`;
            s += `<path d="M${cx - 21} ${bp.feetY + 1} L${cx - 13} ${bp.feetY - 2} L${cx - 5} ${bp.feetY + 1}" fill="none" stroke="${pal.light}" stroke-width="2" />`;
            s += `<polygon points="${cx + 5},${bp.feetY + 1} ${cx + 13},${bp.feetY - 2} ${cx + 21},${bp.feetY + 1} ${cx + 13},${bp.feetY + 5}" fill="${pal.light}" opacity="0.35" />`;
            s += `<path d="M${cx + 5} ${bp.feetY + 1} L${cx + 13} ${bp.feetY - 2} L${cx + 21} ${bp.feetY + 1}" fill="none" stroke="${pal.light}" stroke-width="2" />`;
        }
        return s;
    },

    // ============================================
    // SHARED EYE RENDERER
    // ============================================
    _drawEyes(cx, headY, spacing, mood, style) {
        let s = '';
        const lx = cx - spacing * 1.3, rx = cx + spacing * 1.3, ey = headY - 1;

        if (style === 'round' || style === 'cat') {
            const r = style === 'cat' ? 3 : 3.5;
            s += `<circle cx="${lx}" cy="${ey}" r="${r + 1}" fill="white" /><circle cx="${rx}" cy="${ey}" r="${r + 1}" fill="white" />`;
            s += `<circle cx="${lx}" cy="${ey}" r="${r}" fill="#333" /><circle cx="${rx}" cy="${ey}" r="${r}" fill="#333" />`;
            s += `<circle cx="${lx + 1}" cy="${ey - 1}" r="1" fill="white" /><circle cx="${rx + 1}" cy="${ey - 1}" r="1" fill="white" />`;
            if (style === 'cat') { s += `<ellipse cx="${lx}" cy="${ey}" rx="1" ry="${r - 0.5}" fill="#111" /><ellipse cx="${rx}" cy="${ey}" rx="1" ry="${r - 0.5}" fill="#111" />`; }
        } else if (style === 'sharp' || style === 'fierce' || style === 'fierce_cat') {
            const r = 2.5;
            s += `<circle cx="${lx}" cy="${ey}" r="${r + 0.5}" fill="white" /><circle cx="${rx}" cy="${ey}" r="${r + 0.5}" fill="white" />`;
            s += `<circle cx="${lx}" cy="${ey}" r="${r}" fill="#333" /><circle cx="${rx}" cy="${ey}" r="${r}" fill="#333" />`;
            s += `<circle cx="${lx + 0.5}" cy="${ey - 0.8}" r="0.8" fill="white" /><circle cx="${rx + 0.5}" cy="${ey - 0.8}" r="0.8" fill="white" />`;
            s += `<line x1="${lx - 3}" y1="${ey - 4}" x2="${lx + 2}" y2="${ey - 3}" stroke="#333" stroke-width="1" stroke-linecap="round" />`;
            s += `<line x1="${rx + 3}" y1="${ey - 4}" x2="${rx - 2}" y2="${ey - 3}" stroke="#333" stroke-width="1" stroke-linecap="round" />`;
            if (style === 'fierce_cat') { s += `<ellipse cx="${lx}" cy="${ey}" rx="0.8" ry="${r - 0.5}" fill="#111" /><ellipse cx="${rx}" cy="${ey}" rx="0.8" ry="${r - 0.5}" fill="#111" />`; }
        } else if (style === 'glowing' || style === 'glowing_green') {
            const color = style === 'glowing_green' ? '#4CAF50' : '#FFAB00';
            s += `<circle cx="${lx}" cy="${ey}" r="3" fill="${color}" /><circle cx="${rx}" cy="${ey}" r="3" fill="${color}" />`;
            s += `<circle cx="${lx}" cy="${ey}" r="4" fill="${color}" opacity="0.3"><animate attributeName="r" dur="1s" repeatCount="indefinite" values="3.5;5;3.5" /></circle>`;
            s += `<circle cx="${rx}" cy="${ey}" r="4" fill="${color}" opacity="0.3"><animate attributeName="r" dur="1s" repeatCount="indefinite" values="3.5;5;3.5" /></circle>`;
            s += `<circle cx="${lx}" cy="${ey}" r="1.5" fill="white" /><circle cx="${rx}" cy="${ey}" r="1.5" fill="white" />`;
        }
        if (mood === 'celebrating') s += `<text x="${rx + 5}" y="${ey - 3}" font-size="4" fill="#FFAB00">✦</text>`;
        return s;
    },

    // === BODY SILHOUETTE — precise creature-conforming outline ===
    _getBodySilhouette(bp, offset, type, form) {
        const cx = bp.cx, o = offset || 0;
        const hr = bp.headR + o * 0.8;
        const ht = bp.headY - hr;
        const sw = bp.shoulderW + o;
        const bw = bp.bodyW + o;
        const by = bp.bodyY, bh = bp.bodyH;
        const ny = bp.neckY, ay = bp.armY;
        const fy = bp.feetY + o;
        const at = bp.armThick + o * 0.3;

        // Type-specific outline: fire=angular/spiky, plant=organic/leafy, water=smooth/round
        if (type === 'fire') {
            // Angular raptor shape — spiky head tuft, wing stubs, clawed feet
            return `M${cx} ${ht - 4} `
                + `L${cx + 3} ${ht - (form > 0 ? 8 : 5)} L${cx + 5} ${ht} ` // flame tuft
                + `L${cx + hr} ${bp.headY - 2} L${cx + hr + 1} ${bp.headY + 3} ` // head right
                + `L${cx + sw + (form > 1 ? 6 : 3)} ${ay - 3} ` // wing stub right
                + `L${cx + sw + (form > 1 ? 10 : 5)} ${ay + 2} `
                + `L${cx + sw} ${by + 2} ` // shoulder right
                + `L${cx + bw + 2} ${by + bh} ` // body right
                + `L${cx + 10} ${fy} L${cx + 14} ${fy + 3} ` // right foot
                + `L${cx - 14} ${fy + 3} L${cx - 10} ${fy} ` // left foot
                + `L${cx - bw - 2} ${by + bh} ` // body left
                + `L${cx - sw} ${by + 2} ` // shoulder left
                + `L${cx - sw - (form > 1 ? 10 : 5)} ${ay + 2} ` // wing stub left
                + `L${cx - sw - (form > 1 ? 6 : 3)} ${ay - 3} `
                + `L${cx - hr - 1} ${bp.headY + 3} L${cx - hr} ${bp.headY - 2} ` // head left
                + `L${cx - 5} ${ht} L${cx - 3} ${ht - (form > 0 ? 8 : 5)} ` // flame tuft left
                + `Z`;
        } else if (type === 'plant') {
            // Organic feline shape — rounded ears, leaf frills, thick limbs
            const earH = form > 1 ? 7 : 5;
            return `M${cx} ${ht - 2} `
                + `Q${cx + 3} ${ht - earH} ${cx + hr * 0.6} ${ht - earH + 2} ` // right ear
                + `Q${cx + hr} ${ht} ${cx + hr} ${bp.headY} ` // head right
                + `Q${cx + hr + 2} ${ny} ${cx + sw + (form > 1 ? 5 : 2)} ${ay - 3} ` // leaf frill right
                + `Q${cx + sw + (form > 1 ? 8 : 4)} ${ay + 2} ${cx + sw + 1} ${ay + 4} `
                + `Q${cx + bw + 3} ${by + bh * 0.5} ${cx + bw + 1} ${by + bh} ` // body right
                + `Q${cx + 10} ${fy - 3} ${cx + 12} ${fy + 2} ` // right paw
                + `L${cx - 12} ${fy + 2} ` // left paw
                + `Q${cx - 10} ${fy - 3} ${cx - bw - 1} ${by + bh} ` // body left
                + `Q${cx - bw - 3} ${by + bh * 0.5} ${cx - sw - 1} ${ay + 4} `
                + `Q${cx - sw - (form > 1 ? 8 : 4)} ${ay + 2} ${cx - sw - (form > 1 ? 5 : 2)} ${ay - 3} ` // leaf frill left
                + `Q${cx - hr - 2} ${ny} ${cx - hr} ${bp.headY} ` // head left
                + `Q${cx - hr} ${ht} ${cx - hr * 0.6} ${ht - earH + 2} ` // left ear
                + `Q${cx - 3} ${ht - earH} ${cx} ${ht - 2} Z`;
        } else {
            // Water — smooth rounded shape, fin features
            const finH = form > 1 ? 8 : 4;
            return `M${cx} ${ht - 1} `
                + `Q${cx + 4} ${ht - (form > 0 ? 5 : 2)} ${cx + hr * 0.7} ${ht} ` // top fin hint
                + `Q${cx + hr + 1} ${ht + 2} ${cx + hr} ${bp.headY + 2} ` // head right
                + `Q${cx + hr + 2} ${ny - 1} ${cx + sw} ${ay} ` // neck right
                + `Q${cx + sw + finH} ${ay + finH} ${cx + sw + 2} ${by + 3} ` // fin right
                + `Q${cx + bw + 2} ${by + bh * 0.6} ${cx + bw} ${by + bh + 1} ` // body right
                + `Q${cx + 8} ${fy - 2} ${cx + 10} ${fy + 2} ` // right flipper
                + `L${cx - 10} ${fy + 2} ` // left flipper
                + `Q${cx - 8} ${fy - 2} ${cx - bw} ${by + bh + 1} ` // body left
                + `Q${cx - bw - 2} ${by + bh * 0.6} ${cx - sw - 2} ${by + 3} ` // fin left
                + `Q${cx - sw - finH} ${ay + finH} ${cx - sw} ${ay} `
                + `Q${cx - hr - 2} ${ny - 1} ${cx - hr} ${bp.headY + 2} ` // head left
                + `Q${cx - hr - 1} ${ht + 2} ${cx - hr * 0.7} ${ht} `
                + `Q${cx - 4} ${ht - (form > 0 ? 5 : 2)} ${cx} ${ht - 1} Z`;
        }
    },

    // ============================================
    // COSMETIC OVERLAYS — Gen 1-3 quality, all animated
    // ============================================
    // ============================================

    // Cape clasp rendered OVER creature (separate from cape body which is behind)
    _renderCapeClasp(bp) {
        let s = '';
        const cx = bp.cx, ny = bp.neckY;
        // Golden diamond clasp at neck
        s += `<polygon points="${cx - 5},${ny - 2} ${cx},${ny - 8} ${cx + 5},${ny - 2} ${cx},${ny + 3}" fill="#FFD700" />`;
        s += `<polygon points="${cx - 3},${ny - 2} ${cx},${ny - 6} ${cx + 3},${ny - 2} ${cx},${ny + 1}" fill="#FF8F00" />`;
        s += `<circle cx="${cx}" cy="${ny - 1.5}" r="1.8" fill="#E53935" />`;
        s += `<circle cx="${cx}" cy="${ny - 1.5}" r="0.8" fill="#FFCDD2" />`;
        // Gold chain links connecting to shoulders
        s += `<path d="M${cx - 5} ${ny - 2} Q${cx - bp.shoulderW * 0.5} ${ny - 4} ${cx - bp.shoulderW + 2} ${ny - 1}" fill="none" stroke="#FFD700" stroke-width="0.8" />`;
        s += `<path d="M${cx + 5} ${ny - 2} Q${cx + bp.shoulderW * 0.5} ${ny - 4} ${cx + bp.shoulderW - 2} ${ny - 1}" fill="none" stroke="#FFD700" stroke-width="0.8" />`;
        return s;
    },

    _renderClothes(itemId, bp, pal, type) {
        let s = '';
        const cx = bp.cx;
        const fs = bp.scale; // formScale: 0.7 (baby) → 1.0 (ultimate)
        const sw = bp.shoulderW, bw = bp.bodyW, bh = bp.bodyH, by = bp.bodyY;
        const hy = bp.headY, hr = bp.headR, ny = bp.neckY, fy = bp.feetY, ay = bp.armY;
        const at = bp.armThick;

        const items = {
            // --- BANDANA: Thick headband wrapping skull, knot + flowing tails ---
            clothes_bandana: () => {
                const bY = hy - hr * 0.5;
                // Main headband — thick, wraps around head contour
                s += `<path d="M${cx - hr - 2} ${bY + 2} Q${cx - hr - 1} ${bY - 4} ${cx} ${bY - 4.5} Q${cx + hr + 1} ${bY - 4} ${cx + hr + 2} ${bY + 2} L${cx + hr + 1} ${bY + 4} Q${cx} ${bY + 3} ${cx - hr - 1} ${bY + 4} Z" fill="#C62828" />`;
                // Shadow fold under band
                s += `<path d="M${cx - hr} ${bY + 2} Q${cx} ${bY + 3.5} ${cx + hr} ${bY + 2} L${cx + hr + 1} ${bY + 4} Q${cx} ${bY + 5} ${cx - hr - 1} ${bY + 4} Z" fill="#9B1B1B" />`;
                // Highlight stripe
                s += `<path d="M${cx - hr + 2} ${bY - 2} Q${cx} ${bY - 3.5} ${cx + hr - 2} ${bY - 2}" fill="none" stroke="#EF5350" stroke-width="1" />`;
                // Emblem on forehead
                s += `<circle cx="${cx}" cy="${bY}" r="2.8" fill="#B71C1C" />`;
                s += `<circle cx="${cx}" cy="${bY}" r="1.8" fill="#E53935" />`;
                s += `<circle cx="${cx}" cy="${bY}" r="0.7" fill="#FFCDD2" />`;
                // Knot
                s += `<ellipse cx="${cx + hr + 3}" cy="${bY + 1}" rx="2.5" ry="2" fill="#B71C1C" />`;
                s += `<ellipse cx="${cx + hr + 3}" cy="${bY + 1}" rx="1.5" ry="1" fill="#C62828" />`;
                // Flowing tails
                s += `<path fill="#C62828" stroke="#9B1B1B" stroke-width="0.3"><animate attributeName="d" dur="1.8s" repeatCount="indefinite" values="M${cx + hr + 3} ${bY + 2} Q${cx + hr + 7} ${bY + 6} ${cx + hr + 5} ${bY + 12} L${cx + hr + 3} ${bY + 11} Q${cx + hr + 5} ${bY + 5} ${cx + hr + 2} ${bY + 3} Z;M${cx + hr + 3} ${bY + 2} Q${cx + hr + 9} ${bY + 7} ${cx + hr + 7} ${bY + 14} L${cx + hr + 5} ${bY + 13} Q${cx + hr + 7} ${bY + 6} ${cx + hr + 2} ${bY + 3} Z;M${cx + hr + 3} ${bY + 2} Q${cx + hr + 7} ${bY + 6} ${cx + hr + 5} ${bY + 12} L${cx + hr + 3} ${bY + 11} Q${cx + hr + 5} ${bY + 5} ${cx + hr + 2} ${bY + 3} Z" /></path>`;
                s += `<path fill="#E53935" stroke="#B71C1C" stroke-width="0.2"><animate attributeName="d" dur="2.2s" repeatCount="indefinite" values="M${cx + hr + 2} ${bY + 3} Q${cx + hr + 6} ${bY + 9} ${cx + hr + 4} ${bY + 15} L${cx + hr + 2} ${bY + 14} Q${cx + hr + 4} ${bY + 8} ${cx + hr + 1} ${bY + 4} Z;M${cx + hr + 2} ${bY + 3} Q${cx + hr + 8} ${bY + 10} ${cx + hr + 6} ${bY + 17} L${cx + hr + 4} ${bY + 16} Q${cx + hr + 6} ${bY + 9} ${cx + hr + 1} ${bY + 4} Z;M${cx + hr + 2} ${bY + 3} Q${cx + hr + 6} ${bY + 9} ${cx + hr + 4} ${bY + 15} L${cx + hr + 2} ${bY + 14} Q${cx + hr + 4} ${bY + 8} ${cx + hr + 1} ${bY + 4} Z" /></path>`;
            },

            // --- TANK TOP: Fitted athletic tank, body-hugging with muscle contour ---
            clothes_tank: () => {
                const topY = ny + 1;
                const midY = by;
                const botY = by + bh * 0.5;
                // Interpolated body width at various points for tight fit
                const topW = sw - 1;
                const midW = bw + 1;
                const botW = bw - 1;
                // Main body — curved path hugging torso
                s += `<path d="M${cx - topW + 2} ${topY} Q${cx - topW} ${midY - bh * 0.1} ${cx - midW + 1} ${midY} Q${cx - botW} ${midY + bh * 0.2} ${cx - botW + 1} ${botY} L${cx + botW - 1} ${botY} Q${cx + botW} ${midY + bh * 0.2} ${cx + midW - 1} ${midY} Q${cx + topW} ${midY - bh * 0.1} ${cx + topW - 2} ${topY} Z" fill="#1565C0" />`;
                // Darker side panels — contour shading
                s += `<path d="M${cx - topW + 2} ${topY} Q${cx - topW} ${midY - bh * 0.1} ${cx - midW + 1} ${midY} Q${cx - botW} ${midY + bh * 0.2} ${cx - botW + 1} ${botY} L${cx - botW + 4} ${botY} Q${cx - botW + 3} ${midY + bh * 0.15} ${cx - midW + 4} ${midY} Q${cx - topW + 3} ${midY - bh * 0.05} ${cx - topW + 5} ${topY + 1} Z" fill="#0D47A1" />`;
                s += `<path d="M${cx + topW - 2} ${topY} Q${cx + topW} ${midY - bh * 0.1} ${cx + midW - 1} ${midY} Q${cx + botW} ${midY + bh * 0.2} ${cx + botW - 1} ${botY} L${cx + botW - 4} ${botY} Q${cx + botW - 3} ${midY + bh * 0.15} ${cx + midW - 4} ${midY} Q${cx + topW - 3} ${midY - bh * 0.05} ${cx + topW - 5} ${topY + 1} Z" fill="#0D47A1" />`;
                // V-neck collar — deep sport cut
                s += `<path d="M${cx - hr * 0.7} ${topY - 1} Q${cx - hr * 0.2} ${topY + bh * 0.06} ${cx} ${topY + bh * 0.14} Q${cx + hr * 0.2} ${topY + bh * 0.06} ${cx + hr * 0.7} ${topY - 1}" fill="none" stroke="#0D47A1" stroke-width="1.2" />`;
                // Armhole curves
                s += `<path d="M${cx - topW + 2} ${topY} Q${cx - topW - 2} ${topY + 4} ${cx - topW} ${midY - bh * 0.05}" fill="none" stroke="#1976D2" stroke-width="0.8" />`;
                s += `<path d="M${cx + topW - 2} ${topY} Q${cx + topW + 2} ${topY + 4} ${cx + topW} ${midY - bh * 0.05}" fill="none" stroke="#1976D2" stroke-width="0.8" />`;
                // Center seam line
                s += `<line x1="${cx}" y1="${topY + bh * 0.14}" x2="${cx}" y2="${botY - 1}" stroke="#0D47A1" stroke-width="0.4" opacity="0.5" />`;
                // Pec contour lines (subtle)
                s += `<path d="M${cx - midW + 5} ${midY - bh * 0.12} Q${cx - 2} ${midY - bh * 0.05} ${cx} ${midY - bh * 0.06}" fill="none" stroke="#0D47A1" stroke-width="0.5" opacity="0.4" />`;
                s += `<path d="M${cx + midW - 5} ${midY - bh * 0.12} Q${cx + 2} ${midY - bh * 0.05} ${cx} ${midY - bh * 0.06}" fill="none" stroke="#0D47A1" stroke-width="0.5" opacity="0.4" />`;
                // Bottom hem — elastic band
                s += `<path d="M${cx - botW + 1} ${botY - 2} Q${cx} ${botY - 1} ${cx + botW - 1} ${botY - 2}" fill="none" stroke="#0D47A1" stroke-width="1.5" />`;
                // Sport logo
                s += `<rect x="${cx - 3.5}" y="${midY - bh * 0.18}" width="7" height="3.5" rx="0.8" fill="#1976D2" />`;
                s += `<line x1="${cx - 2}" y1="${midY - bh * 0.18 + 1.75}" x2="${cx + 2}" y2="${midY - bh * 0.18 + 1.75}" stroke="#42A5F5" stroke-width="0.7" />`;
            },

            // --- HOODIE: Oversized black streetwear hoodie, hood down ---
            clothes_hoodie: () => {
                const topY = ny - 2;
                const botY = by + bh * 0.75;
                // Oversized fit — scaled by creature form
                const neckW = hr * 0.85;
                const shoulderOut = sw + 3 * fs;
                const waistW = bw + 2 * fs;
                const hipW = bw + 1 * fs;
                // Main body — oversized silhouette neck→shoulder→waist→hip
                s += `<path d="M${cx - neckW} ${topY} L${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 1} ${by - bh * 0.1} ${cx - waistW} ${by + bh * 0.1} Q${cx - hipW} ${botY - 4} ${cx - hipW + 1} ${botY} L${cx + hipW - 1} ${botY} Q${cx + hipW} ${botY - 4} ${cx + waistW} ${by + bh * 0.1} Q${cx + shoulderOut + 1} ${by - bh * 0.1} ${cx + shoulderOut} ${ay - 3} L${cx + neckW} ${topY} Z" fill="#1a1a1a" />`;
                // Side shading panels — dark charcoal for depth
                s += `<path d="M${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 1} ${by - bh * 0.1} ${cx - waistW} ${by + bh * 0.1} Q${cx - hipW} ${botY - 4} ${cx - hipW + 1} ${botY} L${cx - hipW + 4} ${botY} Q${cx - hipW + 3} ${botY - 5} ${cx - waistW + 3} ${by + bh * 0.08} Q${cx - shoulderOut + 2} ${by - bh * 0.05} ${cx - shoulderOut + 2} ${ay - 1} Z" fill="#111" />`;
                s += `<path d="M${cx + shoulderOut} ${ay - 3} Q${cx + shoulderOut + 1} ${by - bh * 0.1} ${cx + waistW} ${by + bh * 0.1} Q${cx + hipW} ${botY - 4} ${cx + hipW - 1} ${botY} L${cx + hipW - 4} ${botY} Q${cx + hipW - 3} ${botY - 5} ${cx + waistW - 3} ${by + bh * 0.08} Q${cx + shoulderOut - 2} ${by - bh * 0.05} ${cx + shoulderOut - 2} ${ay - 1} Z" fill="#111" />`;
                // Hood DOWN — bunched fabric behind neck, generous size
                s += `<path d="M${cx - neckW - 3} ${topY} Q${cx - neckW - 6} ${topY - 5} ${cx - hr * 0.8} ${ny - 5} Q${cx} ${ny - 9} ${cx + hr * 0.8} ${ny - 5} Q${cx + neckW + 6} ${topY - 5} ${cx + neckW + 3} ${topY} Z" fill="#222" />`;
                s += `<path d="M${cx - neckW - 1} ${topY} Q${cx - hr * 0.4} ${topY - 3} ${cx} ${ny - 6} Q${cx + hr * 0.4} ${topY - 3} ${cx + neckW + 1} ${topY} Z" fill="#2a2a2a" />`;
                // Collar — round neck, thick ribbed
                s += `<path d="M${cx - neckW} ${topY} Q${cx} ${topY + 3.5} ${cx + neckW} ${topY}" fill="none" stroke="#333" stroke-width="2.2" stroke-linecap="round" />`;
                // Drawstrings — hanging loose
                s += `<line x1="${cx - 3}" y1="${topY + 1.5}" x2="${cx - 4}" y2="${by - bh * 0.08}" stroke="#555" stroke-width="0.7" />`;
                s += `<line x1="${cx + 3}" y1="${topY + 1.5}" x2="${cx + 4}" y2="${by - bh * 0.08}" stroke="#555" stroke-width="0.7" />`;
                // Drawstring metal aglets
                s += `<rect x="${cx - 4.5}" y="${by - bh * 0.08}" width="1.4" height="2.2" rx="0.3" fill="#888" />`;
                s += `<rect x="${cx + 3.2}" y="${by - bh * 0.08}" width="1.4" height="2.2" rx="0.3" fill="#888" />`;
                // Center seam
                s += `<line x1="${cx}" y1="${topY + 4}" x2="${cx}" y2="${botY - 4}" stroke="#222" stroke-width="0.5" opacity="0.6" />`;
                // Kangaroo pocket — wide, follows body curve
                const pocketY = by + bh * 0.02;
                const pocketW = waistW * 0.75;
                const pocketH = bh * 0.25;
                s += `<path d="M${cx - pocketW} ${pocketY} Q${cx} ${pocketY + 3} ${cx + pocketW} ${pocketY} L${cx + pocketW} ${pocketY + pocketH} Q${cx} ${pocketY + pocketH + 2} ${cx - pocketW} ${pocketY + pocketH} Z" fill="#111" />`;
                s += `<path d="M${cx - pocketW} ${pocketY} Q${cx} ${pocketY + 3} ${cx + pocketW} ${pocketY}" fill="none" stroke="#0a0a0a" stroke-width="0.8" />`;
                s += `<line x1="${cx}" y1="${pocketY + 1}" x2="${cx}" y2="${pocketY + pocketH - 2}" stroke="#0a0a0a" stroke-width="0.4" />`;
                // Sleeve seams — follow arms outward
                s += `<path d="M${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 3} ${ay + at} ${cx - shoulderOut - 2} ${ay + at * 2.2}" fill="none" stroke="#222" stroke-width="0.6" />`;
                s += `<path d="M${cx + shoulderOut} ${ay - 3} Q${cx + shoulderOut + 3} ${ay + at} ${cx + shoulderOut + 2} ${ay + at * 2.2}" fill="none" stroke="#222" stroke-width="0.6" />`;
                // Sleeve cuff ribbing on arms
                s += `<path d="M${cx - shoulderOut - 2} ${ay + at * 1.8} Q${cx - shoulderOut - 3} ${ay + at * 2} ${cx - shoulderOut - 2} ${ay + at * 2.2}" fill="none" stroke="#333" stroke-width="1.2" />`;
                s += `<path d="M${cx + shoulderOut + 2} ${ay + at * 1.8} Q${cx + shoulderOut + 3} ${ay + at * 2} ${cx + shoulderOut + 2} ${ay + at * 2.2}" fill="none" stroke="#333" stroke-width="1.2" />`;
                // Bottom elastic band — ribbed, wide
                const bandH = 3.5;
                s += `<path d="M${cx - hipW + 1} ${botY - bandH} Q${cx} ${botY - bandH + 1.5} ${cx + hipW - 1} ${botY - bandH} L${cx + hipW - 1} ${botY} Q${cx} ${botY + 1.5} ${cx - hipW + 1} ${botY} Z" fill="#222" />`;
                // Rib texture on band
                for (let i = 0; i < Math.floor(hipW * 0.9); i++) {
                    const rx = cx - hipW * 0.45 + i * 1.8;
                    if (rx < cx + hipW - 3) {
                        s += `<line x1="${rx}" y1="${botY - bandH}" x2="${rx}" y2="${botY}" stroke="#1a1a1a" stroke-width="0.25" />`;
                    }
                }
                // Brand logo — small minimal white rectangle on chest
                s += `<rect x="${cx - 3}" y="${by - bh * 0.28}" width="6" height="3" rx="0.5" fill="none" stroke="#555" stroke-width="0.5" />`;
                s += `<line x1="${cx - 1.8}" y1="${by - bh * 0.28 + 1.5}" x2="${cx + 1.8}" y2="${by - bh * 0.28 + 1.5}" stroke="#555" stroke-width="0.4" />`;
            },

            // --- KIMONO (GI): Oversized martial arts robe, scaled by form ---
            clothes_gi: () => {
                const topY = ny - 2;
                const botY = by + bh * 0.75;
                const neckW = hr * 0.85;
                const shoulderOut = sw + 3 * fs;
                const waistW = bw + 1 * fs;
                const hipW = bw + 2 * fs;
                // Main robe body — oversized silhouette neck→shoulder→waist→hip
                s += `<path d="M${cx - neckW} ${topY} L${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 1} ${by - bh * 0.1} ${cx - waistW} ${by + bh * 0.08} Q${cx - hipW} ${botY - 4} ${cx - hipW} ${botY} L${cx + hipW} ${botY} Q${cx + hipW} ${botY - 4} ${cx + waistW} ${by + bh * 0.08} Q${cx + shoulderOut + 1} ${by - bh * 0.1} ${cx + shoulderOut} ${ay - 3} L${cx + neckW} ${topY} Z" fill="#F5F5F5" />`;
                // Side shading panels
                s += `<path d="M${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 1} ${by - bh * 0.1} ${cx - waistW} ${by + bh * 0.08} Q${cx - hipW} ${botY - 4} ${cx - hipW} ${botY} L${cx - hipW + 3} ${botY} Q${cx - hipW + 2} ${botY - 5} ${cx - waistW + 2} ${by + bh * 0.06} Q${cx - shoulderOut + 2} ${by - bh * 0.05} ${cx - shoulderOut + 2} ${ay - 1} Z" fill="#E8E8E8" />`;
                s += `<path d="M${cx + shoulderOut} ${ay - 3} Q${cx + shoulderOut + 1} ${by - bh * 0.1} ${cx + waistW} ${by + bh * 0.08} Q${cx + hipW} ${botY - 4} ${cx + hipW} ${botY} L${cx + hipW - 3} ${botY} Q${cx + hipW - 2} ${botY - 5} ${cx + waistW - 2} ${by + bh * 0.06} Q${cx + shoulderOut - 2} ${by - bh * 0.05} ${cx + shoulderOut - 2} ${ay - 1} Z" fill="#E8E8E8" />`;
                // Right lapel (under layer) — wraps from right shoulder down to center-left
                s += `<path d="M${cx + neckW - 1} ${topY} L${cx + shoulderOut - 1} ${ay - 3} Q${cx + shoulderOut * 0.5} ${ay + 3} ${cx + bw * 0.15} ${by - bh * 0.05} L${cx - bw * 0.1} ${by + bh * 0.1} L${cx - bw * 0.05} ${by + bh * 0.16} L${cx + bw * 0.2} ${by + bh * 0.01} Q${cx + shoulderOut * 0.55} ${ay + 2} ${cx + shoulderOut - 2} ${ay - 2} L${cx + neckW} ${topY + 1} Z" fill="#E0E0E0" />`;
                // Left lapel (top layer) — wraps from left shoulder across chest
                s += `<path d="M${cx - neckW + 1} ${topY} L${cx - shoulderOut + 1} ${ay - 3} Q${cx - shoulderOut * 0.5} ${ay + 3} ${cx - bw * 0.15} ${by - bh * 0.05} L${cx + bw * 0.35} ${by + bh * 0.08} L${cx + bw * 0.35} ${by + bh * 0.15} L${cx - bw * 0.1} ${by + bh * 0.02} Q${cx - shoulderOut * 0.45} ${ay + 4} ${cx - shoulderOut + 2} ${ay - 1} L${cx - neckW + 2} ${topY + 1} Z" fill="#EEEEEE" />`;
                // Lapel fold lines
                s += `<path d="M${cx - neckW + 1} ${topY} Q${cx - bw * 0.2} ${ay + 4} ${cx + bw * 0.35} ${by + bh * 0.08}" fill="none" stroke="#BDBDBD" stroke-width="0.7" />`;
                s += `<path d="M${cx + neckW - 1} ${topY} Q${cx + bw * 0.2} ${ay + 4} ${cx - bw * 0.1} ${by + bh * 0.1}" fill="none" stroke="#CCC" stroke-width="0.5" />`;
                // Obi belt — wide, follows waist curve
                const beltY = by + bh * 0.05;
                const beltH = bh * 0.17;
                const beltOutW = waistW + 2;
                s += `<path d="M${cx - beltOutW} ${beltY} Q${cx} ${beltY - 2} ${cx + beltOutW} ${beltY} L${cx + beltOutW} ${beltY + beltH} Q${cx} ${beltY + beltH + 2} ${cx - beltOutW} ${beltY + beltH} Z" fill="#1a1a1a" />`;
                // Belt texture
                s += `<path d="M${cx - beltOutW + 1} ${beltY + 2.5} Q${cx} ${beltY + 1} ${cx + beltOutW - 1} ${beltY + 2.5}" fill="none" stroke="#333" stroke-width="0.4" />`;
                s += `<path d="M${cx - beltOutW + 1} ${beltY + beltH - 2.5} Q${cx} ${beltY + beltH - 1} ${cx + beltOutW - 1} ${beltY + beltH - 2.5}" fill="none" stroke="#333" stroke-width="0.4" />`;
                s += `<path d="M${cx - beltOutW + 1} ${beltY + beltH * 0.5} Q${cx} ${beltY + beltH * 0.5 - 0.5} ${cx + beltOutW - 1} ${beltY + beltH * 0.5}" fill="none" stroke="#2a2a2a" stroke-width="0.3" />`;
                // Knot — off-center right, layered
                const kx = cx + bw * 0.25;
                const ky = beltY + beltH * 0.5;
                s += `<ellipse cx="${kx}" cy="${ky}" rx="4" ry="3" fill="#2a2a2a" />`;
                s += `<ellipse cx="${kx}" cy="${ky}" rx="2.5" ry="1.8" fill="#3a3a3a" />`;
                s += `<ellipse cx="${kx}" cy="${ky}" rx="1" ry="0.7" fill="#4a4a4a" />`;
                // Knot tails hanging
                s += `<path d="M${kx - 0.5} ${ky + 3} Q${kx + 3.5} ${ky + 8} ${kx + 2} ${ky + 14}" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" />`;
                s += `<path d="M${kx + 0.5} ${ky + 3} Q${kx - 2.5} ${ky + 9} ${kx - 3} ${ky + 15}" fill="none" stroke="#2a2a2a" stroke-width="1.5" stroke-linecap="round" />`;
                s += `<ellipse cx="${kx + 2}" cy="${ky + 14}" rx="1.4" ry="0.6" fill="#1a1a1a" />`;
                s += `<ellipse cx="${kx - 3}" cy="${ky + 15}" rx="1.2" ry="0.5" fill="#2a2a2a" />`;
                // Bottom hem — wave
                s += `<path d="M${cx - hipW} ${botY} Q${cx - hipW * 0.5} ${botY + 1.5} ${cx} ${botY} Q${cx + hipW * 0.5} ${botY - 1.5} ${cx + hipW} ${botY}" fill="none" stroke="#BDBDBD" stroke-width="0.8" />`;
                // Fabric fold lines below belt
                s += `<line x1="${cx - bw * 0.4}" y1="${beltY + beltH + 2}" x2="${cx - hipW * 0.5}" y2="${botY - 1}" stroke="#E0E0E0" stroke-width="0.3" opacity="0.6" />`;
                s += `<line x1="${cx + bw * 0.4}" y1="${beltY + beltH + 2}" x2="${cx + hipW * 0.5}" y2="${botY - 1}" stroke="#E0E0E0" stroke-width="0.3" opacity="0.6" />`;
                s += `<line x1="${cx}" y1="${beltY + beltH + 1}" x2="${cx}" y2="${botY - 1}" stroke="#EBEBEB" stroke-width="0.25" opacity="0.4" />`;
                s += `<line x1="${cx - bw * 0.15}" y1="${beltY + beltH + 3}" x2="${cx - hipW * 0.2}" y2="${botY - 2}" stroke="#EBEBEB" stroke-width="0.2" opacity="0.3" />`;
                s += `<line x1="${cx + bw * 0.15}" y1="${beltY + beltH + 3}" x2="${cx + hipW * 0.2}" y2="${botY - 2}" stroke="#EBEBEB" stroke-width="0.2" opacity="0.3" />`;
                // Collar V accent
                s += `<path d="M${cx - neckW + 1} ${topY} L${cx} ${topY + 4} L${cx + neckW - 1} ${topY}" fill="none" stroke="#BDBDBD" stroke-width="0.7" />`;
                // Sleeve seams on arms
                s += `<path d="M${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 3} ${ay + at} ${cx - shoulderOut - 2} ${ay + at * 2.2}" fill="none" stroke="#DDD" stroke-width="0.5" />`;
                s += `<path d="M${cx + shoulderOut} ${ay - 3} Q${cx + shoulderOut + 3} ${ay + at} ${cx + shoulderOut + 2} ${ay + at * 2.2}" fill="none" stroke="#DDD" stroke-width="0.5" />`;
            },

            // --- CAPE: Crimson & black, flowing behind creature (rendered BEFORE creature in SVG) ---
            clothes_cape: () => {
                const capeW = sw + 8 * fs;
                const capeTopY = ny - 2;
                // Main cape outer — deep crimson, semi-transparent, animated flow
                s += `<path fill="#B71C1C" opacity="0.88"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M${cx - sw + 1} ${capeTopY} Q${cx - capeW - 3} ${by + bh * 0.3} ${cx - capeW + 1} ${fy + 6} L${cx + capeW - 1} ${fy + 6} Q${cx + capeW + 3} ${by + bh * 0.3} ${cx + sw - 1} ${capeTopY} Z;M${cx - sw + 1} ${capeTopY} Q${cx - capeW - 7} ${by + bh * 0.4} ${cx - capeW - 2} ${fy + 8} L${cx + capeW + 2} ${fy + 8} Q${cx + capeW + 7} ${by + bh * 0.4} ${cx + sw - 1} ${capeTopY} Z;M${cx - sw + 1} ${capeTopY} Q${cx - capeW - 3} ${by + bh * 0.3} ${cx - capeW + 1} ${fy + 6} L${cx + capeW - 1} ${fy + 6} Q${cx + capeW + 3} ${by + bh * 0.3} ${cx + sw - 1} ${capeTopY} Z" /></path>`;
                // Inner lining — black, slightly transparent
                s += `<path fill="#1a1a1a" opacity="0.6"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M${cx - sw + 3} ${capeTopY + 2} Q${cx - capeW - 1} ${by + bh * 0.35} ${cx - capeW + 3} ${fy + 5} L${cx + capeW - 3} ${fy + 5} Q${cx + capeW + 1} ${by + bh * 0.35} ${cx + sw - 3} ${capeTopY + 2} Z;M${cx - sw + 3} ${capeTopY + 2} Q${cx - capeW - 5} ${by + bh * 0.45} ${cx - capeW} ${fy + 7} L${cx + capeW} ${fy + 7} Q${cx + capeW + 5} ${by + bh * 0.45} ${cx + sw - 3} ${capeTopY + 2} Z;M${cx - sw + 3} ${capeTopY + 2} Q${cx - capeW - 1} ${by + bh * 0.35} ${cx - capeW + 3} ${fy + 5} L${cx + capeW - 3} ${fy + 5} Q${cx + capeW + 1} ${by + bh * 0.35} ${cx + sw - 3} ${capeTopY + 2} Z" /></path>`;
                // Cape bottom edge trim — gold scalloped
                s += `<path fill="none" stroke="#FFD700" stroke-width="1.2"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M${cx - capeW + 1} ${fy + 6} Q${cx - capeW * 0.5} ${fy + 8} ${cx} ${fy + 7} Q${cx + capeW * 0.5} ${fy + 6} ${cx + capeW - 1} ${fy + 6};M${cx - capeW - 2} ${fy + 8} Q${cx - capeW * 0.5} ${fy + 10} ${cx} ${fy + 9} Q${cx + capeW * 0.5} ${fy + 8} ${cx + capeW + 2} ${fy + 8};M${cx - capeW + 1} ${fy + 6} Q${cx - capeW * 0.5} ${fy + 8} ${cx} ${fy + 7} Q${cx + capeW * 0.5} ${fy + 6} ${cx + capeW - 1} ${fy + 6}" /></path>`;
                // Vertical fold lines on cape — dark
                s += `<line x1="${cx - capeW + 6}" y1="${capeTopY + 6}" x2="${cx - capeW + 4}" y2="${fy + 2}" stroke="#8B0000" stroke-width="0.5" opacity="0.4" />`;
                s += `<line x1="${cx}" y1="${capeTopY + 4}" x2="${cx}" y2="${fy + 4}" stroke="#8B0000" stroke-width="0.4" opacity="0.3" />`;
                s += `<line x1="${cx + capeW - 6}" y1="${capeTopY + 6}" x2="${cx + capeW - 4}" y2="${fy + 2}" stroke="#8B0000" stroke-width="0.5" opacity="0.4" />`;
                // Side edge gold trim
                s += `<path d="M${cx - sw + 1} ${capeTopY} Q${cx - capeW - 3} ${by + bh * 0.3} ${cx - capeW + 1} ${fy + 6}" fill="none" stroke="#FFD700" stroke-width="0.6" opacity="0.6" />`;
                s += `<path d="M${cx + sw - 1} ${capeTopY} Q${cx + capeW + 3} ${by + bh * 0.3} ${cx + capeW - 1} ${fy + 6}" fill="none" stroke="#FFD700" stroke-width="0.6" opacity="0.6" />`;
                // Emblem pattern on cape center — dark red diamond
                const embY = by + bh * 0.1;
                s += `<polygon points="${cx},${embY - 4} ${cx - 5},${embY + 2} ${cx},${embY + 8} ${cx + 5},${embY + 2}" fill="#8B0000" opacity="0.5" />`;
                s += `<polygon points="${cx},${embY - 2} ${cx - 3},${embY + 2} ${cx},${embY + 6} ${cx + 3},${embY + 2}" fill="#C62828" opacity="0.4" />`;
            },

            // --- LIGHT ARMOR: Sleek dark combat armor, red accents, scaled fit ---
            clothes_armor_light: () => {
                const topY = ny - 1;
                const botY = by + bh * 0.6;
                const shoulderOut = sw + 4 * fs;
                const waistW = bw + 1 * fs;
                // Main chest plate — dark matte with body contour
                s += `<path d="M${cx - hr * 0.8} ${topY} L${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 1} ${by - bh * 0.1} ${cx - waistW} ${by + bh * 0.1} L${cx - waistW} ${botY} L${cx + waistW} ${botY} L${cx + waistW} ${by + bh * 0.1} Q${cx + shoulderOut + 1} ${by - bh * 0.1} ${cx + shoulderOut} ${ay - 3} L${cx + hr * 0.8} ${topY} Z" fill="#2a2a2a" />`;
                // Gradient overlay — subtle metallic sheen
                s += `<defs><linearGradient id="armorSheen${cx}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#444" stop-opacity="0.3"/><stop offset="50%" stop-color="#666" stop-opacity="0.1"/><stop offset="100%" stop-color="#333" stop-opacity="0.3"/></linearGradient></defs>`;
                s += `<path d="M${cx - hr * 0.8} ${topY} L${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 1} ${by - bh * 0.1} ${cx - waistW} ${by + bh * 0.1} L${cx - waistW} ${botY} L${cx + waistW} ${botY} L${cx + waistW} ${by + bh * 0.1} Q${cx + shoulderOut + 1} ${by - bh * 0.1} ${cx + shoulderOut} ${ay - 3} L${cx + hr * 0.8} ${topY} Z" fill="url(#armorSheen${cx})" />`;
                // Pec plate sculpt lines — angular
                s += `<path d="M${cx - shoulderOut + 3} ${ay - 1} Q${cx - bw * 0.35} ${by - bh * 0.15} ${cx - 2} ${by - bh * 0.05}" fill="none" stroke="#E53935" stroke-width="0.8" opacity="0.8" />`;
                s += `<path d="M${cx + shoulderOut - 3} ${ay - 1} Q${cx + bw * 0.35} ${by - bh * 0.15} ${cx + 2} ${by - bh * 0.05}" fill="none" stroke="#E53935" stroke-width="0.8" opacity="0.8" />`;
                // Center line — glowing red strip
                s += `<line x1="${cx}" y1="${topY + 3}" x2="${cx}" y2="${botY - 2}" stroke="#E53935" stroke-width="1" opacity="0.6" />`;
                s += `<line x1="${cx}" y1="${topY + 3}" x2="${cx}" y2="${botY - 2}" stroke="#FF8A80" stroke-width="0.4" opacity="0.4" />`;
                // Ab plate segments — red edge glow
                for (let i = 0; i < 3; i++) {
                    const segY = by + i * bh * 0.1;
                    const segW = bw * (0.55 - i * 0.05);
                    s += `<path d="M${cx - segW} ${segY} Q${cx} ${segY + 1.5} ${cx + segW} ${segY}" fill="none" stroke="#E53935" stroke-width="0.5" opacity="0.5" />`;
                }
                // Side panel shading — deep black
                s += `<path d="M${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 1} ${by - bh * 0.1} ${cx - waistW} ${by + bh * 0.1} L${cx - waistW} ${botY} L${cx - waistW + 3} ${botY} L${cx - waistW + 3} ${by + bh * 0.08} Q${cx - shoulderOut + 2} ${by - bh * 0.05} ${cx - shoulderOut + 2} ${ay - 1} Z" fill="#1a1a1a" />`;
                s += `<path d="M${cx + shoulderOut} ${ay - 3} Q${cx + shoulderOut + 1} ${by - bh * 0.1} ${cx + waistW} ${by + bh * 0.1} L${cx + waistW} ${botY} L${cx + waistW - 3} ${botY} L${cx + waistW - 3} ${by + bh * 0.08} Q${cx + shoulderOut - 2} ${by - bh * 0.05} ${cx + shoulderOut - 2} ${ay - 1} Z" fill="#1a1a1a" />`;
                // Pauldrons — angular, aggressive, dark with red trim
                s += `<path d="M${cx - sw - 6} ${ay + 2} Q${cx - sw - 7} ${ay - 7} ${cx - sw + 1} ${ay - 9} Q${cx - sw + 7} ${ay - 10} ${cx - sw + 8} ${ay - 3} Q${cx - sw + 4} ${ay + 1} ${cx - sw - 3} ${ay + 3} Z" fill="#333" />`;
                s += `<path d="M${cx - sw - 5} ${ay - 5} Q${cx - sw + 1} ${ay - 8} ${cx - sw + 6} ${ay - 7}" fill="none" stroke="#E53935" stroke-width="0.8" />`;
                s += `<path d="M${cx - sw - 3} ${ay - 2} Q${cx - sw + 1} ${ay - 5} ${cx - sw + 4} ${ay - 4}" fill="none" stroke="#555" stroke-width="0.5" />`;
                s += `<path d="M${cx + sw + 6} ${ay + 2} Q${cx + sw + 7} ${ay - 7} ${cx + sw - 1} ${ay - 9} Q${cx + sw - 7} ${ay - 10} ${cx + sw - 8} ${ay - 3} Q${cx + sw - 4} ${ay + 1} ${cx + sw + 3} ${ay + 3} Z" fill="#333" />`;
                s += `<path d="M${cx + sw + 5} ${ay - 5} Q${cx + sw - 1} ${ay - 8} ${cx + sw - 6} ${ay - 7}" fill="none" stroke="#E53935" stroke-width="0.8" />`;
                s += `<path d="M${cx + sw + 3} ${ay - 2} Q${cx + sw - 1} ${ay - 5} ${cx + sw - 4} ${ay - 4}" fill="none" stroke="#555" stroke-width="0.5" />`;
                // Rivets — small red-glowing dots
                const rivets = [[cx - sw + 2, topY + 4], [cx + sw - 2, topY + 4], [cx - waistW + 4, by + bh * 0.08], [cx + waistW - 4, by + bh * 0.08], [cx - sw - 2, ay - 5], [cx + sw + 2, ay - 5]];
                for (const [rx, ry] of rivets) {
                    s += `<circle cx="${rx}" cy="${ry}" r="1" fill="#333" />`;
                    s += `<circle cx="${rx}" cy="${ry}" r="0.5" fill="#E53935" opacity="0.8" />`;
                }
                // Collar — high, tactical
                s += `<path d="M${cx - hr * 0.8} ${topY} Q${cx} ${topY + 2.5} ${cx + hr * 0.8} ${topY}" fill="none" stroke="#444" stroke-width="2" stroke-linecap="round" />`;
                // Belt — tactical black with red buckle
                const beltY = by + bh * 0.12;
                s += `<path d="M${cx - waistW} ${beltY} Q${cx} ${beltY - 1} ${cx + waistW} ${beltY} L${cx + waistW} ${beltY + 4} Q${cx} ${beltY + 3} ${cx - waistW} ${beltY + 4} Z" fill="#1a1a1a" />`;
                s += `<rect x="${cx - 3.5}" y="${beltY - 1}" width="7" height="5.5" rx="1" fill="#333" />`;
                s += `<rect x="${cx - 2.5}" y="${beltY}" width="5" height="3.5" rx="0.5" fill="#E53935" />`;
                s += `<circle cx="${cx}" cy="${beltY + 1.75}" r="0.8" fill="#FF8A80" />`;
                // Bottom edge — angular trim
                s += `<path d="M${cx - waistW} ${botY} L${cx - waistW + 3} ${botY - 2} L${cx} ${botY - 1} L${cx + waistW - 3} ${botY - 2} L${cx + waistW} ${botY}" fill="none" stroke="#E53935" stroke-width="0.6" opacity="0.6" />`;
            },

            // --- ROYAL: Black & gold imperial robe, fur collar, crown ---
            clothes_royal: () => {
                const topY = ny - 2;
                const botY = by + bh * 0.75;
                const shoulderOut = sw + 4 * fs;
                const waistW = bw + 2 * fs;
                const hipW = bw + 3 * fs;
                // Main robe — deep black, oversized body contour
                s += `<path d="M${cx - hr * 0.85} ${topY} L${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 1} ${by - bh * 0.1} ${cx - waistW} ${by + bh * 0.08} Q${cx - hipW} ${botY - 4} ${cx - hipW} ${botY} L${cx + hipW} ${botY} Q${cx + hipW} ${botY - 4} ${cx + waistW} ${by + bh * 0.08} Q${cx + shoulderOut + 1} ${by - bh * 0.1} ${cx + shoulderOut} ${ay - 3} L${cx + hr * 0.85} ${topY} Z" fill="#111" />`;
                // Center panel — slightly lighter
                s += `<path d="M${cx - bw * 0.45} ${topY + 5} Q${cx} ${by - bh * 0.05} ${cx + bw * 0.45} ${topY + 5} L${cx + bw * 0.4} ${botY - 1} Q${cx} ${botY + 1} ${cx - bw * 0.4} ${botY - 1} Z" fill="#1a1a1a" />`;
                // Side shading panels
                s += `<path d="M${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 1} ${by - bh * 0.1} ${cx - waistW} ${by + bh * 0.08} Q${cx - hipW} ${botY - 4} ${cx - hipW} ${botY} L${cx - hipW + 3} ${botY} Q${cx - hipW + 2} ${botY - 5} ${cx - waistW + 2} ${by + bh * 0.06} Q${cx - shoulderOut + 2} ${by - bh * 0.05} ${cx - shoulderOut + 2} ${ay - 1} Z" fill="#0a0a0a" />`;
                s += `<path d="M${cx + shoulderOut} ${ay - 3} Q${cx + shoulderOut + 1} ${by - bh * 0.1} ${cx + waistW} ${by + bh * 0.08} Q${cx + hipW} ${botY - 4} ${cx + hipW} ${botY} L${cx + hipW - 3} ${botY} Q${cx + hipW - 2} ${botY - 5} ${cx + waistW - 2} ${by + bh * 0.06} Q${cx + shoulderOut - 2} ${by - bh * 0.05} ${cx + shoulderOut - 2} ${ay - 1} Z" fill="#0a0a0a" />`;
                // V-neckline with golden trim
                s += `<path d="M${cx - hr * 0.85 + 1} ${topY + 1} Q${cx - sw * 0.3} ${topY + bh * 0.18} ${cx} ${topY + bh * 0.28} Q${cx + sw * 0.3} ${topY + bh * 0.18} ${cx + hr * 0.85 - 1} ${topY + 1}" fill="none" stroke="#FFD700" stroke-width="1.5" />`;
                // Fur collar — luxurious white
                s += `<path d="M${cx - hr * 0.85} ${topY} Q${cx - sw - 1} ${topY - 4} ${cx - hr} ${topY - 5} Q${cx} ${topY - 7} ${cx + hr} ${topY - 5} Q${cx + sw + 1} ${topY - 4} ${cx + hr * 0.85} ${topY} Q${cx + hr * 0.4} ${topY + 2} ${cx} ${topY + 1} Q${cx - hr * 0.4} ${topY + 2} ${cx - hr * 0.85} ${topY} Z" fill="#E0E0E0" />`;
                // Fur texture
                for (let i = 0; i < 10; i++) {
                    const fx = cx - hr + i * (hr * 0.25);
                    s += `<line x1="${fx}" y1="${topY - 4}" x2="${fx + 0.5}" y2="${topY - 1.5}" stroke="#BDBDBD" stroke-width="0.4" />`;
                }
                // Gold embroidery down center
                for (let i = 0; i < 4; i++) {
                    const ey = topY + bh * 0.33 + i * bh * 0.1;
                    s += `<path d="M${cx - 3.5} ${ey} Q${cx} ${ey - 2.5} ${cx + 3.5} ${ey} Q${cx} ${ey + 2.5} ${cx - 3.5} ${ey}" fill="none" stroke="#FFD700" stroke-width="0.6" opacity="0.7" />`;
                }
                // Gold side trim lines
                s += `<path d="M${cx - shoulderOut} ${ay} Q${cx - shoulderOut - 1} ${by} ${cx - hipW} ${botY}" fill="none" stroke="#FFD700" stroke-width="0.7" opacity="0.5" />`;
                s += `<path d="M${cx + shoulderOut} ${ay} Q${cx + shoulderOut + 1} ${by} ${cx + hipW} ${botY}" fill="none" stroke="#FFD700" stroke-width="0.7" opacity="0.5" />`;
                // Bottom gold trim — ornate scalloped
                s += `<path d="M${cx - hipW} ${botY - 1} Q${cx - hipW * 0.5} ${botY + 2} ${cx} ${botY} Q${cx + hipW * 0.5} ${botY + 2} ${cx + hipW} ${botY - 1}" fill="none" stroke="#FFD700" stroke-width="1.3" />`;
                // Golden epaulettes — large, aggressive
                s += `<path d="M${cx - sw - 5} ${ay + 2} Q${cx - sw - 4} ${ay - 7} ${cx - sw + 2} ${ay - 8} Q${cx - sw + 7} ${ay - 7} ${cx - sw + 6} ${ay - 1} Q${cx - sw + 3} ${ay + 2} ${cx - sw - 3} ${ay + 3} Z" fill="#FFD700" />`;
                s += `<path d="M${cx - sw - 3} ${ay - 3} Q${cx - sw + 1} ${ay - 6} ${cx - sw + 5} ${ay - 5}" fill="none" stroke="#FF8F00" stroke-width="0.6" />`;
                for (let i = 0; i < 4; i++) {
                    const fx = cx - sw - 4 + i * 3;
                    s += `<line x1="${fx}" y1="${ay + 1}" x2="${fx - 0.5}" y2="${ay + 4.5}" stroke="#FFD700" stroke-width="0.5" />`;
                }
                s += `<path d="M${cx + sw + 5} ${ay + 2} Q${cx + sw + 4} ${ay - 7} ${cx + sw - 2} ${ay - 8} Q${cx + sw - 7} ${ay - 7} ${cx + sw - 6} ${ay - 1} Q${cx + sw - 3} ${ay + 2} ${cx + sw + 3} ${ay + 3} Z" fill="#FFD700" />`;
                s += `<path d="M${cx + sw + 3} ${ay - 3} Q${cx + sw - 1} ${ay - 6} ${cx + sw - 5} ${ay - 5}" fill="none" stroke="#FF8F00" stroke-width="0.6" />`;
                for (let i = 0; i < 4; i++) {
                    const fx = cx + sw - 4 + i * 3;
                    s += `<line x1="${fx}" y1="${ay + 1}" x2="${fx + 0.5}" y2="${ay + 4.5}" stroke="#FFD700" stroke-width="0.5" />`;
                }
                // Crown — gold with black velvet
                const crY = hy - hr - 2;
                s += `<path d="M${cx - 10} ${crY + 1} Q${cx} ${crY - 1} ${cx + 10} ${crY + 1} L${cx + 10} ${crY + 4} Q${cx} ${crY + 2} ${cx - 10} ${crY + 4} Z" fill="#FFD700" />`;
                s += `<polygon points="${cx - 9},${crY + 1} ${cx - 8},${crY - 6} ${cx - 5},${crY - 3} ${cx - 2},${crY - 10} ${cx},${crY - 6} ${cx + 2},${crY - 10} ${cx + 5},${crY - 3} ${cx + 8},${crY - 6} ${cx + 9},${crY + 1}" fill="#FFD700" />`;
                s += `<polygon points="${cx - 8},${crY + 1} ${cx - 7},${crY - 4} ${cx - 4},${crY - 2} ${cx - 2},${crY - 7} ${cx},${crY - 4} ${cx + 2},${crY - 7} ${cx + 4},${crY - 2} ${cx + 7},${crY - 4} ${cx + 8},${crY + 1}" fill="#1a1a1a" />`;
                s += `<path d="M${cx - 10} ${crY + 2} Q${cx} ${crY} ${cx + 10} ${crY + 2}" fill="none" stroke="#FF8F00" stroke-width="1" />`;
                // Crown gems
                s += `<circle cx="${cx}" cy="${crY - 7.5}" r="1.8" fill="#E53935" />`;
                s += `<circle cx="${cx}" cy="${crY - 7.5}" r="0.8" fill="#FFCDD2" />`;
                s += `<circle cx="${cx - 6.5}" cy="${crY - 4}" r="1.2" fill="#1E88E5" />`;
                s += `<circle cx="${cx + 6.5}" cy="${crY - 4}" r="1.2" fill="#4CAF50" />`;
                // Center chest gem brooch
                const gemY = topY + bh * 0.28;
                s += `<polygon points="${cx},${gemY - 4} ${cx - 4},${gemY + 1} ${cx},${gemY + 6} ${cx + 4},${gemY + 1}" fill="#E53935" />`;
                s += `<polygon points="${cx},${gemY - 2} ${cx - 2.2},${gemY + 1} ${cx},${gemY + 4} ${cx + 2.2},${gemY + 1}" fill="#EF5350" />`;
                s += `<path d="M${cx - 1.5} ${gemY - 1} L${cx + 0.5} ${gemY + 1}" fill="none" stroke="#FFCDD2" stroke-width="0.5" opacity="0.8" />`;
                s += `<polygon points="${cx},${gemY - 5} ${cx - 5},${gemY + 1} ${cx},${gemY + 7} ${cx + 5},${gemY + 1}" fill="none" stroke="#FFD700" stroke-width="0.6" />`;
                // Sleeve seams
                s += `<path d="M${cx - shoulderOut} ${ay - 3} Q${cx - shoulderOut - 3} ${ay + at} ${cx - shoulderOut - 2} ${ay + at * 2.2}" fill="none" stroke="#FFD700" stroke-width="0.4" opacity="0.5" />`;
                s += `<path d="M${cx + shoulderOut} ${ay - 3} Q${cx + shoulderOut + 3} ${ay + at} ${cx + shoulderOut + 2} ${ay + at * 2.2}" fill="none" stroke="#FFD700" stroke-width="0.4" opacity="0.5" />`;
            },

            // --- LEGENDARY: Divine golden armor, angel wings, ornate crown, animated glow ---
            clothes_legendary: () => {
                const topY = ny;
                const botY = by + bh * 0.5;
                const midY = by;
                // Main chest plate — sculpted golden armor following body
                s += `<path d="M${cx - sw + 1} ${topY} Q${cx - sw - 1} ${midY} ${cx - bw + 1} ${botY} L${cx + bw - 1} ${botY} Q${cx + sw + 1} ${midY} ${cx + sw - 1} ${topY} Z" fill="url(#legendGrad${cx})" />`;
                // Gradient def for golden armor
                s += `<defs><linearGradient id="legendGrad${cx}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFE082"/><stop offset="40%" stop-color="#FFB300"/><stop offset="100%" stop-color="#FF8F00"/></linearGradient></defs>`;
                // Sculpted pectoral plates
                s += `<path d="M${cx - sw + 3} ${topY + 2} Q${cx - bw * 0.4} ${topY + bh * 0.1} ${cx - 2} ${midY - bh * 0.1}" fill="none" stroke="#FFD54F" stroke-width="1" />`;
                s += `<path d="M${cx + sw - 3} ${topY + 2} Q${cx + bw * 0.4} ${topY + bh * 0.1} ${cx + 2} ${midY - bh * 0.1}" fill="none" stroke="#FFD54F" stroke-width="1" />`;
                // Center vertical ridge
                s += `<path d="M${cx} ${topY + 3} Q${cx - 1} ${midY} ${cx} ${botY - 2}" fill="none" stroke="#FFE082" stroke-width="1.2" />`;
                // Abdominal plate segments
                for (let i = 0; i < 3; i++) {
                    const segY = midY - bh * 0.05 + i * bh * 0.1;
                    const segW = bw * (0.5 - i * 0.05);
                    s += `<path d="M${cx - segW} ${segY} Q${cx} ${segY + 1.5} ${cx + segW} ${segY}" fill="none" stroke="#FF8F00" stroke-width="0.6" />`;
                }
                // Side panels — darker bronze
                s += `<path d="M${cx - sw + 1} ${topY} Q${cx - sw - 1} ${midY} ${cx - bw + 1} ${botY} L${cx - bw + 4} ${botY - 2} Q${cx - sw + 2} ${midY + 2} ${cx - sw + 3} ${topY + 2} Z" fill="#FF8F00" opacity="0.7" />`;
                s += `<path d="M${cx + sw - 1} ${topY} Q${cx + sw + 1} ${midY} ${cx + bw - 1} ${botY} L${cx + bw - 4} ${botY - 2} Q${cx + sw - 2} ${midY + 2} ${cx + sw - 3} ${topY + 2} Z" fill="#FF8F00" opacity="0.7" />`;
                // Center diamond emblem with animated glow
                const gemY = topY + bh * 0.15;
                s += `<polygon points="${cx},${gemY - 5} ${cx - 5},${gemY + 1} ${cx},${gemY + 7} ${cx + 5},${gemY + 1}" fill="#FF6F00"><animate attributeName="fill" dur="2s" repeatCount="indefinite" values="#FF6F00;#FFB300;#FF6F00" /></polygon>`;
                s += `<polygon points="${cx},${gemY - 3} ${cx - 3},${gemY + 1} ${cx},${gemY + 5} ${cx + 3},${gemY + 1}" fill="#FFE082" />`;
                s += `<circle cx="${cx}" cy="${gemY + 1}" r="1.5" fill="#FFF8E1"><animate attributeName="r" dur="2s" repeatCount="indefinite" values="1.2;1.8;1.2" /></circle>`;
                // Ornate shoulder pauldrons with wing motif
                // Left pauldron
                s += `<path d="M${cx - sw - 6} ${ay + 2} Q${cx - sw - 7} ${ay - 7} ${cx - sw} ${ay - 9} Q${cx - sw + 7} ${ay - 10} ${cx - sw + 7} ${ay - 3} Q${cx - sw + 3} ${ay + 2} ${cx - sw - 3} ${ay + 3} Z" fill="#FFB300" stroke="#FF8F00" stroke-width="0.5" />`;
                s += `<path d="M${cx - sw - 4} ${ay - 3} Q${cx - sw} ${ay - 8} ${cx - sw + 5} ${ay - 6}" fill="none" stroke="#FFD54F" stroke-width="0.7" />`;
                s += `<path d="M${cx - sw - 2} ${ay - 1} Q${cx - sw} ${ay - 5} ${cx - sw + 3} ${ay - 4}" fill="none" stroke="#FFD54F" stroke-width="0.5" />`;
                // Wing feather extensions from left pauldron
                s += `<path fill="#FFC107" opacity="0.9"><animate attributeName="d" dur="2.5s" repeatCount="indefinite" values="M${cx - sw - 5} ${ay - 3} L${cx - sw - 10} ${ay - 10} L${cx - sw - 8} ${ay - 5} L${cx - sw - 13} ${ay - 7} L${cx - sw - 10} ${ay - 1} L${cx - sw - 14} ${ay + 1} L${cx - sw - 8} ${ay + 2} Z;M${cx - sw - 5} ${ay - 3} L${cx - sw - 11} ${ay - 12} L${cx - sw - 9} ${ay - 6} L${cx - sw - 15} ${ay - 9} L${cx - sw - 11} ${ay - 2} L${cx - sw - 16} ${ay} L${cx - sw - 9} ${ay + 2} Z;M${cx - sw - 5} ${ay - 3} L${cx - sw - 10} ${ay - 10} L${cx - sw - 8} ${ay - 5} L${cx - sw - 13} ${ay - 7} L${cx - sw - 10} ${ay - 1} L${cx - sw - 14} ${ay + 1} L${cx - sw - 8} ${ay + 2} Z" /></path>`;
                // Feather detail lines
                s += `<line x1="${cx - sw - 8}" y1="${ay - 7}" x2="${cx - sw - 6}" y2="${ay - 3}" stroke="#FF8F00" stroke-width="0.4" opacity="0.6" />`;
                // Right pauldron (mirrored)
                s += `<path d="M${cx + sw + 6} ${ay + 2} Q${cx + sw + 7} ${ay - 7} ${cx + sw} ${ay - 9} Q${cx + sw - 7} ${ay - 10} ${cx + sw - 7} ${ay - 3} Q${cx + sw - 3} ${ay + 2} ${cx + sw + 3} ${ay + 3} Z" fill="#FFB300" stroke="#FF8F00" stroke-width="0.5" />`;
                s += `<path d="M${cx + sw + 4} ${ay - 3} Q${cx + sw} ${ay - 8} ${cx + sw - 5} ${ay - 6}" fill="none" stroke="#FFD54F" stroke-width="0.7" />`;
                s += `<path d="M${cx + sw + 2} ${ay - 1} Q${cx + sw} ${ay - 5} ${cx + sw - 3} ${ay - 4}" fill="none" stroke="#FFD54F" stroke-width="0.5" />`;
                // Wing feather extensions from right pauldron
                s += `<path fill="#FFC107" opacity="0.9"><animate attributeName="d" dur="2.5s" repeatCount="indefinite" values="M${cx + sw + 5} ${ay - 3} L${cx + sw + 10} ${ay - 10} L${cx + sw + 8} ${ay - 5} L${cx + sw + 13} ${ay - 7} L${cx + sw + 10} ${ay - 1} L${cx + sw + 14} ${ay + 1} L${cx + sw + 8} ${ay + 2} Z;M${cx + sw + 5} ${ay - 3} L${cx + sw + 11} ${ay - 12} L${cx + sw + 9} ${ay - 6} L${cx + sw + 15} ${ay - 9} L${cx + sw + 11} ${ay - 2} L${cx + sw + 16} ${ay} L${cx + sw + 9} ${ay + 2} Z;M${cx + sw + 5} ${ay - 3} L${cx + sw + 10} ${ay - 10} L${cx + sw + 8} ${ay - 5} L${cx + sw + 13} ${ay - 7} L${cx + sw + 10} ${ay - 1} L${cx + sw + 14} ${ay + 1} L${cx + sw + 8} ${ay + 2} Z" /></path>`;
                s += `<line x1="${cx + sw + 8}" y1="${ay - 7}" x2="${cx + sw + 6}" y2="${ay - 3}" stroke="#FF8F00" stroke-width="0.4" opacity="0.6" />`;
                // Ornate crown — divine, with filigree
                const crY = hy - hr - 2;
                // Crown base band with gem sockets
                s += `<path d="M${cx - 10} ${crY + 1} Q${cx} ${crY - 1} ${cx + 10} ${crY + 1} L${cx + 10} ${crY + 4} Q${cx} ${crY + 2} ${cx - 10} ${crY + 4} Z" fill="#FF8F00" />`;
                // Crown points — 5 elaborate prongs
                s += `<polygon points="${cx - 9},${crY + 1} ${cx - 8},${crY - 7} ${cx - 6},${crY - 4} ${cx - 3},${crY - 11} ${cx},${crY - 7} ${cx + 3},${crY - 11} ${cx + 6},${crY - 4} ${cx + 8},${crY - 7} ${cx + 9},${crY + 1}" fill="#FFD700" />`;
                // Inner radiance
                s += `<polygon points="${cx - 7},${crY + 1} ${cx - 6},${crY - 5} ${cx - 5},${crY - 3} ${cx - 3},${crY - 8} ${cx},${crY - 5} ${cx + 3},${crY - 8} ${cx + 5},${crY - 3} ${cx + 6},${crY - 5} ${cx + 7},${crY + 1}" fill="#FFE082" opacity="0.7" />`;
                // Crown filigree pattern
                s += `<path d="M${cx - 8} ${crY} Q${cx - 4} ${crY - 2} ${cx} ${crY}" fill="none" stroke="#FFD54F" stroke-width="0.4" />`;
                s += `<path d="M${cx} ${crY} Q${cx + 4} ${crY - 2} ${cx + 8} ${crY}" fill="none" stroke="#FFD54F" stroke-width="0.4" />`;
                // Crown gems — animated pulsing
                s += `<polygon points="${cx},${crY - 9} ${cx - 2.2},${crY - 6} ${cx},${crY - 3} ${cx + 2.2},${crY - 6}" fill="#E53935"><animate attributeName="fill" dur="3s" repeatCount="indefinite" values="#E53935;#FF5252;#E53935" /></polygon>`;
                s += `<circle cx="${cx}" cy="${crY - 6}" r="0.8" fill="#FFCDD2" />`;
                s += `<circle cx="${cx - 6.5}" cy="${crY - 5}" r="1.2" fill="#1E88E5"><animate attributeName="opacity" dur="2.5s" repeatCount="indefinite" values="0.8;1;0.8" /></circle>`;
                s += `<circle cx="${cx + 6.5}" cy="${crY - 5}" r="1.2" fill="#4CAF50"><animate attributeName="opacity" dur="2.5s" repeatCount="indefinite" values="0.8;1;0.8" /></circle>`;
                s += `<circle cx="${cx - 3}" cy="${crY - 8}" r="0.7" fill="#FFD700" />`;
                s += `<circle cx="${cx + 3}" cy="${crY - 8}" r="0.7" fill="#FFD700" />`;
                // Crown tip orbs
                s += `<circle cx="${cx - 8}" cy="${crY - 7}" r="0.8" fill="#FFC107" />`;
                s += `<circle cx="${cx + 8}" cy="${crY - 7}" r="0.8" fill="#FFC107" />`;
                // Belt — ornate golden
                const beltY = midY + bh * 0.1;
                s += `<path d="M${cx - bw + 1} ${beltY} Q${cx} ${beltY - 1} ${cx + bw - 1} ${beltY} L${cx + bw - 1} ${beltY + 4} Q${cx} ${beltY + 3} ${cx - bw + 1} ${beltY + 4} Z" fill="#FF8F00" />`;
                s += `<path d="M${cx - bw + 2} ${beltY + 1} Q${cx} ${beltY} ${cx + bw - 2} ${beltY + 1}" fill="none" stroke="#FFD54F" stroke-width="0.4" />`;
                // Belt buckle — divine emblem
                s += `<polygon points="${cx - 4},${beltY - 1} ${cx},${beltY - 4} ${cx + 4},${beltY - 1} ${cx + 4},${beltY + 5} ${cx},${beltY + 8} ${cx - 4},${beltY + 5}" fill="#FFD700" />`;
                s += `<polygon points="${cx - 2},${beltY} ${cx},${beltY - 2} ${cx + 2},${beltY} ${cx + 2},${beltY + 4} ${cx},${beltY + 6} ${cx - 2},${beltY + 4}" fill="#FF8F00" />`;
                s += `<circle cx="${cx}" cy="${beltY + 2}" r="1.2" fill="#E53935"><animate attributeName="r" dur="2s" repeatCount="indefinite" values="1;1.4;1" /></circle>`;
                // Animated golden glow around armor edges
                s += `<path d="M${cx - sw + 1} ${topY} Q${cx - sw - 1} ${midY} ${cx - bw + 1} ${botY} L${cx + bw - 1} ${botY} Q${cx + sw + 1} ${midY} ${cx + sw - 1} ${topY}" fill="none" stroke="#FFE082" stroke-width="0.6" opacity="0.5"><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.3;0.7;0.3" /></path>`;
            }
        };
        if (items[itemId]) items[itemId]();
        return s;
    },

    // --- PER-ITEM SPECIFIC BRILLIANCE for high-tier items ---
    _renderItemBrilliance(itemId, bp, type, form) {
        let s = '';
        const cx = bp.cx, sw = bp.shoulderW, by = bp.bodyY, bh = bp.bodyH, hy = bp.headY, hr = bp.headR, ny = bp.neckY, fy = bp.feetY, ay = bp.armY;
        const uid = 'br' + Math.random().toString(36).substr(2, 4);

        if (itemId === 'clothes_cape') {
            // Crimson embers falling from cape edges
            for (let i = 0; i < 6; i++) {
                const ex = cx - sw - 4 + i * (sw * 2 + 8) / 5;
                const ey = ny + i * 5;
                s += `<circle cx="${ex}" cy="${ey}" r="${0.8 + i * 0.1}" fill="#E53935" opacity="0"><animate attributeName="opacity" dur="${1.5 + i * 0.3}s" begin="${(i * 0.25).toFixed(1)}s" repeatCount="indefinite" values="0;0.7;0" /><animate attributeName="cy" dur="${1.5 + i * 0.3}s" begin="${(i * 0.25).toFixed(1)}s" repeatCount="indefinite" values="${ey};${ey + 8}" /></circle>`;
            }
            // Red glow at cape hem
            s += `<line x1="${cx - sw - 5}" y1="${fy + 2}" x2="${cx + sw + 5}" y2="${fy + 2}" stroke="#E53935" stroke-width="1.5" opacity="0.15"><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.1;0.25;0.1" /></line>`;
        } else if (itemId === 'clothes_royal') {
            // Gold dust particles rising from outfit
            for (let i = 0; i < 8; i++) {
                const gx = cx - sw * 0.8 + i * (sw * 1.6 / 7);
                const gy = by + bh * 0.3 + (i % 3) * 5;
                s += `<circle cx="${gx}" cy="${gy}" r="${0.6 + (i % 2) * 0.3}" fill="#FFD700" opacity="0"><animate attributeName="opacity" dur="${2 + i * 0.2}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0;0.8;0" /><animate attributeName="cy" dur="${2 + i * 0.2}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="${gy};${gy - 10}" /></circle>`;
            }
            // Crown glow
            s += `<ellipse cx="${cx}" cy="${hy - hr - 3}" rx="${hr + 3}" ry="2" fill="#FFD700" opacity="0.1"><animate attributeName="opacity" dur="2.5s" repeatCount="indefinite" values="0.05;0.15;0.05" /></ellipse>`;
        } else if (itemId === 'clothes_legendary') {
            // Prismatic energy streams along armor plates
            const colors = ['#FFD700', '#E040FB', '#40C4FF', '#FFD700'];
            for (let i = 0; i < 4; i++) {
                const lx1 = cx + (i % 2 === 0 ? -1 : 1) * (sw * 0.6 + i * 2);
                const ly1 = ay - 2 + i * 4;
                const lx2 = lx1 + (i % 2 === 0 ? -3 : 3);
                const ly2 = ly1 + 8;
                s += `<line x1="${lx1}" y1="${ly1}" x2="${lx2}" y2="${ly2}" stroke="${colors[i]}" stroke-width="0.8" opacity="0"><animate attributeName="opacity" dur="${1.8 + i * 0.4}s" begin="${(i * 0.5).toFixed(1)}s" repeatCount="indefinite" values="0;0.6;0" /></line>`;
            }
            // Armor plate gleam points
            const gleamPts = [[cx, by + 2], [cx - sw * 0.5, by + bh * 0.3], [cx + sw * 0.5, by + bh * 0.3], [cx, by + bh * 0.6]];
            for (let i = 0; i < gleamPts.length; i++) {
                s += `<circle cx="${gleamPts[i][0]}" cy="${gleamPts[i][1]}" r="1" fill="white" opacity="0"><animate attributeName="opacity" dur="2.5s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite" values="0;0.9;0" /><animate attributeName="r" dur="2.5s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite" values="0.3;1.5;0.3" /></circle>`;
            }
        } else if (itemId === 'wings_shadow') {
            // Dark smoke wisps trailing from wing tips
            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 3; i++) {
                    const wx = cx + side * (sw + 12 + i * 4);
                    const wy = ay - 6 + i * 8;
                    s += `<circle cx="${wx}" cy="${wy}" r="${1.5 + i * 0.5}" fill="#111" opacity="0"><animate attributeName="opacity" dur="${2 + i * 0.5}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite" values="0;0.4;0" /><animate attributeName="r" dur="${2 + i * 0.5}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite" values="${1 + i * 0.3};${2.5 + i * 0.5};${1 + i * 0.3}" /></circle>`;
                }
            }
            // Shadow drip effect
            s += `<path d="M${cx - sw - 10} ${ay + 5} Q${cx - sw - 12} ${ay + 15} ${cx - sw - 8} ${ay + 20}" fill="none" stroke="#1a1a1a" stroke-width="0.8" opacity="0"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0;0.3;0" /></path>`;
            s += `<path d="M${cx + sw + 10} ${ay + 5} Q${cx + sw + 12} ${ay + 15} ${cx + sw + 8} ${ay + 20}" fill="none" stroke="#1a1a1a" stroke-width="0.8" opacity="0"><animate attributeName="opacity" dur="3s" begin="0.5s" repeatCount="indefinite" values="0;0.3;0" /></path>`;
        } else if (itemId === 'wings_angel') {
            // Holy light feathers drifting down
            for (let i = 0; i < 5; i++) {
                const fx = cx + (i - 2) * 8;
                const fy2 = ay + i * 6;
                s += `<path d="M${fx} ${fy2} Q${fx + 2} ${fy2 + 2} ${fx + 1} ${fy2 + 4}" fill="none" stroke="white" stroke-width="0.6" opacity="0"><animate attributeName="opacity" dur="${2.5 + i * 0.3}s" begin="${(i * 0.5).toFixed(1)}s" repeatCount="indefinite" values="0;0.5;0" /><animate attributeName="transform" type="translate" dur="${2.5 + i * 0.3}s" begin="${(i * 0.5).toFixed(1)}s" repeatCount="indefinite" values="0 0;${(i % 2 === 0 ? 2 : -2)} 8" /></path>`;
            }
            // Soft halo ring above head
            s += `<ellipse cx="${cx}" cy="${hy - hr - 6}" rx="${hr + 4}" ry="2.5" fill="none" stroke="#FFF8E1" stroke-width="1" opacity="0.3"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.2;0.5;0.2" /></ellipse>`;
        } else if (itemId === 'wings_divine') {
            // Golden light rays radiating from wings
            for (let i = 0; i < 8; i++) {
                const angle = -80 + i * 20;
                const rad = angle * Math.PI / 180;
                const len = sw + 18;
                for (let side = -1; side <= 1; side += 2) {
                    const ox = cx + side * (sw + 2);
                    s += `<line x1="${ox}" y1="${ay}" x2="${ox + Math.cos(rad) * len * side}" y2="${ay + Math.sin(rad) * len}" stroke="#FFF8E1" stroke-width="0.5" opacity="0"><animate attributeName="opacity" dur="3.5s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0;0.35;0" /></line>`;
                }
            }
            // Golden sparkle burst at wing roots
            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 3; i++) {
                    s += `<circle cx="${cx + side * sw}" cy="${ay - 2 + i * 3}" r="1" fill="#FFD700" opacity="0"><animate attributeName="opacity" dur="${1.5 + i * 0.4}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0;0.8;0" /><animate attributeName="r" dur="${1.5 + i * 0.4}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0.3;1.8;0.3" /></circle>`;
                }
            }
        }

        return s;
    },

    // --- PET EFFECTS: Special effects for high-tier pets (phoenix+) ---
    _renderPetEffects(petId, bp) {
        let s = '';
        const px = bp.cx + bp.shoulderW + 12;
        const py = bp.feetY - 3;
        const sc = (0.7 + bp.scale * 0.2).toFixed(2);

        if (petId === 'pet_phoenix') {
            // Fire trail behind phoenix
            for (let i = 0; i < 4; i++) {
                s += `<circle cx="${px + 8 + i * 3}" cy="${py - 12 + i * 2}" r="${1.2 - i * 0.2}" fill="#FF6D00" opacity="0"><animate attributeName="opacity" dur="${1 + i * 0.3}s" begin="${(i * 0.2).toFixed(1)}s" repeatCount="indefinite" values="0;0.6;0" /><animate attributeName="cy" dur="${1 + i * 0.3}s" begin="${(i * 0.2).toFixed(1)}s" repeatCount="indefinite" values="${py - 12 + i * 2};${py - 18 + i * 2}" /></circle>`;
            }
            // Heat distortion glow
            s += `<ellipse cx="${px}" cy="${py - 14}" rx="8" ry="5" fill="#FF6D00" opacity="0.06"><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.03;0.1;0.03" /></ellipse>`;
        } else if (petId === 'pet_dragon') {
            // Smoke trail from nostrils — bigger, more particles
            for (let i = 0; i < 5; i++) {
                s += `<circle cx="${px - 8 + i * 2}" cy="${py - 6 - i * 3}" r="${0.8 + i * 0.4}" fill="#78909C" opacity="0"><animate attributeName="opacity" dur="${2 + i * 0.5}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0;0.35;0" /><animate attributeName="cy" dur="${2 + i * 0.5}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="${py - 6 - i * 3};${py - 14 - i * 3}" /><animate attributeName="r" dur="${2 + i * 0.5}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="${0.8 + i * 0.4};${1.5 + i * 0.5}" /></circle>`;
            }
            // Fire burst from mouth — intermittent
            s += `<path d="M${px - 10} ${py - 5} L${px - 16} ${py - 7} L${px - 14} ${py - 4} L${px - 18} ${py - 5} L${px - 14} ${py - 3}" fill="#FF6D00" opacity="0"><animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;0;0;0.6;0.8;0.4;0;0" /></path>`;
            s += `<path d="M${px - 10} ${py - 4} L${px - 15} ${py - 5} L${px - 13} ${py - 3}" fill="#FFAB00" opacity="0"><animate attributeName="opacity" dur="4s" begin="0.1s" repeatCount="indefinite" values="0;0;0;0.4;0.6;0.3;0;0" /></path>`;
            // Green scale shimmer
            s += `<ellipse cx="${px - 1}" cy="${py - 4}" rx="6" ry="4" fill="#4CAF50" opacity="0.05"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.03;0.1;0.03" /></ellipse>`;
        } else if (petId === 'pet_cerberus') {
            // Dark aura under cerberus — larger, more ominous
            s += `<ellipse cx="${px - 2}" cy="${py + 5}" rx="16" ry="4" fill="#1a1a1a" opacity="0.2"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.12;0.3;0.12" /><animate attributeName="rx" dur="3s" repeatCount="indefinite" values="14;18;14" /></ellipse>`;
            // Red eye glow — all three heads
            for (let i = 0; i < 3; i++) {
                const offsets = [[-9, -6], [-5, -10], [-1, -7]];
                const [ox, oy] = offsets[i];
                s += `<circle cx="${px - 4 + ox}" cy="${py + 1 + oy}" r="3" fill="#E53935" opacity="0"><animate attributeName="opacity" dur="${1.8 + i * 0.3}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0;0.2;0" /></circle>`;
            }
            // Dark rising wisps — ominous prowl effect
            for (let i = 0; i < 4; i++) {
                const wx = px - 6 + i * 4;
                s += `<circle cx="${wx}" cy="${py + 3}" r="${0.6 + i * 0.2}" fill="#263238" opacity="0"><animate attributeName="opacity" dur="${2.5 + i * 0.4}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite" values="0;0.25;0" /><animate attributeName="cy" dur="${2.5 + i * 0.4}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite" values="${py + 3};${py - 5}" /></circle>`;
            }
            // Menacing growl indicator — pulsing red line under center head
            s += `<line x1="${px - 8}" y1="${py - 5}" x2="${px - 2}" y2="${py - 5}" stroke="#E53935" stroke-width="0.5" opacity="0"><animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;0;0.3;0.5;0.3;0;0;0" /></line>`;
        }

        return s;
    },

    // --- WINGS: Rendered BEHIND the creature body ---
    _renderWings(itemId, bp, type) {
        let s = '';
        const cx = bp.cx, ay = bp.armY, sw = bp.shoulderW, fy = bp.feetY, by = bp.bodyY, bh = bp.bodyH;

        // Detect current theme for wing visibility
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
            (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.getAttribute('data-theme') !== 'light');

        const wings = {
            wings_feather: { c1: '#E0E0E0', c2: '#BDBDBD', c3: '#F5F5F5', size: 1, animated: false },
            wings_bat: { c1: '#37474F', c2: '#263238', c3: '#546E7A', size: 1.1, animated: false },
            wings_flame: { c1: '#FF6D00', c2: '#E65100', c3: '#FFAB00', size: 1.2, animated: true },
            wings_crystal: { c1: '#80DEEA', c2: '#4DD0E1', c3: '#E0F7FA', size: 1.2, animated: true },
            // Shadow wings: lighter in dark mode for visibility
            wings_shadow: isDark
                ? { c1: '#424242', c2: '#333', c3: '#616161', size: 1.4, animated: true }
                : { c1: '#1a1a1a', c2: '#111', c3: '#333', size: 1.4, animated: true },
            // Angel wings: blue tint in light mode for visibility
            wings_angel: isDark
                ? { c1: '#FFFFFF', c2: '#F5F5F5', c3: '#FFF8E1', size: 1.5, animated: true, opacity: 0.45 }
                : { c1: '#E3F2FD', c2: '#BBDEFB', c3: '#E1F5FE', size: 1.5, animated: true, opacity: 0.55 },
            wings_divine: { c1: '#FFD700', c2: '#FF8F00', c3: '#FFF8E1', size: 1.6, animated: true }
        };
        const w = wings[itemId] || wings.wings_feather;
        const sz = w.size;
        const wingW = (sw + 10) * sz;
        const wingH = (bh + 15) * sz;
        const topY = ay - 8 * sz;
        const wOpacity = w.opacity || 0.85;

        // Left wing
        if (w.animated) {
            s += `<path fill="${w.c1}" opacity="${wOpacity}"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M${cx - sw + 1} ${ay} Q${cx - wingW - 2} ${topY} ${cx - wingW} ${ay - 2} Q${cx - wingW - 4} ${ay + wingH * 0.4} ${cx - wingW + 5} ${ay + wingH * 0.7} Q${cx - sw - 2} ${ay + wingH * 0.5} ${cx - sw + 1} ${ay + 5} Z;M${cx - sw + 1} ${ay} Q${cx - wingW - 5} ${topY - 3} ${cx - wingW - 3} ${ay - 4} Q${cx - wingW - 7} ${ay + wingH * 0.35} ${cx - wingW + 3} ${ay + wingH * 0.65} Q${cx - sw - 3} ${ay + wingH * 0.45} ${cx - sw + 1} ${ay + 5} Z;M${cx - sw + 1} ${ay} Q${cx - wingW - 2} ${topY} ${cx - wingW} ${ay - 2} Q${cx - wingW - 4} ${ay + wingH * 0.4} ${cx - wingW + 5} ${ay + wingH * 0.7} Q${cx - sw - 2} ${ay + wingH * 0.5} ${cx - sw + 1} ${ay + 5} Z" /></path>`;
        } else {
            s += `<path d="M${cx - sw + 1} ${ay} Q${cx - wingW - 2} ${topY} ${cx - wingW} ${ay - 2} Q${cx - wingW - 4} ${ay + wingH * 0.4} ${cx - wingW + 5} ${ay + wingH * 0.7} Q${cx - sw - 2} ${ay + wingH * 0.5} ${cx - sw + 1} ${ay + 5} Z" fill="${w.c1}" opacity="${wOpacity}" />`;
        }
        // Left wing inner
        s += `<path d="M${cx - sw + 2} ${ay + 1} Q${cx - wingW * 0.8} ${topY + 4} ${cx - wingW * 0.8} ${ay} Q${cx - wingW * 0.85} ${ay + wingH * 0.3} ${cx - wingW * 0.7} ${ay + wingH * 0.5} Q${cx - sw - 1} ${ay + wingH * 0.35} ${cx - sw + 2} ${ay + 4} Z" fill="${w.c2}" opacity="0.4" />`;
        // Left feather lines
        for (let i = 0; i < 4; i++) {
            const t = i / 4;
            const fx = cx - sw - (wingW - sw) * (0.3 + t * 0.5);
            const fy1 = topY + 3 + t * wingH * 0.25;
            const fy2 = ay + wingH * (0.1 + t * 0.15);
            s += `<line x1="${cx - sw + 1}" y1="${ay + 1 + i * 2}" x2="${fx}" y2="${(fy1 + fy2) / 2}" stroke="${w.c3}" stroke-width="0.5" opacity="0.4" />`;
        }

        // Right wing (mirrored)
        if (w.animated) {
            s += `<path fill="${w.c1}" opacity="${wOpacity}"><animate attributeName="d" dur="3s" repeatCount="indefinite" values="M${cx + sw - 1} ${ay} Q${cx + wingW + 2} ${topY} ${cx + wingW} ${ay - 2} Q${cx + wingW + 4} ${ay + wingH * 0.4} ${cx + wingW - 5} ${ay + wingH * 0.7} Q${cx + sw + 2} ${ay + wingH * 0.5} ${cx + sw - 1} ${ay + 5} Z;M${cx + sw - 1} ${ay} Q${cx + wingW + 5} ${topY - 3} ${cx + wingW + 3} ${ay - 4} Q${cx + wingW + 7} ${ay + wingH * 0.35} ${cx + wingW - 3} ${ay + wingH * 0.65} Q${cx + sw + 3} ${ay + wingH * 0.45} ${cx + sw - 1} ${ay + 5} Z;M${cx + sw - 1} ${ay} Q${cx + wingW + 2} ${topY} ${cx + wingW} ${ay - 2} Q${cx + wingW + 4} ${ay + wingH * 0.4} ${cx + wingW - 5} ${ay + wingH * 0.7} Q${cx + sw + 2} ${ay + wingH * 0.5} ${cx + sw - 1} ${ay + 5} Z" /></path>`;
        } else {
            s += `<path d="M${cx + sw - 1} ${ay} Q${cx + wingW + 2} ${topY} ${cx + wingW} ${ay - 2} Q${cx + wingW + 4} ${ay + wingH * 0.4} ${cx + wingW - 5} ${ay + wingH * 0.7} Q${cx + sw + 2} ${ay + wingH * 0.5} ${cx + sw - 1} ${ay + 5} Z" fill="${w.c1}" opacity="${wOpacity}" />`;
        }
        s += `<path d="M${cx + sw - 2} ${ay + 1} Q${cx + wingW * 0.8} ${topY + 4} ${cx + wingW * 0.8} ${ay} Q${cx + wingW * 0.85} ${ay + wingH * 0.3} ${cx + wingW * 0.7} ${ay + wingH * 0.5} Q${cx + sw + 1} ${ay + wingH * 0.35} ${cx + sw - 2} ${ay + 4} Z" fill="${w.c2}" opacity="0.4" />`;
        for (let i = 0; i < 4; i++) {
            const t = i / 4;
            const fx = cx + sw + (wingW - sw) * (0.3 + t * 0.5);
            const fy1 = topY + 3 + t * wingH * 0.25;
            const fy2 = ay + wingH * (0.1 + t * 0.15);
            s += `<line x1="${cx + sw - 1}" y1="${ay + 1 + i * 2}" x2="${fx}" y2="${(fy1 + fy2) / 2}" stroke="${w.c3}" stroke-width="0.5" opacity="0.4" />`;
        }

        // Special effects per wing type
        if (itemId === 'wings_flame') {
            // Fire particles along wing edges
            for (let i = 0; i < 5; i++) {
                const px = cx - wingW * 0.5 - i * 3;
                const py = topY + i * wingH * 0.15;
                s += `<circle cx="${px}" cy="${py}" r="1.5" fill="#FFAB00" opacity="0"><animate attributeName="opacity" dur="${1.2 + i * 0.2}s" repeatCount="indefinite" values="0;0.8;0" /></circle>`;
                s += `<circle cx="${cx * 2 - px}" cy="${py}" r="1.5" fill="#FFAB00" opacity="0"><animate attributeName="opacity" dur="${1.2 + i * 0.2}s" begin="0.3s" repeatCount="indefinite" values="0;0.8;0" /></circle>`;
            }
        } else if (itemId === 'wings_crystal') {
            // Crystal gleam lines
            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 3; i++) {
                    const gx = cx + side * (sw + 5 + i * 6);
                    const gy = ay - 2 + i * 5;
                    s += `<line x1="${gx}" y1="${gy}" x2="${gx + side * 4}" y2="${gy - 3}" stroke="#E0F7FA" stroke-width="0.8" opacity="0"><animate attributeName="opacity" dur="2s" begin="${i * 0.5}s" repeatCount="indefinite" values="0;0.7;0" /></line>`;
                }
            }
        } else if (itemId === 'wings_angel') {
            // Ethereal shimmer pulses across wing surface
            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 4; i++) {
                    const shimX = cx + side * (sw + 3 + i * 5);
                    const shimY = ay - 3 + i * 4;
                    s += `<ellipse cx="${shimX}" cy="${shimY}" rx="3" ry="1.5" fill="white" opacity="0"><animate attributeName="opacity" dur="${2 + i * 0.5}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite" values="0;0.25;0" /></ellipse>`;
                }
            }
            // Gentle glow at wing roots
            s += `<circle cx="${cx - sw}" cy="${ay}" r="4" fill="white" opacity="0.08"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.05;0.15;0.05" /></circle>`;
            s += `<circle cx="${cx + sw}" cy="${ay}" r="4" fill="white" opacity="0.08"><animate attributeName="opacity" dur="3s" begin="0.5s" repeatCount="indefinite" values="0.05;0.15;0.05" /></circle>`;
        } else if (itemId === 'wings_divine') {
            // Golden light rays from wings
            for (let i = 0; i < 6; i++) {
                const angle = -60 + i * 24;
                const rad = angle * Math.PI / 180;
                const len = wingW * 1.2;
                for (let side = -1; side <= 1; side += 2) {
                    const ox = cx + side * sw;
                    s += `<line x1="${ox}" y1="${ay}" x2="${ox + Math.cos(rad) * len * side}" y2="${ay + Math.sin(rad) * len}" stroke="#FFF8E1" stroke-width="0.6" opacity="0"><animate attributeName="opacity" dur="3s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0;0.4;0" /></line>`;
                }
            }
        }

        return s;
    },

    // --- AURAS: Classic circle-based energy around the creature ---
    _renderAura(itemId, bp, type, form) {
        let s = '';
        const cx = bp.cx;
        const hy = bp.headY, hr = bp.headR, sw = bp.shoulderW;
        const by = bp.bodyY, bh = bp.bodyH;
        const fy = bp.feetY, ay = bp.armY;

        const auras = {
            aura_mist:      { c1: '#B0BEC5', c2: '#78909C', c3: '#CFD8DC', c4: '#ECEFF1', particles: 10, speed: 5, pad: 10 },
            aura_wind:      { c1: '#81D4FA', c2: '#4FC3F7', c3: '#B3E5FC', c4: '#E1F5FE', particles: 12, speed: 3.5, pad: 12 },
            aura_fire:      { c1: '#FF6D00', c2: '#E65100', c3: '#FFAB00', c4: '#FFF3E0', particles: 14, speed: 2.5, pad: 14 },
            aura_lightning: { c1: '#FFEB3B', c2: '#FBC02D', c3: '#FFF9C4', c4: '#FFFDE7', particles: 14, speed: 1.8, pad: 14 },
            aura_shadow:    { c1: '#37474F', c2: '#263238', c3: '#546E7A', c4: '#1a1a2e', particles: 12, speed: 4, pad: 12 },
            aura_cosmos:    { c1: '#7C4DFF', c2: '#651FFF', c3: '#B388FF', c4: '#EDE7F6', particles: 16, speed: 5, pad: 16 },
            aura_divine:    { c1: '#FFD700', c2: '#FF8F00', c3: '#FFF8E1', c4: '#FFFDE7', particles: 18, speed: 4, pad: 20 }
        };
        const a = auras[itemId] || auras.aura_mist;
        const uid = 'au' + Math.random().toString(36).substr(2, 4);

        // Center on the creature's chest area (slightly above geometric center for better visual)
        const centerY = (hy + fy) / 2 - 2;
        const creatureHeight = (fy - hy + hr * 2) / 2;
        const creatureWidth = sw + 4;
        const r = Math.max(creatureHeight, creatureWidth) + a.pad;

        // === DEFS: Gradients & Filters ===
        s += `<defs>`;
        s += `<radialGradient id="${uid}g1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${a.c3}" stop-opacity="0.12"/><stop offset="50%" stop-color="${a.c1}" stop-opacity="0.06"/><stop offset="80%" stop-color="${a.c1}" stop-opacity="0.02"/><stop offset="100%" stop-color="${a.c1}" stop-opacity="0"/></radialGradient>`;
        s += `<radialGradient id="${uid}g2" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="${a.c3}" stop-opacity="0.15"/><stop offset="70%" stop-color="${a.c2}" stop-opacity="0.03"/><stop offset="100%" stop-color="${a.c2}" stop-opacity="0"/></radialGradient>`;
        s += `<filter id="${uid}blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>`;
        s += `<filter id="${uid}glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
        s += `</defs>`;

        // === Layer 1: Ambient glow field (soft background) ===
        s += `<ellipse cx="${cx}" cy="${centerY}" rx="${r + 6}" ry="${r + 3}" fill="url(#${uid}g1)" filter="url(#${uid}blur)"><animate attributeName="rx" dur="${a.speed * 1.5}s" repeatCount="indefinite" values="${r + 4};${r + 8};${r + 4}" /><animate attributeName="ry" dur="${a.speed * 1.3}s" repeatCount="indefinite" values="${r + 1};${r + 5};${r + 1}" /></ellipse>`;

        // === Layer 2: Pulsating inner glow ===
        s += `<ellipse cx="${cx}" cy="${centerY}" rx="${r - 2}" ry="${r - 4}" fill="url(#${uid}g2)"><animate attributeName="opacity" dur="${a.speed * 0.7}s" repeatCount="indefinite" values="0.3;0.6;0.3" /><animate attributeName="rx" dur="${a.speed * 0.9}s" repeatCount="indefinite" values="${r - 4};${r};${r - 4}" /></ellipse>`;

        // === Layer 3: Dynamic rotating ring ===
        s += `<ellipse cx="${cx}" cy="${centerY}" rx="${r}" ry="${r - 2}" fill="none" stroke="${a.c1}" stroke-width="1.2" opacity="0.25" stroke-dasharray="8 12 3 12"><animate attributeName="stroke-dashoffset" from="0" to="-70" dur="${a.speed}s" repeatCount="indefinite" /><animate attributeName="opacity" dur="${a.speed * 0.8}s" repeatCount="indefinite" values="0.15;0.35;0.15" /></ellipse>`;

        // === Layer 4: Counter-rotating inner ring ===
        s += `<ellipse cx="${cx}" cy="${centerY}" rx="${r - 6}" ry="${r - 8}" fill="none" stroke="${a.c2}" stroke-width="0.7" opacity="0.15" stroke-dasharray="5 8 2 10"><animate attributeName="stroke-dashoffset" from="0" to="50" dur="${a.speed * 1.2}s" repeatCount="indefinite" /><animate attributeName="opacity" dur="${a.speed}s" repeatCount="indefinite" values="0.1;0.25;0.1" /></ellipse>`;

        // === Layer 5: Orbiting energy particles (true orbital motion via animateMotion) ===
        const orbitCount = Math.min(a.particles, 12);
        for (let i = 0; i < orbitCount; i++) {
            const pSize = 0.6 + (i % 4) * 0.3;
            const orbitR = r - 3 + (i % 3) * 4;
            const orbitRy = orbitR - 2 - (i % 2) * 2;
            const dur = (a.speed * 0.8 + (i % 5) * 0.6).toFixed(1);
            const delay = (i * (a.speed / orbitCount)).toFixed(1);
            const col = i % 3 === 0 ? a.c3 : i % 3 === 1 ? a.c1 : a.c2;
            const startAngle = (i / orbitCount) * 360;
            // cx/cy set to center so particle isn't at 0,0 if animateMotion fails to start
            s += `<circle cx="${cx}" cy="${centerY}" r="${pSize}" fill="${col}" filter="url(#${uid}glow)" opacity="0">`;
            s += `<animateMotion dur="${dur}s" begin="${delay}s" repeatCount="indefinite" rotate="auto">`;
            s += `<mpath href="#${uid}orbit${i % 3}"/>`;
            s += `</animateMotion>`;
            s += `<animate attributeName="opacity" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" values="0.2;0.8;0.2" />`;
            s += `<animate attributeName="r" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" values="${(pSize * 0.4).toFixed(1)};${(pSize * 1.2).toFixed(1)};${(pSize * 0.4).toFixed(1)}" />`;
            s += `</circle>`;
        }
        // Orbit paths (hidden, used by animateMotion)
        for (let o = 0; o < 3; o++) {
            const oR = r - 3 + o * 4;
            const oRy = oR - 2 - o * 2;
            s += `<ellipse id="${uid}orbit${o}" cx="${cx}" cy="${centerY}" rx="${oR}" ry="${oRy}" fill="none" stroke="none" />`;
        }

        // === Layer 6: Rising energy wisps ===
        for (let i = 0; i < 6; i++) {
            const wx = cx - r * 0.6 + i * (r * 1.2 / 5);
            const wy = centerY + r * 0.3;
            const wh = r * 0.8 + (i % 3) * 4;
            const dur = (2 + i * 0.4).toFixed(1);
            const delay = (i * 0.35).toFixed(1);
            s += `<line x1="${wx.toFixed(1)}" y1="${wy.toFixed(1)}" x2="${(wx + (i % 2 === 0 ? 2 : -2)).toFixed(1)}" y2="${(wy - wh).toFixed(1)}" stroke="${a.c3}" stroke-width="0.6" opacity="0" stroke-linecap="round"><animate attributeName="opacity" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" values="0;0.4;0" /><animate attributeName="y2" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" values="${wy.toFixed(1)};${(wy - wh).toFixed(1)}" /></line>`;
        }

        // === TYPE-SPECIFIC DYNAMIC EFFECTS ===
        if (itemId === 'aura_fire') {
            // Flickering flame tongues rising around creature
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const fx = cx + Math.cos(angle) * (r * 0.85);
                const fy2 = centerY + Math.sin(angle) * (r * 0.8);
                const fh = 5 + (i % 3) * 3;
                const dur = (0.8 + i * 0.15).toFixed(2);
                s += `<path d="M${fx.toFixed(1)} ${fy2.toFixed(1)} Q${(fx + (i % 2 ? 2 : -2)).toFixed(1)} ${(fy2 - fh / 2).toFixed(1)} ${fx.toFixed(1)} ${(fy2 - fh).toFixed(1)}" fill="none" stroke="${i % 2 ? a.c3 : a.c1}" stroke-width="${0.8 + (i % 2) * 0.4}" stroke-linecap="round" opacity="0"><animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" values="0;0.7;0.3;0.8;0" /><animate attributeName="d" dur="${dur}s" repeatCount="indefinite" values="M${fx.toFixed(1)} ${fy2.toFixed(1)} Q${(fx + 2).toFixed(1)} ${(fy2 - fh / 2).toFixed(1)} ${fx.toFixed(1)} ${(fy2 - fh).toFixed(1)};M${fx.toFixed(1)} ${fy2.toFixed(1)} Q${(fx - 2).toFixed(1)} ${(fy2 - fh / 2 - 2).toFixed(1)} ${(fx + 1).toFixed(1)} ${(fy2 - fh - 2).toFixed(1)};M${fx.toFixed(1)} ${fy2.toFixed(1)} Q${(fx + 2).toFixed(1)} ${(fy2 - fh / 2).toFixed(1)} ${fx.toFixed(1)} ${(fy2 - fh).toFixed(1)}" /></path>`;
            }
            // Heat shimmer distortion ring
            s += `<ellipse cx="${cx}" cy="${centerY - r * 0.2}" rx="${r * 0.6}" ry="${r * 0.15}" fill="${a.c3}" opacity="0.05"><animate attributeName="ry" dur="1.5s" repeatCount="indefinite" values="${r * 0.12};${r * 0.2};${r * 0.12}" /><animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0.03;0.08;0.03" /></ellipse>`;

        } else if (itemId === 'aura_lightning') {
            // Dynamic lightning bolts that flash randomly
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 4;
                const x1 = cx + Math.cos(angle) * (r * 0.3);
                const y1 = centerY + Math.sin(angle) * (r * 0.25);
                const x2 = cx + Math.cos(angle) * (r + 3);
                const y2 = centerY + Math.sin(angle) * (r + 1);
                const mx1 = x1 + (x2 - x1) * 0.3 + (i % 2 === 0 ? 4 : -4);
                const my1 = y1 + (y2 - y1) * 0.3 + (i % 3 === 0 ? 3 : -2);
                const mx2 = x1 + (x2 - x1) * 0.65 + (i % 2 === 0 ? -3 : 3);
                const my2 = y1 + (y2 - y1) * 0.65;
                s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${mx1.toFixed(1)} ${my1.toFixed(1)} L${mx2.toFixed(1)} ${my2.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="#FDD835" stroke-width="1.2" stroke-linecap="round" opacity="0" filter="url(#${uid}glow)"><animate attributeName="opacity" dur="${1.5 + i * 0.5}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0;0;0;0.9;0;0;0;0.7;0;0" /></path>`;
                // Branch bolt
                s += `<path d="M${mx1.toFixed(1)} ${my1.toFixed(1)} L${(mx1 + (i % 2 ? 5 : -5)).toFixed(1)} ${(my1 + 4).toFixed(1)}" fill="none" stroke="#FFF9C4" stroke-width="0.7" opacity="0"><animate attributeName="opacity" dur="${1.5 + i * 0.5}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0;0;0;0.6;0;0;0;0.4;0;0" /></path>`;
            }
            // Electric arc sparks at aura edge
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
                const sx = cx + Math.cos(angle) * r;
                const sy = centerY + Math.sin(angle) * (r - 2);
                s += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="1.5" fill="#FFEB3B" filter="url(#${uid}glow)" opacity="0"><animate attributeName="opacity" dur="${0.3 + i * 0.1}s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite" values="0;0.9;0" /><animate attributeName="r" dur="${0.3 + i * 0.1}s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite" values="0.5;2;0.5" /></circle>`;
            }

        } else if (itemId === 'aura_cosmos') {
            // Orbiting star constellation points
            for (let i = 0; i < 7; i++) {
                const angle = (i / 7) * Math.PI * 2;
                const sr = r * (0.6 + (i % 3) * 0.15);
                const sx = cx + Math.cos(angle) * sr;
                const sy = centerY + Math.sin(angle) * (sr - 2);
                const sz = 1 + (i % 3) * 0.5;
                // 4-point star
                s += `<polygon points="${sx},${sy - sz} ${sx + sz * 0.3},${sy - sz * 0.3} ${sx + sz},${sy} ${sx + sz * 0.3},${sy + sz * 0.3} ${sx},${sy + sz} ${sx - sz * 0.3},${sy + sz * 0.3} ${sx - sz},${sy} ${sx - sz * 0.3},${sy - sz * 0.3}" fill="${i % 2 ? '#B388FF' : '#E1BEE7'}" filter="url(#${uid}glow)" opacity="0.2"><animate attributeName="opacity" dur="${2 + i * 0.5}s" repeatCount="indefinite" values="0.1;0.9;0.1" /><animateTransform attributeName="transform" type="rotate" from="0 ${sx.toFixed(1)} ${sy.toFixed(1)}" to="360 ${sx.toFixed(1)} ${sy.toFixed(1)}" dur="${6 + i * 2}s" repeatCount="indefinite" /></polygon>`;
            }
            // Nebula swirl paths
            for (let i = 0; i < 3; i++) {
                const startA = (i / 3) * Math.PI * 2;
                const midA = startA + Math.PI * 0.5;
                const endA = startA + Math.PI;
                const x1 = cx + Math.cos(startA) * r * 0.7, y1 = centerY + Math.sin(startA) * r * 0.65;
                const xm = cx + Math.cos(midA) * r * 0.9, ym = centerY + Math.sin(midA) * r * 0.85;
                const x2 = cx + Math.cos(endA) * r * 0.5, y2 = centerY + Math.sin(endA) * r * 0.45;
                s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${xm.toFixed(1)} ${ym.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${i % 2 ? '#B388FF' : '#7C4DFF'}" stroke-width="0.5" opacity="0" stroke-dasharray="3 5"><animate attributeName="opacity" dur="${3 + i}s" repeatCount="indefinite" values="0;0.3;0" /><animate attributeName="stroke-dashoffset" from="0" to="-30" dur="${2 + i * 0.5}s" repeatCount="indefinite" /></path>`;
            }

        } else if (itemId === 'aura_divine') {
            // Radiating light rays that pulse outward
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const x1 = cx + Math.cos(angle) * (r * 0.7);
                const y1 = centerY + Math.sin(angle) * (r * 0.65);
                const x2 = cx + Math.cos(angle) * (r + 8);
                const y2 = centerY + Math.sin(angle) * (r + 6);
                s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#FFF8E1" stroke-width="${0.4 + (i % 3) * 0.2}" stroke-linecap="round" opacity="0"><animate attributeName="opacity" dur="${2.5 + (i % 4) * 0.3}s" begin="${(i * 0.2).toFixed(1)}s" repeatCount="indefinite" values="0;0.35;0.1;0.3;0" /></line>`;
            }
            // Halo above head — elegant arc with glow
            const haloY = hy - hr - 6;
            s += `<path d="M${cx - hr - 4} ${haloY + 1} Q${cx} ${haloY - 7} ${cx + hr + 4} ${haloY + 1}" fill="none" stroke="#FFD700" stroke-width="1.5" filter="url(#${uid}glow)" opacity="0.5"><animate attributeName="opacity" dur="2.5s" repeatCount="indefinite" values="0.3;0.7;0.3" /></path>`;
            // Inner halo
            s += `<path d="M${cx - hr - 1} ${haloY + 1} Q${cx} ${haloY - 4} ${cx + hr + 1} ${haloY + 1}" fill="none" stroke="#FFF8E1" stroke-width="0.6" opacity="0.3"><animate attributeName="opacity" dur="2s" begin="0.5s" repeatCount="indefinite" values="0.2;0.5;0.2" /></path>`;
            // Golden sparkle bursts
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const gx = cx + Math.cos(angle) * (r * 0.7);
                const gy = centerY + Math.sin(angle) * (r * 0.65);
                s += `<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="1.2" fill="#FFD700" filter="url(#${uid}glow)" opacity="0"><animate attributeName="opacity" dur="${1.5 + i * 0.4}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite" values="0;0.8;0" /><animate attributeName="r" dur="${1.5 + i * 0.4}s" begin="${(i * 0.4).toFixed(1)}s" repeatCount="indefinite" values="0.3;2;0.3" /></circle>`;
            }

        } else if (itemId === 'aura_shadow') {
            // Dark tendrils rising and curling
            for (let i = 0; i < 6; i++) {
                const tx = cx - r * 0.5 + i * (r / 3);
                const ty = centerY + r * 0.4;
                const th = r * 0.7 + (i % 3) * 5;
                const curl = (i % 2 === 0 ? 6 : -6);
                const dur = (2.5 + i * 0.4).toFixed(1);
                s += `<path d="M${tx.toFixed(1)} ${ty.toFixed(1)} Q${(tx + curl).toFixed(1)} ${(ty - th * 0.4).toFixed(1)} ${(tx - curl * 0.5).toFixed(1)} ${(ty - th).toFixed(1)}" fill="none" stroke="${i % 2 ? a.c1 : a.c2}" stroke-width="${0.8 + (i % 2) * 0.4}" stroke-linecap="round" opacity="0"><animate attributeName="opacity" dur="${dur}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0;0.35;0.15;0.3;0" /><animate attributeName="d" dur="${dur}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="M${tx.toFixed(1)} ${ty.toFixed(1)} Q${(tx + curl).toFixed(1)} ${(ty - th * 0.4).toFixed(1)} ${(tx - curl * 0.5).toFixed(1)} ${(ty - th).toFixed(1)};M${tx.toFixed(1)} ${ty.toFixed(1)} Q${(tx - curl).toFixed(1)} ${(ty - th * 0.5).toFixed(1)} ${(tx + curl * 0.3).toFixed(1)} ${(ty - th - 3).toFixed(1)};M${tx.toFixed(1)} ${ty.toFixed(1)} Q${(tx + curl).toFixed(1)} ${(ty - th * 0.4).toFixed(1)} ${(tx - curl * 0.5).toFixed(1)} ${(ty - th).toFixed(1)}" /></path>`;
            }
            // Dark vortex spiral at feet
            s += `<ellipse cx="${cx}" cy="${fy + 2}" rx="${r * 0.5}" ry="${r * 0.12}" fill="${a.c2}" opacity="0.1" stroke="${a.c1}" stroke-width="0.5" stroke-dasharray="3 5"><animate attributeName="stroke-dashoffset" from="0" to="-30" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.05;0.15;0.05" /></ellipse>`;

        } else if (itemId === 'aura_wind') {
            // Swirling wind arcs that rotate
            for (let i = 0; i < 4; i++) {
                const startA = (i / 4) * Math.PI * 2;
                const sweep = Math.PI * 0.7;
                const arc_r = r * (0.7 + (i % 2) * 0.2);
                const x1 = cx + Math.cos(startA) * arc_r;
                const y1 = centerY + Math.sin(startA) * (arc_r - 2);
                const x2 = cx + Math.cos(startA + sweep) * arc_r;
                const y2 = centerY + Math.sin(startA + sweep) * (arc_r - 2);
                s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${arc_r.toFixed(0)} ${(arc_r - 2).toFixed(0)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${i % 2 ? a.c1 : a.c3}" stroke-width="${0.6 + (i % 2) * 0.3}" stroke-linecap="round" opacity="0" stroke-dasharray="6 4"><animate attributeName="opacity" dur="${2.5 + i * 0.4}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite" values="0;0.4;0.15;0.35;0" /><animate attributeName="stroke-dashoffset" from="0" to="${i % 2 ? -20 : 20}" dur="${1.5 + i * 0.3}s" repeatCount="indefinite" /></path>`;
            }
            // Leaf-like particles caught in wind
            for (let i = 0; i < 3; i++) {
                const lx = cx - r * 0.4 + i * r * 0.4;
                const ly = centerY + (i - 1) * r * 0.3;
                s += `<path d="M${lx.toFixed(1)} ${ly.toFixed(1)} Q${(lx + 2).toFixed(1)} ${(ly - 1).toFixed(1)} ${(lx + 3).toFixed(1)} ${ly.toFixed(1)}" fill="${a.c1}" opacity="0"><animate attributeName="opacity" dur="${2 + i * 0.5}s" begin="${(i * 0.7).toFixed(1)}s" repeatCount="indefinite" values="0;0.5;0" /><animate attributeName="transform" type="translate" dur="${2 + i * 0.5}s" begin="${(i * 0.7).toFixed(1)}s" repeatCount="indefinite" values="0 0;${8 + i * 3} ${-4 - i * 2}" /></path>`;
            }

        } else if (itemId === 'aura_mist') {
            // Drifting fog wisps
            for (let i = 0; i < 5; i++) {
                const mx = cx - r * 0.6 + i * (r * 0.3);
                const my = centerY + r * 0.1 + (i % 2) * r * 0.3;
                const mw = r * 0.4 + (i % 3) * 4;
                const mh = r * 0.08 + (i % 2) * 2;
                s += `<ellipse cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" rx="${mw.toFixed(1)}" ry="${mh.toFixed(1)}" fill="${a.c3}" opacity="0"><animate attributeName="opacity" dur="${3 + i * 0.6}s" begin="${(i * 0.5).toFixed(1)}s" repeatCount="indefinite" values="0;0.15;0.05;0.12;0" /><animate attributeName="cx" dur="${3 + i * 0.6}s" begin="${(i * 0.5).toFixed(1)}s" repeatCount="indefinite" values="${mx.toFixed(1)};${(mx + (i % 2 ? 5 : -5)).toFixed(1)};${mx.toFixed(1)}" /></ellipse>`;
            }
        }

        return s;
    },

    // Helper: get points around the body contour for particle placement
    _getBodyContourPoints(bp, offset) {
        const cx = bp.cx, hr = bp.headR, hy = bp.headY, sw = bp.shoulderW;
        const by = bp.bodyY, bh = bp.bodyH, fy = bp.feetY, ay = bp.armY, ny = bp.neckY;
        const pts = [];
        // Head top
        pts.push([cx, hy - hr - offset]);
        // Head sides
        pts.push([cx - hr - offset, hy]);
        pts.push([cx + hr + offset, hy]);
        // Shoulders
        pts.push([cx - sw - offset, ay]);
        pts.push([cx + sw + offset, ay]);
        // Mid body sides
        pts.push([cx - sw - offset, by]);
        pts.push([cx + sw + offset, by]);
        // Lower body
        pts.push([cx - sw - offset + 2, by + bh * 0.5]);
        pts.push([cx + sw + offset - 2, by + bh * 0.5]);
        // Legs
        pts.push([cx - sw * 0.4 - offset, fy]);
        pts.push([cx + sw * 0.4 + offset, fy]);
        // Arms
        pts.push([cx - sw - offset - 2, ay + bp.armThick]);
        pts.push([cx + sw + offset + 2, ay + bp.armThick]);
        return pts;
    },


    // --- PETS: Detailed companions with angular Gen 1-3 style + idle animations ---
    _renderPet(itemId, bp) {
        let s = '';
        const px = bp.cx + bp.shoulderW + 12;
        const py = bp.feetY - 3;
        const sc = (0.7 + bp.scale * 0.2).toFixed(2);

        // Movement animations: ground pets walk back & forth, flying pets bob
        const flyingPets = ['pet_bird', 'pet_eagle', 'pet_phoenix', 'pet_dragon'];
        const isFlying = flyingPets.includes(itemId);
        const moveAnim = isFlying
            ? `<animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0;0,3;0,0" dur="3s" repeatCount="indefinite" additive="sum" />`
            : `<animateTransform attributeName="transform" type="translate" values="0,0;6,0;0,0;-6,0;0,0" dur="4s" repeatCount="indefinite" additive="sum" />`;

        const pets = {
            // === MOUSE: Cute round mouse with soft ears, twitching whiskers ===
            pet_mouse: () => {
                s += `<g transform="translate(${px},${py}) scale(${sc})">${moveAnim}`;
                // Body — soft rounded
                s += `<ellipse cx="0" cy="0" rx="6" ry="4.5" fill="#9E9E9E" />`;
                s += `<ellipse cx="0" cy="1" rx="4.5" ry="3" fill="#BDBDBD" />`;
                // Head
                s += `<ellipse cx="-7" cy="-1" rx="4" ry="3.5" fill="#BDBDBD" />`;
                // Ears — round, pink inner
                s += `<ellipse cx="-9" cy="-5" rx="2.5" ry="3" fill="#B0B0B0" />`;
                s += `<ellipse cx="-9" cy="-5" rx="1.5" ry="2" fill="#F8BBD0" opacity="0.7" />`;
                s += `<ellipse cx="-5" cy="-5" rx="2.5" ry="3" fill="#B0B0B0" />`;
                s += `<ellipse cx="-5" cy="-5" rx="1.5" ry="2" fill="#F8BBD0" opacity="0.7" />`;
                // Eyes — small, cute
                s += `<circle cx="-8.5" cy="-1.5" r="1" fill="#333" />`;
                s += `<circle cx="-8.5" cy="-2" r="0.4" fill="white" />`;
                // Nose
                s += `<ellipse cx="-11" cy="0" rx="0.8" ry="0.6" fill="#E91E63" />`;
                // Whiskers — animated
                s += `<line x1="-11" y1="-0.5" x2="-15" y2="-2" stroke="#888" stroke-width="0.3"><animate attributeName="x2" dur="1.5s" repeatCount="indefinite" values="-15;-15.5;-15" /></line>`;
                s += `<line x1="-11" y1="0.5" x2="-15" y2="1.5" stroke="#888" stroke-width="0.3"><animate attributeName="x2" dur="1.8s" repeatCount="indefinite" values="-15;-15.5;-15" /></line>`;
                // Tail — curly
                s += `<path d="M6 0 Q10 -4 12 -1 Q13 1 11 2" fill="none" stroke="#9E9E9E" stroke-width="1" stroke-linecap="round"><animate attributeName="d" dur="2s" repeatCount="indefinite" values="M6 0 Q10 -4 12 -1 Q13 1 11 2;M6 0 Q10 -5 13 -2 Q14 0 12 2;M6 0 Q10 -4 12 -1 Q13 1 11 2" /></path>`;
                // Feet
                s += `<ellipse cx="-3" cy="4" rx="1.5" ry="1" fill="#BDBDBD" />`;
                s += `<ellipse cx="2" cy="4" rx="1.5" ry="1" fill="#BDBDBD" />`;
                s += `</g>`;
            },

            // === BIRD: Elegant songbird with smooth curves, flapping wings ===
            pet_bird: () => {
                const by = py - 14;
                s += `<g transform="translate(${px},${by}) scale(${sc})">${moveAnim}`;
                // Body
                s += `<ellipse cx="0" cy="0" rx="5" ry="4" fill="#42A5F5" />`;
                s += `<ellipse cx="0" cy="1" rx="3.5" ry="2.5" fill="#90CAF9" />`;
                // Head
                s += `<circle cx="-5" cy="-3" r="3.5" fill="#64B5F6" />`;
                s += `<circle cx="-5" cy="-3" r="2.5" fill="#90CAF9" />`;
                // Eye
                s += `<circle cx="-5.5" cy="-3.5" r="1.1" fill="white" />`;
                s += `<circle cx="-5.5" cy="-3.5" r="0.6" fill="#333" />`;
                s += `<circle cx="-5.8" cy="-3.8" r="0.25" fill="white" />`;
                // Beak
                s += `<path d="M-8.5 -3 L-11 -2.5 L-8.5 -2" fill="#FF8F00" />`;
                // Crest
                s += `<path d="M-4 -6 L-3 -9 L-2 -6" fill="#1E88E5" />`;
                s += `<path d="M-5.5 -6 L-5 -8 L-4 -6" fill="#1565C0" />`;
                // Wing — animated flap
                s += `<path fill="#1E88E5" opacity="0.9"><animate attributeName="d" dur="0.8s" repeatCount="indefinite" values="M0 -2 Q4 -5 7 -4 Q8 -2 6 0 L3 1;M0 -2 Q4 -7 8 -6 Q9 -3 7 -1 L3 1;M0 -2 Q4 -5 7 -4 Q8 -2 6 0 L3 1" /></path>`;
                // Tail
                s += `<path d="M5 0 Q8 -1 9 0 Q10 2 8 3 L5 2" fill="#1565C0" />`;
                // Legs
                s += `<line x1="-2" y1="4" x2="-2" y2="6.5" stroke="#FF8F00" stroke-width="1" />`;
                s += `<line x1="1" y1="4" x2="1" y2="6.5" stroke="#FF8F00" stroke-width="1" />`;
                s += `<path d="M-3.5 6.5 L-2 6.5 L-0.5 6.5" stroke="#FF8F00" stroke-width="0.8" fill="none" />`;
                s += `<path d="M-0.5 6.5 L1 6.5 L2.5 6.5" stroke="#FF8F00" stroke-width="0.8" fill="none" />`;
                s += `</g>`;
            },

            // === WOLF: Noble wolf with refined silhouette, glowing amber eyes ===
            pet_wolf: () => {
                s += `<g transform="translate(${px},${py}) scale(${sc})">${moveAnim}`;
                // Body — sleek
                s += `<ellipse cx="0" cy="0" rx="8" ry="5" fill="#607D8B" />`;
                s += `<ellipse cx="-1" cy="1" rx="6" ry="3.5" fill="#78909C" />`;
                // Head
                s += `<ellipse cx="-10" cy="-2" rx="4.5" ry="3.5" fill="#78909C" />`;
                s += `<path d="M-14 -2 Q-15 -2.5 -14.5 -1.5" fill="#546E7A" />`;
                // Muzzle
                s += `<ellipse cx="-13.5" cy="-1" rx="2" ry="1.5" fill="#90A4AE" />`;
                s += `<ellipse cx="-15" cy="-1.2" rx="0.8" ry="0.6" fill="#333" />`;
                // Ears — pointed, elegant
                s += `<path d="M-9 -5 L-10.5 -10 L-7.5 -6" fill="#607D8B" />`;
                s += `<path d="M-9.5 -6 L-10 -9 L-8.5 -6.5" fill="#90A4AE" opacity="0.5" />`;
                s += `<path d="M-7 -5 L-7.5 -10 L-5.5 -6" fill="#607D8B" />`;
                s += `<path d="M-7 -6 L-7.2 -9 L-6 -6.5" fill="#90A4AE" opacity="0.5" />`;
                // Eyes — amber glow
                s += `<ellipse cx="-9.5" cy="-3" rx="1.2" ry="0.9" fill="#FFC107" />`;
                s += `<ellipse cx="-9.5" cy="-3" rx="0.4" ry="0.7" fill="#333" />`;
                s += `<ellipse cx="-9.5" cy="-3" rx="1.8" ry="1.3" fill="#FFC107" opacity="0.15"><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.1;0.25;0.1" /></ellipse>`;
                // Legs
                s += `<path d="M-4 4 L-5 8 L-3 8 L-2 5" fill="#607D8B" />`;
                s += `<path d="M-1 4 L-2 8 L0 8 L1 5" fill="#607D8B" />`;
                s += `<path d="M4 3 L3 8 L5 8 L6 4" fill="#607D8B" />`;
                // Paws
                s += `<ellipse cx="-4" cy="8" rx="1.5" ry="0.8" fill="#546E7A" />`;
                s += `<ellipse cx="-1" cy="8" rx="1.5" ry="0.8" fill="#546E7A" />`;
                s += `<ellipse cx="4" cy="8" rx="1.5" ry="0.8" fill="#546E7A" />`;
                // Tail — bushy, animated
                s += `<path fill="#78909C"><animate attributeName="d" dur="2.5s" repeatCount="indefinite" values="M7 -1 Q10 -4 12 -2 Q13 0 11 2 L8 1;M7 -1 Q10 -5 13 -3 Q14 -1 12 2 L8 1;M7 -1 Q10 -4 12 -2 Q13 0 11 2 L8 1" /></path>`;
                s += `<path fill="#90A4AE" opacity="0.5"><animate attributeName="d" dur="2.5s" repeatCount="indefinite" values="M8 0 Q10 -3 11 -1 L10 1;M8 0 Q10 -4 12 -2 L11 1;M8 0 Q10 -3 11 -1 L10 1" /></path>`;
                s += `</g>`;
            },

            // === PHOENIX: Majestic fire bird, elegant flame plumage ===
            pet_phoenix: () => {
                const by = py - 16;
                s += `<g transform="translate(${px - 2},${by}) scale(${sc})">${moveAnim}`;
                // Body — warm gradient shape
                s += `<ellipse cx="0" cy="0" rx="5" ry="4.5" fill="#FF6D00" />`;
                s += `<ellipse cx="0" cy="0.5" rx="3.5" ry="3" fill="#FFAB00" />`;
                // Head
                s += `<circle cx="-5" cy="-4" r="3.5" fill="#FFAB00" />`;
                s += `<circle cx="-5" cy="-4" r="2.5" fill="#FFD54F" />`;
                // Eyes — deep ember
                s += `<circle cx="-5.5" cy="-4.5" r="1" fill="#BF360C" />`;
                s += `<circle cx="-5.5" cy="-4.5" r="0.4" fill="#FFE082" />`;
                // Beak
                s += `<path d="M-8.5 -3.5 L-10.5 -3 L-8.5 -2.5" fill="#E65100" />`;
                // Fire crest — animated flames
                s += `<path fill="#FF6D00"><animate attributeName="d" dur="0.6s" repeatCount="indefinite" values="M-4 -7 L-3 -12 L-2 -7;M-4 -7 L-3 -13 L-2 -7;M-4 -7 L-3 -12 L-2 -7" /></path>`;
                s += `<path fill="#FFAB00"><animate attributeName="d" dur="0.5s" repeatCount="indefinite" values="M-6 -6.5 L-5.5 -10.5 L-4.5 -6.5;M-6 -6.5 L-5.5 -11.5 L-4.5 -6.5;M-6 -6.5 L-5.5 -10.5 L-4.5 -6.5" /></path>`;
                s += `<path fill="#FFD54F" opacity="0.8"><animate attributeName="d" dur="0.7s" repeatCount="indefinite" values="M-2 -6.5 L-1 -9.5 L0 -6;M-2 -6.5 L-1 -10.5 L0 -6;M-2 -6.5 L-1 -9.5 L0 -6" /></path>`;
                // Wing — animated with flame tips
                s += `<path fill="#E65100" opacity="0.9"><animate attributeName="d" dur="1.2s" repeatCount="indefinite" values="M1 -2 Q5 -7 8 -5 Q9 -2 7 0 L4 1;M1 -2 Q5 -9 9 -7 Q10 -3 8 -1 L4 1;M1 -2 Q5 -7 8 -5 Q9 -2 7 0 L4 1" /></path>`;
                s += `<path fill="#FFAB00" opacity="0.6"><animate attributeName="d" dur="0.5s" repeatCount="indefinite" values="M8 -5 L10 -8 L9 -4;M8 -5 L11 -9 L9 -4;M8 -5 L10 -8 L9 -4" /></path>`;
                // Flame tail — flowing
                s += `<path fill="#FF6D00" opacity="0.85"><animate attributeName="d" dur="0.7s" repeatCount="indefinite" values="M5 1 Q8 3 10 1 Q11 -1 9 4 L5 3;M5 1 Q8 4 11 2 Q12 0 10 5 L5 3;M5 1 Q8 3 10 1 Q11 -1 9 4 L5 3" /></path>`;
                s += `<path fill="#FFAB00" opacity="0.5"><animate attributeName="d" dur="0.6s" repeatCount="indefinite" values="M5 2 Q7 5 9 3 Q10 1 8 6 L5 4;M5 2 Q7 6 10 4 Q11 2 9 7 L5 4;M5 2 Q7 5 9 3 Q10 1 8 6 L5 4" /></path>`;
                // Legs
                s += `<line x1="-2" y1="4" x2="-2" y2="7" stroke="#E65100" stroke-width="1" />`;
                s += `<line x1="1" y1="4" x2="1" y2="7" stroke="#E65100" stroke-width="1" />`;
                // Ember particles
                s += `<circle cx="7" cy="-3" r="0.6" fill="#FFAB00" opacity="0"><animate attributeName="opacity" dur="1s" repeatCount="indefinite" values="0;0.8;0" /><animate attributeName="cy" dur="1s" repeatCount="indefinite" values="-3;-9" /></circle>`;
                s += `<circle cx="9" cy="1" r="0.5" fill="#FF6D00" opacity="0"><animate attributeName="opacity" dur="1.3s" begin="0.3s" repeatCount="indefinite" values="0;0.6;0" /><animate attributeName="cy" dur="1.3s" begin="0.3s" repeatCount="indefinite" values="1;-6" /></circle>`;
                s += `</g>`;
            },

            // === DRAGON: Compact but detailed dragon, visible scales, membranous wings ===
            pet_dragon: () => {
                const by = py - 8;
                s += `<g transform="translate(${px - 3},${by}) scale(${sc})">${moveAnim}`;
                // Body — muscular
                s += `<ellipse cx="0" cy="0" rx="7" ry="5" fill="#388E3C" />`;
                s += `<ellipse cx="0" cy="0.5" rx="5" ry="3.5" fill="#4CAF50" />`;
                // Scales pattern
                s += `<path d="M-3 -2 Q-2 -3 -1 -2 Q0 -1 -1 0" fill="none" stroke="#2E7D32" stroke-width="0.5" opacity="0.5" />`;
                s += `<path d="M0 -1 Q1 -2 2 -1 Q3 0 2 1" fill="none" stroke="#2E7D32" stroke-width="0.5" opacity="0.5" />`;
                s += `<path d="M-2 1 Q-1 0 0 1 Q1 2 0 3" fill="none" stroke="#2E7D32" stroke-width="0.5" opacity="0.5" />`;
                // Head
                s += `<ellipse cx="-9" cy="-3" rx="4" ry="3.5" fill="#4CAF50" />`;
                s += `<ellipse cx="-11.5" cy="-2.5" rx="2" ry="1.5" fill="#66BB6A" />`;
                // Horns
                s += `<path d="M-7.5 -6 L-8.5 -11 L-6.5 -7" fill="#5D4037" />`;
                s += `<path d="M-5.5 -6 L-6 -10 L-4.5 -7" fill="#5D4037" />`;
                // Eye — reptilian slit
                s += `<ellipse cx="-8" cy="-4" rx="1.2" ry="1" fill="#FFEB3B" />`;
                s += `<ellipse cx="-8" cy="-4" rx="0.3" ry="0.9" fill="#333" />`;
                // Nostril smoke
                s += `<circle cx="-13" cy="-2" r="0.5" fill="#9E9E9E" opacity="0"><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0;0.4;0" /><animate attributeName="cy" dur="2s" repeatCount="indefinite" values="-2;-5" /><animate attributeName="r" dur="2s" repeatCount="indefinite" values="0.5;1.5" /></circle>`;
                // Wings — membranous, animated
                s += `<path fill="#2E7D32" opacity="0.85"><animate attributeName="d" dur="1.5s" repeatCount="indefinite" values="M-1 -4 Q4 -10 8 -8 Q10 -5 8 -3 L4 -2;M-1 -4 Q4 -12 9 -10 Q11 -6 9 -3 L4 -2;M-1 -4 Q4 -10 8 -8 Q10 -5 8 -3 L4 -2" /></path>`;
                // Wing veins
                s += `<line x1="1" y1="-5" x2="6" y2="-8" stroke="#1B5E20" stroke-width="0.3" opacity="0.5" />`;
                s += `<line x1="2" y1="-4" x2="7" y2="-6" stroke="#1B5E20" stroke-width="0.3" opacity="0.5" />`;
                // Dorsal spikes
                s += `<path d="M-5 -5 L-4 -7.5 L-3 -5" fill="#2E7D32" />`;
                s += `<path d="M-2 -5 L-1 -7 L0 -5" fill="#2E7D32" />`;
                s += `<path d="M1 -4.5 L2 -6.5 L3 -4.5" fill="#2E7D32" />`;
                // Tail — sinuous, animated
                s += `<path fill="#388E3C"><animate attributeName="d" dur="2.5s" repeatCount="indefinite" values="M6 1 Q10 2 12 0 Q14 -2 13 1 L11 2;M6 1 Q10 3 13 1 Q15 -1 14 2 L12 3;M6 1 Q10 2 12 0 Q14 -2 13 1 L11 2" /></path>`;
                s += `<path fill="#2E7D32"><animate attributeName="d" dur="2.5s" repeatCount="indefinite" values="M12 0 L15 -2 L13 1;M13 1 L16 -1 L14 2;M12 0 L15 -2 L13 1" /></path>`;
                // Legs with claws
                s += `<path d="M-3 4 L-4 7 L-2 7 L-1 5" fill="#388E3C" />`;
                s += `<path d="M2 4 L1 7 L3 7 L4 5" fill="#388E3C" />`;
                s += `<path d="M-4 7 L-5 8 M-3 7 L-3 8 M-2 7 L-1 8" fill="none" stroke="#5D4037" stroke-width="0.4" />`;
                s += `<path d="M1 7 L0 8 M2 7 L2 8 M3 7 L4 8" fill="none" stroke="#5D4037" stroke-width="0.4" />`;
                s += `</g>`;
            },

            // === CERBERUS: Three-headed dark hound, powerful stance, glowing red eyes ===
            pet_cerberus: () => {
                s += `<g transform="translate(${px - 4},${py + 1}) scale(${sc})">${moveAnim}`;
                // Body — massive
                s += `<ellipse cx="0" cy="0" rx="9" ry="5.5" fill="#37474F" />`;
                s += `<ellipse cx="0" cy="0.5" rx="7" ry="4" fill="#455A64" />`;
                // Spine ridges
                s += `<path d="M-4 -5.5 L-3 -7 L-2 -5.5" fill="#263238" />`;
                s += `<path d="M-1 -5.5 L0 -7 L1 -5.5" fill="#263238" />`;
                s += `<path d="M2 -5 L3 -6.5 L4 -5" fill="#263238" />`;
                // LEFT HEAD — tilted left
                s += `<ellipse cx="-10" cy="-5" rx="3.5" ry="3" fill="#455A64" />`;
                s += `<ellipse cx="-12" cy="-4.5" rx="2" ry="1.5" fill="#546E7A" />`;
                s += `<circle cx="-9.5" cy="-6" r="1" fill="#E53935" /><circle cx="-9.5" cy="-6" r="0.4" fill="#FFCDD2" />`;
                s += `<circle cx="-9.5" cy="-6" r="1.5" fill="#E53935" opacity="0.15"><animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="0.1;0.25;0.1" /></circle>`;
                s += `<path d="M-11 -7.5 L-12 -11 L-9.5 -8" fill="#37474F" />`;
                s += `<path d="M-9 -7.5 L-9 -10.5 L-7.5 -8" fill="#37474F" />`;
                s += `<path d="M-13 -3.5 L-12.5 -2.5 L-12 -3.5" fill="white" opacity="0.7" />`;
                // CENTER HEAD — highest
                s += `<ellipse cx="-4" cy="-8" rx="3.5" ry="3.5" fill="#455A64" />`;
                s += `<ellipse cx="-6.5" cy="-7.5" rx="2" ry="1.5" fill="#546E7A" />`;
                s += `<circle cx="-3.5" cy="-9.5" r="1.1" fill="#E53935" /><circle cx="-3.5" cy="-9.5" r="0.45" fill="#FFCDD2" />`;
                s += `<circle cx="-3.5" cy="-9.5" r="1.6" fill="#E53935" opacity="0.15"><animate attributeName="opacity" dur="2.2s" begin="0.3s" repeatCount="indefinite" values="0.1;0.25;0.1" /></circle>`;
                s += `<path d="M-5 -11 L-6 -15 L-3.5 -12" fill="#37474F" />`;
                s += `<path d="M-3 -11 L-3 -14.5 L-1 -11.5" fill="#37474F" />`;
                s += `<path d="M-7.5 -6.5 L-7 -5.5 L-6.5 -6.5" fill="white" opacity="0.7" />`;
                // RIGHT HEAD — tilted right
                s += `<ellipse cx="2" cy="-5.5" rx="3.5" ry="3" fill="#455A64" />`;
                s += `<ellipse cx="0" cy="-5" rx="2" ry="1.5" fill="#546E7A" />`;
                s += `<circle cx="2.5" cy="-7" r="1" fill="#E53935" /><circle cx="2.5" cy="-7" r="0.4" fill="#FFCDD2" />`;
                s += `<circle cx="2.5" cy="-7" r="1.5" fill="#E53935" opacity="0.15"><animate attributeName="opacity" dur="1.8s" begin="0.6s" repeatCount="indefinite" values="0.1;0.25;0.1" /></circle>`;
                s += `<path d="M1 -8 L0 -11.5 L3 -9" fill="#37474F" />`;
                s += `<path d="M3 -8 L3 -11 L5 -9" fill="#37474F" />`;
                s += `<path d="M-1 -4 L-0.5 -3 L0 -4" fill="white" opacity="0.7" />`;
                // Legs — sturdy
                s += `<path d="M-5 4.5 L-6 8 L-4 8 L-3 5.5" fill="#37474F" />`;
                s += `<path d="M-1 5 L-2 8 L0 8 L1 5.5" fill="#37474F" />`;
                s += `<path d="M5 4 L4 8 L6 8 L7 4.5" fill="#37474F" />`;
                // Paws
                s += `<ellipse cx="-5" cy="8.5" rx="2" ry="0.8" fill="#263238" />`;
                s += `<ellipse cx="-1" cy="8.5" rx="2" ry="0.8" fill="#263238" />`;
                s += `<ellipse cx="5" cy="8.5" rx="2" ry="0.8" fill="#263238" />`;
                // Tail — dark smoke
                s += `<path fill="#263238" opacity="0.8"><animate attributeName="d" dur="2s" repeatCount="indefinite" values="M8 -1 Q11 -4 13 -2 Q14 0 12 2 L9 1;M8 -1 Q11 -5 14 -3 Q15 -1 13 2 L9 1;M8 -1 Q11 -4 13 -2 Q14 0 12 2 L9 1" /></path>`;
                // Shadow aura
                s += `<ellipse cx="0" cy="9" rx="10" ry="2" fill="#263238" opacity="0.25"><animate attributeName="rx" dur="3s" repeatCount="indefinite" values="9;11;9" /></ellipse>`;
                s += `</g>`;
            }
        };
        // === EAGLE: Majestic raptor with wide wings, golden eye ===
        pets.pet_eagle = () => {
            const by = py - 16;
            s += `<g transform="translate(${px},${by}) scale(${sc})">${moveAnim}`;
            // Body
            s += `<ellipse cx="0" cy="0" rx="5" ry="5" fill="#5D4037" />`;
            s += `<ellipse cx="0" cy="0.5" rx="3.5" ry="3.5" fill="#795548" />`;
            // Head
            s += `<circle cx="-6" cy="-4" r="3.5" fill="#F5F5F5" />`;
            s += `<circle cx="-6" cy="-4" r="2.5" fill="#FAFAFA" />`;
            // Eye — fierce golden
            s += `<ellipse cx="-6" cy="-4.5" rx="1.2" ry="1" fill="#FFC107" />`;
            s += `<circle cx="-6" cy="-4.5" r="0.5" fill="#333" />`;
            s += `<path d="M-7.5 -4.5 L-5 -4.5" stroke="#5D4037" stroke-width="0.4" opacity="0.4" />`;
            // Beak — curved hook
            s += `<path d="M-9 -4 Q-11 -3.5 -10.5 -2.5 L-9 -3" fill="#FF8F00" />`;
            // Crest feathers
            s += `<path d="M-5 -7 L-4.5 -10 L-3.5 -7.5" fill="#FFEB3B" opacity="0.6" />`;
            // Wide wings — animated
            s += `<path fill="#4E342E" opacity="0.9"><animate attributeName="d" dur="1.4s" repeatCount="indefinite" values="M0 -2 Q5 -8 9 -6 Q11 -3 9 -1 L5 0;M0 -2 Q5 -10 10 -8 Q12 -4 10 -1 L5 0;M0 -2 Q5 -8 9 -6 Q11 -3 9 -1 L5 0" /></path>`;
            // Wing feather lines
            s += `<line x1="2" y1="-4" x2="7" y2="-6" stroke="#3E2723" stroke-width="0.4" opacity="0.5" />`;
            s += `<line x1="3" y1="-3" x2="8" y2="-5" stroke="#3E2723" stroke-width="0.3" opacity="0.4" />`;
            // Tail
            s += `<path d="M5 1 Q8 2 9 0 Q10 -1 8 3 L5 2" fill="#4E342E" />`;
            // Talons
            s += `<line x1="-2" y1="5" x2="-2" y2="7.5" stroke="#FF8F00" stroke-width="1" />`;
            s += `<line x1="1" y1="5" x2="1" y2="7.5" stroke="#FF8F00" stroke-width="1" />`;
            s += `<path d="M-3.5 7.5 L-2 7.5 L-0.5 7.5" stroke="#333" stroke-width="0.5" fill="none" />`;
            s += `<path d="M-0.5 7.5 L1 7.5 L2.5 7.5" stroke="#333" stroke-width="0.5" fill="none" />`;
            s += `</g>`;
        };

        if (pets[itemId]) pets[itemId]();
        return s;
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
                        <div class="starter-name">Flamoussin</div>
                        <div class="starter-type">🔥 Feu</div>
                    </div>
                    <div class="starter-card" onclick="Creature._pickStarter('plant',${callback ? 'true' : 'false'})">
                        ${plantPreview}
                        <div class="starter-name">Herbachat</div>
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
