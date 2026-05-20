// ===== EMAIL SENDING HELPER =====
// Provider : Resend (https://resend.com). Set RESEND_API_KEY as a
// Cloudflare Worker secret to activate. If the key is absent, sendEmail()
// is a graceful no-op (logs + returns {skipped:true}) — this lets the
// rest of the codebase call it safely before the provider is wired.
//
// Sender domain (1food.fr) must be verified in Resend (DKIM + SPF + DMARC)
// before delivery works.
import { TEMPLATES } from './_email-templates.js';

const FROM = 'OneFood <hello@1food.fr>';
const APP_URL = 'https://1food.fr';
const SUPPORT_EMAIL = 'contact@1food.fr';

// Replace every {{var}} with data[var]. Unknown vars become ''.
// Runs twice so placeholders inside injected values (e.g. footerReason
// containing {{daysInactive}}) are also resolved.
export function renderTemplate(str, data) {
    let out = String(str);
    for (let pass = 0; pass < 2; pass++) {
        out = out.replace(/\{\{(\w+)\}\}/g, (_, k) => (data[k] !== undefined && data[k] !== null) ? String(data[k]) : '');
    }
    return out;
}

// Build a default unsubscribe URL. token = opaque value the /unsubscribe
// endpoint can verify (here we use the email — /unsubscribe re-hashes it).
function _unsubUrl(email) {
    return `${APP_URL}/api/unsubscribe?email=${encodeURIComponent(email || '')}`;
}

// Send a templated email.
//   env       : Cloudflare env (needs RESEND_API_KEY)
//   to        : recipient address
//   template  : key of TEMPLATES ('welcome' | 'trial-ending' | ...)
//   data      : object of {{var}} values
// Returns { sent } | { skipped } | { sent:false, error }.
export async function sendEmail(env, { to, template, data = {} }) {
    const tmpl = TEMPLATES[template];
    if (!tmpl) {
        console.error('[email] unknown template:', template);
        return { sent: false, error: 'unknown_template' };
    }
    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
        console.error('[email] invalid recipient:', to);
        return { sent: false, error: 'invalid_recipient' };
    }

    if (!env.RESEND_API_KEY) {
        console.log(`[email] RESEND_API_KEY absent — skip "${template}" → ${to}`);
        return { skipped: true };
    }

    const merged = {
        appUrl: APP_URL,
        supportEmail: SUPPORT_EMAIL,
        currentYear: new Date().getFullYear(),
        unsubscribeUrl: _unsubUrl(to),
        footerReason: tmpl.footerReason || '',
        ...data
    };

    const payload = {
        from: FROM,
        to,
        subject: renderTemplate(tmpl.subject, merged),
        html: renderTemplate(tmpl.html, merged),
        text: renderTemplate(tmpl.text, merged)
    };

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.error(`[email] Resend ${res.status} for "${template}":`, errText.substring(0, 200));
            return { sent: false, error: `resend_${res.status}` };
        }
        return { sent: true };
    } catch (err) {
        console.error('[email] network error:', err.message);
        return { sent: false, error: 'network' };
    }
}
