// Trial check by IP — prevents multiple free trials from same IP
const { getStore } = require('@netlify/blobs');

function getClientIP(event) {
    return (
        event.headers['x-nf-client-connection-ip'] ||
        event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        event.headers['client-ip'] ||
        'unknown'
    );
}

function hashIP(ip) {
    // Simple hash to avoid storing raw IPs
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const chr = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return 'ip_' + Math.abs(hash).toString(36);
}

const ALLOWED_ORIGIN = process.env.URL || 'https://theironfuel.netlify.app';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const store = getStore({ name: 'trial-ips', siteID: process.env.SITE_ID || context.site?.id, token: process.env.NETLIFY_AUTH_TOKEN || '' });
        const ip = getClientIP(event);
        const ipHash = hashIP(ip);
        const body = JSON.parse(event.body || '{}');
        const action = body.action; // 'check', 'register', 'paid'
        const userId = body.userId || 'unknown';

        if (action === 'check') {
            // Check if this IP already used a trial
            let record = null;
            try {
                const data = await store.get(ipHash);
                if (data) record = JSON.parse(data);
            } catch (e) {
                // Key doesn't exist = no record
            }

            if (!record) {
                // New IP — allow trial
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ allowed: true, reason: 'new', daysLeft: 14 })
                };
            }

            if (record.paid) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ allowed: true, reason: 'paid', paid: true })
                };
            }

            // Check trial expiry
            const start = new Date(record.startDate);
            const now = new Date();
            const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
            const daysLeft = Math.max(0, 14 - elapsed);

            if (daysLeft > 0) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ allowed: true, reason: 'trial', daysLeft })
                };
            }

            // Trial expired
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ allowed: false, reason: 'expired', daysLeft: 0 })
            };
        }

        if (action === 'register') {
            // Register this IP for trial
            let record = null;
            try {
                const data = await store.get(ipHash);
                if (data) record = JSON.parse(data);
            } catch (e) {}

            if (record && !record.paid) {
                // Already registered — return existing trial info
                const start = new Date(record.startDate);
                const now = new Date();
                const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
                const daysLeft = Math.max(0, 14 - elapsed);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ registered: true, existing: true, daysLeft })
                };
            }

            if (record && record.paid) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ registered: true, paid: true })
                };
            }

            // New registration
            const newRecord = {
                startDate: new Date().toISOString(),
                userIds: [userId],
                paid: false
            };
            await store.set(ipHash, JSON.stringify(newRecord));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ registered: true, daysLeft: 14 })
            };
        }

        if (action === 'paid') {
            // Mark IP as paid
            let record = null;
            try {
                const data = await store.get(ipHash);
                if (data) record = JSON.parse(data);
            } catch (e) {}

            const updatedRecord = {
                ...(record || { startDate: new Date().toISOString(), userIds: [] }),
                paid: true,
                paidDate: new Date().toISOString(),
                paidBy: userId
            };
            if (!updatedRecord.userIds.includes(userId)) {
                updatedRecord.userIds.push(userId);
            }
            await store.set(ipHash, JSON.stringify(updatedRecord));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, paid: true })
            };
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid action. Use: check, register, paid' })
        };

    } catch (err) {
        console.error('Trial check error:', err);
        // Fail open — don't block users if the function errors
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ allowed: true, reason: 'error', daysLeft: 14 })
        };
    }
};
