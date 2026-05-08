# Payment Architecture — OneFood

*Last updated: 2026-04-21. Source of truth pour la couche paiement multi-canal et la stratégie de sortie de RevenueCat.*

## Objectif

Encaisser des abonnements Premium sur **3 plateformes** (web PWA, Android natif, iOS natif) sans dupliquer la logique métier ni se prendre les pieds dans les politiques d'Apple/Google qui imposent l'IAP natif pour les abonnements digitaux.

**Contrainte stratégique** : pouvoir migrer vers du natif IAP direct dans 18-24 mois sans tout réécrire.

---

## Architecture en 1 schéma

```
              ┌─────────────────────────────────────────────────┐
              │      Reste de l'app : TrialService, paywall,   │
              │       SettingsPage, dashboard premium check     │
              └─────────────────┬───────────────────────────────┘
                                │
                                ▼
                   ┌──────────────────────┐
                   │   PaymentService     │ ← contrat figé : subscribe / donate / manage / restore
                   │   (payment.js)       │
                   └─────────┬────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌──────────────┐ ┌────────────┐ ┌──────────────────┐
      │ StripeWeb    │ │ RevenueCat │ │ NativeIAP (futur) │
      │ (Stripe)     │ │ (Apple+Play)│ │ (post-migration)  │
      └──────────────┘ └────────────┘ └──────────────────┘
              │              │              │
              ▼              ▼              ▼
      Webhook Stripe   Webhook RC      Webhooks Apple+Google
              │              │              │
              └──────────────┼──────────────┘
                             ▼
              ┌──────────────────────────────┐
              │ Firestore subscriptions/{uid} │ ← shape unifiée
              │ { status, plan, provider,    │
              │   platform, expiresAt, ... } │
              └──────────────────────────────┘
                             │
                             ▼
                  TrialService.isPaid()
```

---

## Provider routing (client)

| Plateforme | Détection | Provider | Endpoint |
|---|---|---|---|
| Web (PWA, browser) | `Capacitor` non défini | StripeWeb | `/api/create-checkout` → redirect |
| Android Capacitor | `Capacitor.isNativePlatform()` true | RevenueCat (Play Billing) | feuille native |
| iOS Capacitor | `Capacitor.isNativePlatform()` true | RevenueCat (StoreKit) | feuille native |
| Donations (toutes plateformes) | toujours | StripeWeb | `/api/create-checkout` mode donation |

Donations restent sur Stripe partout — **les paiements ponctuels non-digitaux** ne tombent pas sous la règle IAP d'Apple/Google.

---

## Document Firestore unifié

`subscriptions/{userId}` — **même shape pour tous les providers** :

```typescript
{
    userId: string,
    status: 'active' | 'cancelled' | 'expired' | 'payment_failed',
    plan: 'annual' | 'monthly',
    provider: 'stripe' | 'revenuecat',
    platform?: 'web' | 'apple' | 'google',
    expiresAt?: Timestamp,
    cancelAtPeriodEnd?: boolean,
    email?: string,
    createdAt: Timestamp,
    updatedAt: Timestamp,
    // Provider-specific debug fields prefixed (à drop à la migration) :
    stripeSessionId?: string,
    stripeSubscriptionId?: string,
    rc_event?: string,
    rc_product?: string
}
```

`TrialService.isPaid()` lit ce doc et n'a pas besoin de savoir d'où vient l'écriture.

---

## Webhooks (server)

| Provider | Endpoint | Auth | Source |
|---|---|---|---|
| Stripe | `/api/stripe-webhook` | HMAC signature `Stripe-Signature` | `STRIPE_WEBHOOK_SECRET` |
| RevenueCat | `/api/revenuecat-webhook` | Bearer token | `REVENUECAT_WEBHOOK_TOKEN` |

Les deux convergent sur le même `subscriptions/{userId}` doc.

### Variables Cloudflare à configurer

Dashboard Cloudflare → Workers & Pages → onefood → Settings → Variables and secrets :

| Nom | Type | Valeur |
|---|---|---|
| `STRIPE_SECRET_KEY` | secret | déjà set (Stripe API key) |
| `STRIPE_WEBHOOK_SECRET` | secret | déjà set (Stripe webhook signing) |
| `STRIPE_PRICE_ID` | env | déjà set (annual price ID) |
| `STRIPE_PRICE_MONTHLY_ID` | env | déjà set (monthly price ID) |
| `REVENUECAT_WEBHOOK_TOKEN` | secret | **à ajouter** — random hex 32+ chars |
| `FIREBASE_SERVICE_ACCOUNT` | secret | déjà set |

---

## Setup RevenueCat — checklist d'activation

Quand tu attaques le sprint native (1-2j de boulot) :

### 1. Créer le compte
- https://app.revenuecat.com → Sign up
- Créer un projet « OneFood »

### 2. Connecter Apple Connect (pour iOS plus tard)
- App Store Connect → Apps → OneFood → App Information → App-Specific Shared Secret
- RevenueCat → Project Settings → Apps → + iOS → coller le secret

### 3. Connecter Google Play Console
- Play Console → API access → Service Account → générer JSON
- RevenueCat → Project Settings → Apps → + Android → upload JSON
- Lier l'app `fr.onefood.app`

### 4. Créer les products
**Apple App Store Connect** : créer 2 subscriptions auto-renewable :
- `onefood_annual` — 14,99 €/an, renouvellement annuel
- `onefood_monthly` — 3,99 €/mois, renouvellement mensuel
- Subscription Group : « OneFood Premium »

**Google Play Console** : Monetize → Subscriptions :
- ID `onefood_annual` — 14,99 €/an
- ID `onefood_monthly` — 3,99 €/mois

### 5. Configurer les Offerings dans RevenueCat
- Products → import depuis Apple + Google (RC pull auto)
- Entitlements → créer `premium` (donne accès aux features Premium)
- Offerings → « default » → ajouter packages :
  - `$rc_annual` → linked to `onefood_annual`
  - `$rc_monthly` → linked to `onefood_monthly`

Les IDs doivent matcher exactement `js/services/payment-revenuecat.js _packageIdFor()`.

### 6. Configurer le webhook
- RevenueCat → Project Settings → Webhooks → Add
- URL : `https://1food.fr/api/revenuecat-webhook`
- Authorization header : `Bearer <ton-token-32-chars>`
- Stocker le même token dans `REVENUECAT_WEBHOOK_TOKEN` côté Cloudflare

### 7. Ajouter les API keys au build natif
Au début de ton bundle natif (par ex dans `index.html` ou via wrangler env vars), injecter :
```html
<script>
  window.__REVENUECAT_APPLE_KEY__ = 'appl_xxxxxxxxxxxx';
  window.__REVENUECAT_GOOGLE_KEY__ = 'goog_xxxxxxxxxxxx';
</script>
```

Ces clés sont **publiques** côté RC (`appl_…` / `goog_…` — c'est leur design). Ne jamais commit le secret server-side de RC (qui sert à l'API REST).

### 8. Capacitor sync
```bash
npm run android:install     # pulls @revenuecat/purchases-capacitor
npx cap add android         # generates android/
npx cap sync android        # links native plugin
# Test: build APK debug, login sandbox, achat test
```

---

## Plan de migration vers native IAP direct

### Quand
- ARR > 100k€/mois → 1 % RC = 1k€/mois, devient significatif
- OU besoin d'une feature StoreKit avancée non supportée par RC
- OU politique entreprise « 0 dépendance externe sur le revenu »

### Ce qui change
| Couche | Avant (RC) | Après (native) |
|---|---|---|
| `services/payment-revenuecat.js` | utilise `Capacitor.Plugins.Purchases` | **remplacer** par `payment-native.js` qui utilise `@capacitor-community/in-app-purchases-2` |
| Routeur `payment.js` | détecte `RevenueCatPaymentService` | détecte `NativeIAPPaymentService` (1 ligne) |
| Webhook | `/api/revenuecat-webhook` | **ajouter** `/api/apple-server-notifications-v2` + `/api/play-rtdn-pubsub` |
| Receipt validation | RC le fait | **ajouter** un service qui call Apple `/inAppPurchase/...` + Google `purchases.subscriptions.get` |
| Document Firestore | inchangé ✅ | inchangé ✅ |
| `TrialService.isPaid()` | inchangé ✅ | inchangé ✅ |
| UI paywall | inchangée ✅ | inchangée ✅ |

**Estimation effort migration** : 60-80h (vs 100-150h en partant from scratch grâce à l'abstraction).

### Ce qu'il faut surveiller pour préparer la migration
1. Ne **jamais** stocker un champ RC-spécifique sans préfixe `rc_` qui le rend droppable
2. Garder un mapping `productId → plan` simple et centralisé (`_planFromProduct` dans webhook + `_packageIdFor` dans client)
3. Documenter chaque event RC qu'on consomme dans `revenuecat-webhook.js` — on devra recevoir l'équivalent Apple/Google et le mapper sur les mêmes états

---

## État au 21/04/2026

| Item | Status |
|---|---|
| Abstraction `PaymentService` | ✅ commit `c7e06ee` |
| Provider Stripe extrait | ✅ commit `c7e06ee` |
| Provider RevenueCat (lazy native) | ✅ commit `e47d38f` |
| Webhook `/api/revenuecat-webhook` | ✅ commit `a93abdf` |
| Age 13+ gate | ✅ commit `4646c62` |
| Architecture documentée | ✅ ce fichier |
| Compte RevenueCat créé | ❌ à faire toi |
| Products Apple/Google | ❌ à faire après `cap add` |
| `REVENUECAT_WEBHOOK_TOKEN` set sur Cloudflare | ❌ à faire toi |
| Sandbox testing Apple/Google | ❌ à faire après `cap add` |
| Migration vers IAP natif | 🟡 planifiée à ARR > 100k€/mois |
