import { initFirebase, jsonResponse, errorResponse } from './_shared.js';

function getClientIP(request) {
    return (
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown'
    );
}

async function hashIP(ip, salt) {
    const data = new TextEncoder().encode(ip + (salt || 'onefood'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return 'ip_' + hashHex.substring(0, 16);
}

export async function onRequestPost(context) {
    const { env, request } = context;

    // TRIAL_KV must be bound in Cloudflare dashboard
    const kv = env.TRIAL_KV;
    if (!kv) return errorResponse('KV not configured');

    try {
        const ip = getClientIP(request);
        const ipHash = await hashIP(ip, env.IP_HASH_SALT);
        const body = await request.json();
        const action = body.action;
        const userId = body.userId || 'unknown';

        if (action === 'check') {
            const data = await kv.get(ipHash);
            const record = data ? JSON.parse(data) : null;

            if (!record) return jsonResponse({ allowed: true, reason: 'new', daysLeft: 14 });
            if (record.paid) return jsonResponse({ allowed: true, reason: 'paid', paid: true });

            const start = new Date(record.startDate);
            const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
            const daysLeft = Math.max(0, 14 - elapsed);

            if (daysLeft > 0) return jsonResponse({ allowed: true, reason: 'trial', daysLeft });
            return jsonResponse({ allowed: false, reason: 'expired', daysLeft: 0 });
        }

        if (action === 'register') {
            const data = await kv.get(ipHash);
            const record = data ? JSON.parse(data) : null;

            if (record && !record.paid) {
                const elapsed = Math.floor((Date.now() - new Date(record.startDate).getTime()) / (1000 * 60 * 60 * 24));
                return jsonResponse({ registered: true, existing: true, daysLeft: Math.max(0, 14 - elapsed) });
            }
            if (record && record.paid) return jsonResponse({ registered: true, paid: true });

            await kv.put(ipHash, JSON.stringify({ startDate: new Date().toISOString(), userIds: [userId], paid: false }));
            return jsonResponse({ registered: true, daysLeft: 14 });
        }

        if (action === 'paid') {
            const a = initFirebase(env);
            if (a) {
                const authHeader = request.headers.get('Authorization') || '';
                const token = authHeader.replace('Bearer ', '');
                if (!token) return errorResponse('Auth required', 401);
                try { await a.auth().verifyIdToken(token); }
                catch { return errorResponse('Invalid token', 403); }
            }

            const data = await kv.get(ipHash);
            const record = data ? JSON.parse(data) : null;
            const updated = { ...(record || { startDate: new Date().toISOString(), userIds: [] }), paid: true, paidDate: new Date().toISOString(), paidBy: userId };
            if (!updated.userIds.includes(userId)) updated.userIds.push(userId);
            await kv.put(ipHash, JSON.stringify(updated));
            return jsonResponse({ success: true, paid: true });
        }

        return errorResponse('Invalid action. Use: check, register, paid', 400);
    } catch (err) {
        return jsonResponse({ allowed: true, reason: 'error', daysLeft: 0 });
    }
}
