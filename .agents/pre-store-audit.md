# Pre-Store Audit — OneFood

*Tour du proprio avant Google Play & App Store. Trié par criticité. Skill `intuition` activé : `aso-audit` + analyse code + standards stores 2026.*

---

## 🔴 BLOCKERS — sortie store impossible / rejet quasi-certain

### 1. Pas de projet natif Android/iOS généré
**État** : `capacitor.config.json` ✅ présent (`appId: fr.onefood.app`, splash, push). Mais aucun dossier `android/` ni `ios/` dans le repo → **Capacitor n'a jamais été syncé**.

**Action** :
```bash
npm run android:install     # installe Capacitor (script ajouté)
npx cap add android
npm run cap:sync            # construit android/
# Pour iOS (Mac requis) :
npx cap add ios
npx cap sync ios
```

### 2. **Apple App Store : Stripe ≠ autorisé pour l'abonnement digital**
La règle 3.1.1 d'Apple impose **In-App Purchase (IAP)** pour tout contenu/service digital consommé dans l'app. Stripe + PayPal ne passeront pas. **Ton app sera rejetée à la review.**

3 voies possibles :
- **A. Implémenter IAP Apple en parallèle de Stripe** — plugin `@capacitor-community/in-app-purchases-2` ou **RevenueCat** (recommandé, gère les deux stores + abos via une seule API). Côté code : abstraire `TrialService.startPayment()` pour brancher Stripe (web), Apple IAP (iOS), Google Play Billing (Android).
- **B. Distribuer une PWA "à installer manuellement"** sans passer par App Store. Ratio installs très inférieur mais pas de 30%.
- **C. Reader app exemption** — mais OneFood n'est pas un "reader" donc inéligible.

**Recommandation** : RevenueCat (gratuit jusqu'à 2,5k$/mois MTR, ~9% commission au-delà) + plugin Capacitor officiel. Refactor estimé : **2-3 jours**.

### 3. Google Play : même règle (depuis 2022)
Google Play Billing obligatoire pour digital subs. Mêmes solutions (RevenueCat couvre les deux). À noter : Google a perdu en justice contre Epic, des assouplissements arrivent en 2026 mais pour l'instant la règle s'applique.

### 4. Pas de vérification d'âge à l'inscription
Apple et Google exigent une déclaration d'âge minimum (généralement 13 ans, 16 dans certains pays UE pour le RGPD). Aucun input « date de naissance » ou « j'ai plus de 13 ans » dans le signup.

**Action** : ajouter un champ "Année de naissance" dans le profil + bloquer si < 13 ans. Stocker dans `Storage.getProfile()`.

---

## 🟠 STRONG RECOMMENDATIONS — risque de rejet ou mauvaises premières reviews

### 5. Pre-prompt d'explication avant les permissions OS

Actuellement (`js/services/notifications.js:57`, `js/pages/camera.js:65`) on appelle directement `Notification.requestPermission()` ou `getUserMedia()`. Apple exige (et Android recommande) un écran d'explication AVANT.

**Action** : modale custom du genre « OneFood a besoin de la caméra pour analyser tes plats en photo. Tu pourras toujours autoriser/refuser ensuite. » → puis appel système.

### 6. Privacy Nutrition Labels (Apple) + Data Safety form (Google)

Les deux stores demandent maintenant un formulaire détaillé sur les données collectées. À pré-remplir :

| Catégorie | Collectée | Linked to user | Usage |
|---|---|---|---|
| Email | Oui (Firebase Auth) | Oui | Compte, support |
| Health & Fitness | Oui (poids, calories, séances) | Oui | Fonction principale |
| Photos | Non (envoyées, jamais stockées) | Non | Analyse Photo IA |
| Crash Logs | Oui (Sentry) | Non (anonyme) | Stabilité |
| User ID | Oui (Firebase UID) | Oui | Sync multi-device |
| Purchase History | Oui (Stripe) | Oui | Abonnement |

→ document à conserver et à coller mot pour mot dans les deux consoles store.

### 7. Permissions Android probablement trop larges (à vérifier après `cap sync`)

À l'audit du `AndroidManifest.xml` (généré par Capacitor + plugins), retirer toute permission inutile :
- `BLUETOOTH` / `BLUETOOTH_ADMIN` — non utilisée
- `READ/WRITE_EXTERNAL_STORAGE` — Android 11+ utilise Scoped Storage
- `RECORD_AUDIO` — uniquement si voice activé (sinon retirer)
- Garder : `INTERNET`, `CAMERA`, `VIBRATE`, `POST_NOTIFICATIONS` (Android 13+)

### 8. Targets SDK Android à jour (Play Store policy)

Depuis août 2024, Play Store exige `targetSdkVersion >= 34` (Android 14). À vérifier dans `android/app/build.gradle` après sync. Le template Capacitor 6.x est déjà à 34, donc ✅ probable.

### 9. Splash screen + adaptive icons natifs

`capacitor.config.json` configure le splash (durée 2000ms, fond #EF4444 — ✅ aligné sur le nouveau logo) mais il faut générer les ressources réelles :
```bash
npx @capacitor/assets generate --iconBackgroundColor "#EF4444" --splashBackgroundColor "#EF4444"
```
Source : `assets/icons/icon-512.png` (déjà à jour avec le nouveau logo).

### 10. Versionnement natif

À chaque release, bumper :
- `capacitor.config.json` ne contient pas la version → la version vient de `android/app/build.gradle` (`versionCode` int + `versionName` string) et `ios/App/App/Info.plist`
- Synchroniser avec `package.json:version` (1.0.2 actuellement)
- Play Store : `versionCode` doit être strictement croissant à chaque upload

---

## 🟡 NICE TO HAVE — post-launch ou polish

### 11. Onboarding première utilisation
Aucun tutoriel ne montre Photo IA / Chat IA / Créature au premier lancement. Un onboarding 3-écrans augmente la rétention D1 de 20-30%. → Skill `onboarding-cro`.

### 12. Deep links / Universal links
Permettrait `1food.fr/onefood-vs-myfitnesspal.html?ref=...` à ouvrir directement dans l'app si installée. Capacitor plugin `App` + AndroidManifest `<intent-filter>`.

### 13. Push notifications réelles
FCM est configuré (`sw.js`) mais aucune campagne push live. Le scheduler `daily-notification.js` est dans `functions/api/` mais à vérifier qu'il tourne via Cron Cloudflare.

### 14. Demande de review in-app
Plugin `@capacitor-community/in-app-review` après J7+ d'utilisation et 3+ logs/jour. Booste les notes Play/App Store.

### 15. Backups automatiques cloud
Sync Firestore est en place ✅, mais pas de "backup zip exportable" pour l'utilisateur soucieux. `exportData()` existe (settings.js:307) mais pas mis en avant.

### 16. Mode hors ligne complet
Service Worker cache fonts + JS + CSS, mais le journal du jour fonctionne en offline. Tester scénario complet : avion, ouvrir l'app, logger 5 repas, atterrir, sync auto.

### 17. Accessibilité (a11y)
- Contrast ratios : OK (rouge sur sombre passe WCAG AA)
- Tab navigation : à tester systématiquement
- Screen reader labels (aria-label) : présents sur la nav, à vérifier sur les modals
- Focus visible : `:focus-visible` dans CSS, à valider sur tous les boutons

### 18. Tests automatisés
Aucun test Playwright/Cypress sur les flows critiques (signup, paywall, photo IA). Si tu solo-développe c'est OK pour l'instant ; si l'équipe grandit, c'est bloquant.

### 19. Telemetry produit
Firebase Analytics est branché (`js/services/analytics.js`) mais les events clés à logger pour mesurer la santé :
- `signup_completed`
- `first_meal_logged`
- `trial_started`
- `paywall_shown`
- `paywall_subscribed`
- `subscription_cancelled`
- `photo_ia_success` / `photo_ia_failed`
- `streak_lost`

### 20. Page settings : import MFP
Trouvée comme objection #1 dans le research client (`.agents/customer-research.md`). Aujourd'hui marquée "à prévoir". Construire un parser CSV MFP basique éliminerait un blocker switch majeur.

---

## ✅ Ce qui est déjà OK (bon balayage)

- **Account deletion** complète (`settings.js:457` + Firestore docs + auth account, conforme Apple/Play 2024)
- **Health disclaimer** présent (`terms.html:102`, `mentions-legales.html:68`, `dashboard.js:274`)
- **GDPR consent** explicite avant traitement (`app.js:196-461`)
- **Privacy Policy + Terms** en français hébergés (`privacy.html`, `terms.html`)
- **Photo deletion policy** explicite (Gemini supprime après analyse — point fort à défendre)
- **Export RGPD** des données utilisateur (`settings.js:307`)
- **Versioning serveur** robuste (sw.js + version.json + cache bust)
- **Logo & branding** modernisés ✅
- **Sentry monitoring** + endpoint `/api/error-log`
- **PWA installable** (manifest, icons, SW) — déjà testable comme app native sur Android via "Ajouter à l'écran d'accueil"

---

## Roadmap minimale avant Play Store (estimation 2-3 semaines)

| Sprint | Sujet | Effort |
|---|---|---|
| **Sprint 1** (3-4j) | Refactor paiement multi-channel : Stripe (web) + RevenueCat (mobile) | 🔴 Critique |
| | Ajouter check d'âge à l'inscription | 🔴 Critique |
| **Sprint 2** (3-4j) | `npx cap add android` + custom splash + adaptive icons + audit AndroidManifest | 🔴 Critique |
| | Pre-prompts permissions caméra/notifications | 🟠 |
| | Tests sur APK release sur 5+ devices Android (Samsung, Pixel, Xiaomi) | 🟠 |
| **Sprint 3** (2-3j) | Onboarding 3-écrans | 🟡 mais ROI fort |
| | Events analytics santé produit | 🟡 |
| | Remplir formulaires Data Safety + Privacy Labels | 🟠 |
| **Sprint 4** (2j) | Soumission Play Store + iteration sur reviewers feedback | — |

Pour Apple Store, ajouter ~1 sprint pour tests `ios/`, certificats, TestFlight, soumission.

---

## Action immédiate suggérée

1. **Décider la stratégie paiement** — RevenueCat ou native IAP direct ? (impact : bloque tout le reste)
2. **`npm run android:install` + `npx cap add android`** — voir l'état natif réel
3. **Ajouter le check d'âge** — 30 min de dev, débloque la conformité

Dis-moi par quoi tu veux qu'on attaque.
