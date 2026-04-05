import { getDb, jsonResponse, errorResponse, initFirebase } from './_shared.js';
import admin from 'firebase-admin';

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

export async function onRequestGet(context) {
    const db = getDb(context.env);
    if (!db) return errorResponse('DB not configured');

    const url = new URL(context.request.url);
    const query = (url.searchParams.get('q') || '').toLowerCase().trim();
    if (!query || query.length < 2) return jsonResponse({ foods: [] });

    const snap = await db.collection('community_foods').where('nameLower', '>=', query).where('nameLower', '<=', query + '\uf8ff').limit(20).get();
    const foods = [];
    snap.forEach(doc => {
        const d = doc.data();
        foods.push({ id: doc.id, name: d.name, calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat, fiber: d.fiber || 0, grams: d.grams || 100, barcode: d.barcode || null, source: d.source || 'community', votes: d.votes || 0 });
    });
    return jsonResponse({ foods });
}

export async function onRequestPost(context) {
    initFirebase(context.env);
    const db = getDb(context.env);
    if (!db) return errorResponse('DB not configured');

    const food = await context.request.json();
    if (!isValidFood(food)) return errorResponse('Invalid food', 400);

    const nameLower = food.name.toLowerCase().trim();
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
        await existing.ref.update({ votes: admin.firestore.FieldValue.increment(1), lastSeen: new Date().toISOString() });
        return jsonResponse({ status: 'voted', id: existing.id });
    }

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
    return jsonResponse({ status: 'added', id: doc.id });
}
