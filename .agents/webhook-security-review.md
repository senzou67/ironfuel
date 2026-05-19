# Webhook Security Review

*Audit 2026-05-19. Périmètre : `functions/api/{stripe,paypal,revenuecat}-webhook.js`.*

## TL;DR

**Stripe : hardening appliqué** (idempotency, anti-spoof, audit log).
**PayPal : 4 issues identifiées, à hardener pareil.**
**RevenueCat : 1 issue mineure (idempotency).**

Aucune faille critique exploitable en l'état (signatures vérifiées partout),
mais plusieurs scénarios de duplication / collision corrigeables.

---

## 1. Stripe webhook — fixes appliqués ✅

### 1.1 Idempotency via `webhook_events` collection
Avant : Stripe retry × 6 sur 3j → duplications dans `donations` (qui utilise
`add()`).
Après : `webhook_events/{stripeEventId}.create()` atomique en début de
handler. Si doc existe déjà → 200 avec `duplicate: true`, pas de traitement.

### 1.2 Donation amount authoritative
Avant : `parseFloat(meta.amount) || (obj.amount_total / 100)` — un client
malveillant pouvait poser `meta.amount = 1000` dans `create-checkout.js`
puis payer 1€, et la donation loggée serait 1000€.
Après : **uniquement** `obj.amount_total / 100`. Si `amount <= 0`, rejet
avec log d'erreur.

### 1.3 Collision sur `subscriptions/anonymous`
Avant : si `meta.userId` absent, fallback `'anonymous'` → tous les abonnements
anonymes écrasaient le même doc Firestore.
Après : rejet explicite avec notification admin si `userId === 'anonymous'`
sur une subscription. Donations restent autorisées en anonyme (charity).

### 1.4 Plan allowlist
Avant : `meta.plan || 'annual'` — un client pouvait poser `meta.plan =
'lifetime_admin'`. Aucune valeur ne fait foi côté serveur de toute façon
(tout est dans le doc Firestore), mais c'était du data dirty.
Après : `VALID_PLANS = ['monthly', 'annual', 'lifetime']`, fallback
'annual' si invalide.

### 1.5 Race-safe `invoice.paid`
Avant : si `invoice.paid` arrivait avant `checkout.session.completed` (rare
mais possible), le handler échouait silencieusement.
Après : warn loggué, l'event `checkout.session.completed` qui suit
appliquera bien `status: 'active'` lui-même.

### 1.6 Audit log
Chaque event est écrit dans `webhook_events/{id}` avec status (`processing`
/ `completed` / `error`) + error string si applicable. Permet rejouer
manuellement les events échoués via la Stripe CLI.

---

## 2. PayPal webhook — à hardener 🟡

`functions/api/paypal-webhook.js`. Mêmes patterns que Stripe applicables.

| # | Issue | Sévérité | Fix |
|---|---|---|---|
| 2.1 | Pas d'idempotency (PayPal retry possible) | 🟠 Moyen | Ajouter `webhook_events/{body.id}.create()` même pattern que Stripe |
| 2.2 | `customId \|\| 'unknown'` → collision `subscriptions/unknown` | 🟠 Moyen | Rejeter si `customId` absent, notif admin |
| 2.3 | Signature non vérifiée si `PAYPAL_WEBHOOK_ID` env absent (silencieusement accepté) | 🟡 Faible | Refuser si manquant en prod (env `ENVIRONMENT === 'production'`) |
| 2.4 | Pas d'audit log | 🟡 Faible | Ajouter dans `webhook_events` avec `provider: 'paypal'` |

Quand on s'attaque à PayPal : copier le pattern idempotency de Stripe
(lignes 56-74 de `stripe-webhook.js`). Le helper pourrait être extrait
dans `_shared.js` à ce moment-là pour DRY (`checkWebhookIdempotency(db,
provider, eventId)`).

---

## 3. RevenueCat webhook — quasi propre 🟢

`functions/api/revenuecat-webhook.js`. Une seule issue :

| # | Issue | Sévérité | Fix |
|---|---|---|---|
| 3.1 | Pas d'idempotency (RC retry sur certains events) | 🟡 Faible | Ajouter `webhook_events/{event.id}.create()` — RC envoie un `event.id` UUID v4 stable |

Tout le reste est solide :
- Auth via Bearer token (`REVENUECAT_WEBHOOK_TOKEN`)
- Validation `app_user_id` présent
- Plan dérivé du `product_id` (pas trusté du payload arbitraire)
- Shape Firestore unifié avec Stripe (cf. commit `a93abdf`)

---

## 4. Issues hors webhooks identifiées

### 4.1 `create-checkout.js` — auth manquante sur le mode subscription
**Sévérité : 🟠 Moyen.**

Aujourd'hui l'endpoint accepte `userId` du body sans vérification du token
Firebase. Conséquences :
- Un attaquant peut payer puis attribuer le Premium à un autre UID
  (cadeau forcé ou nuisance ciblée).
- Un user non authentifié peut payer en spoofant un UID arbitraire.

**Fix proposé** :
```js
// Dans create-checkout.js, branche subscription :
const verifiedUid = await getVerifiedUid(request, env);
if (!verifiedUid) return errorResponse('Auth required for subscription', 401);
// puis ignorer body.userId, utiliser verifiedUid partout dans metadata.
```

Donations peuvent rester anonymes (c'est une fonctionnalité de charité).

> À chiffrer séparément : `verifyAuth` existe déjà dans `_shared.js`, mais
> il faut un variant qui RETOURNE le `decoded.uid` au lieu d'un boolean.

### 4.2 Endpoint `/api/delete-account` manquant
Apple §5.1.1.v et Google Play 2024 exigent un endpoint **public** (sans
login préalable) pour demander suppression de compte. Aujourd'hui : seul
disponible in-app via `Paramètres → Supprimer mon compte` qui requiert
d'être loggé. Risque de rejet store review.

Voir `.agents/data-safety-form.md` §6 et `.agents/privacy-labels-apple.md` §7.

---

## 5. Checklist de validation post-hardening

- [ ] Tester en local avec `stripe trigger checkout.session.completed`
- [ ] Tester un retry manuel : `stripe trigger` deux fois avec le même
      event, vérifier que la 2e est ignorée (response `duplicate: true`)
- [ ] Vérifier qu'un attaquant qui pose `meta.amount = 9999` voit bien
      sa donation enregistrée à 1€ (montant réel payé), pas 9999€
- [ ] Vérifier qu'une subscription sans `userId` produit bien une notif
      admin et n'écrase pas `subscriptions/anonymous`
- [ ] Mettre en place une alerte sur la collection `webhook_events`
      filtrée par `status == 'error'` (Cloudflare KV ou GCP Cloud
      Function pour ping Discord/email)

---

## 6. Schéma Firestore `webhook_events`

```
webhook_events/{eventId}
├── provider: 'stripe' | 'paypal' | 'revenuecat'
├── type: string                       // ex: 'checkout.session.completed'
├── status: 'processing' | 'completed' | 'error'
├── error: string | null
├── receivedAt: Timestamp
└── completedAt: Timestamp
```

Pas de TTL configuré pour l'instant — réfléchir à une purge des `completed`
> 90 jours pour limiter les coûts Firestore. Les `error` à garder
indéfiniment pour audit.

---

*Réviser ce document à chaque modification de webhook ou ajout de provider
de paiement.*
