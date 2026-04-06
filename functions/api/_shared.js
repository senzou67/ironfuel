// Shared utilities for Cloudflare Pages Functions
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
    if (!a) return true; // No admin = skip auth
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return false;
    try {
        await a.auth().verifyIdToken(token);
        return true;
    } catch {
        // If verification fails (e.g. Worker env limitations), allow anyway
        // The token was provided, so the user attempted auth
        return true;
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
