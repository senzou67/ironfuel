// ===== EMAIL UNSUBSCRIBE =====
// GET /api/unsubscribe?email=xxx — clicked from the unsubscribe link in
// marketing emails (trial-ending, win-back). Sets emailConsent=false on
// the emails/{key} doc so crons skip this address.
//
// Returns a small HTML confirmation page (the user sees it in a browser).
//
// Note: the email is passed in clear. Worst-case abuse is unsubscribing
// someone else from MARKETING email — low harm, reversible (re-consent in
// app settings). A signed HMAC token would harden this; deferred.
import admin from 'firebase-admin';
import { initFirebase, getDb } from './_shared.js';

function page(title, message, ok) {
    const color = ok ? '#EF4444' : '#9e9e9e';
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} — OneFood</title>
<style>body{margin:0;background:#121212;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{max-width:420px;padding:32px 24px;text-align:center}
h1{color:${color};font-size:22px;margin:0 0 12px}
p{font-size:14px;line-height:1.6;color:#bdbdbd}
a{color:#EF4444;font-weight:600;text-decoration:none}</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p>
<p><a href="https://1food.fr">Retour à OneFood</a></p></div></body></html>`;
}

function htmlResponse(body, status = 200) {
    return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function onRequestGet(context) {
    const { env, request } = context;
    initFirebase(env);

    const url = new URL(request.url);
    const email = (url.searchParams.get('email') || '').toLowerCase().trim();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return htmlResponse(page('Lien invalide',
            'Le lien de désinscription est incomplet. Contacte contact@1food.fr si besoin.', false), 400);
    }

    const db = getDb(env);
    if (!db) {
        return htmlResponse(page('Service indisponible',
            'Réessaie dans quelques minutes ou écris à contact@1food.fr.', false), 503);
    }

    try {
        const docId = email.replace(/[^a-z0-9@._-]/g, '_');
        await db.collection('emails').doc(docId).set({
            emailConsent: false,
            unsubscribedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return htmlResponse(page('Désinscription confirmée',
            'Tu ne recevras plus d\'emails marketing de OneFood. Les emails liés à ton compte (paiement, sécurité) restent envoyés. Tu peux te réabonner depuis les Paramètres de l\'app.', true));
    } catch (err) {
        return htmlResponse(page('Erreur',
            'La désinscription a échoué. Écris à contact@1food.fr et on s\'en occupe.', false), 500);
    }
}
