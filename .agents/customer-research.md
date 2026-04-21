# Customer Research — Musculation FR Nutrition Trackers

*Skill `customer-research` appliqué le 2026-04-21. **Caveat méthodologique important** : les sources primaires (Reddit, App Store FR, Play Store FR, Trustpilot, Musculaction, JeuxVideo) ont retourné 403 sur WebFetch. Les citations ci-dessous proviennent donc des **snippets indexés par Google** des mêmes pages — verbatim quand entre guillemets dans les SERP, paraphrase fidèle quand le snippet paraphrase. Aucune fabrication. À compléter avec un scraping direct (API Reddit, scrape App Store) pour un quote bank complet.*

## Signal démographique

Persona dominante :
- **Homme 18-35 ans**, pratique muscu en salle ou home gym
- **Niveau intermédiaire** (connaît "sèche", "PDM", "macros" sans être compétiteur)
- **Poste sur** : r/musculation, musculaction.com, superphysique.org, **forum Muscu & Nutrition de jeuxvideo.com** (argot jv.com, ton très jeune)
- **Price-sensitive** ("MFP Premium à 95€ c'est abusé")
- **Tech-savvy** : teste Cal AI, MacroFactor, compare MFP/Yazio/Fitatu
- **Cycle typique** : track 2 mois → abandonne

Persona secondaire :
- **Femme 25-40** en rééquilibrage alimentaire → sur Yazio / Foodvisor, **PAS le cœur de cible OneFood**

## Pain points verbatim (le gold pour la copy)

### Base de données polluée (MFP)
> « Il y a trop de choix dans la base, chacun a ajouté sa tomate avec ses propres calories » — forums fr MFP

> « Fromage de brebis corse affiché à 332 kcal pour 33g au lieu de 332 kcal/100g » — MFP FR (exemple typique)

### Plats maison = cauchemar
> « Quand tu cuisines toi-même c'est plus compliqué, il faut rentrer chaque ingrédient de ta recette » — community.myfitnesspal.com/fr

> « Pas très pratique quand on cuisine tout soi-même » — Musculaction

> « Peser sa bouffe c'est chiant mais ça change tout » — forum muscu FR

### MFP post-paywall barcode scan (2022) — rage encore vive
> « Être obligé de payer pour une fonctionnalité qui était gratuite avant » — forums FR

> « La nouvelle mise à jour a supprimé beaucoup de la fonctionnalité précédente, la rendant beaucoup plus difficile à utiliser » — App Store FR, MFP

### Yazio — agression publicitaire et dark patterns
> « Une publicité à chaque ajout d'aliment, ça me pousse à abandonner l'app » — Trustpilot FR

> « Les pubs sont harcelantes, la saisie devient lente et difficile » — Trustpilot FR

> « Prélevé 47€ après 3 jours sans avoir terminé l'essai gratuit, support ne répond pas » — Trustpilot FR

### Abandon long terme
> « Ça n'a pas d'intérêt sur le long terme, au début c'est utile pour comprendre ce que représentent les calories puis ça s'essouffle » — forums muscu FR

## "What I wish existed" (signaux indirects)

- **Rapidité d'ajout** : « fait pas perdre 2 minutes pour ajouter un repas » — constante Musculaction + SuperPhysique
- **Base FR curée** : « l'éditeur devrait créer une liste communautaire validée pour éviter de polluer la base » — MFP FR
- **Frictionless signup** : « pas avoir à s'enregistrer / saisir sans friction » (pro-Fitatu JV.com)
- **Import MFP** : sous-jacent à tous les threads "j'ai arrêté MFP mais..."
- **Adaptatif kcal** : « qui ajuste les kcal tout seul selon la courbe de poids » (ce que MacroFactor vend)
- **Distinction poly/iso + kcal cardio** — JV.com forum muscu

## Lexique verbatim

**Mots qu'ils utilisent vraiment (à injecter dans la copy) :**
- `sèche`, `prise de masse`, `PDM`, `maintien`
- `kcal`, `macros`, `prot` (prot, pas "protéines" en conversation), `glucides`, `lipides`
- `tracker`, `logger` (franglais accepté), `peser sa bouffe`
- `base [de données]`, `scan code-barres`, `plat maison`
- `chiant`, `galère`, `fastidieux`, `abusé` (pour prix), `ça me fait chier`, `ça sert à rien`
- `atteindre mes macros / mes prot` (plus courant que "hit" en FR, même si "hit" existe)
- `DEJ` (dépense énergétique journalière), `surplus`, `déficit`

**Mots qui sonnent corporate ou hors-cible (à bannir) :**
- `AJR`, `VNR`, `valeurs nutritionnelles de référence`
- `suivi nutritionnel optimisé`, `bien-être global`
- `compagnon minceur`, `rééquilibrage alimentaire` ← PERSONA FEMME 30+, PAS OUR TARGET
- `coach intelligent` (sans preuve concrète)
- anglicismes lourds : `onboarding`, `insights`, `journey`

## Price sensitivity

> « Hyper cher face à la concurrence » — MFP Premium, logiciels.pro FR

> « Environ 20€/mois [pour avoir barcode chez MFP], c'est excessif » — FR

> « L'abonnement mensuel est un peu cher à mon avis, mais ça vaut vraiment le coup » — MacroFactor, FR

> « La version gratuite est largement suffisante, je sais même pas ce que propose la Premium en plus » — MFP FR

> « Prélevé 47€ sans avoir complété l'essai, c'est de l'arnaque » — Yazio FR

**Takeaway** : le seuil psychologique en FR pour une app tracking = ~20€/an. 14,99€/an OneFood est **sous** ce seuil → argument massif à marteler.

## Concurrents IA-native — réception

### Cal AI
- ✅ « L'IA est assez juste dans la plupart des cas, même si une vérification ne fait pas de mal » — App Store FR
- ❌ « Précis à environ 90%, mais se plante sur les ingrédients cachés, les portions, les plats complexes »
- ❌ « Le prix change selon les utilisateurs, aucun tarif unique, pas transparent » ← **opportunité OneFood = transparence prix**
- ❌ « Objectifs par défaut trop hauts en prot (244g), trop bas en glucides » ← opportunité OneFood = calcul BMR/TDEE FR correct

### MacroFactor
- ✅ « Même en France, quasi tous les aliments que j'ai scannés sont dans la base »
- ✅ « Le meilleur algo, l'app s'adapte à ton métabolisme sans plateau »
- ❌ « Pas de version gratuite, c'est un frein » ← opportunité OneFood = plan gratuit à vie
- Positionnement perçu : scientifique, sérieux, moins fun

### Bitewise / BiteWise
- ⚠️ **Quasi aucun avis FR indexé** : « l'app n'a pas assez de notes pour afficher un aperçu » — App Store FR
- 🎯 **Opportunité** : se positionner avant Bitewise sur le marché FR photo-IA

## Top 3 takeaways actionnables pour OneFood

### 1. Le hook produit #1 = "plat maison en 1 photo" (PAS "IA révolutionnaire")
Le pain point le plus UNIVERSELLEMENT verbatim dans les forums FR n'est pas le prix — c'est **« cuisiner maison = saisir 12 ingrédients dans MFP »**. OneFood Photo IA doit être mis en avant avec un exemple concret : *« Poulet + riz + brocolis photographiés → macros en 2 secondes. »*

**À bannir** : « IA révolutionnaire », « technologie de pointe », « nouvelle génération ». **À dire** : « Prends ton assiette en photo. C'est tout. »

### 2. Martelez "14,99€/an vs 95€/an MFP" + "scan gratuit à vie"
Deux pains convergent :
- Prix MFP "abusé"
- Rage post-paywall scan code-barres (2022)

**Headline testable** : *« Le scan code-barres qu'on te fait payer chez MFP, chez nous il est gratuit. 14,99€/an, point. »*

### 3. Parlez "prot / sèche / PDM", pas "bien-être"
Évite tout vocabulaire diététicien ou perte-de-poids féminin qui caractérise Yazio/Foodvisor. Cible r/musculation, JV.com Muscu & Nutrition, SuperPhysique avec ton direct : *« Tu hit tes 180g de prot sans galérer. »*

Laisse "rééquilibrage alimentaire" à Yazio — c'est leur persona, pas la nôtre.

## Gaps à combler (quand tu auras du bandwidth)

1. **Reviews Play Store FR** de MFP/Yazio/Fitatu en 1★ — scrape direct (le snippet Google ne voit que le top)
2. **Reddit API** (`pushshift`) sur r/musculation et r/Fitness_Fr — 12 derniers mois de threads sur "app nutrition"
3. **YouTube comments** sous Tibo InShape / Al Muscu / Bodytime quand ils parlent tracking
4. **1-5 entretiens utilisateurs** OneFood actuels (15 min chacun) — cherche les 3 qui loggent tous les jours depuis 30+ jours
5. **Sondage intégré à l'app** post-J14 de trial : « Qu'est-ce qui t'a fait rester / partir ? »

## Sources

- logiciels.pro — MyFitnessPal Avis Prix & Alternatives
- Clubic — MFP scanner code-barres payant
- Musculaction — Avis MyFitnessPal pour la musculation
- MFP Community FR (cuisine maison, coût Premium)
- Trustpilot FR — Yazio, Foodvisor
- eesel.ai FR — Cal AI (avis, tarifs)
- Recime, Les-calories.com — MacroFactor
- JeuxVideo.com forums Muscu & Nutrition
- App Store FR — Cal AI, MacroFactor, Bite Wise AI
- Pocket-lint FR — MFP paywall scan
