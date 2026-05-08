// ===== STRIPE PAYMENT PROVIDER =====
// Web payments via Cloudflare Worker → /api/create-checkout (existing).
// Used for: PWA / browser users + donations on all platforms.
//
// Apple App Store policy 3.1.1 forbids using this for digital subscriptions
// inside an iOS native build — the PaymentService router handles that
// constraint by switching to the mobile provider on Capacitor native.
const StripePaymentService = {
    async subscribe({ plan, userId, email, skipTrial }) {
        const res = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                email,
                plan: plan || 'annual',
                skipTrial: !!skipTrial
            })
        });
        let data = {};
        try { data = await res.json(); } catch {}
        if (res.ok && data.url) {
            window.location.href = data.url;
            return { status: 'redirected', sessionId: data.sessionId };
        }
        throw new Error(data.error || `Erreur ${res.status}`);
    },

    async donate({ userId, email, amount, message }) {
        const res = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                email,
                mode: 'donation',
                amount,
                message
            })
        });
        let data = {};
        try { data = await res.json(); } catch {}
        if (res.ok && data.url) {
            window.location.href = data.url;
            return { status: 'redirected', sessionId: data.sessionId };
        }
        throw new Error(data.error || `Erreur ${res.status}`);
    },

    async manage({ email } = {}) {
        const reqHeaders = { 'Content-Type': 'application/json' };
        try {
            const user = (typeof AuthService !== 'undefined') ? AuthService.getCurrentUser() : null;
            if (user) reqHeaders['Authorization'] = 'Bearer ' + await user.getIdToken();
        } catch {}
        const res = await fetch('/api/create-portal-session', {
            method: 'POST',
            headers: reqHeaders,
            body: JSON.stringify({ email })
        });
        let data = {};
        try { data = await res.json(); } catch {}
        if (res.ok && data.url) {
            window.location.href = data.url;
            return { status: 'redirected' };
        }
        throw new Error(data.error || 'Portail indisponible');
    }
};
