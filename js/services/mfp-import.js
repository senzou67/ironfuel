// ===== MYFITNESSPAL CSV IMPORTER =====
// Parses MFP export CSV and converts rows into OneFood food entries.
//
// MFP export format (Premium → Settings → Export Data → CSV) typically :
//   Date,Meal,Food,Calories,Fat (g),Carbohydrates (g),Protein (g),
//   Cholesterol (mg),Sodium (mg),Sugars (g),Fiber (g),Note
//
// Variations seen :
//   - "kcal" instead of "Calories" on older exports
//   - Optional "Note" column at the end
//   - Quoted food names containing commas
//   - UTF-8 BOM at file start
//
// The parser is permissive : missing optional macros default to 0,
// rows with no Food name or no Calories are skipped (logged).
const MFPImportService = {
    // Map MFP meal names → OneFood meal IDs.
    _MEAL_MAP: {
        'breakfast': 'breakfast',
        'lunch': 'lunch',
        'dinner': 'dinner',
        'snack': 'snack',
        'snacks': 'snack',
        'collation': 'snack',
        'petit-déjeuner': 'breakfast',
        'petit-dejeuner': 'breakfast',
        'déjeuner': 'lunch',
        'dejeuner': 'lunch',
        'dîner': 'dinner',
        'diner': 'dinner'
    },

    // Header keywords → canonical field name.
    _HEADER_MAP: {
        'date': 'date',
        'meal': 'meal',
        'repas': 'meal',
        'food': 'food',
        'aliment': 'food',
        'calories': 'calories',
        'kcal': 'calories',
        'energy': 'calories',
        'energie': 'calories',
        'fat': 'fat',
        'fat (g)': 'fat',
        'lipides': 'fat',
        'lipides (g)': 'fat',
        'carbohydrates': 'carbs',
        'carbohydrates (g)': 'carbs',
        'carbs': 'carbs',
        'glucides': 'carbs',
        'glucides (g)': 'carbs',
        'protein': 'protein',
        'protein (g)': 'protein',
        'protéines': 'protein',
        'proteines': 'protein',
        'protéines (g)': 'protein',
        'fiber': 'fiber',
        'fiber (g)': 'fiber',
        'fibres': 'fiber',
        'fibres (g)': 'fiber'
    },

    // State-machine CSV parser. Returns 2D array of strings.
    // Handles quoted fields with commas, escaped quotes ("" inside ""),
    // CRLF/LF line endings. Strips UTF-8 BOM.
    parseCSV(text) {
        if (!text) return [];
        // Strip BOM
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

        const rows = [];
        let row = [];
        let field = '';
        let inQuotes = false;
        const len = text.length;

        for (let i = 0; i < len; i++) {
            const c = text[i];
            if (inQuotes) {
                if (c === '"') {
                    if (text[i + 1] === '"') { field += '"'; i++; }
                    else { inQuotes = false; }
                } else {
                    field += c;
                }
            } else {
                if (c === '"') { inQuotes = true; }
                else if (c === ',') { row.push(field); field = ''; }
                else if (c === '\n' || c === '\r') {
                    // End of row. Push field; skip \r\n pair.
                    row.push(field); field = '';
                    if (row.length > 1 || row[0] !== '') rows.push(row);
                    row = [];
                    if (c === '\r' && text[i + 1] === '\n') i++;
                } else {
                    field += c;
                }
            }
        }
        // Tail
        if (field !== '' || row.length > 0) {
            row.push(field);
            if (row.length > 1 || row[0] !== '') rows.push(row);
        }
        return rows;
    },

    // Map a header row to column indices. Returns object like
    // { date: 0, meal: 1, food: 2, calories: 3, ... }.
    // Throws if required columns (date, meal, food, calories) are missing.
    _mapHeaders(headerRow) {
        const cols = {};
        headerRow.forEach((h, idx) => {
            const key = String(h).trim().toLowerCase();
            const canonical = this._HEADER_MAP[key];
            if (canonical && cols[canonical] === undefined) cols[canonical] = idx;
        });
        const required = ['date', 'meal', 'food', 'calories'];
        const missing = required.filter(k => cols[k] === undefined);
        if (missing.length > 0) {
            throw new Error(`Colonnes manquantes : ${missing.join(', ')}. Le CSV doit contenir Date, Meal, Food, Calories.`);
        }
        return cols;
    },

    // Parse a single value as a positive number, returning 0 if invalid.
    // Accepts French decimal comma (e.g. "12,5") as well as dot.
    _num(s) {
        if (s === undefined || s === null || s === '') return 0;
        const n = parseFloat(String(s).replace(',', '.').replace(/[^\d.\-]/g, ''));
        return (isNaN(n) || n < 0) ? 0 : n;
    },

    // Parse a date string in any common format → 'YYYY-MM-DD' or null.
    // MFP exports YYYY-MM-DD by default but some users export DD/MM/YYYY.
    _parseDate(s) {
        if (!s) return null;
        s = String(s).trim();
        // ISO YYYY-MM-DD
        const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
        // DD/MM/YYYY or DD-MM-YYYY
        const eu = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (eu) return `${eu[3]}-${eu[2].padStart(2, '0')}-${eu[1].padStart(2, '0')}`;
        // MM/DD/YYYY (US) — ambiguous, but MFP exports ISO so this is fallback
        const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
        return null;
    },

    _mealId(mfpMeal) {
        const k = String(mfpMeal || '').trim().toLowerCase();
        return this._MEAL_MAP[k] || 'snack';
    },

    // Main parse entry point. Returns { entries, summary, errors }.
    //   entries: array of OneFood food objects, ready to addFoodToMeal()
    //   summary: { count, dateMin, dateMax, totalCalories, mealBreakdown }
    //   errors:  array of row-level warnings (out-of-range, missing fields)
    parse(text) {
        const rows = this.parseCSV(text);
        if (rows.length < 2) {
            return {
                entries: [],
                summary: { count: 0, dateMin: null, dateMax: null, totalCalories: 0, mealBreakdown: {} },
                errors: ['Fichier vide ou sans en-têtes.']
            };
        }
        const cols = this._mapHeaders(rows[0]); // throws on missing required cols

        const entries = [];
        const errors = [];
        const breakdown = {};
        let totalCalories = 0;
        let dateMin = null;
        let dateMax = null;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            const date = this._parseDate(row[cols.date]);
            const food = String(row[cols.food] || '').trim();
            const calories = this._num(row[cols.calories]);

            if (!date) { errors.push(`Ligne ${i + 1} : date invalide → ignorée`); continue; }
            if (!food) { errors.push(`Ligne ${i + 1} : nom d'aliment vide → ignorée`); continue; }
            if (calories <= 0) { errors.push(`Ligne ${i + 1} : "${food.substring(0, 30)}" — calories invalides → ignorée`); continue; }
            if (calories > 5000) { errors.push(`Ligne ${i + 1} : "${food.substring(0, 30)}" — ${calories} kcal aberrant → ignorée`); continue; }

            const mealId = this._mealId(row[cols.meal]);
            const entry = {
                name: food.substring(0, 100),
                calories: Math.round(calories),
                protein: this._num(row[cols.protein]),
                carbs: this._num(row[cols.carbs]),
                fat: this._num(row[cols.fat]),
                fiber: cols.fiber !== undefined ? this._num(row[cols.fiber]) : 0,
                grams: 100,                   // MFP rows are per-serving but we don't know the gram weight; treat as a fixed entry
                _mfpImport: true,             // tag for debugging / re-import detection
                _date: date,
                _mealId: mealId
            };
            entries.push(entry);
            totalCalories += entry.calories;
            breakdown[mealId] = (breakdown[mealId] || 0) + 1;
            if (!dateMin || date < dateMin) dateMin = date;
            if (!dateMax || date > dateMax) dateMax = date;
        }

        return {
            entries,
            summary: {
                count: entries.length,
                dateMin,
                dateMax,
                totalCalories,
                mealBreakdown: breakdown,
                errorCount: errors.length
            },
            errors
        };
    },

    // Import parsed entries into Storage. Returns { imported, skippedExisting }.
    // Idempotent : marks each imported entry with _mfpImport=true so a re-run
    // won't double-add (compares name+date+meal+calories).
    async importEntries(entries, { onProgress } = {}) {
        let imported = 0;
        let skippedExisting = 0;
        const total = entries.length;
        const byDate = {};
        entries.forEach(e => {
            const k = e._date;
            if (!byDate[k]) byDate[k] = [];
            byDate[k].push(e);
        });

        const dates = Object.keys(byDate).sort();
        let processed = 0;
        for (const date of dates) {
            const log = Storage.getDayLog(new Date(date + 'T12:00:00')); // noon to avoid TZ edges
            const dayEntries = byDate[date];
            for (const entry of dayEntries) {
                const mealId = entry._mealId;
                if (!log.meals[mealId]) log.meals[mealId] = [];

                // Idempotency : skip if exact match already exists for the same day+meal
                const exists = log.meals[mealId].some(f =>
                    f._mfpImport && f.name === entry.name && f.calories === entry.calories
                );
                if (exists) { skippedExisting++; processed++; continue; }

                const clean = {
                    id: Date.now() + Math.random(),
                    name: entry.name,
                    calories: entry.calories,
                    protein: entry.protein,
                    carbs: entry.carbs,
                    fat: entry.fat,
                    fiber: entry.fiber,
                    grams: entry.grams,
                    _mfpImport: true
                };
                log.meals[mealId].push(clean);
                imported++;
                processed++;
                if (onProgress) onProgress(processed, total);
            }
            // Persist the day once after all entries for that date
            Storage.setDayLog(log);
        }
        return { imported, skippedExisting };
    }
};
