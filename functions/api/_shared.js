// Shared utilities for Cloudflare Workers Functions
import admin from 'firebase-admin';

let _adminInitialized = false;

export function initFirebase(env) {
    if (_adminInitialized && admin.apps.length) return admin;
    try {
        const sa = env.FIREBASE_SERVICE_ACCOUNT;
        if (sa && !admin.apps.length) {
            const cert = JSON.parse(sa);
            admin.initializeApp({
                credential: admin.credential.cert(cert),
                projectId: cert.project_id || env.FIREBASE_PROJECT_ID
            });
        }
        _adminInitialized = true;
        return admin.apps.length ? admin : null;
    } catch {
        return null;
    }
}

export function getDb(env) {
    const a = initFirebase(env);
    if (!a) return null;
    try { return a.firestore(); } catch { return null; }
}

export async function verifyAuth(request, env) {
    const a = initFirebase(env);
    if (!a) return true; // No admin SDK = skip auth (dev mode)
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return false;
    try {
        await a.auth().verifyIdToken(token);
        return true;
    } catch {
        return false;
    }
}

// Lightweight auth check: just verify a token is present (no Firebase verification)
// Use this for endpoints where Firebase Admin may not work in Workers env
export function hasAuthToken(request) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    return token.length > 20; // A real Firebase token is always 800+ chars
}

// Simple rate limiter using KV (if available)
export async function checkRateLimit(env, key, maxPerHour) {
    if (!env.RATE_LIMIT_KV) return true; // No KV bound = allow
    const now = Date.now();
    const hour = Math.floor(now / 3600000);
    const kvKey = `rl:${key}:${hour}`;
    try {
        const val = await env.RATE_LIMIT_KV.get(kvKey);
        const count = val ? parseInt(val) : 0;
        if (count >= maxPerHour) return false;
        await env.RATE_LIMIT_KV.put(kvKey, String(count + 1), { expirationTtl: 7200 });
        return true;
    } catch {
        return true; // KV error = allow
    }
}

export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export function errorResponse(message, status = 500) {
    return jsonResponse({ error: message }, status);
}
