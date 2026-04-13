// Error logging endpoint — stores client-side errors in Firestore
// Used for debugging production issues without requiring user reports
import { initFirebase, getDb, jsonResponse, errorResponse } from './_shared.js';

const MAX_ERRORS_PER_USER_PER_HOUR = 20; // Prevent spam

export async function onRequestPost(context) {
    const { env, request } = context;
    initFirebase(env);
    const db = getDb(env);
    if (!db) return errorResponse('Database not available');

    try {
        const body = await request.json();
        const { message, stack, url, userAgent, userId, page, extra } = body;

        if (!message || typeof message !== 'string') {
            return errorResponse('Missing message', 400);
        }

        // Truncate to prevent abuse
        const error = {
            message: String(message).substring(0, 500),
            stack: stack ? String(stack).substring(0, 2000) : null,
            url: url ? String(url).substring(0, 500) : null,
            userAgent: userAgent ? String(userAgent).substring(0, 300) : null,
            userId: userId ? String(userId).substring(0, 100) : 'anonymous',
            page: page ? String(page).substring(0, 100) : null,
            extra: extra ? JSON.stringify(extra).substring(0, 1000) : null,
            ip: request.headers.get('cf-connecting-ip') || 'unknown',
            country: request.headers.get('cf-ipcountry') || 'unknown',
            timestamp: new Date().toISOString(),
            createdAt: new Date()
        };

        // Rate limit: max 20 errors/hour per user
        const oneHourAgo = new Date(Date.now() - 3600000);
        const recentQuery = await db.collection('error_logs')
            .where('userId', '==', error.userId)
            .where('createdAt', '>', oneHourAgo)
            .limit(MAX_ERRORS_PER_USER_PER_HOUR + 1)
            .get();

        if (recentQuery.size >= MAX_ERRORS_PER_USER_PER_HOUR) {
            return jsonResponse({ logged: false, reason: 'rate_limited' });
        }

        await db.collection('error_logs').add(error);

        return jsonResponse({ logged: true });
    } catch (err) {
        return errorResponse(err.message || 'Failed to log error');
    }
}
