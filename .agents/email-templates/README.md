# Email Templates — OneFood

*Conçues 2026-05-19. Templates HTML + plain-text pour les 4 emails
transactionnels clés du funnel OneFood.*

## TL;DR

4 templates prêts à brancher. Aucune infra d'envoi n'existe encore dans
le repo (`save-email.js` ne fait que stocker en Firestore). Section "Mise
en service" ci-dessous propose 3 options pour brancher l'envoi.

## Templates inclus

| Fichier | Quand l'envoyer | Objectif business |
|---|---|---|
| `welcome.html` / `.txt` | Immédiatement après signup | Activation : faire arriver l'utilisateur jusqu'au premier repas loggé |
| `trial-ending.html` / `.txt` | J-3 avant fin d'essai gratuit (14 j) | Conversion trial → paid (le moment critique) |
| `payment-failed.html` / `.txt` | Webhook Stripe `invoice.payment_failed` | Récupération de paiement avant churn |
| `win-back.html` / `.txt` | 30 j d'inactivité OU 7 j après `subscription.deleted` | Réactivation |

Toutes en français, tutoiement (cohérent avec l'app), tonalité directe.

## Variables de templating

Syntaxe `{{variable}}` (Handlebars-like, compatible avec la plupart des
SaaS d'envoi). À remplacer côté serveur AVANT envoi.

| Variable | Description | Exemple |
|---|---|---|
| `{{name}}` | Prénom utilisateur (depuis Firebase Auth ou onboarding) | `David` |
| `{{appUrl}}` | URL de l'app (toujours `https://1food.fr`) | `https://1food.fr` |
| `{{daysLeft}}` | (trial-ending) jours restants | `3` |
| `{{streak}}` | (trial-ending, win-back) streak actuelle | `7` |
| `{{mealsLogged}}` | (trial-ending) repas loggés pendant l'essai | `24` |
| `{{updatePaymentUrl}}` | (payment-failed) URL portail Stripe | `https://billing.stripe.com/p/session/...` |
| `{{daysInactive}}` | (win-back) nombre de jours d'inactivité | `45` |
| `{{unsubscribeUrl}}` | Lien désinscription (RGPD requis pour marketing) | `https://1food.fr/unsubscribe?token=...` |
| `{{supportEmail}}` | Toujours `contact@1food.fr` | — |
| `{{currentYear}}` | Pour footer copyright | `2026` |

## Subjects et pre-headers

À configurer **côté code d'envoi**, PAS dans le HTML (les SaaS séparent
`subject`, `preheader`, `body`).

| Template | Subject | Pre-header (preview text) |
|---|---|---|
| `welcome` | `Bienvenue chez OneFood, {{name}} 🔥` | `Voilà comment loger ton premier repas en 30 secondes.` |
| `trial-ending` | `Plus que {{daysLeft}} jours d'essai, {{name}}` | `Continue à 1,25 €/mois — vs 8 €/mois MyFitnessPal.` |
| `payment-failed` | `OneFood — Paiement échoué 🚨` | `Mets à jour ton moyen de paiement pour garder Premium.` |
| `win-back` | `On t'a manqué ? 🐣` | `Reprends où tu en étais — ta créature t'attend.` |

## Mise en service — 3 options

### Option A — Firebase "Trigger Email" Extension (gratuit, simple)

1. Installer l'extension : Firebase Console → Extensions → "Trigger Email"
2. Configurer SMTP (Brevo gratuit jusqu'à 300/jour, ou Resend, ou
   Mailgun)
3. Modifier `functions/api/save-email.js` pour pousser dans la collection
   `mail/` au lieu (ou en plus) de `emails/` :
   ```js
   await db.collection('mail').add({
       to: email,
       template: { name: 'welcome', data: { name, appUrl: 'https://1food.fr' } }
   });
   ```
4. Uploader les HTML templates dans la collection `mail-templates/` :
   ```
   mail-templates/welcome  { subject: '...', html: '...', text: '...' }
   ```
5. **Avantage** : zéro code custom, déclenchement par simple write Firestore
6. **Inconvénient** : un peu lent (5-30s avant envoi)

### Option B — Resend (recommandé pour MVP, free 3k/mois)

1. Compte Resend.com, vérifier domain `1food.fr` (DNS DKIM + SPF)
2. Ajouter env var `RESEND_API_KEY` aux Cloudflare Worker secrets
3. Créer `functions/api/_email.js` (helper d'envoi) :
   ```js
   export async function sendEmail(env, { to, template, data }) {
       const tmpl = TEMPLATES[template]; // import depuis email-templates
       const html = renderTemplate(tmpl.html, data);
       const text = renderTemplate(tmpl.text, data);
       return fetch('https://api.resend.com/emails', {
           method: 'POST',
           headers: {
               'Authorization': `Bearer ${env.RESEND_API_KEY}`,
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({
               from: 'OneFood <hello@1food.fr>',
               to, subject: tmpl.subject, html, text,
               headers: { 'X-Entity-Ref-ID': `${template}-${Date.now()}` }
           })
       });
   }
   ```
4. Brancher dans `save-email.js` (welcome), `stripe-webhook.js`
   (`payment_failed`), et un cron `/api/cron-trial-ending` quotidien
5. **Avantage** : moderne, API clean, bons logs, deliverability solide
6. **Inconvénient** : si > 3k/mois → 20 $/mois pour 50k

### Option C — SendGrid / Mailgun (entreprise)

Plus chère pour MVP. À considérer si > 100k emails/mois ou besoin
analytics avancé. Skip pour l'instant.

## Triggers de chaque template (à coder côté serveur)

### `welcome`
- **Trigger** : `save-email.js` quand `consent === true` ET premier signup
- **Vérification anti-doublon** : ne pas re-envoyer si le doc Firestore
  `emails/{key}.welcomeSentAt` existe déjà

### `trial-ending`
- **Trigger** : Cron quotidien (Cloudflare Worker scheduled) qui scan
  les subs `status === 'trialing'` et calcule `trial_end - now <= 3j`
- **Vérification** : `subscriptions/{uid}.trialEndingSentAt` pour ne pas
  re-envoyer

### `payment-failed`
- **Trigger** : `stripe-webhook.js` sur event `invoice.payment_failed`
  (déjà handlé, juste ajouter l'appel email)
- **`updatePaymentUrl`** : utiliser l'endpoint `/api/create-portal-session`
  existant ou stocker une session pré-générée

### `win-back`
- **Trigger** : Cron quotidien qui scan :
  - `subscriptions/{uid}.status === 'cancelled'` ET `cancelledAt < now - 7j`
  - OU users avec `lastSeenAt < now - 30j` ET pas Premium
- **Cap** : un seul `win-back` par utilisateur (`emails/{key}.winBackSentAt`)
- **⚠️ Placeholder promo code** : le template mentionne `RETOUR1MOIS`
  (1 mois Premium offert). Ce code n'existe pas encore — à créer dans
  Stripe Dashboard (Products → Coupons) AVANT d'envoyer le premier
  win-back. Sinon : retirer le bloc `.promo` du HTML/TXT.

## Compatibilité clients email

Les templates sont conçus pour fonctionner sur :
- ✅ Gmail (web, iOS, Android)
- ✅ Apple Mail (macOS, iOS)
- ✅ Outlook 365 (web)
- ⚠️ Outlook desktop (Windows) : tables-based layout utilisé, mais
  certains gradients/border-radius peuvent ne pas rendre (acceptable)
- ✅ Yahoo Mail
- ✅ ProtonMail (mode HTML)

Largeur max 600 px, mobile-first responsive via media queries.
Texte alternatif sur toutes les images (a11y + clients qui bloquent
les images).

## Tests avant envoi en production

1. **Litmus / Email on Acid** (payant, 30 j gratuit) : preview cross-client
2. **Mail-tester.com** (gratuit) : score deliverability + warnings SPF/DKIM
3. **Send à toi-même** sur Gmail, Yahoo, Outlook avant chaque lancement

## Désinscription (légal RGPD + CAN-SPAM)

**OBLIGATOIRE** sur tous les emails non strictement transactionnels :
- `welcome` : ✅ technique (réponse à action user) → unsubscribe optionnel
  mais recommandé
- `trial-ending` : ⚠️ borderline marketing → unsubscribe **requis**
- `payment-failed` : ✅ transactionnel pur → pas besoin
- `win-back` : ⚠️ marketing pur → unsubscribe **requis**

Implémenter `/unsubscribe?token=...` qui flip `emails/{key}.emailConsent
= false`. Le token devrait être un HMAC du userId pour éviter abuse.

## Roadmap d'implémentation

| Étape | Effort | Bloquant |
|---|---|---|
| Choisir provider (Resend recommandé) | 10 min | — |
| Vérifier domain `1food.fr` (DKIM/SPF/DMARC) | 30 min | DNS access |
| Coder `_email.js` helper + renderTemplate | 1 h | provider choisi |
| Brancher `welcome` (save-email.js) | 30 min | helper |
| Brancher `payment-failed` (stripe-webhook.js) | 30 min | helper |
| Créer cron `trial-ending` quotidien | 1 h | helper |
| Créer cron `win-back` quotidien | 1 h | helper |
| Endpoint `/unsubscribe` + table token | 1 h | RGPD |
| Tests cross-client (Litmus ou manuels) | 2 h | tous |
| **Total** | **~7 h** | — |

À noter : les templates eux-mêmes sont prêts, c'est le wiring qui prend
du temps.
