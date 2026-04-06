const OpenFoodFactsService = {
    async getProduct(barcode) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let response;
        try {
            response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, { signal: controller.signal });
        } finally {
            clearTimeout(timeout);
        }
        if (!response.ok) throw new Error('Produit non trouvé');

        const data = await response.json();
        if (data.status !== 1 || !data.product) {
            throw new Error('Produit non trouvé dans la base de données');
        }

        const p = data.product;
        const n = p.nutriments || {};

        return {
            name: p.product_name_fr || p.product_name || 'Produit inconnu',
            brand: p.brands || '',
            image: p.image_front_url || '',
            serving: p.serving_size || '100g',
            nutrition: {
                calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
                protein: Math.round((n.proteins_100g || 0) * 10) / 10,
                carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
                fat: Math.round((n.fat_100g || 0) * 10) / 10,
                fiber: Math.round((n.fiber_100g || 0) * 10) / 10,
                sugar: Math.round((n.sugars_100g || 0) * 10) / 10,
                salt: Math.round((n.salt_100g || 0) * 10) / 10
            },
            nutriscore: p.nutriscore_grade || null,
            categories: p.categories || ''
        };
    },

    // Cache for online search results
    _searchCache: {},

    async searchProducts(query, page = 1) {
        const cacheKey = query.toLowerCase().trim() + '_' + page;

        // Check cache (1 hour TTL)
        const cached = this._searchCache[cacheKey];
        if (cached && (Date.now() - cached.time) < 3600000) {
            return cached.data;
        }

        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=15&page=${page}&lc=fr&fields=product_name_fr,product_name,brands,image_front_small_url,nutriments,nutriscore_grade,code`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let response;
        try {
            response = await fetch(url, { signal: controller.signal });
        } finally {
            clearTimeout(timeout);
        }
        if (!response.ok) throw new Error('Erreur de recherche');
        const data = await response.json();

        const results = (data.products || [])
            .filter(p => (p.product_name_fr || p.product_name) && p.nutriments)
            .map(p => {
                const n = p.nutriments || {};
                return {
                    name: p.product_name_fr || p.product_name || 'Inconnu',
                    brand: p.brands || '',
                    image: p.image_front_small_url || '',
                    barcode: p.code,
                    nutriscore: p.nutriscore_grade,
                    n: [
                        Math.round(n['energy-kcal_100g'] || 0),
                        Math.round((n.proteins_100g || 0) * 10) / 10,
                        Math.round((n.carbohydrates_100g || 0) * 10) / 10,
                        Math.round((n.fat_100g || 0) * 10) / 10,
                        Math.round((n.fiber_100g || 0) * 10) / 10
                    ],
                    isOnline: true
                };
            });

        // Cache results
        this._searchCache[cacheKey] = { data: results, time: Date.now() };

        return results;
    }
};
