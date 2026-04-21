# Google Play ASO Listing — OneFood

*Skill `aso-audit` appliqué en mode "pré-lancement" : template complet pour la future publication sur Play Store. À ré-auditer une fois live avec vraies données (keyword ranks, conversion impressions → installs).*

## Contexte
- App Android via Capacitor wrapper du PWA 1food.fr
- Pas encore publiée sur Play Store → ce doc est la base de la fiche
- Langue primaire : **fr-FR**, langue secondaire : **en** (fallback)

---

## 1. App Title (30 caractères MAX)

### Recommandation
**`OneFood – Muscu & Nutrition IA`** (29 car.)

**Alternatives testables :**
- `OneFood – Tracker Muscu IA` (26)
- `OneFood – Macros Muscu IA` (25)
- `OneFood : Suivi Muscu IA` (24)

**Rationale :**
- Brand `OneFood` obligatoire (marque)
- `Muscu` : keyword FR haute intention, différenciant vs "Fitness" générique
- `IA` : hook moderne, différencie de MFP/Yazio
- `Nutrition`/`Tracker`/`Macros` : synonymes à A/B tester selon volume de recherche

## 2. Short Description (80 car. MAX, visible dans les résultats)

### Recommandation
**`Log tes repas en photo. Macros muscu, séances salle & créature évolutive.`** (78)

**Alternatives :**
- `Photo IA pour logger tes repas. Suivi macros muscu en 1 clic.` (62)
- `Le tracker muscu qui log tes repas en photo. Plus simple que MFP.` (66)

**Rationale :**
- Verbe d'action en premier (`Log`)
- `Photo` = killer feature mentionnée
- `Muscu` + `salle` + `créature` = mots-clés uniques à OneFood

## 3. Long Description (4000 car. MAX)

```markdown
🎯 OneFood — Le tracker nutrition & musculation qui log tes repas à ta place.

Fini les 5 minutes passées à chercher "yaourt nature Danone" dans une base de données bruyante. OneFood utilise l'IA pour logger tes repas en une photo, à la voix ou par code-barres.

📸 PHOTO IA — PRENDRE UNE PHOTO, C'EST TOUT
Pose ton assiette, prends une photo, l'IA détecte les aliments, estime les quantités, calcule les macros. En 3 secondes.

🎙️ CHAT & VOIX — "J'AI MANGÉ UN STEAK ET DU RIZ"
Décris ce que tu as mangé en langage naturel. L'IA décompose, identifie chaque aliment, applique les portions standards.

📊 CONÇU POUR LA MUSCU
• Objectifs protéines / glucides / lipides / fibres personnalisés
• Calcul BMR + TDEE + besoins caloriques auto selon ton profil (homme/femme, âge, poids, activité)
• Suivi poids avec graphiques d'évolution
• Journal de séances salle (exercices, séries, reps, charge)
• Compléments alimentaires & timing

🐉 GAMIFICATION — TA CRÉATURE ÉVOLUE AVEC TOI
Chaque jour où tu hits tes macros, ta créature progresse. Skip un jour, elle stagne. Un système de rétention qui pousse à la régularité sans push notifs agressives.

💰 PRIX HONNÊTE
• Essai gratuit 14 jours (toutes les fonctions Premium incluses)
• Premium annuel : 14,99€/an (1,25€/mois)
• Premium mensuel : 3,99€/mois
• Plan gratuit à vie : journal, recherche 500+ aliments, historique

Moins cher que MyFitnessPal Premium (95€/an). Spécialisé muscu, pas un clone d'app fitness générique.

🇫🇷 FAIT EN FRANCE, POUR LES SPORTIFS FRANCOPHONES
• Base alimentaire française : 500+ aliments courants
• Communauté d'utilisateurs qui ajoutent les aliments manquants
• Interface tutoiement, vocabulaire muscu (shred, prise de masse, cut, hit mes macros)
• Serveurs Cloudflare en Europe, RGPD-compliant

🔒 VIE PRIVÉE
• Auth Firebase (Google, Apple, email)
• Données chiffrées, export & suppression en 1 clic
• Pas de revente de données
• Photos supprimées après analyse (jamais stockées)

🎯 POUR QUI ?
• Pratiquants muscu / fitness en sèche, prise de masse ou maintenance
• Anciens utilisateurs MFP frustrés par la lenteur et le prix
• Débutants qui veulent hit leurs protéines sans devenir diététicien pro
• Ceux qui kiffent la gamification et les streaks

— Par une équipe de sportifs français qui en avait marre de galérer avec MyFitnessPal.

Des retours ? contact@1food.fr
Mentions légales : https://1food.fr/terms
Confidentialité : https://1food.fr/privacy
```

**Keywords intégrés** (SEO ASO) : tracker muscu, nutrition, IA, macros, calories, photo, MyFitnessPal alternative, app musculation, compteur calories, sèche, prise de masse, protéines, suivi salle de sport, gamification fitness, code-barres aliments.

## 4. App Icon

✅ Déjà à jour avec le nouveau logo : aplat `#EF4444`, chiffre "1" blanc, sans dégradé ni contour blanc (commit `fd8f034`).

Règle Play Store : 512×512 PNG, pas de texte ajouté, safe-zone 80% respectée. Le logo actuel (`assets/icons/icon-512.png`) coche toutes les cases.

## 5. Screenshots (recommandé : 5 à 8, en 9:16)

Ordre et angle :

| # | Écran | Caption overlay (≤30 car.) | Justification |
|---|---|---|---|
| 1 | Photo IA en action avec résultats | "📸 1 photo = repas loggé" | Killer feature en 1er (3 sec d'attention en store) |
| 2 | Dashboard avec macros / barres | "Tes macros en temps réel" | Preuve que ça fait le job |
| 3 | Chat IA avec prompt | "« J'ai mangé un steak et du riz »" | Feature IA #2 |
| 4 | Avatar / créature | "Ta créature évolue avec toi" | Différenciateur émotionnel |
| 5 | Plans Premium | "14,99€/an. 69% moins cher que MFP." | Levier prix |
| 6 | Séance salle / routine | "Salle + nutrition = une app" | Différenciateur muscu |
| 7 | Graphique progression poids | "Vois ta progression" | Preuve scientifique |
| 8 | Historique / streak | "Reste régulier grâce aux streaks" | Rétention |

## 6. Feature Graphic (1024×500)

Logo OneFood + hook : **« Log tes repas en photo. Hit tes macros. »**
Fond `#EF4444`, texte blanc, photo d'un plat avec overlay IA.

## 7. Catégorie Play Store

**Principale :** Health & Fitness
**Tags secondaires :** Nutrition, Weight Loss, Fitness, Food & Drink

## 8. Content Rating

**PEGI 3** (pas de contenu sensible). Remplir le questionnaire Play Console :
- Pas d'achats intégrés pour mineurs → vérifier paramètre parental
- Aucun contenu user-generated modérable côté sensible

## 9. What's New (à chaque release, 500 car. max)

Template à remplir à chaque version :
```
v1.X
• 📸 Photo IA encore plus rapide (modèle Gemini 2.5)
• 🐛 Corrections mineures et amélioration de la stabilité
• ⚡ Chargement -30% plus rapide
Merci pour vos retours ❤️
```

## 10. Keyword rank priority (à monitorer post-launch)

| Keyword | Volume FR estimé | Priorité | Pourquoi |
|---|---|---|---|
| `tracker muscu` | moyen | 🔴 | Intention + niche |
| `app musculation` | élevé | 🔴 | Volume |
| `compteur calories` | très élevé | 🟠 | Volume mais concurrence MFP |
| `macros tracker` | moyen | 🔴 | Spécialisé |
| `alternative myfitnesspal` | faible | 🔴 | Intention ACHAT |
| `photo IA nutrition` | faible | 🟡 | Innovation, à récupérer |
| `suivi musculation français` | moyen | 🟠 | Concurrence réduite |
| `sèche app` | moyen | 🟡 | Pic saisonnier été |

**Outil recommandé** : AppFollow, Sensor Tower ou AppTweak pour le monitoring rank. Gratuit : Google Play Console (une fois publié) + `play.google.com/store/search?q=…`.

## 11. A/B Tests à lancer dès publication

1. **Store Listing Experiments Play Console** : tester 2-3 variations de short description
2. Tester 2 versions de l'icône : avec "1" actuelle vs avec fourchette stylisée
3. Tester ordre screenshots 1-3 (Photo IA vs Dashboard en premier)

## 12. Post-launch monitoring

| Métrique | Fréquence | Objectif initial |
|---|---|---|
| Impressions → Page views | Hebdo | > 15% |
| Page views → Installs | Hebdo | > 25% |
| Rank sur `tracker muscu` | Mensuel | Top 10 en 3 mois |
| Note moyenne | Permanente | > 4.2 / 5 |
| Reviews 1-2★ | Hebdo | Répondre sous 48h |

---

## Prochaine action (quand app publiée)

1. Pousser la fiche ci-dessus dans Play Console
2. Lancer 1 Store Listing Experiment sur short description
3. Post-30 jours : ré-auditer avec le skill `aso-audit` + vraies données rank
