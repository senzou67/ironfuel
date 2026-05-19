# Launch Checklist — OneFood Pre-Store Submission

*État au 2026-05-19, branche `claude/resume-session-checkpoint-1-nZNQl`
(v141). Code prêt à 100 % sur le repo ; cette checklist liste tout ce
qui reste hors-repo.*

---

## 🔴 BLOQUANTS HARD — sans ça, pas de soumission

| # | Action | Owner | Délai estimé |
|---|---|---|---|
| 1 | **DUNS number** — demande envoyée 2026-05-19 à D&B France | Toi | 5-30 j ouvrés, parfois 60+ |
| 2 | **Apple Developer enrollment** (Organization, 99 $/an) | Toi | 1-2 j ouvrés après DUNS reçu + ID scannée |
| 3 | **Google Play Console** (Organization, 25 $ one-time) | Toi | Acceptable en "Pending DUNS", 1 j |
| 4 | **RevenueCat account** (gratuit jusqu'à 2,5k $ MRR) | Toi | 15 min |
| 5 | **SIRET définitif** — 3 pages legals disent "en cours d'immatriculation" | Toi | Variable |

**Sans #1-3, impossible de générer le bundle natif et de soumettre.**

---

## 🟠 AVANT LAUNCH — pré-requis raisonnables (1-2 semaines de boulot)

### A. Wiring serveur des features livrées

| # | Action | Source | Effort |
|---|---|---|---|
| A1 | **Endpoint `/api/delete-account` réel** (admin SDK, complete deletion) | `.agents/webhook-security-review.md` §4.2 + `.agents/a11y-audit.md` | 1-2h |
| A2 | **Infra envoi emails** (Resend recommandé) + DNS DKIM/SPF/DMARC sur 1food.fr | `.agents/email-templates/README.md` "Option B" | 7h total (templates prêts) |
| A3 | **Cron quotidien `trial-ending`** — Cloudflare Worker scheduled trigger | `.agents/email-templates/README.md` | 1h |
| A4 | **Cron quotidien `win-back`** — pareil | idem | 1h |
| A5 | **Trigger email `welcome` depuis `save-email.js`** | idem | 30 min |
| A6 | **Trigger email `payment-failed` depuis stripe-webhook.js** | idem | 30 min |
| A7 | **Hardening PayPal webhook** — pattern idempotency déjà appliqué Stripe à dupliquer | `.agents/webhook-security-review.md` §2 | 30 min |
| A8 | **Hardening RC webhook** (idempotency seulement) | idem §3 | 15 min |
| A9 | **Code promo Stripe `RETOUR1MOIS`** — 1 mois Premium offert (sinon retirer du template win-back) | `.agents/email-templates/README.md` | 5 min Stripe Dashboard |

### B. Setup natif (post-`cap add android` + `cap add ios`)

| # | Action | Source | Effort |
|---|---|---|---|
| B1 | `npm run android:install && npm run build && npx cap add android` | `.agents/pre-store-audit.md` | 30 min |
| B2 | `npx cap add ios` (Mac requis) | idem | 30 min |
| B3 | Copier `assets/native-sources/PrivacyInfo.xcprivacy` → `ios/App/App/` + lier dans Xcode | `.agents/privacy-labels-apple.md` §4 | 5 min |
| B4 | Ajouter `*UsageDescription` au `Info.plist` (caméra, micro, photothèque) | `.agents/privacy-labels-apple.md` §5 | 10 min |
| B5 | Générer icônes & splash : `npx capacitor-assets generate ...` | `.agents/native-assets-procedure.md` | 5 min |
| B6 | Vérifier `AndroidManifest.xml` — retirer permissions inutiles (BLUETOOTH, READ_EXTERNAL_STORAGE, RECORD_AUDIO si pas voice) | `.agents/pre-store-audit.md` §7 | 15 min |
| B7 | `targetSdkVersion >= 34` Android (Capacitor 6.x default OK) | idem §8 | check seulement |
| B8 | Keystore release Android : `keytool -genkey` + `keystore.properties` + `.gitignore` + Play App Signing | idem §8b | 30 min |
| B9 | **Configurer Sign in with Apple côté Apple Developer** (Capability + Service ID) | implémenté dans `auth.js:173`, juste à activer en console | 20 min |
| B10 | Adaptive icons Android (API 26+) — déjà OK via capacitor-assets si les SVG sources sont propres | `.agents/native-assets-procedure.md` | 0-15 min |

### C. Création produits IAP

| # | Action | Effort |
|---|---|---|
| C1 | App Store Connect → Subscriptions → créer "OneFood Premium Annual" (14,99 €) + "Monthly" (3,99 €) | 30 min |
| C2 | Play Console → Monetize → Subscriptions → créer les mêmes | 30 min |
| C3 | RevenueCat → ajouter projet → connecter Apple/Google → créer entitlement "premium" + packages annual/monthly | 30 min |
| C4 | Configurer `REVENUECAT_WEBHOOK_TOKEN` dans Cloudflare Workers secrets + même valeur dans RC dashboard | 5 min |
| C5 | Tester un sandbox purchase iOS + Android | 1h |

### D. Variables d'environnement Cloudflare Workers à confirmer

```
STRIPE_SECRET_KEY                # déjà configuré
STRIPE_WEBHOOK_SECRET            # déjà configuré
STRIPE_PRICE_ID                  # 14,99 €/an
STRIPE_PRICE_MONTHLY_ID          # 3,99 €/mois
PAYPAL_CLIENT_ID                 # déjà configuré (vérifier mode live vs sandbox)
PAYPAL_SECRET                    # idem
PAYPAL_WEBHOOK_ID                # idem
PAYPAL_MODE=live                 # vs sandbox
FIREBASE_SERVICE_ACCOUNT         # JSON cert
FIREBASE_PROJECT_ID              # auto-derivé du JSON
ADMIN_UID                        # ton UID Firebase pour les notifs admin
GEMINI_API_KEY                   # Photo IA
REVENUECAT_WEBHOOK_TOKEN         # NOUVEAU — à créer (random 32+ chars)
RESEND_API_KEY                   # NOUVEAU — quand A2 fait
URL=https://1food.fr             # pour les success_url Stripe
```

### E. Assets store listing

| # | Action | Effort |
|---|---|---|
| E1 | **Screenshots iOS** : 6.7" + 6.5" + 5.5" (3 tailles min), 5-10 par taille | 2-3h |
| E2 | **Screenshots Android** : phone + 7" tablet + 10" tablet, 4-8 par taille | 2-3h |
| E3 | **App preview vidéo** iOS (optionnel mais +30% conversion) | 1-2h |
| E4 | **Long description Play Store** | 30 min (template prêt dans `.agents/aso-listing.md`) |
| E5 | **Privacy Policy URL** = https://1food.fr/privacy.html ✓ déjà en ligne |
| E6 | **Data Deletion URL** = https://1food.fr/delete-account.html ✓ shipé v137 |
| E7 | **Support email** = contact@1food.fr ✓ |
| E8 | **App Store Connect → App Privacy** : recopier `.agents/privacy-labels-apple.md` §1-3 | 1h |
| E9 | **Play Console → Data Safety** : recopier `.agents/data-safety-form.md` § par § | 1h |

---

## 🟡 POST-LAUNCH — peut attendre Week 1-2

| # | Action | Source |
|---|---|---|
| L1 | Refactor in-app delete account → call `/api/delete-account` (complete cleanup) | A1 + a11y-audit |
| L2 | Endpoint `/unsubscribe` pour emails marketing (RGPD requis) | email-templates README |
| L3 | Lighthouse audit en production sur 1food.fr (cible 95+) | a11y-audit §5 |
| L4 | axe DevTools sur 6 pages clés | idem |
| L5 | Test VoiceOver + TalkBack manuel sur 3-4 flows critiques | idem |
| L6 | Litmus / Email on Acid : preview cross-client des 4 templates | email-templates README |
| L7 | Tests sandbox complets : trial → conversion → annulation → re-souscription | C5 |
| L8 | Setup alerting `webhook_events.status == 'error'` (Discord webhook ou email) | webhook-security-review §5 |
| L9 | Item 3.1-3.3 du a11y-audit (SVG aria-hidden batch, labels inputs profile, SPA nav announcements) | a11y-audit §3 |
| L10 | App Tracking Transparency : NON requis maintenant, à re-évaluer si on ajoute AdMob plus tard | privacy-labels-apple §6 |

---

## 🚨 RISQUES ANTICIPÉS — préviens-toi maintenant

### R1. DUNS qui traîne — Plan B
Si le DUNS dépasse 30 j, demande à D&B France un suivi téléphonique
(souvent ça débloque en 48h). Pendant ce temps, Google Play accepte
en "Pending DUNS" donc tu peux quand même démarrer l'enrollment Play
et le sandbox setup.

### R2. Apple review rejection — top causes à anticiper
- **§5.1.1.v "Account deletion"** : Apple TESTE physiquement la
  suppression. Aujourd'hui l'in-app delete est INCOMPLET
  (`settings.js:493-555` ne nettoie ni `subscriptions/{uid}` ni
  `emails/{key}` ni `error_logs`). **Bloquant à fixer (A1)**.
- **§3.1.1 "In-App Purchase"** : pour le build iOS native, le Premium
  DOIT passer par Apple IAP, pas Stripe. ✓ Architecture déjà faite
  (`payment-revenuecat.js`), mais vérifier que sur build natif iOS le
  bouton "Souscrire" passe bien par `PaymentService` → `revenuecat`
  (et NON `stripe`). Test sandbox obligatoire.
- **§4.8 "Sign in with Apple"** : ✓ implémenté `auth.js:173`, à
  activer côté Apple Developer Console + Capability dans Xcode.
- **§2.3.7 "Accurate metadata"** : si la description du Play/App
  Store mentionne "IA reconnaissance d'aliments", l'app DOIT
  vraiment le faire. ✓ Photo IA actif. Évite "coming soon" features
  dans la description.
- **§5.1.2 "Data use disclosure"** : le formulaire Apple App Privacy
  DOIT matcher exactement ce qui est dans le code. ✓ aligné via
  `.agents/privacy-labels-apple.md` v141, mais à recopier
  méticuleusement dans App Store Connect.

### R3. Google Play 2024+ — pièges
- **Data safety form audit** : Google audite le trafic réseau et
  compare aux déclarations. ✓ aligné dans `.agents/data-safety-form.md`,
  notamment Firebase Analytics qui était oublié dans privacy.html (fix
  commit `305f3fc`).
- **Target API 34 minimum** (Android 14, depuis août 2024). ✓ Capacitor
  6.x par défaut, vérifier après `cap add android`.
- **Account deletion URL** : ✓ /delete-account.html livré v137.

### R4. Incohérence âge minimum
- `privacy.html` §11 dit "moins de 16 ans" → données effacées
- `trial.js` (commit `4646c62`) gate à 13 ans minimum
- Lift majeur de TAM en alignant à 13. **Mais attention RGPD France :
  la loi pour une République numérique fixe 15 ans pour le consentement
  sans autorité parentale.** Conservateur = laisser à 15-16 ; aggressive
  = aligner à 13 et accepter le risque RGPD-FR. **À arbitrer.**

### R5. Production secrets — points de défaillance
- Si `STRIPE_WEBHOOK_SECRET` leak : rotation Stripe Dashboard + Cloudflare,
  puis attendre 24h que les events en flight soient traités avant
  l'ancien secret.
- Si `FIREBASE_SERVICE_ACCOUNT` leak : régénérer le service account
  dans Firebase Console, **toute l'app casse pendant la rotation**
  (l'admin SDK ne marchera plus). Prévoir maintenance ~10 min.
- Garde une **copie de la keystore Android** dans un coffre-fort externe
  (1Password, Bitwarden, etc.) — perdue = jamais plus de mise à jour
  Play Store sur ce package name. C'est définitif.

### R6. Cloudflare auto-deploy sur correction-IA
- **Ne JAMAIS cliquer "Deploy" manuellement dans le dashboard
  Cloudflare** (rappel session-state §5). Ça lock la prod sur un
  commit ancien, bug rencontré déjà.
- Toujours pousser sur `correction-IA` et laisser le build automatique
  faire.
- Cette branche `claude/resume-session-checkpoint-1-nZNQl` doit être
  mergée vers `correction-IA` pour déployer tout ce qu'on a fait
  cette session.

### R7. Volume Photo IA — capacité Gemini
- Tier gratuit Gemini = limite par minute. Si tu fais Product Hunt et
  500 users d'un coup, ça peut throttle.
- Préviens en upgrade vers Pay-as-you-go Gemini avant tout boost de
  trafic. Coût négligeable (~0,002 $ par photo).

### R8. RevenueCat free tier
- 2,5 k $/mois MRR gratuit. À 14,99 €/an = ~1,25 €/mois × utilisateurs.
- Tu passes payant (~250 $/mois fixe + 1 % MRR) à environ 2 000
  abonnés annuels. Anticiper la migration native IAP directe si
  ça devient cher (cf. `.agents/payment-architecture.md` "Migration
  future").

---

## 📋 SÉQUENCE OPTIMALE — ce que je ferais à ta place

### Semaine 1 (en attendant DUNS)
1. Choisir provider email (Resend)
2. Verifier DNS 1food.fr (DKIM, SPF, DMARC) — peut prendre 24h propagation
3. Brancher `welcome` + `payment-failed` emails (A2, A5, A6)
4. Build endpoint `/api/delete-account` (A1)
5. Hardening PayPal + RC webhooks (A7, A8)
6. Créer compte RevenueCat + entitlements (C3, C4)
7. Pre-écrire 5 screenshots key flows (E1, E2)

### Semaine 2 (DUNS reçu)
1. Apple Developer enrollment
2. Play Console enrollment (peut être en parallèle Sem 1)
3. `npx cap add ios && cap add android` (B1, B2)
4. Test sandbox IAP complet (C5)
5. Crons emails trial-ending + win-back (A3, A4)

### Semaine 3 — submission
1. App Store Connect : metadata + privacy form + screenshots + bundle
2. Play Console : data safety + listing + bundle
3. Soumission. Délai Apple : 1-3 j review. Play : 1-7 j.

### Post-launch Week +1
- Lighthouse + a11y audit prod (L3-L5)
- Tests cross-client emails (L6)
- Alerting webhook_events errors (L8)
- Refactor in-app delete (L1)

---

## 📁 Référence — où trouver quoi dans le repo

| Doc | Pour quoi faire |
|---|---|
| `.agents/session-state.md` | Resumer une nouvelle session Claude |
| `.agents/pre-store-audit.md` | Audit complet Apple/Play, items priorisés |
| `.agents/data-safety-form.md` | Recopier dans Play Console → Data Safety |
| `.agents/privacy-labels-apple.md` | Recopier dans App Store Connect → App Privacy |
| `.agents/webhook-security-review.md` | Findings sécurité Stripe/PayPal/RC + fixes appliqués + TODOs |
| `.agents/a11y-audit.md` | WCAG fixes appliqués + items restants |
| `.agents/email-templates/README.md` | Wiring guide complet + 4 templates HTML/TXT prêts |
| `.agents/aso-listing.md` | Template Play Store listing (title, desc, keywords) |
| `.agents/paywall-cro-plan.md` | 10 issues CRO paywall, A/B testable |
| `.agents/customer-research.md` | Pain points verbatim pour copy/marketing |
| `.agents/native-assets-procedure.md` | Génération icônes/splash post `cap add` |
| `.agents/payment-architecture.md` | Architecture Stripe vs RevenueCat |
| `assets/native-sources/PrivacyInfo.xcprivacy` | À copier dans `ios/App/App/` |

---

## ⚡ Quick reference — variables d'environnement Cloudflare à créer
*(les secrets sont visibles en clair dans `wrangler.toml` non, dans le
dashboard Cloudflare → Settings → Variables ; ne JAMAIS commit ces
valeurs)*

```bash
# Nouveau pour cette session :
REVENUECAT_WEBHOOK_TOKEN=<générer 32+ chars random>
# Plus tard quand A2 fait :
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

*Réviser à chaque release majeure ou changement d'infra.*
