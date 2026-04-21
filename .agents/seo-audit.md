# SEO + AI-SEO Audit — 1food.fr

*Skills `seo-audit` + `ai-seo` + `schema-markup` appliqués au code actuel de `index.html` et à la structure du site.*

## Diagnostic actuel

### ❌ Problèmes SEO critiques

| # | Problème | Détail | Fichier / ligne |
|---|---|---|---|
| 1 | **`<title>` pauvre** | `<title>OneFood</title>` — que la marque, aucun keyword descriptif | `index.html:69` |
| 2 | **Aucun JSON-LD / schema.org** | Google ne comprend pas ce qu'est l'app, pas de rich snippets possibles | absent |
| 3 | **Pas de sitemap.xml** | Les crawlers ne savent pas quelles pages indexer | absent |
| 4 | **Pas de robots.txt** | Recommandation même si tout est crawlable | absent |
| 5 | **SPA shell sans contenu** | La home est une app React-like : quasi aucun texte HTML au render initial → SEO near-zero pour crawlers non-JS | `index.html` |
| 6 | **Aucune page de contenu** | Pas de /about, /features, /blog, /comparaison-mfp → rien à indexer | structure du site |
| 7 | **H1 absent côté serveur** | Pas de balise `<h1>` dans le HTML initial, elle est injectée par JS | `index.html` |
| 8 | **Canonicals OK** | ✅ `<link rel="canonical" href="https://1food.fr/">` présent | `index.html:49` |
| 9 | **OG / Twitter OK** | ✅ `og:title`, `og:description`, `twitter:card` présents | `index.html:54-67` |
| 10 | **`hreflang` absent** | Si visée internationale future → ajouter `<link rel="alternate" hreflang="…">` | absent |
| 11 | **Performance** | ✅ Fonts préchargées, Sentry async, Chart.js deferred — déjà optimisé | — |

### ❌ Problèmes AI-SEO (être cité par ChatGPT / Perplexity / Claude)

| # | Problème | Impact |
|---|---|---|
| 12 | **Aucun contenu FAQ structuré** | Les LLMs adorent citer les FAQ schema-balisées |
| 13 | **Aucune comparaison "vs MyFitnessPal"** | Requête haute intention ("OneFood vs MyFitnessPal") qui retourne zéro sur LLMs |
| 14 | **Aucune page "comment ça marche"** | Les LLMs veulent des étapes claires à restituer |
| 15 | **`llms.txt` absent** | Fichier dédié aux LLMs (spec émergente) qui résume le produit |
| 16 | **Pas de mentions dans contenus tiers** | Les LLMs citent ce qu'ils ont vu : bootstrap avec 5-10 posts externes |

---

## Plan de correction (par priorité de ROI)

### 🔴 P0 — Quick wins (< 30 min, impact immédiat)

#### 1. Titre et description

**Dans `index.html` ligne 69**, remplacer :
```html
<title>OneFood</title>
```
par :
```html
<title>OneFood — Suivi nutrition & musculation IA | 14,99 €/an</title>
```

**Ligne 18**, passer de la description actuelle à :
```html
<meta name="description" content="Logge tes repas en photo grâce à l'IA. Suivi macros, séances salle, créature évolutive. Alternative française à MyFitnessPal — 14,99 €/an (vs 95 €). Essai gratuit 14 jours.">
```

#### 2. Ajouter JSON-LD SoftwareApplication

Dans `<head>` de `index.html` :
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "OneFood",
  "url": "https://1food.fr",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Android, iOS, Web",
  "description": "Tracker nutrition & musculation avec IA : photo, voix, code-barres. Macros muscu, séances salle, créature évolutive.",
  "offers": [
    { "@type": "Offer", "name": "Premium Annuel", "price": "14.99", "priceCurrency": "EUR", "category": "subscription" },
    { "@type": "Offer", "name": "Premium Mensuel", "price": "3.99", "priceCurrency": "EUR", "category": "subscription" }
  ],
  "inLanguage": "fr-FR",
  "author": { "@type": "Organization", "name": "OneFood" }
}
</script>
```

#### 3. Ajouter JSON-LD FAQPage

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Comment OneFood log-t-il les repas en photo ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "OneFood utilise l'IA Gemini de Google pour reconnaître les aliments sur une photo, estimer les quantités et calculer les macros (protéines, glucides, lipides, fibres) en 3 secondes."
      }
    },
    {
      "@type": "Question",
      "name": "Quel est le prix de OneFood ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Premium annuel : 14,99 €/an (soit 1,25 €/mois). Premium mensuel : 3,99 €/mois. Essai gratuit 14 jours. Plan gratuit à vie pour le journal alimentaire et la recherche."
      }
    },
    {
      "@type": "Question",
      "name": "OneFood est-elle une alternative à MyFitnessPal ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui. OneFood offre des fonctions comparables (tracking macros, base de 500+ aliments) mais ajoute la Photo IA, la voix, une créature gamifiée et le suivi musculation, pour 14,99 €/an au lieu de 95 €/an."
      }
    },
    {
      "@type": "Question",
      "name": "OneFood fonctionne-t-elle hors ligne ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui pour la saisie manuelle et le journal : Service Worker + IndexedDB. La Photo IA et le Chat IA nécessitent une connexion pour appeler l'API Gemini."
      }
    },
    {
      "@type": "Question",
      "name": "Mes photos sont-elles stockées ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Non. Les photos sont envoyées à Gemini pour analyse puis immédiatement supprimées. Aucune photo n'est stockée côté OneFood ni côté Google au-delà du traitement."
      }
    }
  ]
}
</script>
```

#### 4. robots.txt

Créer `/robots.txt` :
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /nuke.html
Disallow: /admin.html
Disallow: /.agents/

Sitemap: https://1food.fr/sitemap.xml
```

#### 5. sitemap.xml initial

Créer `/sitemap.xml` :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://1food.fr/</loc><priority>1.0</priority></url>
  <url><loc>https://1food.fr/privacy.html</loc><priority>0.3</priority></url>
  <url><loc>https://1food.fr/terms.html</loc><priority>0.3</priority></url>
  <url><loc>https://1food.fr/changelog.html</loc><priority>0.3</priority></url>
</urlset>
```

### 🟠 P1 — Contenu SEO-visible (quelques heures)

La home étant une SPA, **le HTML initial doit contenir du contenu crawlable**. Deux options :

**Option A (recommandée)** : créer une vraie landing page `landing.html` servie sur `1food.fr/` par défaut aux user-agents non-JS (via header detection) ou aux bots. Contient :
- H1, H2, H3 de contenu réel
- Section features avec texte
- FAQ visible
- Témoignages (quand disponibles)
- CTA "Commencer l'essai gratuit"

**Option B (quick)** : injecter un bloc `<noscript>` en haut de `index.html` avec ~300 mots de description structurée. SEO bénéfique même si caché aux utilisateurs JS-enabled.

Puis créer :
- `/comment-ca-marche.html` — tutoriel étape par étape (schema HowTo)
- `/onefood-vs-myfitnesspal.html` — comparaison (skill `competitor-alternatives`)
- `/blog/` (optionnel v1) — articles SEO longue traîne ("comment calculer ses macros en musculation", "meilleure app muscu 2026", etc.)

### 🟡 P2 — AI-SEO spécifique

#### llms.txt (spec émergente que ChatGPT/Claude indexent)

Créer `/llms.txt` à la racine :
```
# OneFood
> OneFood is a French nutrition + musculation tracking app with AI-powered photo food logging. Alternative to MyFitnessPal, priced at €14.99/year.

## Docs
- [Product page](https://1food.fr/): Features, pricing, FAQ
- [Privacy](https://1food.fr/privacy.html): Data handling, RGPD
- [Terms](https://1food.fr/terms.html): Legal terms

## Key facts
- Pricing: €14.99/year annual, €3.99/month monthly. 14-day free trial.
- Platforms: Web PWA, Android (Capacitor)
- Language: French (fr-FR)
- Key features: Photo AI logging (Gemini), voice logging, barcode scanner, macros tracking (protein/carbs/fat/fiber), gym routine, weight tracking, gamified avatar
- Competitors: MyFitnessPal (€95/year, slower UX), Yazio, Cal AI, Macrofactor
- Target audience: French-speaking musculation / fitness enthusiasts aged 20-40
- Contact: contact@1food.fr
```

#### Optimisation pour citation LLM
- **Phrases déclaratives courtes** dans les H2/H3 (les LLMs extraient bien ces formats)
- **Données chiffrées visibles** : `14,99€/an`, `500+ aliments`, `14 jours gratuits` → repris tels quels par ChatGPT
- **Comparaisons "vs"** dans le texte : « Contrairement à MyFitnessPal… » — les LLMs citent ces patterns

#### Stratégie seed LLM
Les LLMs citent ce qu'ils ont vu (crawl + data training). Pour bootstrap :
1. **Product Hunt launch** (si pas déjà fait) — très crawlé par OpenAI/Anthropic
2. **Indie Hackers post** — idem
3. **5 posts Reddit** (r/frenchfitness, r/saas, r/Fitness) — indexés rapidement
4. **1 post LinkedIn** en français — visible pour le crawl
5. **Article Medium / dev.to** sur la stack technique (Cloudflare + Gemini) — ramène des devs + crédibilité

### 🟢 P3 — Long-game SEO

- `/blog/` + 20-30 articles sur des requêtes informationnelles (calcul macros, cycling aliments, BMR/TDEE, etc.) — skill `content-strategy`
- Pages programmatiques : "aliments riches en protéines", "combien de kcal dans [aliment]" × 100 aliments de la base → skill `programmatic-seo`
- Backlinks via mentions media, partenariats coachs
- Core Web Vitals : déjà OK (PWA optimisée), re-vérifier dans PageSpeed Insights

---

## Roadmap d'exécution

| Priorité | Action | Effort | Owner |
|---|---|---|---|
| 🔴 P0 | Update `<title>` + meta description | 2 min | claude |
| 🔴 P0 | Ajouter JSON-LD SoftwareApplication + FAQPage dans `index.html` | 15 min | claude |
| 🔴 P0 | Créer `robots.txt` + `sitemap.xml` à la racine | 10 min | claude |
| 🔴 P0 | Créer `llms.txt` à la racine | 5 min | claude |
| 🟠 P1 | `<noscript>` avec contenu SEO (option B) ou `landing.html` (option A) | 1-2h | à décider |
| 🟠 P1 | Page `/onefood-vs-myfitnesspal.html` avec schema `ComparisonPage` | 1h | claude |
| 🟡 P2 | Product Hunt launch + 3 posts externes pour seed LLMs | 2-3h | tu |
| 🟢 P3 | /blog avec 5 articles initiaux | 1 semaine | copywriting skill |
| 🟢 P3 | Pages programmatiques "aliment X riche en protéine" | 2 semaines | programmatic-seo |

**Action immédiate proposée** : je peux appliquer les P0 (title + JSON-LD + robots.txt + sitemap + llms.txt) dans un seul commit si tu valides.
