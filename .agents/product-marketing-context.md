# Product Marketing Context

*Last updated: 2026-04-21 — V1 auto-drafted from codebase by Claude. Sections marked `[À CONFIRMER]` need human input before other marketing skills rely on them.*

## Product Overview
**One-liner:** OneFood — le coach nutrition intelligent pour la musculation.
**What it does:** PWA + app Android qui permet de logger ses repas en photo, à la voix ou par code-barres grâce à l'IA, de suivre ses macros (dont les fibres) et son avancée musculation, avec un avatar gamifié qui évolue selon la régularité.
**Product category:** Suivi nutrition & fitness (alternative à MyFitnessPal, Yazio) — spécialisé musculation.
**Product type:** Freemium SaaS consumer (PWA + Android Capacitor).
**Business model:** Essai gratuit 14 jours → Premium **14,99 €/an (≈ 1,25 €/mois)** ou **3,99 €/mois**. Stripe + PayPal. Plan gratuit à vie avec fonctions limitées (pas de Photo IA, pas de créature, pas de compléments, etc.).

## Target Audience
**Persona principale — à affiner avec toi :** utilisateur francophone, 20-40 ans, qui fait de la muscu / prépare un shred ou une prise de masse, frustré par la saisie manuelle des aliments dans MFP.
**Primary use case:** logger vite et précisément ce qu'il mange pour atteindre un objectif kcal/protéines précis.
**Jobs to be done (hypothèses) :**
- « M'assurer que je hit mes protéines tous les jours sans y passer 15 min. »
- « Comprendre pourquoi je ne progresse pas (trop / pas assez de kcal). »
- « Me tenir régulier sur plusieurs mois (gamification + streaks). »
**Use cases concrets :**
- Logger un plat au resto avec la photo sans connaître les valeurs
- Scanner un code-barres en magasin
- Suivre la progression hebdo (poids, kcal moyennes, fibres)
- Prévoir les repas de la semaine (meal planner) et les synchroniser avec la routine salle

`[À CONFIRMER]` — % d'utilisateurs qui s'entraînent vs simple suivi nutrition ; % hommes vs femmes ; niveau (débutant / intermédiaire / compétition).

## Problems & Pain Points
**Core problem:** « Suivre ses macros précisément en musculation est chiant : soit tu passes 5 min à chaque repas dans MyFitnessPal, soit tu devines et tu rates ton objectif. »
**Why alternatives fall short:**
- MyFitnessPal / Yazio = saisie manuelle lente, base de données bruyante, UX vieillissante, pas de spécialisation muscu
- Cronometer = trop scientifique, barrière pour débutant
- Carnet papier = aucune analyse, pas de gamification, aucune reconnaissance auto
**What it costs them:** temps (5-15 min/jour dans MFP), frustration, abandon après 2-3 semaines, ratage des objectifs (prise de masse trop rapide = gras, shred trop agressif = perte muscle).
**Emotional tension:** « Je sais que je devrais logger mes repas mais c'est chiant, donc je le fais pas, donc je progresse pas, donc je me sens coupable. »

## Competitive Landscape
**Direct:** MyFitnessPal (leader mondial), Yazio (France/DE), Fitatu — *manquent de Photo IA française, UX datée, Premium cher (MFP ≈ 95 €/an).*
**Secondary:** Cronometer (scientifique pur) — *trop complexe, pas gamifié, pas orienté muscu.*
**Indirect:** Apple Health / Google Fit + carnet papier — *pas de base alimentaire, pas d'analyse.*
**AI-native concurrents émergents :** `[À CONFIRMER]` — Cal AI, Macrofactor, Bitewise — à auditer.

## Differentiation
**Key differentiators:**
- **Photo IA** (Gemini) — logger un plat en 1 photo, pas en 6 clics
- **Chat IA** — « j'ai mangé un steak et du riz » → détection automatique
- **Créature / avatar** qui évolue selon la régularité (gamification forte)
- **Pricing agressif** : 14,99 €/an vs 95 €/an chez MFP → accessible
- **Focus muscu francophone** : séances salle intégrées, suppléments trackés, objectifs protéines mis en avant
- **Fibres comptées à 2 kcal/g** dans le calcul total (précision scientifique rare)
**How we do it differently:** l'IA fait la saisie à la place de l'utilisateur. L'avatar entretient la rétention sans push notifs agressives.
**Why customers choose us:** « Plus rapide que MFP, moins cher, et c'est le seul qui capte mes repas maison en photo. »

## Objections
| Objection | Response |
|---|---|
| « L'IA va se tromper sur les quantités » | Tu peux ajuster le poids en 1 clic, et on a un clamp anti-surestimation (œuf max 55g etc.). |
| « Encore 14,99 €/an en plus… » | Moins cher qu'un café Starbucks par mois, avec 14 jours d'essai sans engagement. |
| « J'ai déjà tout mon historique dans MyFitnessPal » | `[À CONFIRMER]` — import MFP prévu / disponible ? |
| « C'est pas en anglais / pour la muscu pro » | Spécifiquement pensé pour les muscu francophones : protéines en avant, séances intégrées, termes fr. |

**Anti-persona :** cycliste endurance pur cherchant des glucides complexes précis, diététicien pro voulant des micronutriments exhaustifs (→ Cronometer).

## Switching Dynamics
**Push (ce qui les fait quitter MFP) :** lenteur de saisie, pubs envahissantes, Premium cher, UI datée.
**Pull (ce qui les attire) :** Photo IA, prix, spécialisation muscu, gamification.
**Habit (ce qui les colle à MFP) :** historique de logs, habitude du UX, communauté large.
**Anxiety (peur du switch) :** perdre l'historique, l'IA qui se plante, manque d'aliments FR obscurs.

## Customer Language
`[À REMPLIR avec vraie voix client — reviews Play Store, commentaires Reddit r/frenchfitness, DMs Insta]`

**Words/phrases probables à utiliser (à valider) :**
- « shred », « sèche », « prise de masse », « bulk », « cut »
- « hit mes macros », « objectif protéines », « kcal »
- « coach », « progression », « régularité »
**Words to avoid:** jargon diététique pro (« AJR », « VNR »), ton culpabilisant, termes anglais-techniques-opaques.
**Glossary:**
| Term | Meaning |
|---|---|
| Créature | avatar gamifié qui évolue selon la régularité |
| Photo IA | analyse d'un plat via Gemini Vision |
| Streak | jours consécutifs de logging |

## Brand Voice
**Tone:** tutoiement, direct, motivant sans être culpabilisant.
**Style:** court, visuel, emoji ciblés, pas de blabla marketing corporate.
**Personality:** moderne · accessible · sportif · tech-savvy · français fier.

## Proof Points
`[À REMPLIR]` — tout ce qui peut se citer :
- Nombre d'utilisateurs actifs : `[??]`
- Taille base de données : 500+ aliments (a priori)
- Reviews Play Store : `[note moyenne ?]`
- Témoignages : `[à collecter]`
- Metrics clés : trial-to-paid %, retention D7/D30, NPS si existant.

## Goals
**Primary business goal:** augmenter la conversion **trial → paid annual**.
**Secondary:** acquisition organique via SEO + ASO, bouche-à-oreille.
**Key conversion action:** cliquer « S'abonner 14,99 €/an » sur la page paywall ou dans Settings → Premium.
**Current metrics:** `[À REMPLIR]` — nombre de trials actifs, taux de conversion trial→paid, DAU/MAU, churn mensuel.

---

## Notes de session (contexte récent)

- **Avril 2026** : plusieurs fixes critiques poussés (Gemini modèles 2.5, calorie œuf correcte à 77 kcal, paywall Android scrollable, fibres à 2 kcal/g, logo aplat rouge #EF4444).
- **Infra** : Cloudflare Workers + Pages, prod sur branche `correction-IA`, builds en auto sauf si override manuel (→ ne pas cliquer "Deploy" sur d'anciennes versions).
- **Prochains chantiers marketing potentiels** : ASO Google Play (quand l'app sera publiée), CRO paywall (une fois les métriques en place), SEO 1food.fr.
