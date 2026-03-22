// Food Image Service — Fetches and caches real food photos from OpenFoodFacts
// Uses curated Wikimedia Commons images for basic/raw foods (fruits, vegetables, meats, etc.)
const FoodImageService = {
    _cache: null,
    _pending: {},
    _CACHE_KEY: 'ironfuel_food_images',
    _CACHE_TTL: 7 * 24 * 3600 * 1000, // 7 days

    // Curated images for basic/raw foods — Wikimedia Commons via Special:FilePath (stable redirect URLs)
    // All URLs verified working — 120px thumbnails for fast loading
    _W: 'https://commons.wikimedia.org/wiki/Special:FilePath/',
    get _curated() {
        const w = this._W;
        return {
            // Fruits
            'pomme': w + 'Red_Apple.jpg?width=120',
            'banane': w + 'Banana-Single.jpg?width=120',
            'orange': w + 'Oranges_-_whole-halved-segment.jpg?width=120',
            'fraise': w + 'PerfectStrawberry.jpg?width=120',
            'raisin': w + 'Table_grapes_on_white.jpg?width=120',
            'poire': w + 'Pear_(Nashpati).JPG?width=120',
            'peche': w + 'Peaches.jpg?width=120',
            'mangue': w + 'Hapus_Mango.jpg?width=120',
            'ananas': w + 'Pineapple_and_cross_section.jpg?width=120',
            'kiwi': w + 'Kiwi_aka.jpg?width=120',
            'cerise': w + 'Cherry_Stella444.jpg?width=120',
            'pasteque': w + 'Watermelon_cross_BNC.jpg?width=120',
            'melon': w + 'Muskmelon.jpg?width=120',
            'citron': w + 'Lemon.jpg?width=120',
            'abricot': w + 'Apricot_and_cross_section.jpg?width=120',
            'myrtille': w + 'Blueberries.jpg?width=120',
            'framboise': w + 'Raspberries05.jpg?width=120',
            'avocat': w + 'Avocado_Hass_-_single_and_halved.jpg?width=120',
            'grenade': w + 'Pomegranate03_edit.jpg?width=120',
            // Légumes
            'carotte': w + 'Daucus_carota.jpg?width=120',
            'tomate': w + 'Tomato_je.jpg?width=120',
            'courgette': w + 'Zucchini-Whole.jpg?width=120',
            'brocoli': w + 'Broccoli_and_cross_section_edit.jpg?width=120',
            'epinard': w + 'Spinach_leaves.jpg?width=120',
            'haricot vert': w + 'GreenBeans.jpg?width=120',
            'poivron': w + 'Red_capsicum_and_cross_section.jpg?width=120',
            'oignon': w + 'Mixed_onions.jpg?width=120',
            'ail': w + 'Garlic.jpg?width=120',
            'chou-fleur': w + 'Cauliflower.JPG?width=120',
            'concombre': w + 'ARS_cucumber.jpg?width=120',
            'aubergine': w + 'Eggplant_display.JPG?width=120',
            'champignon': w + 'White_mushroom.jpg?width=120',
            'salade': w + 'Iceberg_lettuce_in_SB.jpg?width=120',
            'pomme de terre': w + 'Patates.jpg?width=120',
            'patate douce': w + 'Ipomoea_batatas_006.JPG?width=120',
            // Viandes & Protéines
            'poulet': w + 'Roast_chicken.jpg?width=120',
            'boeuf': w + 'Steak_03_bg_040306.jpg?width=120',
            'porc': w + 'Pork.jpg?width=120',
            'saumon': w + 'SalsaSalmon.jpg?width=120',
            'thon': w + 'Tuna_steak.jpg?width=120',
            'oeuf': w + 'Chicken_eggs_2009-04-05.jpg?width=120',
            'oeufs': w + 'Chicken_eggs_2009-04-05.jpg?width=120',
            // Féculents
            'riz': w + 'White_rice_(Oryza_sativa)_in_a_bowl.jpg?width=120',
            'pates': w + 'Pasta_2006_1.jpg?width=120',
            'pain': w + 'Fresh_made_bread_05.jpg?width=120',
            'quinoa': w + 'Quinoa_closeup.jpg?width=120',
            // Produits laitiers
            'lait': w + 'Milk_glass.jpg?width=120',
            'fromage': w + 'Camembert_de_Normandie_(AOP)_12.jpg?width=120',
            'beurre': w + 'NCI_butter.jpg?width=120',
            'yaourt': w + 'Joghurt.jpg?width=120',
            // Noix
            'amande': w + 'Mandel_Gr_99.jpg?width=120',
            'noix': w + 'Walnuts.jpg?width=120',
            'noisette': w + 'Hazelnuts.jpg?width=120',
        };
    },

    // Load cache from localStorage
    _loadCache() {
        if (this._cache) return this._cache;
        try {
            const raw = localStorage.getItem(this._CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Purge expired entries
                const now = Date.now();
                const cleaned = {};
                for (const [k, v] of Object.entries(parsed)) {
                    if (v.t && (now - v.t) < this._CACHE_TTL) {
                        cleaned[k] = v;
                    }
                }
                this._cache = cleaned;
            } else {
                this._cache = {};
            }
        } catch {
            this._cache = {};
        }
        return this._cache;
    },

    _saveCache() {
        try {
            // Keep max 300 entries to avoid localStorage bloat
            const entries = Object.entries(this._cache);
            if (entries.length > 300) {
                entries.sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
                this._cache = Object.fromEntries(entries.slice(0, 300));
            }
            localStorage.setItem(this._CACHE_KEY, JSON.stringify(this._cache));
        } catch { /* storage full — ignore */ }
    },

    // Check curated dictionary for a food name (matches base name without parentheses)
    _getCurated(foodName) {
        const clean = foodName.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s*\(.*?\)\s*/g, '')  // Remove (cuit), (cru), etc.
            .trim();

        // Direct match
        if (this._curated[clean]) return this._curated[clean];

        // Match first word (e.g. "Poulet (blanc)" → "poulet")
        const firstWord = clean.split(/\s+/)[0];
        if (this._curated[firstWord]) return this._curated[firstWord];

        // Match first two words (e.g. "Pomme de terre" → "pomme de terre")
        const words = clean.split(/\s+/);
        for (let i = words.length; i >= 2; i--) {
            const partial = words.slice(0, i).join(' ');
            if (this._curated[partial]) return this._curated[partial];
        }

        return null;
    },

    // Get cached image URL (sync — returns null if not cached)
    getCachedImage(foodName) {
        // Check curated first (instant, no fetch needed)
        const curated = this._getCurated(foodName);
        if (curated) return curated;

        const cache = this._loadCache();
        const key = this._normalizeKey(foodName);
        const entry = cache[key];
        if (entry && entry.u) return entry.u;
        return null;
    },

    // Fetch image for a food name (async, with dedup)
    async fetchImage(foodName) {
        // Curated images don't need fetch
        const curated = this._getCurated(foodName);
        if (curated) return curated;

        if (!navigator.onLine) return null;

        const key = this._normalizeKey(foodName);
        const cache = this._loadCache();

        // Already cached
        if (cache[key]) return cache[key].u || null;

        // Already fetching this one
        if (this._pending[key]) return this._pending[key];

        const promise = this._doFetch(foodName, key);
        this._pending[key] = promise;

        try {
            const url = await promise;
            return url;
        } finally {
            delete this._pending[key];
        }
    },

    async _doFetch(foodName, key) {
        try {
            // Search OFF for the food with a small result set
            const searchName = foodName
                .replace(/\s*\(.*?\)\s*/g, ' ')  // Remove parentheses content like "(cuit)"
                .replace(/\s+/g, ' ')
                .trim();

            const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchName)}&json=1&page_size=10&lc=fr&fields=product_name_fr,product_name,image_front_small_url,image_url`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('fetch failed');

            const data = await response.json();
            const products = data.products || [];

            // Find best product with an image — prefer those whose name closely matches
            let imageUrl = null;
            const searchLower = searchName.toLowerCase();

            // Pass 1: find product whose name contains our search term
            for (const p of products) {
                const img = p.image_front_small_url || p.image_url;
                if (!img) continue;
                const pName = (p.product_name_fr || p.product_name || '').toLowerCase();
                if (pName.includes(searchLower) || searchLower.includes(pName)) {
                    imageUrl = img;
                    break;
                }
            }

            // Pass 2: fallback to any product with an image
            if (!imageUrl) {
                for (const p of products) {
                    const img = p.image_front_small_url || p.image_url;
                    if (img) { imageUrl = img; break; }
                }
            }

            // Cache result (even null to avoid re-fetching)
            this._cache[key] = { u: imageUrl, t: Date.now() };
            this._saveCache();

            return imageUrl;
        } catch {
            // Cache as null so we don't retry immediately
            this._cache[key] = { u: null, t: Date.now() };
            this._saveCache();
            return null;
        }
    },

    // Rate-limited queue for OFF API requests
    _queue: [],
    _activeRequests: 0,
    _MAX_CONCURRENT: 2,
    _REQUEST_DELAY: 300, // ms between requests

    _processQueue() {
        while (this._queue.length > 0 && this._activeRequests < this._MAX_CONCURRENT) {
            const task = this._queue.shift();
            this._activeRequests++;
            task().finally(() => {
                this._activeRequests--;
                // Small delay before processing next to respect rate limits
                setTimeout(() => this._processQueue(), this._REQUEST_DELAY);
            });
        }
    },

    // Batch fetch images for multiple foods (fire-and-forget, updates DOM when ready)
    fetchAndRender(foods) {
        if (!navigator.onLine) return;

        // Filter to only foods that need fetching (max 10 per batch to avoid overwhelming)
        const toFetch = [];
        for (const food of foods) {
            if (toFetch.length >= 10) break;
            if (this._getCurated(food.name)) continue;
            const key = this._normalizeKey(food.name);
            const cache = this._loadCache();
            if (cache[key]) continue;
            toFetch.push(food);
        }

        // Add to rate-limited queue
        toFetch.forEach(food => {
            this._queue.push(() => {
                return this.fetchImage(food.name).then(imageUrl => {
                    if (imageUrl) {
                        const thumbs = document.querySelectorAll(`.food-thumb[data-food-id="${food.id}"]`);
                        thumbs.forEach(thumb => {
                            const img = document.createElement('img');
                            img.src = imageUrl;
                            img.alt = '';
                            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:8px';
                            img.onerror = () => img.remove();
                            thumb.textContent = '';
                            thumb.appendChild(img);
                            thumb.style.background = 'none';
                            thumb.style.border = 'none';
                        });
                    }
                });
            });
        });

        this._processQueue();
    },

    _normalizeKey(name) {
        return name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 40);
    }
};
