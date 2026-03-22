# IronFuel — Récapitulatif Complet v52
> Dernière mise à jour : 21 mars 2026

---

## 1. ÉTAT ACTUEL DU PROJET

| Élément | Valeur |
|---------|--------|
| Version | 3.0.0 (cache v52) |
| URL prod | https://theironfuel.netlify.app |
| Hébergement | Netlify (front + serverless functions) |
| Backend | Firebase Auth + Firestore REST API |
| Paiement | Stripe (annuel/mensuel) + PayPal (en cours) |
| IA | Google Gemini 2.5 Flash (analyse photo) |
| Contact | iron.fuel@outlook.com |
| Portail Stripe | https://billing.stripe.com/p/login/dRmcMXcr4bNCaKWci65c400 |

---

## 2. ARCHITECTURE TECHNIQUE

### Stack
- **Frontend** : Vanilla JS (pas de framework), SPA hash-based routing
- **CSS** : 1 fichier (`style.css`, 86KB), dark mode, glassmorphism
- **Backend** : 12 Netlify Functions (Node.js, esbuild)
- **Auth** : Firebase Auth (Google, Apple, Email)
- **DB** : localStorage (client) + Firestore REST (cloud sync)
- **PWA** : Service Worker, manifest, icônes PNG maskable
- **Notifications** : Firebase Cloud Messaging

### Fichiers principaux (33 scripts JS, ~14K lignes)
```
js/
├── app.js              # Contrôleur SPA + onboarding + RGPD
├── db.js               # Base 500+ aliments (55KB)
├── storage.js          # Wrapper localStorage
├── services/
│   ├── auth.js         # Firebase Auth + login screen
│   ├── sync.js         # Firestore REST sync + polling 30s
│   ├── trial.js        # Freemium + Stripe/PayPal
│   ├── nutrition.js    # Calcul BMR/TDEE (Mifflin-St Jeor)
│   ├── vision.js       # Analyse photo IA (Gemini)
│   ├── micronutrients.js # Estimation micronutriments (premium)
│   ├── notifications.js  # FCM push
│   ├── paypal.js       # Intégration PayPal
│   ├── analytics.js    # Firebase Analytics
│   ├── speech.js       # Reconnaissance vocale
│   ├── openfoodfacts.js # API OpenFoodFacts
│   └── foodimages.js   # Images aliments
├── components/
│   ├── modal.js        # Modales (role=dialog, aria-modal)
│   ├── charts.js       # Chart.js wrappers
│   ├── navbar.js, mealcard.js, fooditem.js, avatar.js
├── pages/
│   ├── dashboard.js    # Accueil (repas, macros, fibres, hydratation)
│   ├── diary.js        # Journal alimentaire
│   ├── search.js       # Recherche aliments
│   ├── camera.js       # Photo IA
│   ├── voice.js        # Saisie vocale
│   ├── barcode.js      # Scanner code-barres
│   ├── supplements.js  # Compléments (nouveau v50)
│   ├── gym.js          # Salle de musculation
│   ├── shop.js         # Boutique cosmétiques créature
│   ├── avatar.js       # Créature évolutive
│   ├── profile.js, settings.js, history.js, customfood.js

netlify/functions/
├── analyze.js              # Gemini IA (authentifié Firebase)
├── create-checkout.js      # Stripe checkout session
├── stripe-webhook.js       # Webhook Stripe (signature vérifiée)
├── create-portal-session.js # Portail client Stripe
├── verify-payment.js       # Vérification paiement
├── create-paypal-order.js  # PayPal création commande
├── capture-paypal-order.js # PayPal capture
├── paypal-webhook.js       # Webhook PayPal (⚠️ signature non vérifiée)
├── trial-check.js          # Vérification trial server-side (IP hash)
├── daily-notification.js   # Cron FCM quotidien (7 UTC)
├── send-notification.js    # Envoi FCM
└── save-email.js           # Collecte emails
```

---

## 3. FEATURES IMPLÉMENTÉES

### Core
- [x] Suivi calories/macros/fibres quotidien
- [x] Journal alimentaire (4 repas)
- [x] Base de données 500+ aliments français
- [x] Recherche OpenFoodFacts (code-barres + texte)
- [x] Analyse photo IA (Gemini 2.5 Flash)
- [x] Saisie vocale
- [x] Scanner code-barres
- [x] Historique + graphiques Chart.js
- [x] Suivi poids
- [x] Suivi hydratation (verres d'eau)
- [x] Objectifs personnalisés (Mifflin-St Jeor)

### Gamification
- [x] Créature évolutive (3 types, 4 formes)
- [x] IronCoins (monnaie in-app)
- [x] Boutique cosmétiques (vêtements, accessoires)
- [x] Streak quotidien
- [x] Bonus calories/eau atteints

### Premium (v50+)
- [x] Suivi micronutriments (12 vitamines/minéraux)
- [x] Fibres dans les macros
- [x] Page Compléments (16 prédéfinis + custom)
- [x] Salle de musculation

### Technique
- [x] PWA offline-first (Service Worker)
- [x] Dark mode (auto/clair/sombre)
- [x] Sync cloud multi-appareils (Firestore REST)
- [x] Notifications push FCM
- [x] Animations + glassmorphism (reduced-motion respecté)
- [x] Bouton retour sur chaque page
- [x] Détection PWA vs navigateur (bouton installer)
- [x] Fun fact quotidien (rotation à 8h)

### Légal & Sécurité (v51-52)
- [x] Politique de confidentialité (`/privacy.html`)
- [x] Conditions d'utilisation (`/terms.html`)
- [x] Consentement RGPD (modal explicite, données santé)
- [x] Suppression de compte (+ subcollections Firestore)
- [x] Portail abonnement Stripe
- [x] Webhook Stripe sécurisé (signature vérifiée)
- [x] API analyse authentifiée (Firebase token)
- [x] Config Firebase hardcodée (anti-injection)
- [x] Import données sécurisé (clés sensibles bloquées)
- [x] XSS corrigé (échappement OpenFoodFacts)
- [x] Vérification paiement avant activation premium

---

## 4. CORRECTIONS v52 (Audit strict)

### CRITICAL corrigés
| # | Issue | Fix |
|---|-------|-----|
| C3 | `_verifyAndUnlock` marquait paid AVANT vérification Stripe | Vérifie d'abord, puis active |
| C4 | `analyze.js` sans authentification (abus Gemini possible) | Token Firebase requis |

### HIGH corrigés
| # | Issue | Fix |
|---|-------|-----|
| H1 | Config Firebase modifiable via localStorage | Hardcodée, plus de lecture LS |
| H2/H3 | XSS via noms/images OpenFoodFacts | `_escapeHtml()` + DOM API pour images |
| H4 | `importData` acceptait tout sans validation | Filtre `nutritrack_` + bloque `trial`/`firebase_config` |
| H5 | SDK Firestore chargé mais jamais utilisé (90KB+) | Supprimé de index.html + SW |
| H7 | Suppression compte ne supprimait pas les logs Firestore | Supprime subcollection `logs/` puis doc principal |

### MEDIUM corrigés
| # | Issue | Fix |
|---|-------|-----|
| M1 | Polling sync toutes les 5s (5760 appels/jour/user) | Réduit à 30s |
| M4 | Version analytics `v51` au lieu de `v52` | Corrigé |
| M5 | Checkbox newsletter lue après destruction du DOM | Lecture avant `innerHTML` |
| M6 | `startPolling()` jamais atteint (early returns) | Restructuré `onLogin()`, polling toujours démarré |

---

## 5. ISSUES CONNUES NON CORRIGÉES

### CRITICAL restants
| # | Issue | Impact | Quand |
|---|-------|--------|-------|
| C1 | PayPal webhook sans vérification de signature | Bypass premium possible | Lundi (compte live) |
| C2 | Trial bypass via console (`localStorage.setItem`) | Perte revenus | Architecture server-side à terme |
| C5 | Aucun rate limiting sur les Netlify Functions | Abus API possible | Moyen terme |

### HIGH restants
| # | Issue | Impact | Quand |
|---|-------|--------|-------|
| H6 | `verify-payment.js` sans authentification | Fuite info session Stripe | Prochaine session |
| H8 | Hash IP djb2 faible dans `trial-check` | Collisions possibles | Prochaine session |

### MEDIUM restants
| # | Issue | Impact | Quand |
|---|-------|--------|-------|
| M2 | Dead code `_analyzeWithGemini`/`_analyzeWithOpenAI` | Bruit code | Nettoyage |
| M3 | PayPal `PLAN_ID` vide → bouton subscription inactif | PayPal mensuel cassé | Quand PayPal live |
| M7 | URL portail Stripe hardcodée en 2 endroits | Maintenance | Prochaine session |
| M8 | `checkAndAwardXP()` appelé à chaque render dashboard | Perf mineure | Optimisation |
| M9 | Stripe crée un nouveau Product sans env var `PRICE_ID` | Pollution Stripe Dashboard | Vérifier env vars |

### LOW
| # | Issue |
|---|-------|
| L1 | 33 scripts sans `defer` ni bundling |
| L2 | `manifest.json` screenshots vide |
| L3 | Pas de Content-Security-Policy header |
| L4 | Apple Sign-In potentiellement non configuré dans Firebase |
| L5 | `item.id` float dans onclick (perte précision possible) |
| L6 | Privacy/Terms pages ne respectent pas le dark mode |
| L7 | Fun fact hash peut répéter avec 30 items |
| L8 | `getStreak()` lit jusqu'à 365 jours de localStorage |
| L9 | Apple Sign-In via popup peut échouer en PWA iOS |

---

## 6. CHECKLIST PRÉ-STORE LAUNCH

### Obligatoire (bloquant)
- [x] Privacy Policy (page web + lien in-app)
- [x] Conditions d'utilisation
- [x] Suppression de compte in-app
- [x] Consentement RGPD (données santé)
- [x] Icônes PNG maskable (192 + 512)
- [ ] **Firebase Security Rules** — Vérifier dans la console Firebase
- [ ] **Apple Developer Account** (99$/an)
- [ ] **Google Play Console** (25$ one-time)
- [ ] **Screenshots stores** (3-5 captures phone)
- [ ] **Apple In-App Purchase / StoreKit** — si vente in-app iOS
- [ ] **Google Play Billing** — si vente in-app Android

### Recommandé
- [ ] PayPal webhook signature verification
- [ ] Content-Security-Policy header
- [ ] Stripe Tax pour ventes multi-pays EU
- [ ] Portail annulation accessible facilement
- [ ] `defer` sur les scripts app
- [ ] Screenshots dans manifest.json

---

## 7. FIREBASE SECURITY RULES (à appliquer)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chaque user ne peut lire/écrire que ses propres données
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Bloquer tout le reste
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 8. MODÈLE ÉCONOMIQUE

| Plan | Prix | Commission store | Net estimé |
|------|------|------------------|------------|
| Annuel (Stripe) | 14,99€/an | 0% (web) / 30% (Apple) / 15% (Google) | 14,99€ / 10,49€ / 12,74€ |
| Mensuel (Stripe) | 1,25€/mois | idem | 1,25€ / 0,87€ / 1,06€ |

### Features premium (verrouillées après 14j trial)
- Créature évolutive
- Objectifs macros personnalisés
- Photo IA
- Saisie vocale
- Code-barres
- Micronutriments
- (Compléments accessible à tous)

### Attention TVA
- Vente de services numériques B2C en UE = TVA obligatoire
- Stripe Tax peut automatiser
- Seuil OSS : 10 000€ de ventes annuelles cross-border

---

## 9. PLANNING IMMÉDIAT

### Lundi 23 mars
- [ ] Firebase ownership transfer (fin du blocage 72h)
- [ ] PayPal compte live (vérification en cours)
- [ ] Vérifier Firebase Security Rules
- [ ] PayPal webhook signature

### Cette semaine
- [ ] Apple Developer Account inscription
- [ ] Google Play Console inscription
- [ ] Préparer screenshots (5 écrans clés)
- [ ] Tester Apple Sign-In dans Firebase

### Week-end prochain (objectif stores)
- [ ] Build TWA (Google Play) — Bubblewrap ou PWABuilder
- [ ] Build iOS wrapper — Capacitor ou PWABuilder
- [ ] Soumission Google Play
- [ ] Soumission Apple App Store

---

## 10. CONTACTS & CREDENTIALS

| Service | Compte | Notes |
|---------|--------|-------|
| Netlify | — | Site: theironfuel |
| Firebase | ironfuel-422fe | Project ID |
| Stripe | — | Portail: lien ci-dessus |
| PayPal | — | En attente vérification |
| Contact | iron.fuel@outlook.com | Email public |

---

## 11. VERSIONING

| Version | Date | Changements majeurs |
|---------|------|---------------------|
| v50 | Mars 2026 | Fibres, micronutriments, compléments, layout dashboard, RGPD, privacy/CGU |
| v51 | Mars 2026 | Email contact, icônes PNG, suppression compte, portail Stripe |
| v52 | 21 mars 2026 | Audit sécurité : auth API, XSS, Firebase config, import validation, sync polling, Firestore cleanup, SDK Firestore supprimé |

---

*Fichier généré le 21 mars 2026 — IronFuel v52*
