// === NUTRITION LOOKUP — USDA + Open Food Facts ===
// Looks up verified nutrition data for identified foods.
// Priority: USDA FoodData Central > Open Food Facts > Gemini fallback

const USDA_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';

// In-memory cache (survives across warm invocations, ~5-10min on Netlify)
const _cache = {};
function _cached(key, ttlMs, fn) {
    const entry = _cache[key];
    if (entry && Date.now() - entry.ts < ttlMs) return Promise.resolve(entry.val);
    return fn().then(val => { _cache[key] = { val, ts: Date.now() }; return val; });
}

// Search USDA FoodData Central for a food by English name
async function searchUSDA(query) {
    try {
        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_KEY}&query=${encodeURIComponent(query)}&dataType=Foundation,SR%20Legacy&pageSize=5`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.foods?.length) return null;

        // Pick best match: prefer result whose description contains the query words
        const queryWords = query.toLowerCase().split(/\s+/);
        let food = data.foods[0]; // default to first
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

// Search Open Food Facts for a food by French name
async function searchOFF(query) {
    try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=3&fields=product_name,nutriments`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const product = data.products?.[0];
        if (!product || !product.nutriments) return null;

        const n = product.nutriments;
        // OFF values are per 100g
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

// Enrich a food item identified by Gemini with verified nutrition data
// food: { name, name_en, weight_g, calories, protein, carbs, fat, fiber }
async function enrichFood(food) {
    const weight = food.weight_g || 100;
    const factor = weight / 100;

    // 1. Try USDA (most accurate, English name) — cached 1h
    if (food.name_en) {
        const usda = await _cached('usda:' + food.name_en.toLowerCase(), 3600000, () => searchUSDA(food.name_en));
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
            // Include micro-nutrients if available
            if (usda.micros) {
                result.micros = {};
                for (const [k, v] of Object.entries(usda.micros)) {
                    result.micros[k] = Math.round(v * factor * 10) / 10;
                }
            }
            return result;
        }
    }

    // 2. Try Open Food Facts (French name) — cached 1h
    const off = await _cached('off:' + food.name.toLowerCase(), 3600000, () => searchOFF(food.name));
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

    // 3. Fallback: Gemini estimates (already in the food object)
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

// Enrich multiple foods in parallel
async function enrichFoods(foods) {
    return Promise.all(foods.map(f => enrichFood(f)));
}

module.exports = { searchUSDA, searchOFF, enrichFood, enrichFoods };
