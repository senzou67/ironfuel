# Google Play Data Safety Form — OneFood

**À recopier dans la Play Console → App content → Data safety.**
Source de vérité : audit code 2026-05-19 (voir `privacy.html` v136 aligné).
Google audite par trafic réseau : ne déclarer QUE ce qui est réellement transmis.

---

## Section 1 — Data collection and security

### Does your app collect or share any of the required user data types?
**OUI**

### Is all of the user data collected by your app encrypted in transit?
**OUI** — TLS/HTTPS pour 100% des appels (Firebase, Cloudflare, Stripe, PayPal,
RevenueCat, Gemini API, OpenFoodFacts).

### Do you provide a way for users to request that their data be deleted?
**OUI** — In-app : *Paramètres → Supprimer mon compte*. Par email :
`contact@1food.fr`. Suppression complète sous 30 jours maximum (cf. privacy.html
§7).

### Has your app committed to following the Play Families Policy?
**NON** — App pas destinée aux enfants. Cible 13+ (gate code dans
`js/services/trial.js`).

### Has your app been independently security reviewed?
**NON** (à mettre à jour si audit externe réalisé).

---

## Section 2 — Data types collected

Pour chaque catégorie : `[Collected: Y/N] / [Shared with 3P: Y/N] /
[Processed ephemerally: Y/N] / [Required or Optional] / [Purpose] /
[Linked to user identity]`.

### 2.1 Personal info

| Type | Collected | Shared | Ephemeral | Required/Optional | Purpose | Linked |
|---|---|---|---|---|---|---|
| **Name** | YES | NO | NO | Optional | Account management | YES |
| **Email address** | YES | NO | NO | **Required** | Account management, Communications | YES |
| **User IDs** (Firebase UID) | YES | NO | NO | **Required** | Account management, App functionality, Analytics | YES |
| **Address** | NO | — | — | — | — | — |
| **Phone number** | NO | — | — | — | — | — |
| **Race and ethnicity** | NO | — | — | — | — | — |
| **Political or religious beliefs** | NO | — | — | — | — | — |
| **Sexual orientation** | NO | — | — | — | — | — |
| **Other info** (age, sex, height, weight) | YES | NO | NO | **Required** | App functionality (calorie calculation) | YES |

> **Note "Other info"** : âge, sexe, taille et poids sont collectés pour le
> calcul des besoins nutritionnels. Stockés localStorage + Firestore.

### 2.2 Financial info

| Type | Collected | Shared | Ephemeral | Required/Optional | Purpose | Linked |
|---|---|---|---|---|---|---|
| **User payment info** | NO* | — | — | — | — | — |
| **Purchase history** | YES | NO | NO | Optional | App functionality | YES |
| **Credit score** | NO | — | — | — | — | — |
| **Other financial info** | NO | — | — | — | — | — |

> **Note** : *aucune* donnée bancaire ne transite par OneFood. Les paiements
> sont traités par Stripe, PayPal, Apple In-App Purchase ou Google Play
> Billing exclusivement. Seul l'historique d'achat (status abonnement,
> dates) est stocké en Firestore (`subscriptions/{uid}`, `donations/{id}`).

### 2.3 Health and fitness

| Type | Collected | Shared | Ephemeral | Required/Optional | Purpose | Linked |
|---|---|---|---|---|---|---|
| **Health info** (weight, daily calories, macros) | YES | NO | NO | **Required** | App functionality | YES |
| **Fitness info** | NO | — | — | — | — | — |

> **Note** : poids, journal alimentaire, hydratation, macronutriments,
> objectifs nutritionnels. Stockés localStorage + Firestore (collections
> `log_*`, `weight_log`).
> **Consentement explicite** recueilli au premier lancement (`app.js:196-461`,
> données de santé Art. 9 RGPD).

### 2.4 Messages

| Type | Collected | Shared | Ephemeral | Required/Optional | Purpose | Linked |
|---|---|---|---|---|---|---|
| **Emails** | NO | — | — | — | — | — |
| **SMS or MMS** | NO | — | — | — | — | — |
| **Other in-app messages** | NO | — | — | — | — | — |

### 2.5 Photos and videos

| Type | Collected | Shared | Ephemeral | Required/Optional | Purpose | Linked |
|---|---|---|---|---|---|---|
| **Photos** | YES | **YES** (Google Gemini) | **YES** | Optional | App functionality (food recognition) | NO |
| **Videos** | NO | — | — | — | — | — |

> **Note CRITIQUE** : les photos sont **ephemeral** au sens Google Play
> (« handled in memory only, not retained beyond the request »). Transmises
> à l'API Google Gemini Vision pour analyse, jamais stockées par OneFood,
> jamais utilisées pour entraîner des modèles d'IA. Fonctionnalité opt-in
> (consentement caméra explicite via modal pre-prompt iOS-compliant).

### 2.6 Audio files

| Type | Collected | Shared | Ephemeral | Required/Optional | Purpose | Linked |
|---|---|---|---|---|---|---|
| **Voice or sound recordings** | NO* | — | — | — | — | — |
| **Music files** | NO | — | — | — | — | — |
| **Other audio files** | NO | — | — | — | — | — |

> *Web Speech API utilisée pour la dictée de repas, traitement 100% local
> dans le navigateur via SpeechRecognition. Aucun envoi audio à un serveur
> OneFood ou tiers.

### 2.7 Files and docs

**Nothing collected.**

### 2.8 Calendar / Contacts

**Nothing collected.**

### 2.9 Location

**Nothing collected.** L'adresse IP est hashée SHA-256 côté serveur pour
prévention de fraude essai gratuit (jamais stockée en clair, jamais
géolocalisée précisément). Le pays (champ `country` dans logs d'erreur)
provient des en-têtes Cloudflare et n'est journalisé que dans les erreurs
techniques.

### 2.10 Web browsing

**Nothing collected.**

### 2.11 App activity

| Type | Collected | Shared | Ephemeral | Required/Optional | Purpose | Linked |
|---|---|---|---|---|---|---|
| **App interactions** | YES | NO | NO | **Required** | Analytics, App functionality | YES |
| **In-app search history** | YES | NO | NO | **Required** | Analytics | YES |
| **Installed apps** | NO | — | — | — | — | — |
| **Other user-generated content** | YES | NO | NO | Optional | App functionality | YES |
| **Other actions** | NO | — | — | — | — | — |

> **Note "App interactions"** : événements Firebase Analytics (`app_open`,
> `page_view`, `food_added`, `search`, `water_added`, `subscription_action`,
> `paywall_shown`, `photo_ia`, `first_meal_logged`, `donation`,
> `avatar_change`). Cf. `js/services/analytics.js`.
> **"User-generated content"** : aliments custom créés par l'utilisateur
> (collection Firestore `community_foods`, anonyme : crowd-sourced sans
> userId, juste `addedAt`).

### 2.12 Web browsing

**Nothing collected.**

### 2.13 App info and performance

| Type | Collected | Shared | Ephemeral | Required/Optional | Purpose | Linked |
|---|---|---|---|---|---|---|
| **Crash logs** | YES | NO | NO | **Required** | App functionality (debug) | YES |
| **Diagnostics** | YES | NO | NO | **Required** | App functionality (debug) | YES |
| **Other app performance data** | NO | — | — | — | — | — |

> **Note** : logs d'erreurs JavaScript (message, stack trace, URL, userAgent,
> pays Cloudflare, IP hashée) stockés dans Firestore (`error_logs/{id}`)
> avec association userId. Pas de Sentry / Crashlytics intégré actuellement,
> implémentation maison.

### 2.14 Device or other identifiers

| Type | Collected | Shared | Ephemeral | Required/Optional | Purpose | Linked |
|---|---|---|---|---|---|---|
| **Device or other IDs** | YES | NO | NO | **Required** | Analytics, Fraud prevention | YES |

> **Note** : Firebase Analytics génère un identifiant pseudo-anonyme côté
> client (Firebase Installation ID). FCM Token stocké pour notifications
> push (`users/{uid}.fcmToken`). IP hashée pour anti-fraude essai gratuit.

---

## Section 3 — Data usage and handling per type

Pour les types **Collected: YES**, Google demande les purposes. Récap :

| Data type | Purposes |
|---|---|
| **Name, Email, User IDs** | Account management, Communications |
| **Other personal info (age/sex/height/weight)** | App functionality |
| **Health info** | App functionality |
| **Purchase history** | App functionality |
| **Photos** | App functionality |
| **App interactions / In-app search** | Analytics, App functionality |
| **User-generated content (foods)** | App functionality |
| **Crash logs / Diagnostics** | App functionality |
| **Device IDs** | Analytics, Fraud prevention, App functionality |

**Aucune donnée n'est utilisée pour** :
- Advertising or marketing
- Personalization
- Account management *au-delà* de ce qui est strictement nécessaire
- Fraud prevention, security, and compliance *au-delà* de l'IP hashée

---

## Section 4 — Data sharing (3P)

**Seuls les transferts suivants existent** :

| Recipient | Data type | Purpose | Linked |
|---|---|---|---|
| **Google Cloud (Firebase)** | Tous les types ci-dessus (sauf photos) | Hosting, Auth, DB | YES |
| **Google Gemini (API)** | Photos | Food recognition (ephemeral) | NO |
| **Google (Firebase Analytics)** | App interactions, Device IDs | Analytics | YES |
| **Cloudflare** | Logs serverless (IP hashée, userAgent) | Hosting, Anti-fraud | YES (via UID) |
| **Stripe** | Email, Purchase data | Payment processing (web) | YES |
| **PayPal** | Email, Donation amount | Payment processing (web donations) | YES |
| **Apple (In-App Purchase)** | Purchase data | Payment processing (iOS) | YES |
| **Google (Play Billing)** | Purchase data | Payment processing (Android) | YES |
| **RevenueCat** | Subscription status, App User ID | Subscription management (mobile) | YES |
| **OpenFoodFacts** | Barcode strings | Food database lookup (no PII) | NO |

> **À déclarer comme "Sharing" dans Play** : Photos (avec Google Gemini),
> Purchase history (avec Stripe/PayPal/Apple/Google/RevenueCat). Les
> transferts à Firebase ne comptent pas comme "Sharing" car Firebase
> est l'hébergement principal (processeur, pas tiers indépendant).

---

## Section 5 — User controls

### Can users request data deletion?
**YES** — In-app *Paramètres → Supprimer mon compte* + email
`contact@1food.fr`. SLA 30 jours, conforme Apple §5.1.1.v et Google Play
Developer Program Policies.

### Can users opt out of data collection?
**Partial** :
- Compte requis pour utiliser l'app (santé/nutrition).
- Notifications push : opt-in via modal pre-prompt.
- Caméra (Photo IA) : opt-in via modal pre-prompt.
- Analytics : non opt-out individuel pour l'instant (à considérer pour v2).

### Can users export their data?
**YES** — *Paramètres → Exporter* (JSON complet, conforme droit à la
portabilité RGPD).

---

## Section 6 — Liens annexes à fournir dans la Console

| Champ | Valeur |
|---|---|
| **Privacy Policy URL** | https://1food.fr/privacy.html |
| **Terms URL** | https://1food.fr/terms.html |
| **Support contact** | contact@1food.fr |
| **Data deletion URL** | https://1food.fr/index.html#settings (puis Supprimer mon compte) — **TODO** : créer endpoint dédié `/api/delete-account` pour requête sans login, exigé par Apple/Play depuis 2024 |

---

## Section 7 — Checklist avant submission

- [ ] Tester un cycle complet de suppression de compte (vérifier
      effacement Firestore + Auth + storage)
- [ ] Documenter ou désactiver l'event `food_name` envoyé à Firebase
      Analytics (peut contenir des PII si l'aliment est custom)
- [ ] Créer endpoint `/api/delete-account` public (sans login) pour
      conformité Apple §5.1.1.v et Google Play 2024
- [ ] Si activation Sentry/Crashlytics ultérieure → mettre à jour cette
      doc + privacy.html
- [ ] Re-vérifier ce form après chaque release qui touche analytics,
      Firestore ou paiements

---

*Document à conserver. Réviser à chaque release majeure ou ajout de SDK
tiers.*
