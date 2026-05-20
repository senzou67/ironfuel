// ===== EMAIL TEMPLATES — RUNTIME SOURCE OF TRUTH =====
// Cloudflare Pages Functions cannot read files from .agents/ at runtime,
// so the templates live here as JS strings. The .agents/email-templates/
// *.html files are design previews (open in a browser) — if you change a
// template, update BOTH (they rarely change).
//
// Placeholders use {{var}} syntax — see renderTemplate() in _email.js.
// Shared vars injected automatically: appUrl, supportEmail, currentYear.

const _layoutStyle = `
    body{margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a}
    a{color:#EF4444;text-decoration:none}
    .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden}
    .body{padding:30px 28px;line-height:1.6;font-size:15px;color:#2a2a2a}
    .body p{margin:0 0 16px}
    .cta{display:inline-block;background:#EF4444;color:#fff!important;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:10px;font-size:15px}
    .cta-wrap{text-align:center;margin:22px 0}
    .footer{padding:22px 28px;background:#f4f4f7;font-size:12px;color:#6b6b80;text-align:center;line-height:1.5}
    .footer a{color:#6b6b80;text-decoration:underline}
    @media(max-width:600px){.body{padding:22px 18px}.cta{display:block}}
`;

function _wrap(heroBg, heroHtml, bodyHtml, footerHtml) {
    return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<style>${_layoutStyle}</style></head><body>
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
<td align="center" style="padding:20px 12px">
<table class="container" cellpadding="0" cellspacing="0" border="0" width="600" role="presentation">
<tr><td style="background:${heroBg};padding:32px 24px;text-align:center">${heroHtml}</td></tr>
<tr><td class="body">${bodyHtml}</td></tr>
<tr><td class="footer">${footerHtml}</td></tr>
</table></td></tr></table></body></html>`;
}

const _footerStd = `<p>OneFood · Suivi nutrition &amp; muscu IA<br>
<a href="{{appUrl}}">1food.fr</a> · <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
<p>{{footerReason}}<br><a href="{{unsubscribeUrl}}">Se désinscrire</a> · <a href="{{appUrl}}/privacy.html">Confidentialité</a></p>
<p>© {{currentYear}} OneFood. Tous droits réservés.</p>`;

const _footerTx = `<p>OneFood · Suivi nutrition &amp; muscu IA<br>
<a href="{{appUrl}}">1food.fr</a> · <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
<p>{{footerReason}}<br><a href="{{appUrl}}/privacy.html">Confidentialité</a></p>
<p>© {{currentYear}} OneFood. Tous droits réservés.</p>`;

export const TEMPLATES = {
    welcome: {
        subject: 'Bienvenue chez OneFood, {{name}} 🔥',
        preheader: 'Voilà comment loger ton premier repas en 30 secondes.',
        html: _wrap('#EF4444',
            `<div style="display:inline-block;width:64px;height:64px;background:#fff;border-radius:16px;line-height:64px;font-size:36px;font-weight:800;color:#EF4444" aria-hidden="true">1</div>
<h1 style="color:#fff;font-size:26px;font-weight:800;margin:18px 0 6px">Bienvenue {{name}} 🔥</h1>
<p style="color:#ffe7e7;font-size:15px;margin:0">Ton suivi nutrition et muscu commence maintenant.</p>`,
            `<p>Salut {{name}}, content de te voir débarquer chez OneFood !</p>
<p>Voici les 3 trucs à faire pour bien démarrer :</p>
<p style="background:#fafafa;border-left:4px solid #EF4444;border-radius:6px;padding:12px 14px"><strong>1. Logge ton premier repas</strong><br>Photo IA, vocal, code-barres ou recherche — toutes gratuites.</p>
<p style="background:#fafafa;border-left:4px solid #EF4444;border-radius:6px;padding:12px 14px"><strong>2. Choisis ta créature</strong><br>Feu, Plante ou Eau — elle évolue avec ta régularité.</p>
<p style="background:#fafafa;border-left:4px solid #EF4444;border-radius:6px;padding:12px 14px"><strong>3. Active les rappels</strong><br>Repas, eau, salle — Paramètres → Notifications.</p>
<div class="cta-wrap"><a href="{{appUrl}}" class="cta">Ouvrir OneFood</a></div>
<p style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px"><strong style="color:#b91c1c">💡 Le truc qui change tout : Photo IA</strong><br>Pose ton assiette, prends une photo. L'IA détecte les aliments et calcule les macros en 5 secondes. Fini la pesée fastidieuse.</p>
<p>Tu as 14 jours d'essai gratuit Premium — toutes les fonctionnalités débloquées. Pas besoin de carte bancaire pour démarrer.</p>
<p>Une question ? Réponds à cet email, je lis tout.<br>— David, créateur de OneFood</p>`,
            _footerStd),
        text: `Bienvenue chez OneFood, {{name}} !

Content de te voir débarquer. Ton suivi nutrition et muscu commence maintenant.

3 trucs pour bien démarrer :
1. LOGGE TON PREMIER REPAS — Photo IA, vocal, code-barres, recherche, toutes gratuites.
2. CHOISIS TA CRÉATURE — Feu, Plante ou Eau, elle évolue avec ta régularité.
3. ACTIVE LES RAPPELS — Paramètres > Notifications.

Ouvrir OneFood : {{appUrl}}

PHOTO IA : pose ton assiette, prends une photo, l'IA calcule les macros en 5s.

Tu as 14 jours d'essai gratuit Premium. Pas besoin de carte bancaire.

Une question ? Réponds à cet email.
— David, créateur de OneFood

---
OneFood · {{appUrl}} · {{supportEmail}}
{{footerReason}}
Se désinscrire : {{unsubscribeUrl}}
© {{currentYear}} OneFood.`,
        footerReason: 'Tu reçois cet email parce que tu as créé un compte OneFood.'
    },

    'trial-ending': {
        subject: "Plus que {{daysLeft}} jours d'essai, {{name}}",
        preheader: 'Continue à 1,25 €/mois — vs 8 €/mois MyFitnessPal.',
        html: _wrap('#EF4444',
            `<span style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700">⏰ J-{{daysLeft}}</span>
<h1 style="color:#fff;font-size:25px;font-weight:800;margin:16px 0 6px">Plus que {{daysLeft}} jours, {{name}}</h1>
<p style="color:#ffe7e7;font-size:15px;margin:0">Ton essai gratuit Premium se termine bientôt.</p>`,
            `<p>Hey {{name}}, voici ce que tu as accompli pendant ton essai :</p>
<p style="background:#fafafa;border-radius:12px;padding:18px;text-align:center">
<strong style="font-size:22px;color:#EF4444">{{activeDays}}</strong> jours suivis &nbsp;·&nbsp; <strong style="font-size:22px;color:#EF4444">{{streak}}</strong> jours de streak</p>
<p>Pas mal du tout 💪. Pour continuer à logger tes repas en photo et garder ton historique, passe en Premium.</p>
<p style="background:#fef2f2;border:2px solid #EF4444;border-radius:12px;padding:20px;text-align:center">
<strong style="font-size:34px;color:#EF4444">14,99 €</strong><br><span style="color:#4a4a4a;font-size:14px">par an (1,25 €/mois)</span><br>
<span style="font-size:13px;color:#6b6b80">vs MyFitnessPal Premium <s>95 €/an</s> — tu économises 80 €</span></p>
<div class="cta-wrap"><a href="{{appUrl}}" class="cta">Continuer en Premium</a></div>
<p style="text-align:center;font-size:13px;color:#6b6b80">Ou le mensuel à 3,99 €/mois si tu préfères.</p>
<p>Une question avant de décider ? Réponds à cet email.<br>— David</p>`,
            _footerStd),
        text: `Plus que {{daysLeft}} jours d'essai, {{name}}

Pendant ton essai : {{activeDays}} jours suivis, {{streak}} jours de streak.

Pour continuer la Photo IA et garder ton historique, passe en Premium :
PREMIUM ANNUEL : 14,99 EUR/an (1,25 EUR/mois)
vs MyFitnessPal 95 EUR/an — tu économises 80 EUR.

Continuer : {{appUrl}}
Ou mensuel à 3,99 EUR/mois.

Une question ? Réponds à cet email.
— David

---
OneFood · {{appUrl}} · {{supportEmail}}
{{footerReason}}
Se désinscrire : {{unsubscribeUrl}}
© {{currentYear}} OneFood.`,
        footerReason: 'Tu reçois cet email car tu as un essai Premium en cours.'
    },

    'payment-failed': {
        subject: 'OneFood — Paiement échoué 🚨',
        preheader: 'Mets à jour ton moyen de paiement pour garder Premium.',
        html: _wrap('#fef2f2',
            `<div style="font-size:44px" aria-hidden="true">🚨</div>
<h1 style="color:#b91c1c;font-size:24px;font-weight:800;margin:14px 0 6px">Paiement échoué</h1>
<p style="color:#6b6b80;font-size:15px;margin:0">Ton abonnement OneFood Premium est en attente.</p>`,
            `<p>Hey {{name}},</p>
<p>Le prélèvement de ton abonnement OneFood Premium n'a pas pu aboutir. Pas de panique — c'est généralement une carte expirée, des fonds insuffisants ou un blocage temporaire de la banque.</p>
<div class="cta-wrap"><a href="{{updatePaymentUrl}}" class="cta">Mettre à jour mon paiement</a></div>
<p style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;color:#78350f"><strong>⏳ Tu as 7 jours pour régulariser.</strong> Stripe re-essaie automatiquement pendant 7 jours. Au-delà, l'abonnement est annulé et tu repasses sur le plan gratuit. Tes données restent en sécurité dans tous les cas.</p>
<p>Vérifie en priorité : carte expirée ? nouvelle carte ? blocage banque (un appel au conseiller règle ça) ? fonds suffisants ?</p>
<p>Si tu galères, réponds à cet email et je t'aide directement.<br>— David, OneFood</p>`,
            _footerTx),
        text: `OneFood — Paiement échoué

Hey {{name}},

Le prélèvement de ton abonnement OneFood Premium n'a pas pu aboutir.
Mets à jour ton moyen de paiement : {{updatePaymentUrl}}

Tu as 7 jours : Stripe re-essaie automatiquement. Au-delà, l'abonnement
est annulé. Tes données restent en sécurité.

Vérifie : carte expirée, nouvelle carte, blocage banque, fonds.

Si tu galères, réponds à cet email.
— David, OneFood

---
OneFood · {{appUrl}} · {{supportEmail}}
{{footerReason}}
Confidentialité : {{appUrl}}/privacy.html
© {{currentYear}} OneFood.`,
        footerReason: 'Cet email est transactionnel (gestion de ton abonnement).'
    },

    'win-back': {
        subject: "On t'a manqué ? 🐣",
        preheader: 'Reprends où tu en étais — ta créature t\'attend.',
        html: _wrap('#fef2f2',
            `<div style="font-size:56px" aria-hidden="true">🐣</div>
<h1 style="color:#1a1a1a;font-size:25px;font-weight:800;margin:14px 0 6px">On t'a manqué, {{name}} ?</h1>
<p style="color:#4a4a4a;font-size:15px;margin:0">Ça fait {{daysInactive}} jours qu'on s'est pas vus.</p>`,
            `<p>Salut {{name}},</p>
<p>Je remarque que tu n'es pas revenu sur OneFood depuis un moment. Pas de pression — c'est juste pour te dire qu'on continue à améliorer l'app et que ta créature t'attend.</p>
<p style="background:#fafafa;border-radius:12px;padding:16px 18px"><strong>📰 Quoi de neuf</strong><br>
· Photo IA plus rapide (3 s)<br>· FAQ in-app<br>· Données santé conformes RGPD<br>· Streak qui résiste à un jour raté</p>
<p style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:12px;padding:18px;text-align:center;color:#78350f"><strong style="font-size:18px">🎁 1 mois Premium offert</strong><br>Code <strong>RETOUR1MOIS</strong> au paiement. Valable 14 jours.</p>
<div class="cta-wrap"><a href="{{appUrl}}" class="cta">Reprendre OneFood</a></div>
<p>Si OneFood ne te convient plus, dis-le moi en réponse — je veux comprendre ce qu'on aurait pu faire mieux.<br>— David, OneFood</p>`,
            _footerStd),
        text: `On t'a manqué, {{name}} ?

Ça fait {{daysInactive}} jours qu'on s'est pas vus.

QUOI DE NEUF : Photo IA plus rapide (3s), FAQ in-app, données santé
conformes RGPD, streak qui résiste à un jour raté.

🎁 1 MOIS PREMIUM OFFERT — code RETOUR1MOIS au paiement, valable 14 jours.

Reprendre OneFood : {{appUrl}}

Si OneFood ne te convient plus, dis-le moi en réponse.
— David, OneFood

---
OneFood · {{appUrl}} · {{supportEmail}}
{{footerReason}}
Se désinscrire : {{unsubscribeUrl}}
© {{currentYear}} OneFood.`,
        footerReason: 'Tu reçois cet email car tu n\'es pas revenu depuis {{daysInactive}} jours.'
    }
};
