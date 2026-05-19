# OneFood — Session State

*Last updated: 2026-05-19 — pre-store readiness sprint.*

## TL;DR
**Code prêt à 90% pour la soumission stores. Bloqueur unique : DUNS en attente (Dun & Bradstreet, envoyé le 2026-05-19). Tout le reste est étalable dès maintenant si la nouvelle session veut continuer.**

---

## 1. Project anchors

| Item | Valeur |
|---|---|
| Repo | `senzou67/ironfuel` (https://github.com/senzou67/ironfuel) |
| Production branch | **`correction-IA`** ← auto-deploy Cloudflare Workers Builds |
| `master` branch | inactif, ne pas y pousser |
| Local working dir | `/home/user/ironfuel` |
| Live URL | https://1food.fr |
| Cloudflare project | `onefood` (workers/services/view/onefood) |
| Version actuelle | **v135** (commit `ea9a2c4`) |
| Bump version routine | `version.json` + `sw.js` CACHE_NAME + LOCAL_V dans `index.html` + `sed 's/?v=N/?v=N+1/g' index.html` |

## 2. Récemment shipé (dernière session — 2026-05-19)

| Commit | Sujet |
|---|---|
| `c7e06ee` | Abstraction `PaymentService` + extraction Stripe → `js/services/payment.js` + `payment-stripe.js` |
| `e47d38f` | Provider RevenueCat lazy native → `js/services/payment-revenuecat.js` |
| `a93abdf` | Webhook serveur `/api/revenuecat-webhook` (shape Firestore unifiée) |
| `4646c62` | Age 13+ gate (`js/pages/profile.js` + `js/services/trial.js`) |
| `879779d` | Doc architecture `.agents/payment-architecture.md` |
| `14e728a` | Modals : health disclaimer first-run, pre-prompt caméra (Apple 5.1.1), pre-prompt notifications |
| `ea9a2c4` | FAQ page `/faq.html` (16 Q&As, schema.org), 3 analytics events, sources d'icônes natives |
| `f2f6f1e` | Align version.json |

## 3. Pending — actions EXTERNES (user-side, bloque tout le reste)

| ⏳ | Item | Détail |
|---|---|---|
| ⏳ | **DUNS number** (Dun & Bradstreet) | Demande envoyée 2026-05-19. Email vers `contact@1food.fr` → forwardé Gmail perso (via Cloudflare Email Routing). Délai habituel France : 5-30j ouvrés, parfois plus court |
| ⏳ | **Apple Developer enrollment** | 99 $/an. Type **Organization** (pas Individual). Lien : https://developer.apple.com/programs/enroll/ . Pré-requis : DUNS reçu + ID scannée |
| ⏳ | **Google Play Console** | 25 $ one-time. Type **Organization**. Lien : https://play.google.com/console/signup . Accepte le compte en "Pending DUNS" puis finalisation |
| ⏳ | **RevenueCat account** | Gratuit jusqu'à 2.5k$ MRR. Lien : https://app.revenuecat.com/signup . **L'user n'avait pas CB sous la main** → à reprendre. Pas vraiment besoin de CB en réalité (RC ne demande qu'au-delà du free tier) mais user a préféré reporter |
| ⏳ | **`cap add android`** | Après les 4 items ci-dessus. Procédure : `npm run android:install && npm run build && npx cap add android && npx cap sync android` |

## 4. Pending — code work (Claude peut faire, prioritisé)

| # | Item | Effort | Source |
|---|---|---|---|
| 1 | **Privacy Policy refresh** — mentionner Apple IAP / Google Play Billing, SLA suppression compte 30j, mention IA Gemini explicite | 30 min | `.agents/pre-store-audit.md` |
| 2 | **Pre-écrire `data-safety-form.md`** (Google Play) — réponses détaillées au formulaire | 1h | idem |
| 3 | **Pre-écrire `privacy-labels-apple.md`** — pareil version Apple | 30 min | idem |
| 4 | **Apple Privacy Manifest** (`PrivacyInfo.xcprivacy` template dans `assets/native-sources/`) — requis iOS depuis mai 2024 | 30 min | idem |
| 5 | **Stripe webhook hardening review** — passe sécurité `functions/api/stripe-webhook.js` | 1h | idem |
| 6 | **MFP CSV import feature** — top pain client (`customer-research.md`) | 3-4h | `.agents/customer-research.md` |
| 7 | **Onboarding resserré** — 8 steps actuels → 3-5 CRO-optimisés, Photo IA hero | 2h | `.agents/pre-store-audit.md` |
| 8 | **Lighthouse pass** — Core Web Vitals tout vert | 1-2h | bonus SEO |
| 9 | **A11y audit** — focus / aria / contrast / kbd | 2h | légal santé UE |
| 10 | **Email templates** — bienvenue / fin trial / paiement échoué / win-back | 2h | conversion |

**Total : ~9-10h étalables, à attaquer dans cet ordre.**

## 5. Décisions architecturales (NE PAS re-litiger)

- **IAP via RevenueCat** (pas natif direct). Migration future documentée. → `.agents/payment-architecture.md`
- **Architecture en abstraction** : `PaymentService` route Web → Stripe, native → RC. Aucun import RC ailleurs que dans `payment-revenuecat.js`. Document Firestore `subscriptions/{uid}` est provider-agnostic (pas de `rc_*` exposé hors webhook debug)
- **Production branch = `correction-IA`** (NOT master). Auto-deploy Cloudflare sur push. **JAMAIS de clic "Deploy" manuel** dans le dashboard Cloudflare (lock la prod sur un commit ancien — bug rencontré, doc dans le commit log)
- **Donations toujours sur Stripe** (les paiements one-time ne tombent pas sous IAP). PaymentService.donate() = StripePaymentService inconditionnel
- **Age minimum 13** (RGPD floor + Apple/Play). Storage.getProfile() default = 30 pour les users existants
- **Logo OneFood** = aplat `#EF4444` "1" blanc. Pas de dégradé, pas de contour blanc. Sources : `assets/native-sources/*.svg`
- **Fibres = 2 kcal/g** dans tous les calculs caloriques
- **Photo IA** : timeout 22s per modèle, 75s client. Clamp doux côté serveur pour les overestimations connues (œuf, etc.)

## 6. Docs `.agents/` existantes (lecture à la demande, pas en bloc)

| Doc | Quand le lire |
|---|---|
| `product-marketing-context.md` | Foundation. Lire avant toute tâche marketing |
| `customer-research.md` | Verbatim user pain points (Reddit, Trustpilot, JV.com) — utile pour copy |
| `seo-audit.md` | Audit SEO 1food.fr + P0/P1/P2 roadmap |
| `ai-seo-plan.md` | Stratégie LLM citation (Product Hunt, HN, etc.) |
| `aso-listing.md` | Template complet Play Store : title, short/long desc, screenshots plan, keywords |
| `paywall-cro-plan.md` | 10 issues CRO paywall + A/B testable headlines |
| `pre-store-audit.md` | **Master audit** Apple/Play — 20 items priorisés |
| `payment-architecture.md` | Architecture IAP + checklist activation RevenueCat |
| `native-assets-procedure.md` | Procédure `npx capacitor-assets generate` quand `android/` existera |

## 7. User context

- **Langue** : français
- **Style com** : direct, terse, préfère « reco courte → action ». Pré-approuve via « go » / « ok » → procéder sans re-confirmer
- **Profil** : solo dev. Veut OneFood sous le nom de société (Organization, pas Individual). Veut éviter au max les dépendances tiers long-terme (mais ok avec RC en transition)
- **Workflow** :
  - Push direct sur `correction-IA` (jamais sur master)
  - Bump version à chaque release de code visible utilisateur
  - Tester avec `/nuke.html` pour purger le cache local quand besoin
  - Cloudflare auto-deploy fait son taf — ne pas toucher au bouton "Deploy"

## 8. Skills & extensions actives

- **Skills user-level** (`~/.claude/skills/`) :
  - `intuition` — invocation proactive des autres skills
  - `checkpoint` — sauvegarde de session avant saturation
  - 36 skills marketing depuis `coreyhaines31/marketingskills` (`paywall-upgrade-cro`, `aso-audit`, `seo-audit`, etc.)
- **MCP** : GitHub MCP server (`mcp__github__*`) connecté au repo `senzou67/ironfuel`

## 9. Étapes urgentes en cas de bug prod

1. **App ne charge pas chez un user** → conseille `/nuke.html` (purge SW + caches)
2. **Cloudflare build échoue** → check `.agents/payment-architecture.md` section "Cloudflare env vars" + vérifier `npm ci` passe en local
3. **Photo IA erreur** → check logs Cloudflare Worker (`onefood/production/logs`), filtrer `[analyze]`
4. **Premium non actif après paiement** → check Firestore `subscriptions/{userId}`, doc doit avoir `status: 'active'`. Sinon webhook a foiré

---

## 🚀 Resume command pour la nouvelle session

Dans une nouvelle session Claude Code, tape :

```
lis .agents/session-state.md et reprends par #1 (Privacy Policy refresh)
```

Ou pick & choose un autre item du backlog §4. La nouvelle session aura tout le contexte en 30 secondes.
