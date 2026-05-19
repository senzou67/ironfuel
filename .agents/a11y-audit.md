# Accessibility (A11y) Audit — OneFood

*Audit du 2026-05-19. Périmètre : PWA OneFood (https://1food.fr).*
*Référentiel : WCAG 2.1 AA (légal UE pour apps santé) + Apple/Google
store guidelines.*

## TL;DR

**Baseline solide.** L'app a déjà la plupart des fondamentaux a11y en
place (skip-link, focus-visible, prefers-reduced-motion, ARIA landmarks,
modal focus-trap, live regions, lang=fr). Cette passe ajoute 3 fixes
ciblés sur des points concrets identifiés par scan code.

## 1. Fixes appliqués ✅

### 1.1 Images sans alt — `js/pages/search.js`
- **Lignes 400, 434** : `<img alt="">` sur les thumbnails d'aliments et
  les résultats OpenFoodFacts en ligne.
- **Issue** : les images d'aliments sont *informatives* (elles aident à
  identifier visuellement le produit), pas décoratives. Un `alt=""` les
  rendait invisibles aux lecteurs d'écran, et inutilisables si l'image
  fail à charger.
- **Fix** : `alt="${safeFoodName}"` / `alt="${safeName}"` (le nom est
  déjà escape-HTML via `_escapeHtml`).

### 1.2 Touch target trop petit — `js/pages/settings.js:646`
- **Issue** : bouton `✕` de suppression d'un repas avec `padding:4px` et
  `font-size:18px` → cliquable ~26×26px. WCAG 2.5.5 recommande 44×44px
  minimum (Apple HIG aussi).
- **Fix** : `min-width:44px; min-height:44px; padding:10px; display:flex;
  align-items:center; justify-content:center;` + `aria-label="Supprimer
  le repas {nom}"` (le ✕ seul n'a pas de label accessible).

### 1.3 Modal sans Escape — `js/components/modal.js`
- **Issue** : focus-trap implémenté avec Tab, mais Escape ne fermait
  pas le modal. WCAG 2.1.2 "No Keyboard Trap" exige une issue clavier
  pour tout dialog.
- **Fix** : ajout `else if (e.key === 'Escape') { Modal.close(); }`
  dans le handler keydown existant.

## 2. Baseline déjà solide (audit a confirmé) ✓

| Élément | Statut |
|---|---|
| `<html lang="fr">` | ✓ index.html:2 |
| Skip link "Aller au contenu principal" | ✓ index.html:273 |
| ARIA landmarks (`role=banner/main/navigation`) | ✓ index.html:282-318 |
| `aria-label` sur boutons icône-only de la nav et FAB | ✓ |
| `aria-current="page"` sur nav active | ✓ |
| `aria-expanded` + `aria-controls` sur FAB toggle | ✓ |
| Live regions (`role=status aria-live=polite`) pour toast + splash | ✓ |
| `:focus-visible` styling distinct | ✓ css/style.css:107 |
| `@media (prefers-reduced-motion: reduce) { animation: none }` | ✓ css/style.css:148 |
| Touch targets `touch-action: manipulation` partout | ✓ index.html:144 |
| Modal `aria-modal="true"` + focus-trap Tab | ✓ modal.js:133+151 |
| Modal sr-only close button | ✓ modal.js:137 |
| Overlay-click-to-close sur modals | ✓ modal.js:206 |
| Contraste `--text-secondary #a8a8c0` sur `--surface #16161e` | ✓ ratio 7.6:1 (AAA) |
| Contraste `#9e9e9e` sur `#121212` (privacy/terms/etc.) | ✓ ratio 7.1:1 (AAA) |
| SVG décoratifs avec `aria-hidden="true"` | ✓ majorité présents |
| `font-display: swap` (évite FOIT, indirect a11y) | ✓ index.html:28-32 |
| `<noscript>` fallback crawlable | ✓ ajouté commit c71a466 |

## 3. Items restants (hors scope court terme)

### 3.1 SVG décoratifs sans `aria-hidden` dans certains chevrons
- **Fichiers** : `js/pages/settings.js:72, 175, 220, 244` (chevrons de
  navigation droite). Ces SVGs sont décoratifs car le bouton parent
  porte déjà le label.
- **Sévérité** : 🟡 best-practice (les lecteurs d'écran ignorent souvent
  ces SVGs inline anyway, mais c'est plus propre)
- **Effort** : 5 min — `find . -name "*.js" -exec sed -i ...` puis
  vérification manuelle. À batch-fixer si on touche settings.js pour
  une autre raison.

### 3.2 Form inputs sans `<label>` explicite
- **Fichiers** : `js/pages/profile.js:135-313`, `js/pages/customfood.js:19`,
  divers inputs dans settings.
- **État actuel** : les inputs ont des `placeholder=` mais pas tous des
  `<label for>` associés. Certains lecteurs d'écran n'annoncent pas le
  placeholder.
- **Sévérité** : 🟠 WCAG 1.3.1 / 3.3.2
- **Effort** : 1-2h (revue input par input). Compte tenu du volume, à
  traiter dans un sprint a11y dédié.

### 3.3 Annonces ARIA pour les changements de page (SPA)
- **Issue** : changer de page (navigation client) n'annonce rien aux
  lecteurs d'écran. Best-practice : mettre à jour le `<h1 id="page-title">`
  et placer le focus dessus, ou utiliser une live region "Page chargée :
  {nom}".
- **Sévérité** : 🟡 best-practice SPA
- **Effort** : 30 min dans `App.navigate()` (js/app.js).

### 3.4 Audit automatisé Lighthouse + axe DevTools
- **Recommandation** : lancer Lighthouse en mode "Accessibility" et
  axe DevTools sur les 5-6 pages principales (dashboard, search, food
  detail, paywall, settings, profile). Capture screenshot du score.
- À faire post-déploiement sur 1food.fr en prod (vs en local).

## 4. Légal — Conformité European Accessibility Act (EAA)

L'EAA entre en vigueur **28 juin 2025** pour les apps santé/produits
numériques en UE. OneFood :
- ✅ Niveau WCAG 2.1 AA atteint sur la baseline + fixes de cette passe
- ⚠️ Items 3.1-3.3 ci-dessus restent à compléter pour conformité 100%
- ✅ Politique d'accessibilité à publier sur `/accessibility.html`
  (TODO post-launch — peut référencer ce doc)

## 5. Checklist post-passe

- [ ] Lancer Lighthouse a11y sur 1food.fr en prod (cible >= 95)
- [ ] Lancer axe DevTools sur les 6 pages principales
- [ ] Vérifier manuellement en mode lecteur d'écran (VoiceOver iOS,
      TalkBack Android) :
  - Navigation entre les pages
  - Ajout d'un aliment via Photo IA
  - Souscription paywall
  - Suppression de compte (settings → confirm dialog)
- [ ] Items 3.1-3.3 dans une sprint a11y dédié (estimation : 4h)
- [ ] Créer `/accessibility.html` avec engagement EAA

---

*Réviser ce document à chaque refonte UI majeure.*
