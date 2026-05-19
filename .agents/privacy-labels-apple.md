# Apple App Store Privacy Labels — OneFood

**À recopier dans App Store Connect → My Apps → OneFood → App Privacy.**
Source de vérité : audit code 2026-05-19, aligné avec
`.agents/data-safety-form.md` et `privacy.html` v136.

Apple impose une catégorisation en **trois groupes** :
1. **Data Used to Track You** (cross-app/website tracking, IDFA, etc.)
2. **Data Linked to You** (associée à l'identité utilisateur)
3. **Data Not Linked to You** (anonymisée ou agrégée)

Pour chaque type : préciser les **purposes** (Analytics, App Functionality,
Developer's Advertising or Marketing, Third-Party Advertising, Product
Personalization, Other Purposes).

---

## Section 1 — Data Used to Track You

**Aucune.** OneFood ne fait pas de tracking cross-app/cross-website.
Pas d'IDFA, pas de SDK pub, pas de partage de données avec data brokers.

> **Réponse au prompt "Does this app use data for tracking purposes?" :**
> **NO**

---

## Section 2 — Data Linked to You

Données associées à l'identité utilisateur (Firebase UID, email).

### 2.1 Contact Info

| Data Type | Collected | Purposes |
|---|---|---|
| **Email Address** | YES | App Functionality |
| **Name** | YES (optionnel, via Google Sign-in) | App Functionality |
| Phone Number | NO | — |
| Physical Address | NO | — |
| Other User Contact Info | NO | — |

### 2.2 Health & Fitness

| Data Type | Collected | Purposes |
|---|---|---|
| **Health** (poids, calories, macros, hydratation) | YES | App Functionality |
| Fitness | NO* | — |

> *Pas de données d'activité physique tracking (pas de podomètre, pas
> d'intégration HealthKit pour l'instant). Si HealthKit ajouté plus tard :
> mettre à jour cette doc + ajouter clé `NSHealthShareUsageDescription` au
> `Info.plist`.

### 2.3 Financial Info

| Data Type | Collected | Purposes |
|---|---|---|
| Payment Info | NO* | — |
| Credit Info | NO | — |
| Other Financial Info | NO | — |

> *Aucune donnée bancaire ne transite par OneFood. Paiements traités
> exclusivement par Stripe / PayPal (web) ou Apple In-App Purchase (iOS) ou
> Google Play Billing (Android), via RevenueCat pour l'unification mobile.

### 2.4 Location

| Data Type | Collected | Purposes |
|---|---|---|
| Precise Location | NO | — |
| Coarse Location | NO | — |

> L'adresse IP est hashée SHA-256 côté serveur (anti-fraude essai gratuit) —
> non considérée "Location" par Apple si elle n'est pas géolocalisée. Le pays
> dérivé des headers Cloudflare n'est journalisé que dans `error_logs`.

### 2.5 Sensitive Info

| Data Type | Collected | Purposes |
|---|---|---|
| Sensitive Info | NO | — |

> Pas de données sensibles au sens Apple (origine raciale, opinions politiques,
> religion, orientation sexuelle, etc.). Les données de santé sont traitées
> dans la catégorie dédiée Health & Fitness.

### 2.6 Contacts

| Data Type | Collected | Purposes |
|---|---|---|
| Contacts | NO | — |

### 2.7 User Content

| Data Type | Collected | Purposes |
|---|---|---|
| **Photos or Videos** | YES (Photo IA) | App Functionality |
| Audio Data | NO* | — |
| **Other User Content** (aliments custom) | YES | App Functionality |
| Customer Support | NO | — |
| Gameplay Content | NO | — |
| Emails or Text Messages | NO | — |

> **Note Photos** : transmises à Google Gemini Vision pour analyse,
> jamais stockées par OneFood, jamais utilisées pour entraîner des IA.
> Apple considère que tant que la photo passe dans l'app (même éphémère),
> elle doit être déclarée. Fonctionnalité opt-in.
>
> *Web Speech API pour dictée → traitement 100% local navigateur, jamais
> envoyé serveur.
>
> **"Other User Content"** : aliments custom créés par l'utilisateur,
> stockés dans `community_foods` (anonymisés mais on coche Linked car
> on prend l'angle conservateur).

### 2.8 Browsing History

| Data Type | Collected | Purposes |
|---|---|---|
| Browsing History | NO | — |

### 2.9 Search History

| Data Type | Collected | Purposes |
|---|---|---|
| **Search History** (recherche d'aliments in-app) | YES | Analytics |

> Event `search` dans Firebase Analytics (cf. `analytics.js:53`).

### 2.10 Identifiers

| Data Type | Collected | Purposes |
|---|---|---|
| **User ID** (Firebase UID) | YES | App Functionality, Analytics |
| Device ID | NO* | — |

> *Pas d'IDFA, pas d'identifiant matériel Apple. Firebase génère un
> Installation ID pseudo-anonyme côté client mais Apple ne le considère
> pas comme "Device ID" si on n'utilise pas `identifierForVendor` ou IDFA.
> Si on intègre l'attribution publicitaire plus tard → re-déclarer.

### 2.11 Purchases

| Data Type | Collected | Purposes |
|---|---|---|
| **Purchase History** | YES | App Functionality |

> Collections Firestore `subscriptions/{uid}` et `donations/{id}`. Inclut
> status d'abonnement, plan, dates, montants. Synchronisé via webhooks
> Stripe / PayPal / RevenueCat.

### 2.12 Usage Data

| Data Type | Collected | Purposes |
|---|---|---|
| **Product Interaction** (events Firebase Analytics) | YES | Analytics, App Functionality |
| **Advertising Data** | NO | — |
| Other Usage Data | NO | — |

> Events : `app_open`, `page_view`, `food_added`, `water_added`,
> `subscription_action`, `paywall_shown`, `photo_ia`,
> `first_meal_logged`, `donation`, `avatar_change`. Cf.
> `js/services/analytics.js`.

### 2.13 Diagnostics

| Data Type | Collected | Purposes |
|---|---|---|
| **Crash Data** | YES | App Functionality |
| **Performance Data** | NO* | — |
| **Other Diagnostic Data** | YES (userAgent, country, hashed IP) | App Functionality |

> Logs JS clients envoyés à Firestore `error_logs/{id}` avec userId,
> stack trace, URL, userAgent, country (Cloudflare), IP hashée.
> *Pas de framework de profiling actif (Sentry / Crashlytics).

### 2.14 Other Data

| Data Type | Collected | Purposes |
|---|---|---|
| **Other Data Types** (âge, sexe, taille, poids) | YES | App Functionality |

> Pas de catégorie native Apple pour les données démographiques de profil
> nutritionnel. À mettre dans "Other Data" avec description :
> "User profile (age, sex, height, weight) used to calculate personalized
> nutritional needs".

---

## Section 3 — Data Not Linked to You

Données collectées mais non associables à l'identité utilisateur.

### 3.1 Photos or Videos

| Data Type | Collected | Purposes |
|---|---|---|
| **Photos** (envoyées à Gemini) | YES (ephemeral) | App Functionality |

> Bien que collectées au sens technique (passage par mémoire serveur
> Cloudflare Worker → API Gemini), les photos ne sont **pas linkées à
> l'identité** car :
> - Pas de userId dans la requête Gemini
> - Pas de stockage post-analyse (ni OneFood ni Google)
> - Pas d'entraînement modèles
>
> **À débattre avec Apple Review** : certains reviewers considèrent que
> dès qu'une photo passe par un serveur appartenant au dev, elle doit
> être "Linked" même si éphémère. Position défensive : Linked-to-user
> dans §2.7, et expliciter dans l'app description.

---

## Section 4 — Privacy Manifest (`PrivacyInfo.xcprivacy`)

**Requis iOS depuis mai 2024** pour toutes les apps qui utilisent certaines
APIs ("Required Reason APIs"). À créer dans `assets/native-sources/` puis
copier dans `ios/App/App/` après `npx cap add ios`.

### APIs candidates utilisées (selon le code) :

| API | Reason code | Justification |
|---|---|---|
| `UserDefaults` | `CA92.1` ou `1C8F.1` | Stockage de préférences utilisateur (équivalent localStorage en native) |
| `File timestamp APIs` (`NSURLContentModificationDateKey`, etc.) | `C617.1` | Si Capacitor Filesystem est utilisé pour cache |
| `System boot time APIs` | Non utilisé | — |
| `Disk space APIs` | Non utilisé | — |
| `Active keyboard APIs` | Non utilisé | — |

### Tracking domains à déclarer :
**Aucun** — pas de tracking cross-app/website.

### SDKs tiers à déclarer dans le manifest :
Selon la liste des "commonly used third-party SDKs that require manifest" :
- `RevenueCat` — ⚠️ requis (depuis l'ajout au projet)
- `Firebase Analytics` — requis
- `Firebase Auth` — requis
- `Firebase Firestore` — requis
- `Firebase Messaging` (FCM) — requis

> Chaque SDK ci-dessus doit publier son propre `PrivacyInfo.xcprivacy`.
> Vérifier que les versions Capacitor / Firebase / RevenueCat installées
> sont récentes (post-2024-05) pour avoir les manifests.

### Template à créer (`assets/native-sources/PrivacyInfo.xcprivacy`) :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <!-- Email -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Name -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeName</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Health (poids, calories, macros) -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeHealth</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Photos (Photo IA) -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePhotosorVideos</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Other User Content (aliments custom) -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeOtherUserContent</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Search History -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeSearchHistory</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAnalytics</string>
            </array>
        </dict>
        <!-- User ID -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeUserID</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
                <string>NSPrivacyCollectedDataTypePurposeAnalytics</string>
            </array>
        </dict>
        <!-- Purchase History -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePurchaseHistory</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Product Interaction -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeProductInteraction</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAnalytics</string>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Crash Data -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeCrashData</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Other Diagnostic Data (userAgent, country, hashed IP) -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeOtherDiagnosticData</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Other Data Types (profil démographique) -->
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeOtherDataTypes</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

> ⚠️ Le fichier ci-dessus est un **template**. Quand `ios/` sera généré
> via `npx cap add ios`, copier ce fichier dans `ios/App/App/PrivacyInfo.xcprivacy`
> et l'inclure dans le Xcode bundle (drag & drop dans le project navigator,
> Target: App, Build Phase: Copy Bundle Resources).

---

## Section 5 — Permissions strings (`Info.plist`)

À ajouter quand `ios/` sera généré. Apple rejette systématiquement les
apps qui demandent une permission sans `*UsageDescription` clair en
français/anglais.

| Clé | Valeur recommandée (FR) |
|---|---|
| `NSCameraUsageDescription` | "OneFood utilise la caméra pour analyser tes plats grâce à l'intelligence artificielle." |
| `NSPhotoLibraryUsageDescription` | "OneFood accède à ta photothèque pour analyser une photo de repas déjà prise." |
| `NSMicrophoneUsageDescription` | "OneFood utilise le micro pour dicter tes repas à la voix. La reconnaissance vocale est traitée localement sur ton appareil." |
| `NSUserNotificationsUsageDescription` | (implicite via `requestAuthorization` du framework UserNotifications) |
| `NSHealthShareUsageDescription` | **NON requis** tant que pas d'intégration HealthKit |
| `NSHealthUpdateUsageDescription` | **NON requis** idem |

---

## Section 6 — App Tracking Transparency (ATT)

**Non requis.** OneFood ne fait pas de tracking au sens Apple :
- Pas de matching d'identité user cross-app/cross-website
- Pas d'IDFA collecté
- Pas de partage de données avec data brokers
- Pas de SDK pub

Donc **pas besoin** de prompt `ATTrackingManager.requestTrackingAuthorization()`.

> Si AdMob / Meta SDK / autre attribution publicitaire est ajoutée plus
> tard → ATT devient obligatoire + mettre à jour cette doc.

---

## Section 7 — Checklist avant submission App Store Connect

- [ ] Recopier sections 1-3 dans App Store Connect → App Privacy
- [ ] Vérifier que toutes les questions Apple ont été cochées (l'interface
      est un wizard step-by-step)
- [ ] Créer `PrivacyInfo.xcprivacy` dans le projet iOS (cf. §4)
- [ ] Ajouter les `*UsageDescription` au `Info.plist` (cf. §5)
- [ ] Vérifier que **TOUS** les SDKs tiers utilisés sont à jour
      (Firebase, RevenueCat, Capacitor plugins) — Apple bloque l'upload
      si un SDK "Required Reason API" n'a pas son propre manifest privacy
- [ ] Privacy Policy URL : https://1food.fr/privacy.html
- [ ] (TODO commun avec Google Play) Créer endpoint `/api/delete-account`
      pour permettre la suppression de compte sans login

---

## Section 8 — Alignement avec Google Play Data Safety

Croisement avec `.agents/data-safety-form.md` :

| Catégorie Apple | Catégorie Google Play correspondante |
|---|---|
| Contact Info → Email | Personal info → Email address |
| Contact Info → Name | Personal info → Name |
| Health & Fitness → Health | Health and fitness → Health info |
| User Content → Photos | Photos and videos → Photos |
| User Content → Other User Content | App activity → Other user-generated content |
| Search History | App activity → In-app search history |
| Identifiers → User ID | Personal info → User IDs |
| Purchases → Purchase History | Financial info → Purchase history |
| Usage Data → Product Interaction | App activity → App interactions |
| Diagnostics → Crash Data | App info and performance → Crash logs |
| Diagnostics → Other Diagnostic | App info and performance → Diagnostics |
| Other Data Types | Personal info → Other info |

Les deux formulaires doivent rester **cohérents**. Si une release modifie
la collecte de données, mettre à jour les **deux** docs simultanément.

---

*Document à conserver. Réviser à chaque release majeure ou ajout de SDK
tiers.*
