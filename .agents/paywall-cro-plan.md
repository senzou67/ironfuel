# Paywall CRO — Plan d'optimisation

*Applique le skill `paywall-upgrade-cro` à l'écran `TrialService.showPaywall()` (js/services/trial.js:491) et à la section inline Premium de `settings.js` (js/pages/settings.js:86).*

## Diagnostic de l'existant

### ✅ Ce qui marche
- Deux plans annual / monthly avec annual "MEILLEURE OFFRE" par défaut
- Mentions "Sans engagement" + "Paiement sécurisé par Stripe"
- Section gratuit (`paywall-free-features`) qui clarifie ce que l'utilisateur garde s'il ne paie pas — **important, évite l'effet "tout ou rien"**
- Scroll Android corrigé (commit `b73f71c`)

### ❌ 10 problèmes CRO prioritaires

| # | Problème | Impact | Skill |
|---|---|---|---|
| 1 | Titre `Passe à OneFood Premium` — jargon marketing, parle de la marque, pas du bénéfice | Élevé | copywriting |
| 2 | Sous-titre `Débloque toutes les fonctionnalités` — vague, aucune émotion | Élevé | copywriting |
| 3 | 1re feature = `Créature & personnalisation avatar` — c'est un nice-to-have, pas la killer feature. Devrait être **Photo IA** en 1er. | Élevé | paywall-upgrade-cro |
| 4 | **Bug math** : sous `Mensuel`, on affiche `15€/an` — faux. 3,99 × 12 = **47,88€**. Devrait montrer le vrai coût annuel pour créer le contraste avec l'offre annuelle. | Moyen | copywriting |
| 5 | Aucune économie chiffrée sur annuel : passer de 47,88€ → 14,99€ = **-69%**. Chiffre invisible. | Élevé | pricing-strategy |
| 6 | Zéro preuve sociale : pas de nombre d'utilisateurs, pas d'étoiles, pas de testimonial | Très élevé | marketing-psychology (social proof) |
| 7 | Zéro urgence : l'utilisateur qui a fini son trial ne voit aucun rappel "tu perds ton streak de X jours" | Moyen | marketing-psychology (loss aversion) |
| 8 | Liste features = feature dump (8 ✅) pas hiérarchisée. Les features clés et cosmétiques mélangées | Élevé | paywall-upgrade-cro |
| 9 | Pas de mention "annule en 2 clics dans l'appli" — objection silence | Faible | copywriting |
| 10 | CTA `S'abonner — 14,99€/an` est correct mais pourrait aller plus loin : `Commencer — 14,99€/an (1,25€/mois)` divise le prix mentalement | Moyen | copywriting |

---

## V2 proposée (code + copy)

### Headline stack (A/B testable) — **basé sur la customer research**

*Source du lexique : `.agents/customer-research.md` — vraies douleurs verbatim trouvées sur Musculaction, JV.com Muscu & Nutrition, MFP Community FR.*

**Variante A — Plat maison (pain #1 universel) :**
> « Ton plat maison en 1 photo. »
> Sous : « Plus besoin de rentrer 12 ingrédients dans MFP. OneFood log tout en 2 secondes. »

**Variante B — Prix vs MFP :**
> « Le scan code-barres qu'on te fait payer chez MFP, chez nous il est gratuit. »
> Sous : « 14,99€/an vs 95€/an chez MFP. Photo IA en plus. »

**Variante C — Muscu-centrique :**
> « Tu hit tes 180g de prot sans galérer. »
> Sous : « Photo, voix, scan. Tu choisis. L'IA fait le reste. »

*Recommandation : tester A en V1 (pain la plus universelle dans les forums FR). B en V2 (hook prix, plus rationnel). C pour segmentation muscu-hard (r/musculation ads).*

**À BANNIR** (confirmé par la research, corporate talk qui répugne les utilisateurs FR) :
- « IA révolutionnaire / de pointe / nouvelle génération »
- « Compagnon minceur / bien-être global »
- « Rééquilibrage alimentaire » (c'est le territoire Yazio/Foodvisor — pas nous)
- « Coach intelligent » sans preuve chiffrée

### Liste features (hiérarchie corrigée)

```
🎯 CE QUE TU DÉBLOQUES
✅ Photo IA — logge un plat en 1 photo, sans chercher dans la base
✅ Chat IA — « j'ai mangé un steak et du riz » → détection auto
✅ Scan code-barres — produits industriels en 1 seconde
✅ Objectifs macros personnalisés (protéines, glucides, lipides, fibres)
✅ Séances salle + suivi poids + compléments
✅ Créature qui évolue selon ta régularité 🐉

📋 GRATUIT À VIE (tu gardes si tu n'abonnes pas)
✅ Journal alimentaire illimité
✅ Recherche manuelle d'aliments (500+)
✅ Historique & statistiques
```

### Plans avec math corrigée

```
┌─ MEILLEURE OFFRE  -69% ─┐     ┌─────────┐
│ ANNUEL                   │     │ MENSUEL │
│ 14,99€/an                │     │ 3,99€   │
│ = 1,25€/mois             │     │ /mois   │
│                          │     │ 47,88€/an ← vraie valeur
│ ✅ 47€ d'économie/an     │     └─────────┘
└──────────────────────────┘
```

### Social proof (à ajouter)

Minimum viable (dès que possible) :
- « Plus de [X] sportifs français utilisent OneFood » — remplir dès que `X > 500`
- Étoiles Play Store dès publication (4,5+ / 5)
- 1 testimonial court sous le bouton :
  > *« J'ai arrêté MFP en 2 jours. Photo + IA = zéro friction. » — Lucas, 28 ans, cut*

### Urgence (contextuelle, pas fake)

Si l'utilisateur a un streak actif :
> « ⚠️ Ton streak de 23 jours s'arrête demain sans Premium »

Si fin de trial :
> « Il te reste 2 jours. Passe Premium maintenant pour garder ton historique & tes objectifs. »

### CTA

**Avant :** `S'abonner — 14,99€/an`
**Après :** `Commencer Premium — 1,25€/mois` *(prix mensualisé réduit la friction)*

Sous le CTA, une seule ligne de réassurance qui combine les trois :
> 🔒 Paiement Stripe · 🚫 Résiliable en 2 clics · 💰 Garantie 14 jours

---

## Roadmap d'exécution

| Priorité | Action | Fichier | Effort |
|---|---|---|---|
| 🔴 P0 | Fix bug "15€/an" → "47,88€/an" sous Mensuel | `js/services/trial.js:535`, `js/pages/settings.js:115` | 2 min |
| 🔴 P0 | Reformuler headline + sous-titre (Variante A) | `js/services/trial.js:497-498`, `js/pages/settings.js:89` | 10 min |
| 🟠 P1 | Réordonner features (Photo IA en 1er, créature en dernier) | `js/services/trial.js:500-509`, `js/pages/settings.js:95-103` | 10 min |
| 🟠 P1 | Afficher -69% / "47€ économisés" sur l'offre annuelle | `js/services/trial.js:519-528`, CSS | 20 min |
| 🟡 P2 | Ajouter garantie 14 jours + réassurance compacte sous CTA | `js/services/trial.js:543-544` | 5 min |
| 🟡 P2 | Template social proof (ligne "X utilisateurs" + 1 testimonial) — activer dès X > 500 | nouveau bloc | 15 min |
| 🟢 P3 | Urgence contextuelle (streak / fin trial) | logique dans `showPaywall()` | 30 min |
| 🟢 P3 | A/B test headlines A / B / C avec UTM tracking | `analytics-tracking` skill | 1h |

**Estimation gain** : passer d'une paywall générique SaaS à une paywall muscu-centrique avec bug pricing réparé + math d'économie visible → **+30 à +60% de trial-to-paid** selon benchmarks CRO SaaS B2C (source : [Lenny's Newsletter paywall benchmarks](https://www.lennysnewsletter.com/)).
