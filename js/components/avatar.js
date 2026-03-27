// ===== CREATURE SYSTEM =====
// 3 starters (fire/plant/water) × 4 evolution forms
// Flat cartoon SVG rendering
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
        fire:  { main: '#E64A19', light: '#FF8A50', accent: '#FFAB00', dark: '#BF360C', belly: '#FFCCBC', bg1: '#FBE9E7', bg2: '#FFCCBC' },
        plant: { main: '#4CAF50', light: '#81C784', accent: '#C8E6C9', dark: '#2E7D32', belly: '#E8F5E9', bg1: '#E8F5E9', bg2: '#C8E6C9' },
        water: { main: '#1E88E5', light: '#64B5F6', accent: '#90CAF9', dark: '#0D47A1', belly: '#E1F5FE', bg1: '#E3F2FD', bg2: '#BBDEFB' }
    },

    TYPE_EMOJI: { fire: '🔥', plant: '🌿', water: '💧' },

    messages: {
        celebrating: ['MACHINE !', 'Objectif atteint ! 💪', 'Inarrêtable !', 'BEAST MODE ! 🔥', 'No pain no gain !', 'Tu gères !'],
        happy: ['On continue !', 'Bonne journée !', 'Feed the beast !', 'Tu progresses ! 💪', 'Encore un effort !'],
        encouraging: ['Allez, on mange !', 'N\'oublie pas ton repas !', 'Ton compagnon a faim !', 'Ajoute un repas ! 🍽️']
    },

    getData() { return Storage.getCreature() || { type: 'fire', xp: 0, form: 1, chosen: false }; },
    getActiveDays() { return (Storage.getLogDates() || []).length; },
    getForm() {
        const d = this.getActiveDays();
        return d >= 100 ? 3 : d >= 40 ? 2 : d >= 10 ? 1 : 0;
    },
    getMuscleProgress() {
        const d = this.getActiveDays(), f = this.getForm(), t = [0,10,40,100,999];
        return Math.min(1, (d - t[f]) / (t[f+1] - t[f]));
    },
    getSpeciesName(type, form) { return this.NAMES[type]?.[form] || this.NAMES.fire[0]; },
    getNextFormDays(form) { return [10, 40, 100, null][form]; },
    getMood() {
        const g = Storage.getGoals(), t = Storage.getDayTotals(), l = Storage.getDayLog();
        const m = Object.values(l.meals).filter(x => x.length > 0).length;
        const p = g.calories > 0 ? (t.calories / g.calories) * 100 : 0;
        if (p >= 85 && p <= 115 && m >= 3) return 'celebrating';
        if (p >= 40 || m >= 2) return 'happy';
        return 'encouraging';
    },
    getMessage(mood) { const m = this.messages[mood] || this.messages.encouraging; return m[Math.floor(Math.random() * m.length)]; },

    checkAndAwardXP() {
        if (!Storage.hasChosenStarter() || Storage.hasXPBeenAwardedToday()) return;
        const log = Storage.getDayLog();
        if (!Object.values(log.meals).some(m => m.length > 0)) return;
        const streak = Storage.getCreatureStreak();
        const today = App._localDateKey();
        if (streak.lastActiveDate) {
            const diff = Math.floor((new Date(today) - new Date(streak.lastActiveDate)) / 86400000);
            if (diff === 1) streak.current++;
            else if (diff === 2 && streak.freezesOwned > 0) { streak.freezesOwned--; streak.freezesUsed.push(streak.lastActiveDate); streak.current++; }
            else if (diff > 1) streak.current = 1;
        } else { streak.current = 1; }
        streak.lastActiveDate = today;
        if (streak.current > streak.best) streak.best = streak.current;
        if (streak.current > 0 && streak.current % 10 === 0 && TrialService.isPaid() && streak.freezesOwned < 1) {
            streak.freezesOwned++;
            App.showToast('🧊 Freeze gagné ! Tu peux rater 1 jour sans perdre ton streak');
        }
        Storage.setCreatureStreak(streak);
        const xp = 10 + Math.min(10, Math.floor(streak.current * 0.5));
        Storage.addCreatureXP(xp);
        Storage.markXPAwarded();
        return { xp, streak };
    },

    // ============================================
    // SVG CARTOON CREATURE BUILDERS
    // ============================================
    _eyes(cx, cy, r, mood) {
        let s = '';
        const sp = r * 1.8;
        // White sclera
        s += `<ellipse cx="${cx-sp}" cy="${cy}" rx="${r}" ry="${r*1.1}" fill="white" stroke="#333" stroke-width="0.5"/>`;
        s += `<ellipse cx="${cx+sp}" cy="${cy}" rx="${r}" ry="${r*1.1}" fill="white" stroke="#333" stroke-width="0.5"/>`;
        // Pupils
        const pr = r * 0.55;
        s += `<circle cx="${cx-sp+0.3}" cy="${cy+0.3}" r="${pr}" fill="#222"/>`;
        s += `<circle cx="${cx+sp+0.3}" cy="${cy+0.3}" r="${pr}" fill="#222"/>`;
        // Shine
        s += `<circle cx="${cx-sp-0.5}" cy="${cy-0.8}" r="${pr*0.4}" fill="white"/>`;
        s += `<circle cx="${cx+sp-0.5}" cy="${cy-0.8}" r="${pr*0.4}" fill="white"/>`;
        // Mood expression
        if (mood === 'celebrating') {
            s += `<path d="${`M${cx-sp-r*0.6} ${cy+r*1.2} Q${cx-sp} ${cy+r*1.8} ${cx-sp+r*0.6} ${cy+r*1.2}`}" fill="none" stroke="#333" stroke-width="0.6" stroke-linecap="round"/>`;
            s += `<path d="${`M${cx+sp-r*0.6} ${cy+r*1.2} Q${cx+sp} ${cy+r*1.8} ${cx+sp+r*0.6} ${cy+r*1.2}`}" fill="none" stroke="#333" stroke-width="0.6" stroke-linecap="round"/>`;
        } else if (mood === 'happy') {
            s += `<path d="${`M${cx-2} ${cy+r*1.5} Q${cx} ${cy+r*2.2} ${cx+2} ${cy+r*1.5}`}" fill="none" stroke="#333" stroke-width="0.6" stroke-linecap="round"/>`;
        }
        return s;
    },

    _buildFire(form, p, mood) {
        let s = '';
        const cx = 50, sc = [0.7, 0.85, 0.95, 1][form];
        // Tail flame
        const ty = 55 + (3-form)*3, tx = cx + 15 + form*3;
        s += `<path d="M${cx+8} ${ty} Q${tx} ${ty-5} ${tx+3} ${ty-12-form*4} Q${tx-2} ${ty-6} ${tx-4} ${ty-14-form*3} Q${tx-5} ${ty-4} ${cx+8} ${ty}" fill="${p.accent}"><animate attributeName="d" dur="0.8s" repeatCount="indefinite" values="M${cx+8} ${ty} Q${tx} ${ty-5} ${tx+3} ${ty-12-form*4} Q${tx-2} ${ty-6} ${tx-4} ${ty-14-form*3} Q${tx-5} ${ty-4} ${cx+8} ${ty};M${cx+8} ${ty} Q${tx+2} ${ty-6} ${tx+5} ${ty-14-form*4} Q${tx} ${ty-8} ${tx-2} ${ty-12-form*3} Q${tx-3} ${ty-3} ${cx+8} ${ty};M${cx+8} ${ty} Q${tx} ${ty-5} ${tx+3} ${ty-12-form*4} Q${tx-2} ${ty-6} ${tx-4} ${ty-14-form*3} Q${tx-5} ${ty-4} ${cx+8} ${ty}"/></path>`;
        s += `<path d="M${cx+8} ${ty} Q${tx-2} ${ty-4} ${tx} ${ty-8-form*2} Q${tx-3} ${ty-3} ${cx+8} ${ty}" fill="${p.light}"><animate attributeName="opacity" dur="0.6s" repeatCount="indefinite" values="0.8;1;0.8"/></path>`;
        // Body
        const bw = 12+form*3, bh = 14+form*4, by = 48+form*2;
        s += `<ellipse cx="${cx}" cy="${by}" rx="${bw*sc}" ry="${bh*sc}" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
        // Belly
        s += `<ellipse cx="${cx}" cy="${by+2}" rx="${bw*sc*0.6}" ry="${bh*sc*0.55}" fill="${p.belly}"/>`;
        // Head
        const hr = 10+form*2, hy = by - bh*sc + hr*0.3;
        s += `<circle cx="${cx}" cy="${hy}" r="${hr}" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
        // Flame hair
        for (let i = 0; i < 3+form; i++) {
            const fx = cx - 4 - form + i * (4+form*0.5);
            const fh = 6 + form*2 + Math.random()*2;
            s += `<path d="M${fx} ${hy-hr+2} Q${fx+1} ${hy-hr-fh} ${fx+3} ${hy-hr+1}" fill="${p.accent}" stroke="${p.light}" stroke-width="0.3"><animate attributeName="d" dur="${0.6+i*0.1}s" repeatCount="indefinite" values="M${fx} ${hy-hr+2} Q${fx+1} ${hy-hr-fh} ${fx+3} ${hy-hr+1};M${fx} ${hy-hr+2} Q${fx+2} ${hy-hr-fh-2} ${fx+3} ${hy-hr+1};M${fx} ${hy-hr+2} Q${fx+1} ${hy-hr-fh} ${fx+3} ${hy-hr+1}"/></path>`;
        }
        // Face
        s += this._eyes(cx, hy-1, 2.5+form*0.3, mood);
        // Ears
        s += `<ellipse cx="${cx-hr+2}" cy="${hy-hr*0.5}" rx="3" ry="4" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/>`;
        s += `<ellipse cx="${cx+hr-2}" cy="${hy-hr*0.5}" rx="3" ry="4" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/>`;
        // Arms
        const al = 6+form*3;
        s += `<path d="M${cx-bw*sc} ${by-4} Q${cx-bw*sc-al} ${by} ${cx-bw*sc-al+2} ${by+al*0.6}" stroke="${p.main}" stroke-width="${2.5+form*0.5}" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M${cx+bw*sc} ${by-4} Q${cx+bw*sc+al} ${by} ${cx+bw*sc+al-2} ${by+al*0.6}" stroke="${p.main}" stroke-width="${2.5+form*0.5}" fill="none" stroke-linecap="round"/>`;
        // Fists
        s += `<circle cx="${cx-bw*sc-al+2}" cy="${by+al*0.6}" r="${2+form*0.3}" fill="${p.light}"/>`;
        s += `<circle cx="${cx+bw*sc+al-2}" cy="${by+al*0.6}" r="${2+form*0.3}" fill="${p.light}"/>`;
        // Legs
        const ly = by + bh*sc - 2;
        s += `<path d="M${cx-5} ${ly} L${cx-7-form} ${ly+8+form*2}" stroke="${p.main}" stroke-width="${3+form*0.5}" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M${cx+5} ${ly} L${cx+7+form} ${ly+8+form*2}" stroke="${p.main}" stroke-width="${3+form*0.5}" fill="none" stroke-linecap="round"/>`;
        // Feet
        s += `<ellipse cx="${cx-7-form}" cy="${ly+9+form*2}" rx="${3+form*0.5}" ry="2" fill="${p.dark}"/>`;
        s += `<ellipse cx="${cx+7+form}" cy="${ly+9+form*2}" rx="${3+form*0.5}" ry="2" fill="${p.dark}"/>`;
        return s;
    },

    _buildPlant(form, p, mood) {
        let s = '';
        const cx = 50, sc = [0.7, 0.85, 0.95, 1][form];
        // Tail leaf
        const tx = cx+12+form*3, ty = 58+form;
        s += `<path d="M${cx+6} ${ty} Q${tx} ${ty-2} ${tx+4} ${ty-10-form*3} Q${tx+2} ${ty-12-form*3} ${tx-2} ${ty-6} Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/>`;
        s += `<line x1="${cx+8}" y1="${ty-2}" x2="${tx+1}" y2="${ty-8-form*2}" stroke="${p.dark}" stroke-width="0.4" opacity="0.5"/>`;
        // Body
        const bw = 11+form*3, bh = 13+form*4, by = 48+form*2;
        s += `<ellipse cx="${cx}" cy="${by}" rx="${bw*sc}" ry="${bh*sc}" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
        // Belly
        s += `<ellipse cx="${cx}" cy="${by+2}" rx="${bw*sc*0.55}" ry="${bh*sc*0.5}" fill="${p.belly}"/>`;
        // Head
        const hr = 10+form*2, hy = by - bh*sc + hr*0.3;
        s += `<circle cx="${cx}" cy="${hy}" r="${hr}" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
        // Leaf crest on head
        for (let i = 0; i < 2+form; i++) {
            const lx = cx - 3 - form*0.5 + i*(4+form*0.5);
            const lh = 5+form*2+i*1.5;
            s += `<path d="M${lx} ${hy-hr+1} Q${lx-1} ${hy-hr-lh} ${lx+3} ${hy-hr-lh+3} Q${lx+2} ${hy-hr+2} ${lx} ${hy-hr+1}" fill="${p.light}" stroke="${p.dark}" stroke-width="0.3"/>`;
        }
        // Face
        s += this._eyes(cx, hy-1, 2.5+form*0.3, mood);
        // Nose dots
        s += `<circle cx="${cx-1}" cy="${hy+2}" r="0.6" fill="${p.dark}"/>`;
        s += `<circle cx="${cx+1}" cy="${hy+2}" r="0.6" fill="${p.dark}"/>`;
        // Arms (leaf blade style for higher forms)
        const al = 6+form*3;
        if (form >= 2) {
            s += `<path d="M${cx-bw*sc} ${by-3} L${cx-bw*sc-al} ${by-2} L${cx-bw*sc-al-3} ${by-6} L${cx-bw*sc-al+1} ${by+2} Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += `<path d="M${cx+bw*sc} ${by-3} L${cx+bw*sc+al} ${by-2} L${cx+bw*sc+al+3} ${by-6} L${cx+bw*sc+al-1} ${by+2} Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/>`;
        } else {
            s += `<path d="M${cx-bw*sc} ${by-3} Q${cx-bw*sc-al} ${by} ${cx-bw*sc-al+2} ${by+al*0.5}" stroke="${p.main}" stroke-width="${2+form*0.5}" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+bw*sc} ${by-3} Q${cx+bw*sc+al} ${by} ${cx+bw*sc+al-2} ${by+al*0.5}" stroke="${p.main}" stroke-width="${2+form*0.5}" fill="none" stroke-linecap="round"/>`;
            s += `<circle cx="${cx-bw*sc-al+2}" cy="${by+al*0.5}" r="${1.5+form*0.2}" fill="${p.light}"/>`;
            s += `<circle cx="${cx+bw*sc+al-2}" cy="${by+al*0.5}" r="${1.5+form*0.2}" fill="${p.light}"/>`;
        }
        // Legs
        const ly = by + bh*sc - 2;
        s += `<path d="M${cx-5} ${ly} L${cx-6-form} ${ly+8+form*2}" stroke="${p.main}" stroke-width="${2.5+form*0.5}" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M${cx+5} ${ly} L${cx+6+form} ${ly+8+form*2}" stroke="${p.main}" stroke-width="${2.5+form*0.5}" fill="none" stroke-linecap="round"/>`;
        // Feet (clawed)
        s += `<ellipse cx="${cx-6-form}" cy="${ly+9+form*2}" rx="${3+form*0.4}" ry="1.8" fill="${p.dark}"/>`;
        s += `<ellipse cx="${cx+6+form}" cy="${ly+9+form*2}" rx="${3+form*0.4}" ry="1.8" fill="${p.dark}"/>`;
        return s;
    },

    _buildWater(form, p, mood) {
        let s = '';
        const cx = 50, sc = [0.7, 0.85, 0.95, 1][form];
        // Tail (mermaid-like for high forms)
        const tx = cx+10+form*4, ty = 56+form;
        if (form >= 2) {
            s += `<path d="M${cx+6} ${ty} Q${tx} ${ty+2} ${tx+5} ${ty-4} L${tx+8} ${ty-8} L${tx+3} ${ty-3} L${tx+7} ${ty-12} L${tx+1} ${ty-5} Q${tx-2} ${ty+1} ${cx+6} ${ty}" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.5"/>`;
        } else {
            s += `<path d="M${cx+6} ${ty} Q${tx} ${ty-2} ${tx+2} ${ty-6-form*2}" stroke="${p.light}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
            s += `<circle cx="${tx+2}" cy="${ty-7-form*2}" r="${2+form*0.5}" fill="${p.accent}"/>`;
        }
        // Body
        const bw = 11+form*3, bh = 13+form*4, by = 48+form*2;
        s += `<ellipse cx="${cx}" cy="${by}" rx="${bw*sc}" ry="${bh*sc}" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
        // Belly
        s += `<ellipse cx="${cx}" cy="${by+2}" rx="${bw*sc*0.55}" ry="${bh*sc*0.5}" fill="${p.belly}"/>`;
        // Head
        const hr = 10+form*2, hy = by - bh*sc + hr*0.3;
        s += `<circle cx="${cx}" cy="${hy}" r="${hr}" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
        // Fin ears
        const es = 4+form*1.5;
        s += `<path d="M${cx-hr+1} ${hy-2} L${cx-hr-es} ${hy-es-3} L${cx-hr+3} ${hy-es+2} Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.5"/>`;
        s += `<path d="M${cx+hr-1} ${hy-2} L${cx+hr+es} ${hy-es-3} L${cx+hr-3} ${hy-es+2} Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.5"/>`;
        // Inner ear
        s += `<path d="M${cx-hr+2} ${hy-2} L${cx-hr-es+2} ${hy-es-1} L${cx-hr+3} ${hy-es+3} Z" fill="${p.light}" opacity="0.5"/>`;
        s += `<path d="M${cx+hr-2} ${hy-2} L${cx+hr+es-2} ${hy-es-1} L${cx+hr-3} ${hy-es+3} Z" fill="${p.light}" opacity="0.5"/>`;
        // Face
        s += this._eyes(cx, hy-1, 2.5+form*0.3, mood);
        // Whiskers
        s += `<line x1="${cx-hr}" y1="${hy+1}" x2="${cx-hr-5}" y2="${hy-1}" stroke="${p.dark}" stroke-width="0.4" opacity="0.4"/>`;
        s += `<line x1="${cx-hr}" y1="${hy+2}" x2="${cx-hr-5}" y2="${hy+3}" stroke="${p.dark}" stroke-width="0.4" opacity="0.4"/>`;
        s += `<line x1="${cx+hr}" y1="${hy+1}" x2="${cx+hr+5}" y2="${hy-1}" stroke="${p.dark}" stroke-width="0.4" opacity="0.4"/>`;
        s += `<line x1="${cx+hr}" y1="${hy+2}" x2="${cx+hr+5}" y2="${hy+3}" stroke="${p.dark}" stroke-width="0.4" opacity="0.4"/>`;
        // Nose
        s += `<ellipse cx="${cx}" cy="${hy+2}" rx="1.2" ry="0.8" fill="${p.dark}"/>`;
        // Water collar for form 2+
        if (form >= 2) {
            s += `<path d="M${cx-bw*sc-2} ${by-bh*sc+6} Q${cx-bw*sc-5} ${by-bh*sc+10} ${cx-bw*sc} ${by-bh*sc+14} Q${cx-3} ${by-bh*sc+8} ${cx+3} ${by-bh*sc+8} Q${cx+bw*sc} ${by-bh*sc+14} ${cx+bw*sc+5} ${by-bh*sc+10} Q${cx+bw*sc+2} ${by-bh*sc+6} ${cx+bw*sc-2} ${by-bh*sc+4}" fill="${p.accent}" opacity="0.6" stroke="${p.dark}" stroke-width="0.3"/>`;
        }
        // Arms/paws
        const al = 5+form*2.5;
        s += `<path d="M${cx-bw*sc} ${by-3} Q${cx-bw*sc-al} ${by} ${cx-bw*sc-al+1} ${by+al*0.5}" stroke="${p.main}" stroke-width="${2+form*0.5}" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M${cx+bw*sc} ${by-3} Q${cx+bw*sc+al} ${by} ${cx+bw*sc+al-1} ${by+al*0.5}" stroke="${p.main}" stroke-width="${2+form*0.5}" fill="none" stroke-linecap="round"/>`;
        s += `<circle cx="${cx-bw*sc-al+1}" cy="${by+al*0.5}" r="${1.5+form*0.3}" fill="${p.light}"/>`;
        s += `<circle cx="${cx+bw*sc+al-1}" cy="${by+al*0.5}" r="${1.5+form*0.3}" fill="${p.light}"/>`;
        // Legs
        const ly = by + bh*sc - 2;
        s += `<path d="M${cx-5} ${ly} L${cx-6-form} ${ly+7+form*2}" stroke="${p.main}" stroke-width="${2.5+form*0.5}" fill="none" stroke-linecap="round"/>`;
        s += `<path d="M${cx+5} ${ly} L${cx+6+form} ${ly+7+form*2}" stroke="${p.main}" stroke-width="${2.5+form*0.5}" fill="none" stroke-linecap="round"/>`;
        s += `<ellipse cx="${cx-6-form}" cy="${ly+8+form*2}" rx="${2.5+form*0.4}" ry="1.8" fill="${p.dark}"/>`;
        s += `<ellipse cx="${cx+6+form}" cy="${ly+8+form*2}" rx="${2.5+form*0.4}" ry="1.8" fill="${p.dark}"/>`;
        return s;
    },

    buildSVG(size, options = {}) {
        const data = options.creatureData || this.getData();
        const type = data.type || 'fire';
        const form = data.form !== undefined ? data.form : this.getForm();
        const mood = options.mood || this.getMood();
        const p = this.PALETTES[type];

        let svg = `<svg viewBox="10 5 80 90" width="${size}" height="${size}" class="creature-svg ${mood === 'celebrating' ? 'creature-bounce' : ''}" style="overflow:visible">`;
        svg += `<g><animateTransform attributeName="transform" type="translate" values="0,0;0,-1;0,0" dur="2.5s" repeatCount="indefinite"/>`;

        if (type === 'fire') svg += this._buildFire(form, p, mood);
        else if (type === 'plant') svg += this._buildPlant(form, p, mood);
        else svg += this._buildWater(form, p, mood);

        svg += `</g></svg>`;
        return svg;
    },

    render() {
        const data = this.getData();
        if (!data.chosen) return '';
        const form = this.getForm(), speciesName = this.getSpeciesName(data.type, form);
        const playerName = Storage.getProfile().name || 'Dresseur';
        const mood = this.getMood(), message = this.getMessage(mood);
        const coins = Storage.getCoins(), days = this.getActiveDays();
        const nextDays = this.getNextFormDays(form), pal = this.PALETTES[data.type];
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
        const fp = this.buildSVG(80, { creatureData: { type: 'fire', form: 0, chosen: true }, mood: 'happy' });
        const pp = this.buildSVG(80, { creatureData: { type: 'plant', form: 0, chosen: true }, mood: 'happy' });
        const wp = this.buildSVG(80, { creatureData: { type: 'water', form: 0, chosen: true }, mood: 'happy' });
        Modal.show(`
            <div style="text-align:center">
                <div class="modal-title">Choisis ton compagnon !</div>
                <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">Il t'accompagnera dans ton aventure fitness.</p>
                <div class="starter-choice-grid">
                    <div class="starter-card" onclick="Creature._pickStarter('fire',${callback?'true':'false'})">${fp}<div class="starter-name">Braisinge</div><div class="starter-type">🔥 Feu</div></div>
                    <div class="starter-card" onclick="Creature._pickStarter('plant',${callback?'true':'false'})">${pp}<div class="starter-name">Feuillard</div><div class="starter-type">🌿 Plante</div></div>
                    <div class="starter-card" onclick="Creature._pickStarter('water',${callback?'true':'false'})">${wp}<div class="starter-name">Aquarein</div><div class="starter-type">💧 Eau</div></div>
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
        if (this._starterCallback) { this._starterCallback(); this._starterCallback = null; }
    }
};
const Avatar = Creature;
