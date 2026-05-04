// Proxy Open Food Facts search via the worker — bypasses browser CORS issues
// when world.openfoodfacts.org doesn't return Access-Control-Allow-Origin
// for /cgi/search.pl.
import { jsonResponse, errorResponse } from './_shared.js';

export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;

    if (!query || query.length < 2) {
        return jsonResponse({ products: [] });
    }
    if (query.length > 80) {
        return errorResponse('Requête trop longue.', 400);
    }

    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl`
        + `?search_terms=${encodeURIComponent(query)}`
        + `&json=1&page_size=15&page=${page}&lc=fr`
        + `&fields=product_name_fr,product_name,brands,image_front_small_url,nutriments,nutriscore_grade,code`;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    try {
        const res = await fetch(offUrl, {
            // Open Food Facts asks every API consumer to identify itself.
            // Without a sensible User-Agent some requests get throttled.
            headers: { 'User-Agent': 'OneFood/1.0 (https://1food.fr; contact@1food.fr)' },
            signal: ac.signal
        });
        if (!res.ok) {
            return errorResponse(`Open Food Facts indisponible (${res.status}).`, 502);
        }
        const data = await res.json();

        // Normalize to the same shape OpenFoodFactsService.searchProducts already
        // produced from the direct call, so the client doesn't need to change.
        const products = (data.products || [])
            .filter(p => (p.product_name_fr || p.product_name) && p.nutriments)
            .slice(0, 15)
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

        // Cache for 1h at the edge — same query repeated in the same hour
        // is served instantly without hitting OFF again.
        return new Response(JSON.stringify({ products }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600'
            }
        });
    } catch (e) {
        if (e.name === 'AbortError') {
            return errorResponse('Open Food Facts a mis trop de temps à répondre.', 504);
        }
        console.error('[search-online] error:', e.message);
        return errorResponse('Recherche en ligne indisponible.', 502);
    } finally {
        clearTimeout(timer);
    }
}
