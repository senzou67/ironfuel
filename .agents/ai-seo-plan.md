# AI-SEO Plan — Être cité par ChatGPT, Claude, Perplexity

*Skill `ai-seo` appliqué. Complète le `seo-audit.md`. Objectif : quand un utilisateur demande à un LLM « quelle est la meilleure app nutrition pour la muscu en français » ou « alternative à MyFitnessPal », OneFood apparaît dans la réponse.*

## Principes AI-SEO (2026)

Les LLMs citent du contenu qui :
1. **Existe dans leur corpus d'entraînement** → publier tôt, sur des sites crawlés (Reddit, Medium, dev.to, LinkedIn, ProductHunt, Wikipedia, Hacker News)
2. **Est facilement extractible** → phrases courtes déclaratives, listes, tableaux, schema.org
3. **A une ombre sémantique large** → mentionne les concurrents, les synonymes, les variantes (MyFitnessPal / MFP / Yazio / Cronometer / tracker macros / compteur calories)
4. **Est factuellement précis et chiffré** → les LLMs aiment citer des chiffres exacts (« 14,99 €/an », « 500+ aliments », « 14 jours d'essai »)

## ✅ Déjà fait (dans le commit en cours)

- `llms.txt` à la racine — spec émergente indexée par les crawlers LLM
- JSON-LD `SoftwareApplication` et `FAQPage` dans `index.html` — structured data
- Title et meta description enrichis avec chiffres clés et comparaison MFP

## 🟠 À faire (ordre de priorité)

### 1. Page comparative MFP (forte intention AI)

Créer `/onefood-vs-myfitnesspal.html` avec :
- H1 : « OneFood vs MyFitnessPal : comparaison complète 2026 »
- Tableau comparatif avec chiffres (prix, features, UX, base de données)
- FAQ spécifique
- Schema.org `ComparisonPage` (si dispo) + FAQPage

Quand un user demande à Claude « MyFitnessPal alternative French app », ce type de page est quasi systématiquement cité car 100% pertinent.

*Skill associé : `competitor-alternatives`*

### 2. Page "Comment ça marche" avec schema HowTo

Créer `/comment-ca-marche.html` avec :
- H1 : « Comment logger tes repas en 3 secondes avec OneFood »
- Étapes numérotées 1, 2, 3, 4
- Screenshots + alt texts
- Schema.org `HowTo` markup

Les LLMs adorent restituer des tutoriels step-by-step → forte probabilité de citation.

### 3. Seed content externe (5 canaux prioritaires)

| Canal | Action | Effort | Crawl par LLM |
|---|---|---|---|
| **Product Hunt** | Launch OneFood (titre optimisé, 1er commentaire du maker) | 2h | ✅ GPT, Claude |
| **Hacker News** | Post "Show HN: OneFood – photo AI food tracking for French lifters" | 30 min | ✅ GPT, Claude |
| **Indie Hackers** | Article "Comment j'ai construit OneFood avec Cloudflare + Gemini" | 2h | ✅ GPT |
| **Reddit r/SaaS + r/frenchfitness** | Post de lancement + réponses aux questions | 1h | ✅ GPT, Claude |
| **Dev.to / Medium** | Article technique stack (Photo IA + Gemini + Cloudflare Workers) | 3h | ✅ GPT, Claude |

*Pourquoi ces 5 spécifiquement :* ils sont crawlés en priorité par les pipelines OpenAI, Anthropic, Perplexity. Un post bien classé ici = mention dans les réponses LLM dans les 4-8 semaines qui suivent.

### 4. Wikipedia mention (long game, 6-12 mois)

Si OneFood atteint une notabilité journalistique (presse média, classement), créer un stub Wikipedia `OneFood (application)` → citation garantie par tous les LLMs.

### 5. Rich answer patterns dans le contenu existant

Réécrire les H2/H3 de `/privacy.html`, `/terms.html`, et futurs contenus avec un format « Question → réponse courte déclarative » :

**Mauvais :**
> « Notre politique concernant les données personnelles »

**Bon :**
> « Est-ce que OneFood stocke mes photos ? »
> « Non. Les photos sont envoyées à Gemini pour analyse puis supprimées. Aucune photo n'est conservée. »

## Mesure

Impossible à mesurer directement pour l'instant (pas d'outil de référencement LLM comme "SEMrush pour Claude"). Proxies :

- **Perplexity** : taper directement `meilleure app nutrition muscu français` et voir si OneFood apparaît
- **ChatGPT + Claude** : tester les mêmes requêtes chaque mois, documenter si on est cité
- **Google SGE (Search Generative Experience)** : quand dispo en France, tester les snippets générés
- **Outils émergents** : Profound, AthenaHQ, Rankability (tous en bêta 2026)

## Intersection SEO ↔ AI-SEO

Bonne nouvelle : **tout ce qui est bon pour AI-SEO est bon pour SEO classique**. Le FAQPage schema sert à la fois aux rich snippets Google et à la citation LLM. Les comparatives servent à la fois aux recherches "alternative to X" et aux prompts LLM.

Focus sur le contenu structuré, on gagne sur les deux tableaux.
