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
        fire:  { main: '#C62828', light: '#FF8A50', accent: '#FFAB00', dark: '#B71C1C', belly: '#FFCDD2', bg1: '#FFEBEE', bg2: '#FFCDD2' },
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

    _flame(x, y, h, w, color, dur) {
        return `<path d="M${x} ${y} Q${x-w} ${y-h*0.6} ${x} ${y-h} Q${x+w} ${y-h*0.6} ${x} ${y}" fill="${color}"><animate attributeName="d" dur="${dur||0.6}s" repeatCount="indefinite" values="M${x} ${y} Q${x-w} ${y-h*0.6} ${x} ${y-h} Q${x+w} ${y-h*0.6} ${x} ${y};M${x} ${y} Q${x-w*1.3} ${y-h*0.7} ${x+1} ${y-h-2} Q${x+w*1.2} ${y-h*0.5} ${x} ${y};M${x} ${y} Q${x-w} ${y-h*0.6} ${x} ${y-h} Q${x+w} ${y-h*0.6} ${x} ${y}"/></path>`;
    },

    _buildFire(form, p, mood) {
        let s = '';
        const cx = 50;
        if (form === 0) {
            // BRAISINGE — Bébé chimp assis, tout rond, gros yeux, minuscule flamme queue
            s += `<path d="M${cx+6} 62 Q${cx+14} 58 ${cx+16} 50 Q${cx+13} 54 ${cx+10} 48 Q${cx+12} 56 ${cx+6} 62" fill="${p.accent}"><animate attributeName="d" dur="0.7s" repeatCount="indefinite" values="M${cx+6} 62 Q${cx+14} 58 ${cx+16} 50 Q${cx+13} 54 ${cx+10} 48 Q${cx+12} 56 ${cx+6} 62;M${cx+6} 62 Q${cx+15} 57 ${cx+17} 48 Q${cx+14} 52 ${cx+11} 46 Q${cx+13} 55 ${cx+6} 62;M${cx+6} 62 Q${cx+14} 58 ${cx+16} 50 Q${cx+13} 54 ${cx+10} 48 Q${cx+12} 56 ${cx+6} 62"/></path>`;
            s += `<ellipse cx="${cx}" cy="58" rx="10" ry="12" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            s += `<ellipse cx="${cx}" cy="60" rx="6" ry="7" fill="${p.belly}"/>`;
            s += `<circle cx="${cx}" cy="42" r="11" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            s += `<path d="M${cx-3} 31 Q${cx-1} 25 ${cx+1} 31" fill="${p.accent}"/><path d="M${cx} 30 Q${cx+2} 24 ${cx+4} 31" fill="${p.light}"/>`;
            s += this._eyes(cx, 41, 3, mood);
            s += `<ellipse cx="${cx-9}" cy="37" rx="3" ry="3.5" fill="${p.light}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<ellipse cx="${cx+9}" cy="37" rx="3" ry="3.5" fill="${p.light}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<path d="M${cx-10} 54 Q${cx-16} 58 ${cx-14} 63" stroke="${p.main}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+10} 54 Q${cx+16} 58 ${cx+14} 63" stroke="${p.main}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
            s += `<ellipse cx="${cx-5}" cy="70" rx="4" ry="2" fill="${p.dark}"/><ellipse cx="${cx+5}" cy="70" rx="4" ry="2" fill="${p.dark}"/>`;
        } else if (form === 1) {
            // Jeune singe debout — mohawk flamme, bras plus longs
            s += `<path d="M${cx+8} 58 Q${cx+18} 52 ${cx+20} 42 Q${cx+16} 48 ${cx+14} 40 Q${cx+16} 50 ${cx+8} 58" fill="${p.accent}"><animate attributeName="d" dur="0.7s" repeatCount="indefinite" values="M${cx+8} 58 Q${cx+18} 52 ${cx+20} 42 Q${cx+16} 48 ${cx+14} 40 Q${cx+16} 50 ${cx+8} 58;M${cx+8} 58 Q${cx+19} 50 ${cx+22} 40 Q${cx+17} 46 ${cx+15} 38 Q${cx+17} 49 ${cx+8} 58;M${cx+8} 58 Q${cx+18} 52 ${cx+20} 42 Q${cx+16} 48 ${cx+14} 40 Q${cx+16} 50 ${cx+8} 58"/></path>`;
            s += `<ellipse cx="${cx}" cy="52" rx="12" ry="16" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            s += `<ellipse cx="${cx}" cy="54" rx="7" ry="9" fill="${p.belly}"/>`;
            s += `<circle cx="${cx}" cy="32" r="12" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            for (let i = 0; i < 4; i++) { const fx = cx-5+i*3.5; s += `<path d="M${fx} 21 Q${fx+1} ${13-i} ${fx+3} 20" fill="${p.accent}"><animate attributeName="d" dur="${0.5+i*0.1}s" repeatCount="indefinite" values="M${fx} 21 Q${fx+1} ${13-i} ${fx+3} 20;M${fx} 21 Q${fx+2} ${11-i} ${fx+3} 20;M${fx} 21 Q${fx+1} ${13-i} ${fx+3} 20"/></path>`; }
            s += this._eyes(cx, 31, 2.8, mood);
            s += `<ellipse cx="${cx-10}" cy="27" rx="3" ry="4" fill="${p.light}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<ellipse cx="${cx+10}" cy="27" rx="3" ry="4" fill="${p.light}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<path d="M${cx-12} 48 Q${cx-22} 50 ${cx-19} 58" stroke="${p.main}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+12} 48 Q${cx+22} 50 ${cx+19} 58" stroke="${p.main}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
            s += `<circle cx="${cx-19}" cy="58" r="2.5" fill="${p.light}"/><circle cx="${cx+19}" cy="58" r="2.5" fill="${p.light}"/>`;
            s += `<path d="M${cx-5} 67 L${cx-8} 78" stroke="${p.main}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+5} 67 L${cx+8} 78" stroke="${p.main}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
            s += `<ellipse cx="${cx-8}" cy="79" rx="4" ry="2" fill="${p.dark}"/><ellipse cx="${cx+8}" cy="79" rx="4" ry="2" fill="${p.dark}"/>`;
        } else if (form === 2) {
            // Singe musclé — torse large, crinière flammes, poings, féroce
            s += `<path d="M${cx+10} 52 Q${cx+22} 44 ${cx+25} 30 Q${cx+20} 38 ${cx+18} 28 Q${cx+20} 42 ${cx+10} 52" fill="${p.accent}"><animate attributeName="d" dur="0.6s" repeatCount="indefinite" values="M${cx+10} 52 Q${cx+22} 44 ${cx+25} 30 Q${cx+20} 38 ${cx+18} 28 Q${cx+20} 42 ${cx+10} 52;M${cx+10} 52 Q${cx+24} 42 ${cx+27} 28 Q${cx+22} 36 ${cx+20} 26 Q${cx+22} 40 ${cx+10} 52;M${cx+10} 52 Q${cx+22} 44 ${cx+25} 30 Q${cx+20} 38 ${cx+18} 28 Q${cx+20} 42 ${cx+10} 52"/></path>`;
            s += `<ellipse cx="${cx}" cy="48" rx="16" ry="20" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
            s += `<ellipse cx="${cx}" cy="50" rx="9" ry="11" fill="${p.belly}"/>`;
            s += `<line x1="${cx}" y1="42" x2="${cx}" y2="56" stroke="${p.dark}" stroke-width="0.4" opacity="0.3"/>`;
            s += `<line x1="${cx-4}" y1="44" x2="${cx-4}" y2="54" stroke="${p.dark}" stroke-width="0.3" opacity="0.2"/>`;
            s += `<line x1="${cx+4}" y1="44" x2="${cx+4}" y2="54" stroke="${p.dark}" stroke-width="0.3" opacity="0.2"/>`;
            s += `<circle cx="${cx}" cy="25" r="13" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
            for (let i = 0; i < 6; i++) { const fx = cx-8+i*3.5; const fh = 10+Math.abs(i-2.5)*2; s += `<path d="M${fx} 13 Q${fx+1} ${13-fh} ${fx+3} 12" fill="${p.accent}"><animate attributeName="d" dur="${0.4+i*0.08}s" repeatCount="indefinite" values="M${fx} 13 Q${fx+1} ${13-fh} ${fx+3} 12;M${fx} 13 Q${fx+2} ${11-fh} ${fx+3} 12;M${fx} 13 Q${fx+1} ${13-fh} ${fx+3} 12"/></path>`; }
            s += this._eyes(cx, 24, 2.5, mood);
            s += `<path d="M${cx-3} 29 L${cx-2} 31" stroke="white" stroke-width="0.8"/><path d="M${cx+3} 29 L${cx+2} 31" stroke="white" stroke-width="0.8"/>`;
            s += `<path d="M${cx-16} 42 Q${cx-28} 44 ${cx-26} 55" stroke="${p.main}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+16} 42 Q${cx+28} 44 ${cx+26} 55" stroke="${p.main}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
            s += `<circle cx="${cx-26}" cy="55" r="3.5" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/><circle cx="${cx+26}" cy="55" r="3.5" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += `<path d="M${cx-7} 67 L${cx-10} 80" stroke="${p.main}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+7} 67 L${cx+10} 80" stroke="${p.main}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
            s += `<ellipse cx="${cx-10}" cy="81" rx="5" ry="2.5" fill="${p.dark}"/><ellipse cx="${cx+10}" cy="81" rx="5" ry="2.5" fill="${p.dark}"/>`;
        } else {
            // Gorille massif — crinière feu complète, abdos, crocs, aura
            s += `<circle cx="${cx}" cy="42" r="8" fill="${p.accent}" opacity="0.15"><animate attributeName="r" dur="1.5s" repeatCount="indefinite" values="8;12;8"/></circle>`;
            s += `<path d="M${cx+12} 48 Q${cx+26} 38 ${cx+28} 22 Q${cx+22} 30 ${cx+20} 20 Q${cx+24} 36 ${cx+12} 48" fill="${p.accent}"><animate attributeName="d" dur="0.5s" repeatCount="indefinite" values="M${cx+12} 48 Q${cx+26} 38 ${cx+28} 22 Q${cx+22} 30 ${cx+20} 20 Q${cx+24} 36 ${cx+12} 48;M${cx+12} 48 Q${cx+28} 36 ${cx+30} 20 Q${cx+24} 28 ${cx+22} 18 Q${cx+26} 34 ${cx+12} 48;M${cx+12} 48 Q${cx+26} 38 ${cx+28} 22 Q${cx+22} 30 ${cx+20} 20 Q${cx+24} 36 ${cx+12} 48"/></path>`;
            s += `<ellipse cx="${cx}" cy="45" rx="20" ry="24" fill="${p.main}" stroke="${p.dark}" stroke-width="1.2"/>`;
            s += `<ellipse cx="${cx}" cy="47" rx="11" ry="13" fill="${p.belly}"/>`;
            s += `<line x1="${cx}" y1="38" x2="${cx}" y2="56" stroke="${p.dark}" stroke-width="0.5" opacity="0.3"/>`;
            s += `<line x1="${cx-5}" y1="40" x2="${cx-5}" y2="54" stroke="${p.dark}" stroke-width="0.4" opacity="0.25"/>`;
            s += `<line x1="${cx+5}" y1="40" x2="${cx+5}" y2="54" stroke="${p.dark}" stroke-width="0.4" opacity="0.25"/>`;
            s += `<path d="M${cx-8} 42 Q${cx-6} 44 ${cx-8} 46" stroke="${p.dark}" stroke-width="0.3" fill="none" opacity="0.2"/>`;
            s += `<path d="M${cx+8} 42 Q${cx+6} 44 ${cx+8} 46" stroke="${p.dark}" stroke-width="0.3" fill="none" opacity="0.2"/>`;
            s += `<circle cx="${cx}" cy="18" r="15" fill="${p.main}" stroke="${p.dark}" stroke-width="1.2"/>`;
            for (let i = 0; i < 8; i++) { const fx = cx-12+i*3.5; const fh = 12+Math.abs(i-3.5)*3; s += `<path d="M${fx} 5 Q${fx+1} ${5-fh} ${fx+3} 4" fill="${i%2===0?p.accent:p.light}"><animate attributeName="d" dur="${0.35+i*0.06}s" repeatCount="indefinite" values="M${fx} 5 Q${fx+1} ${5-fh} ${fx+3} 4;M${fx} 5 Q${fx+2} ${3-fh} ${fx+3} 4;M${fx} 5 Q${fx+1} ${5-fh} ${fx+3} 4"/></path>`; }
            s += this._eyes(cx, 17, 2.2, mood);
            s += `<path d="M${cx-4} 24 L${cx-3} 27" stroke="white" stroke-width="1" stroke-linecap="round"/><path d="M${cx+4} 24 L${cx+3} 27" stroke="white" stroke-width="1" stroke-linecap="round"/>`;
            s += `<path d="M${cx-6} 22 L${cx+6} 22" stroke="${p.dark}" stroke-width="0.6" opacity="0.4"/>`;
            s += `<path d="M${cx-20} 36 Q${cx-34} 38 ${cx-32} 52" stroke="${p.main}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+20} 36 Q${cx+34} 38 ${cx+32} 52" stroke="${p.main}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
            s += `<circle cx="${cx-32}" cy="52" r="4.5" fill="${p.light}" stroke="${p.dark}" stroke-width="0.6"/><circle cx="${cx+32}" cy="52" r="4.5" fill="${p.light}" stroke="${p.dark}" stroke-width="0.6"/>`;
            s += `<path d="M${cx-9} 68 L${cx-12} 84" stroke="${p.main}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+9} 68 L${cx+12} 84" stroke="${p.main}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
            s += `<ellipse cx="${cx-12}" cy="85" rx="6" ry="3" fill="${p.dark}"/><ellipse cx="${cx+12}" cy="85" rx="6" ry="3" fill="${p.dark}"/>`;
        }
        return s;
    },

    _buildPlant(form, p, mood) {
        let s = '';
        const cx = 50;
        if (form === 0) {
            // Petit gecko mignon — feuille sur la tête, queue feuille
            s += `<path d="M${cx+6} 62 Q${cx+14} 60 ${cx+16} 52 Q${cx+14} 50 ${cx+10} 56 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<line x1="${cx+8}" y1="60" x2="${cx+14}" y2="54" stroke="${p.dark}" stroke-width="0.3" opacity="0.4"/>`;
            s += `<ellipse cx="${cx}" cy="58" rx="9" ry="11" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            s += `<ellipse cx="${cx}" cy="60" rx="5.5" ry="6.5" fill="${p.belly}"/>`;
            s += `<circle cx="${cx}" cy="43" r="10" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            s += `<path d="M${cx-1} 33 Q${cx-2} 26 ${cx+1} 28 Q${cx+3} 25 ${cx+2} 33" fill="${p.light}" stroke="${p.dark}" stroke-width="0.3"/>`;
            s += this._eyes(cx, 42, 3, mood);
            s += `<circle cx="${cx-1}" cy="45" r="0.5" fill="${p.dark}"/><circle cx="${cx+1}" cy="45" r="0.5" fill="${p.dark}"/>`;
            s += `<path d="M${cx-9} 55 Q${cx-14} 58 ${cx-13} 62" stroke="${p.main}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+9} 55 Q${cx+14} 58 ${cx+13} 62" stroke="${p.main}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
            s += `<ellipse cx="${cx-4}" cy="69" rx="3.5" ry="1.8" fill="${p.dark}"/><ellipse cx="${cx+4}" cy="69" rx="3.5" ry="1.8" fill="${p.dark}"/>`;
        } else if (form === 1) {
            // Lézard debout — lames feuilles bras, rapide
            s += `<path d="M${cx+7} 58 Q${cx+16} 54 ${cx+18} 44 Q${cx+16} 42 ${cx+12} 50 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<ellipse cx="${cx}" cy="52" rx="11" ry="15" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            s += `<ellipse cx="${cx}" cy="54" rx="6.5" ry="8" fill="${p.belly}"/>`;
            s += `<circle cx="${cx}" cy="33" r="11" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            for (let i = 0; i < 3; i++) { const lx = cx-3+i*3; s += `<path d="M${lx} 22 Q${lx-1} ${16-i*2} ${lx+2} ${17-i*2} Q${lx+1} 23 ${lx} 22" fill="${p.light}" stroke="${p.dark}" stroke-width="0.3"/>`;  }
            s += this._eyes(cx, 32, 2.8, mood);
            s += `<circle cx="${cx-1}" cy="36" r="0.5" fill="${p.dark}"/><circle cx="${cx+1}" cy="36" r="0.5" fill="${p.dark}"/>`;
            s += `<path d="M${cx-11} 48 Q${cx-18} 46 ${cx-20} 52" stroke="${p.main}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+11} 48 Q${cx+18} 46 ${cx+20} 52" stroke="${p.main}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx-20} 52 L${cx-24} 48 L${cx-22} 54 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.3"/>`;
            s += `<path d="M${cx+20} 52 L${cx+24} 48 L${cx+22} 54 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.3"/>`;
            s += `<path d="M${cx-5} 66 L${cx-7} 78" stroke="${p.main}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+5} 66 L${cx+7} 78" stroke="${p.main}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
            s += `<ellipse cx="${cx-7}" cy="79" rx="4" ry="2" fill="${p.dark}"/><ellipse cx="${cx+7}" cy="79" rx="4" ry="2" fill="${p.dark}"/>`;
        } else if (form === 2) {
            // Raptor musclé — crête impressionnante, griffes
            s += `<path d="M${cx+9} 54 Q${cx+20} 48 ${cx+24} 34 Q${cx+22} 32 ${cx+16} 44 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<line x1="${cx+12}" y1="50" x2="${cx+20}" y2="40" stroke="${p.dark}" stroke-width="0.3" opacity="0.3"/>`;
            s += `<ellipse cx="${cx}" cy="48" rx="15" ry="19" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
            s += `<ellipse cx="${cx}" cy="50" rx="8.5" ry="10" fill="${p.belly}"/>`;
            s += `<circle cx="${cx}" cy="25" r="13" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
            for (let i = 0; i < 5; i++) { const lx = cx-6+i*3; const lh = 8+Math.abs(i-2)*3; s += `<path d="M${lx} 13 Q${lx-1} ${13-lh} ${lx+2} ${14-lh} Q${lx+1} 14 ${lx} 13" fill="${p.light}" stroke="${p.dark}" stroke-width="0.3"/>`;  }
            s += this._eyes(cx, 24, 2.3, mood);
            s += `<circle cx="${cx-1}" cy="28" r="0.6" fill="${p.dark}"/><circle cx="${cx+1}" cy="28" r="0.6" fill="${p.dark}"/>`;
            s += `<path d="M${cx-15} 42 L${cx-26} 40 L${cx-30} 34 L${cx-28} 42 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += `<path d="M${cx+15} 42 L${cx+26} 40 L${cx+30} 34 L${cx+28} 42 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += `<path d="M${cx-7} 66 L${cx-10} 80" stroke="${p.main}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+7} 66 L${cx+10} 80" stroke="${p.main}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx-13} 80 L${cx-10} 78 L${cx-7} 80" stroke="${p.dark}" stroke-width="0.8" fill="none"/>`;
            s += `<path d="M${cx+7} 80 L${cx+10} 78 L${cx+13} 80" stroke="${p.dark}" stroke-width="0.8" fill="none"/>`;
        } else {
            // Dragon végétal — ailes feuilles, torse écorce, queue massive
            s += `<path d="M${cx+12} 50 Q${cx+24} 42 ${cx+28} 26 Q${cx+26} 24 ${cx+18} 40 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += `<path d="M${cx-12} 38 Q${cx-28} 26 ${cx-34} 18 L${cx-30} 28 L${cx-36} 22 L${cx-28} 34 Q${cx-18} 42 ${cx-14} 42" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5" opacity="0.8"/>`;
            s += `<path d="M${cx+12} 38 Q${cx+28} 26 ${cx+34} 18 L${cx+30} 28 L${cx+36} 22 L${cx+28} 34 Q${cx+18} 42 ${cx+14} 42" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5" opacity="0.8"/>`;
            s += `<ellipse cx="${cx}" cy="46" rx="18" ry="22" fill="${p.main}" stroke="${p.dark}" stroke-width="1.2"/>`;
            s += `<ellipse cx="${cx}" cy="48" rx="10" ry="12" fill="${p.belly}"/>`;
            s += `<path d="M${cx-6} 40 Q${cx-4} 42 ${cx-6} 44" stroke="${p.dark}" stroke-width="0.4" fill="none" opacity="0.3"/>`;
            s += `<path d="M${cx+6} 40 Q${cx+4} 42 ${cx+6} 44" stroke="${p.dark}" stroke-width="0.4" fill="none" opacity="0.3"/>`;
            s += `<circle cx="${cx}" cy="18" r="14" fill="${p.main}" stroke="${p.dark}" stroke-width="1.2"/>`;
            for (let i = 0; i < 7; i++) { const lx = cx-9+i*3; const lh = 10+Math.abs(i-3)*3; s += `<path d="M${lx} 5 Q${lx-1} ${5-lh} ${lx+2} ${6-lh} Q${lx+1} 6 ${lx} 5" fill="${p.light}" stroke="${p.dark}" stroke-width="0.3"/>`;  }
            s += this._eyes(cx, 17, 2.2, mood);
            s += `<circle cx="${cx-1}" cy="22" r="0.7" fill="${p.dark}"/><circle cx="${cx+1}" cy="22" r="0.7" fill="${p.dark}"/>`;
            s += `<path d="M${cx-18} 38 L${cx-30} 36 L${cx-34} 28 L${cx-32} 38 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += `<path d="M${cx+18} 38 L${cx+30} 36 L${cx+34} 28 L${cx+32} 38 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += `<path d="M${cx-9} 67 L${cx-12} 84" stroke="${p.main}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+9} 67 L${cx+12} 84" stroke="${p.main}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx-16} 84 L${cx-12} 82 L${cx-8} 84" stroke="${p.dark}" stroke-width="1" fill="none"/>`;
            s += `<path d="M${cx+8} 84 L${cx+12} 82 L${cx+16} 84" stroke="${p.dark}" stroke-width="1" fill="none"/>`;
        }
        return s;
    },

    _buildWater(form, p, mood) {
        let s = '';
        const cx = 50;
        if (form === 0) {
            // Chaton rond — oreilles nageoire, queue goutte d'eau
            s += `<path d="M${cx+6} 60 Q${cx+12} 58 ${cx+13} 52" stroke="${p.light}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
            s += `<circle cx="${cx+13}" cy="51" r="2.5" fill="${p.accent}"/>`;
            s += `<ellipse cx="${cx}" cy="58" rx="10" ry="11" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            s += `<ellipse cx="${cx}" cy="60" rx="6" ry="6.5" fill="${p.belly}"/>`;
            s += `<circle cx="${cx}" cy="43" r="11" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            s += `<path d="M${cx-10} 41 L${cx-14} 34 L${cx-7} 38 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<path d="M${cx+10} 41 L${cx+14} 34 L${cx+7} 38 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<path d="M${cx-9} 41 L${cx-12} 36 L${cx-7} 39 Z" fill="${p.light}" opacity="0.4"/>`;
            s += `<path d="M${cx+9} 41 L${cx+12} 36 L${cx+7} 39 Z" fill="${p.light}" opacity="0.4"/>`;
            s += this._eyes(cx, 42, 3, mood);
            s += `<ellipse cx="${cx}" cy="45" rx="1" ry="0.7" fill="${p.dark}"/>`;
            s += `<line x1="${cx-11}" y1="43" x2="${cx-16}" y2="42" stroke="${p.dark}" stroke-width="0.3" opacity="0.4"/><line x1="${cx-11}" y1="44.5" x2="${cx-16}" y2="45.5" stroke="${p.dark}" stroke-width="0.3" opacity="0.4"/>`;
            s += `<line x1="${cx+11}" y1="43" x2="${cx+16}" y2="42" stroke="${p.dark}" stroke-width="0.3" opacity="0.4"/><line x1="${cx+11}" y1="44.5" x2="${cx+16}" y2="45.5" stroke="${p.dark}" stroke-width="0.3" opacity="0.4"/>`;
            s += `<path d="M${cx-10} 55 Q${cx-14} 58 ${cx-13} 62" stroke="${p.main}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+10} 55 Q${cx+14} 58 ${cx+13} 62" stroke="${p.main}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
            s += `<ellipse cx="${cx-4}" cy="69" rx="3.5" ry="1.8" fill="${p.dark}"/><ellipse cx="${cx+4}" cy="69" rx="3.5" ry="1.8" fill="${p.dark}"/>`;
        } else if (form === 1) {
            // Chat élancé — nageoires développées, moustaches longues
            s += `<path d="M${cx+8} 56 Q${cx+16} 52 ${cx+18} 44" stroke="${p.light}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
            s += `<circle cx="${cx+18}" cy="43" r="3" fill="${p.accent}"/>`;
            s += `<ellipse cx="${cx}" cy="52" rx="12" ry="15" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            s += `<ellipse cx="${cx}" cy="54" rx="7" ry="8.5" fill="${p.belly}"/>`;
            s += `<circle cx="${cx}" cy="33" r="12" fill="${p.main}" stroke="${p.dark}" stroke-width="0.8"/>`;
            s += `<path d="M${cx-11} 31 L${cx-16} 22 L${cx-7} 28 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<path d="M${cx+11} 31 L${cx+16} 22 L${cx+7} 28 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<path d="M${cx-10} 31 L${cx-14} 24 L${cx-7} 29 Z" fill="${p.light}" opacity="0.4"/>`;
            s += `<path d="M${cx+10} 31 L${cx+14} 24 L${cx+7} 29 Z" fill="${p.light}" opacity="0.4"/>`;
            s += this._eyes(cx, 32, 2.8, mood);
            s += `<ellipse cx="${cx}" cy="35" rx="1.2" ry="0.8" fill="${p.dark}"/>`;
            s += `<line x1="${cx-12}" y1="33" x2="${cx-19}" y2="31" stroke="${p.dark}" stroke-width="0.4" opacity="0.4"/><line x1="${cx-12}" y1="35" x2="${cx-19}" y2="37" stroke="${p.dark}" stroke-width="0.4" opacity="0.4"/>`;
            s += `<line x1="${cx+12}" y1="33" x2="${cx+19}" y2="31" stroke="${p.dark}" stroke-width="0.4" opacity="0.4"/><line x1="${cx+12}" y1="35" x2="${cx+19}" y2="37" stroke="${p.dark}" stroke-width="0.4" opacity="0.4"/>`;
            s += `<path d="M${cx-12} 48 Q${cx-19} 50 ${cx-17} 57" stroke="${p.main}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+12} 48 Q${cx+19} 50 ${cx+17} 57" stroke="${p.main}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
            s += `<circle cx="${cx-17}" cy="57" r="2" fill="${p.light}"/><circle cx="${cx+17}" cy="57" r="2" fill="${p.light}"/>`;
            s += `<path d="M${cx-5} 66 L${cx-7} 78" stroke="${p.main}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+5} 66 L${cx+7} 78" stroke="${p.main}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
            s += `<ellipse cx="${cx-7}" cy="79" rx="3.5" ry="1.8" fill="${p.dark}"/><ellipse cx="${cx+7}" cy="79" rx="3.5" ry="1.8" fill="${p.dark}"/>`;
        } else if (form === 2) {
            // Panthère aquatique — collerette d'eau, musclé, regard intense
            s += `<path d="M${cx+10} 52 Q${cx+20} 46 ${cx+24} 36 L${cx+28} 30 L${cx+22} 38 L${cx+26} 26 L${cx+20} 40 Q${cx+14} 50 ${cx+10} 52" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<ellipse cx="${cx}" cy="48" rx="15" ry="19" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
            s += `<ellipse cx="${cx}" cy="50" rx="8.5" ry="10" fill="${p.belly}"/>`;
            s += `<path d="M${cx-15} 34 Q${cx-18} 30 ${cx-14} 28 Q${cx-3} 32 ${cx+3} 32 Q${cx+14} 28 ${cx+18} 30 Q${cx+15} 34 ${cx+14} 36" fill="${p.accent}" opacity="0.5" stroke="${p.dark}" stroke-width="0.3"/>`;
            s += `<circle cx="${cx}" cy="25" r="13" fill="${p.main}" stroke="${p.dark}" stroke-width="1"/>`;
            s += `<path d="M${cx-12} 23 L${cx-18} 12 L${cx-8} 19 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += `<path d="M${cx+12} 23 L${cx+18} 12 L${cx+8} 19 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.4"/>`;
            s += this._eyes(cx, 24, 2.3, mood);
            s += `<ellipse cx="${cx}" cy="28" rx="1.3" ry="0.8" fill="${p.dark}"/>`;
            s += `<line x1="${cx-13}" y1="25" x2="${cx-20}" y2="23" stroke="${p.dark}" stroke-width="0.5" opacity="0.5"/><line x1="${cx-13}" y1="27" x2="${cx-20}" y2="29" stroke="${p.dark}" stroke-width="0.5" opacity="0.5"/>`;
            s += `<line x1="${cx+13}" y1="25" x2="${cx+20}" y2="23" stroke="${p.dark}" stroke-width="0.5" opacity="0.5"/><line x1="${cx+13}" y1="27" x2="${cx+20}" y2="29" stroke="${p.dark}" stroke-width="0.5" opacity="0.5"/>`;
            s += `<path d="M${cx-15} 42 Q${cx-24} 44 ${cx-22} 54" stroke="${p.main}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+15} 42 Q${cx+24} 44 ${cx+22} 54" stroke="${p.main}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
            s += `<circle cx="${cx-22}" cy="54" r="3" fill="${p.light}"/><circle cx="${cx+22}" cy="54" r="3" fill="${p.light}"/>`;
            s += `<path d="M${cx-7} 66 L${cx-9} 80" stroke="${p.main}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+7} 66 L${cx+9} 80" stroke="${p.main}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
            s += `<ellipse cx="${cx-9}" cy="81" rx="4.5" ry="2" fill="${p.dark}"/><ellipse cx="${cx+9}" cy="81" rx="4.5" ry="2" fill="${p.dark}"/>`;
        } else {
            // Lion aquatique majestueux — crinière de vagues, queue sirène
            s += `<circle cx="${cx}" cy="40" r="10" fill="${p.accent}" opacity="0.1"><animate attributeName="r" dur="2s" repeatCount="indefinite" values="10;14;10"/></circle>`;
            s += `<path d="M${cx+12} 48 Q${cx+24} 40 ${cx+28} 28 L${cx+32} 22 L${cx+26} 30 L${cx+30} 18 L${cx+24} 32 Q${cx+16} 44 ${cx+12} 48" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += `<ellipse cx="${cx}" cy="45" rx="19" ry="23" fill="${p.main}" stroke="${p.dark}" stroke-width="1.2"/>`;
            s += `<ellipse cx="${cx}" cy="47" rx="10.5" ry="12" fill="${p.belly}"/>`;
            s += `<path d="M${cx-19} 28 Q${cx-24} 22 ${cx-18} 18 Q${cx-5} 24 ${cx+5} 24 Q${cx+18} 18 ${cx+24} 22 Q${cx+19} 28 ${cx+18} 32" fill="${p.accent}" opacity="0.5" stroke="${p.dark}" stroke-width="0.3"/>`;
            s += `<path d="M${cx-16} 30 Q${cx-20} 26 ${cx-15} 22 Q${cx-4} 26 ${cx+4} 26 Q${cx+15} 22 ${cx+20} 26 Q${cx+16} 30 ${cx+15} 33" fill="${p.light}" opacity="0.3"/>`;
            s += `<circle cx="${cx}" cy="18" r="15" fill="${p.main}" stroke="${p.dark}" stroke-width="1.2"/>`;
            s += `<path d="M${cx-14} 16 L${cx-20} 4 L${cx-10} 12 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += `<path d="M${cx+14} 16 L${cx+20} 4 L${cx+10} 12 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += this._eyes(cx, 17, 2.2, mood);
            s += `<ellipse cx="${cx}" cy="22" rx="1.5" ry="1" fill="${p.dark}"/>`;
            s += `<line x1="${cx-15}" y1="18" x2="${cx-23}" y2="16" stroke="${p.dark}" stroke-width="0.5" opacity="0.5"/><line x1="${cx-15}" y1="20" x2="${cx-23}" y2="22" stroke="${p.dark}" stroke-width="0.5" opacity="0.5"/><line x1="${cx-15}" y1="22" x2="${cx-22}" y2="25" stroke="${p.dark}" stroke-width="0.3" opacity="0.3"/>`;
            s += `<line x1="${cx+15}" y1="18" x2="${cx+23}" y2="16" stroke="${p.dark}" stroke-width="0.5" opacity="0.5"/><line x1="${cx+15}" y1="20" x2="${cx+23}" y2="22" stroke="${p.dark}" stroke-width="0.5" opacity="0.5"/><line x1="${cx+15}" y1="22" x2="${cx+22}" y2="25" stroke="${p.dark}" stroke-width="0.3" opacity="0.3"/>`;
            s += `<path d="M${cx-19} 36 Q${cx-32} 38 ${cx-30} 52" stroke="${p.main}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+19} 36 Q${cx+32} 38 ${cx+30} 52" stroke="${p.main}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
            s += `<circle cx="${cx-30}" cy="52" r="4" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/><circle cx="${cx+30}" cy="52" r="4" fill="${p.light}" stroke="${p.dark}" stroke-width="0.5"/>`;
            s += `<path d="M${cx-9} 67 L${cx-11} 84" stroke="${p.main}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
            s += `<path d="M${cx+9} 67 L${cx+11} 84" stroke="${p.main}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
            s += `<ellipse cx="${cx-11}" cy="85" rx="5.5" ry="2.5" fill="${p.dark}"/><ellipse cx="${cx+11}" cy="85" rx="5.5" ry="2.5" fill="${p.dark}"/>`;
        }
        return s;
    },

    buildSVG(size, options = {}) {
        const data = options.creatureData || this.getData();
        const type = data.type || 'fire';
        const form = data.form !== undefined ? data.form : this.getForm();
        const mood = options.mood || this.getMood();
        const src = '/assets/creatures/' + type + '_' + form + '.png?v=2';

        return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" class="creature-svg ' + (mood === 'celebrating' ? 'creature-bounce' : '') + '" style="overflow:visible">'
            + '<g><animateTransform attributeName="transform" type="translate" values="0,0;0,-1;0,0" dur="2.5s" repeatCount="indefinite"/>'
            + '<image href="' + src + '" x="5" y="5" width="90" height="90" style="image-rendering:auto"/>'
            + '</g></svg>';
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
