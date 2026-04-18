// Shared nutrition lookup utility — USDA + Open Food Facts
// Not a route handler, exported for use by analyze.js and analyze-text.js

const USDA_CACHE = {};

function _evictCache() {
    const keys = Object.keys(USDA_CACHE);
    if (keys.length <= 500) return;
    // Sort by timestamp ascending, remove oldest half
    keys.sort((a, b) => USDA_CACHE[a].ts - USDA_CACHE[b].ts);
    const toRemove = Math.floor(keys.length / 2);
    for (let i = 0; i < toRemove; i++) {
        delete USDA_CACHE[keys[i]];
    }
}

function cached(key, ttlMs, fn) {
    const entry = USDA_CACHE[key];
    if (entry && Date.now() - entry.ts < ttlMs) return Promise.resolve(entry.val);
    return fn().then(val => { USDA_CACHE[key] = { val, ts: Date.now() }; _evictCache(); return val; });
}

async function searchUSDA(query, apiKey) {
    try {
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&dataType=Foundation,SR%20Legacy&pageSize=5`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.foods?.length) return null;

        const queryWords = query.toLowerCase().split(/\s+/);
        let food = data.foods[0];
        for (const f of data.foods) {
            const desc = f.description.toLowerCase();
            const matches = queryWords.filter(w => desc.includes(w)).length;
            if (matches >= queryWords.length) { food = f; break; }
        }

        const get = (name) => {
            const n = food.foodNutrients?.find(n => n.nutrientName === name);
            return n ? n.value : 0;
        };

        return {
            source: 'usda',
            name_en: food.description,
            per100g: {
                calories: Math.round(get('Energy')),
                protein: Math.round(get('Protein') * 10) / 10,
                carbs: Math.round(get('Carbohydrate, by difference') * 10) / 10,
                fat: Math.round(get('Total lipid (fat)') * 10) / 10,
                fiber: Math.round(get('Fiber, total dietary') * 10) / 10
            },
            micros: {
                vitC: Math.round(get('Vitamin C, total ascorbic acid') * 10) / 10,
                vitD: Math.round(get('Vitamin D (D2 + D3)') * 10) / 10,
                vitE: Math.round(get('Vitamin E (alpha-tocopherol)') * 10) / 10,
                vitA: Math.round(get('Vitamin A, RAE') * 10) / 10,
                vitB12: Math.round(get('Vitamin B-12') * 10) / 10,
                calcium: Math.round(get('Calcium, Ca')),
                iron: Math.round(get('Iron, Fe') * 10) / 10,
                magnesium: Math.round(get('Magnesium, Mg')),
                potassium: Math.round(get('Potassium, K')),
                sodium: Math.round(get('Sodium, Na')),
                zinc: Math.round(get('Zinc, Zn') * 10) / 10
            }
        };
    } catch {
        return null;
    }
}

async function searchOFF(query) {
    try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=3&fields=product_name,nutriments`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const product = data.products?.[0];
        if (!product || !product.nutriments) return null;

        const n = product.nutriments;
        return {
            source: 'openfoodfacts',
            name_off: product.product_name,
            per100g: {
                calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
                protein: Math.round((n.proteins_100g || n.proteins || 0) * 10) / 10,
                carbs: Math.round((n.carbohydrates_100g || n.carbohydrates || 0) * 10) / 10,
                fat: Math.round((n.fat_100g || n.fat || 0) * 10) / 10,
                fiber: Math.round((n.fiber_100g || n.fiber || 0) * 10) / 10
            }
        };
    } catch {
        return null;
    }
}

// Realistic maximum weight (g) for items the AI commonly overestimates.
// Used as a safety clamp: if the AI returns an unreasonable weight, cap it.
// Key is a lowercase substring to match against the food name.
const MAX_SINGLE_UNIT_WEIGHT = {
    'oeuf dur': 55, 'oeuf poche': 55, 'oeuf mollet': 55,
    'oeuf au plat': 60, 'oeuf brouille': 60, 'oeuf coque': 55,
    'hard boiled egg': 55, 'poached egg': 55, 'soft boiled egg': 55,
    'tranche de pain': 35, 'slice of bread': 35,
    'tranche de jambon': 35, 'tranche de fromage': 35,
    'yaourt': 180, 'yogurt': 180,
    'carre de chocolat': 10, 'square of chocolate': 10
};

function _clampWeight(name, weight) {
    if (!weight || !name) return weight;
    const low = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Detect explicit multi-count (e.g. "2 oeufs"). If count is given, allow count*max.
    const countMatch = low.match(/(\d+)\s+/);
    const count = countMatch ? Math.min(parseInt(countMatch[1]) || 1, 12) : 1;
    for (const key of Object.keys(MAX_SINGLE_UNIT_WEIGHT)) {
        if (low.includes(key)) {
            const cap = MAX_SINGLE_UNIT_WEIGHT[key] * count;
            if (weight > cap) return cap;
            return weight;
        }
    }
    return weight;
}

export async function enrichFood(food, apiKey) {
    const originalWeight = food.weight_g || 100;
    const weight = _clampWeight(food.name || food.name_en || '', originalWeight);
    const factor = weight / 100;

    if (food.name_en) {
        const usda = await cached('usda:' + food.name_en.toLowerCase(), 3600000, () => searchUSDA(food.name_en, apiKey));
        if (usda && usda.per100g.calories > 0) {
            const result = {
                name: food.name,
                weight_g: weight,
                calories: Math.round(usda.per100g.calories * factor),
                protein: Math.round(usda.per100g.protein * factor * 10) / 10,
                carbs: Math.round(usda.per100g.carbs * factor * 10) / 10,
                fat: Math.round(usda.per100g.fat * factor * 10) / 10,
                fiber: Math.round(usda.per100g.fiber * factor * 10) / 10,
                source: 'usda'
            };
            if (usda.micros) {
                result.micros = {};
                for (const [k, v] of Object.entries(usda.micros)) {
                    result.micros[k] = Math.round(v * factor * 10) / 10;
                }
            }
            return result;
        }
    }

    const off = await cached('off:' + food.name.toLowerCase(), 3600000, () => searchOFF(food.name));
    if (off && off.per100g.calories > 0) {
        return {
            name: food.name,
            weight_g: weight,
            calories: Math.round(off.per100g.calories * factor),
            protein: Math.round(off.per100g.protein * factor * 10) / 10,
            carbs: Math.round(off.per100g.carbs * factor * 10) / 10,
            fat: Math.round(off.per100g.fat * factor * 10) / 10,
            fiber: Math.round(off.per100g.fiber * factor * 10) / 10,
            source: 'openfoodfacts'
        };
    }

    return {
        name: food.name,
        weight_g: weight,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        fiber: food.fiber || 0,
        source: 'estimate'
    };
}

export async function enrichFoods(foods, apiKey) {
    return Promise.all(foods.map(f => enrichFood(f, apiKey)));
}
