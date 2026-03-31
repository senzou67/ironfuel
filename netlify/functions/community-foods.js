const admin = require('firebase-admin');
if (!admin.apps.length) {
    try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID });
    } catch {}
}
function getDb() { try { return admin.firestore(); } catch { return null; } }

const ALLOWED_ORIGIN = process.env.URL || 'https://1food.fr';
const BANNED_WORDS = ['fuck','shit','merde','putain','bite','couille','porn','xxx','sex','nazi','hitler','drogue','drug','cocaine','heroin','weed','cannabis'];

function isValidFood(food) {
    if (!food || !food.name || !food.calories) return false;
    const name = food.name.toLowerCase();
    if (BANNED_WORDS.some(w => name.includes(w))) return false;
    if (name.length < 2 || name.length > 100) return false;
    const g = food.grams || 100;
    const cal100 = (food.calories / g) * 100;
    if (cal100 < 0 || cal100 > 1000) return false;
    if (food.protein < 0 || food.carbs < 0 || food.fat < 0) return false;
    return true;
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

    const db = getDb();
    if (!db) return { statusCode: 500, headers, body: JSON.stringify({ error: 'DB not configured' }) };

    const action = event.queryStringParameters?.action || 'search';

    try {
        // SEARCH — find foods by name
        if (action === 'search' && event.httpMethod === 'GET') {
            const query = (event.queryStringParameters?.q || '').toLowerCase().trim();
            if (!query || query.length < 2) return { statusCode: 200, headers, body: JSON.stringify({ foods: [] }) };

            const snap = await db.collection('community_foods').where('nameLower', '>=', query).where('nameLower', '<=', query + '\uf8ff').limit(20).get();
            const foods = [];
            snap.forEach(doc => {
                const d = doc.data();
                foods.push({ id: doc.id, name: d.name, calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat, fiber: d.fiber || 0, grams: d.grams || 100, barcode: d.barcode || null, source: d.source || 'community', votes: d.votes || 0 });
            });
            return { statusCode: 200, headers, body: JSON.stringify({ foods }) };
        }

        // ADD — contribute a food
        if (action === 'add' && event.httpMethod === 'POST') {
            const food = JSON.parse(event.body || '{}');
            if (!isValidFood(food)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid food' }) };

            const nameLower = food.name.toLowerCase().trim();
            // Check if already exists (by name or barcode)
            let existing = null;
            if (food.barcode) {
                const snap = await db.collection('community_foods').where('barcode', '==', food.barcode).limit(1).get();
                if (!snap.empty) existing = snap.docs[0];
            }
            if (!existing) {
                const snap = await db.collection('community_foods').where('nameLower', '==', nameLower).limit(1).get();
                if (!snap.empty) existing = snap.docs[0];
            }

            if (existing) {
                // Already exists — increment vote count (user confirms data is correct)
                await existing.ref.update({ votes: admin.firestore.FieldValue.increment(1), lastSeen: new Date().toISOString() });
                return { statusCode: 200, headers, body: JSON.stringify({ status: 'voted', id: existing.id }) };
            }

            // New food — add to collection
            const doc = await db.collection('community_foods').add({
                name: food.name.substring(0, 100),
                nameLower,
                barcode: food.barcode || null,
                calories: Math.round(food.calories),
                protein: Math.round((food.protein || 0) * 10) / 10,
                carbs: Math.round((food.carbs || 0) * 10) / 10,
                fat: Math.round((food.fat || 0) * 10) / 10,
                fiber: Math.round((food.fiber || 0) * 10) / 10,
                grams: food.grams || 100,
                source: food.source || 'user',
                votes: 1,
                createdAt: new Date().toISOString(),
                lastSeen: new Date().toISOString()
            });
            return { statusCode: 200, headers, body: JSON.stringify({ status: 'added', id: doc.id }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
