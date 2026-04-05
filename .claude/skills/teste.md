---
name: teste
description: Audit complet de l'application IronFuel/OneFood — teste toutes les fonctionnalités, corrige les bugs, propose des améliorations
user_invocable: true
---

# Audit & Test complet de l'application IronFuel

Tu es un auditeur qualité expert. Ton rôle est de passer en revue **toute l'application** IronFuel/OneFood, de trouver les bugs, de les corriger, et de proposer des améliorations.

## Architecture de l'app

- **Frontend** : Vanilla JS (SPA), hash routing, PWA
- **Backend** : Netlify Functions (Node.js)
- **DB** : localStorage + Firebase Firestore (REST)
- **IA** : Google Gemini 2.5 Flash (photos/texte)
- **Paiement** : Stripe + PayPal

## Fichiers clés

### Pages (js/pages/)
- `dashboard.js` — Vue principale, calories/macros, eau, quick actions
- `diary.js` — Journal alimentaire par jour, navigation dates
- `search.js` — Recherche aliments (local + OpenFoodFacts + communauté cloud)
- `camera.js` — Photo IA (capture + import + analyse Gemini)
- `barcode.js` — Scan code-barres (BarcodeDetector / Html5Qrcode)
- `voice.js` — Saisie vocale (Web Speech API, hold-to-record)
- `chat.js` — Description texte IA d'un repas
- `customfood.js` — Création aliment personnalisé
- `gym.js` — Suivi musculation, calendrier, routine
- `weight.js` — Suivi poids, graphiques
- `profile.js` — Profil, objectifs, BMR/TDEE
- `settings.js` — Thème, notifications, gestion repas
- `supplements.js` — Suivi compléments alimentaires
- `history.js` — Historique calories/macros/poids
- `avatar.js` — Créature évolutive, shop, gamification
- `shop.js` — Boutique cosmétiques/powerups

### Services (js/services/)
- `auth.js` — Firebase Auth (Google, Apple, Email)
- `nutrition.js` — Calcul BMR, TDEE, macros auto
- `vision.js` — Analyse photo IA (Gemini)
- `speech.js` — Reconnaissance vocale
- `sync.js` — Sync Firestore REST
- `trial.js` — Freemium, trial, paiement
- `notifications.js` — FCM push notifications
- `micronutrients.js` — Estimation 12 micro-nutriments
- `openfoodfacts.js` — API OpenFoodFacts
- `foodimages.js` — Images aliments
- `paypal.js` — PayPal SDK
- `analytics.js` — Firebase Analytics

### Composants (js/components/)
- `modal.js` — Modals aliment (DB + custom), quantité, macros, fibres
- `mealcard.js` — Carte repas (header, items, collapse)
- `fooditem.js` — Ligne aliment dans un repas
- `navbar.js` — Navigation bottom bar
- `charts.js` — Graphiques Chart.js

### Core
- `app.js` — Router, navigation, date, init
- `storage.js` — Persistance localStorage, day logs, community foods
- `db.js` — Base de données 500+ aliments

### Backend (netlify/functions/)
- `analyze.js` — Analyse photo Gemini + enrichissement USDA/OFF
- `analyze-text.js` — Analyse texte IA
- `nutrition-lookup.js` — Lookup USDA + OpenFoodFacts
- `community-foods.js` — Base communautaire Firestore
- `create-checkout.js`, `verify-payment.js`, `stripe-webhook.js` — Stripe
- `create-paypal-order.js`, `capture-paypal-order.js`, `paypal-webhook.js` — PayPal
- `create-portal-session.js` — Portail client Stripe
- `send-notification.js`, `daily-notification.js` — Notifications FCM
- `save-email.js` — Capture email RGPD
- `trial-check.js` — Anti-abus trial par IP
- `admin-api.js` — Dashboard admin

### Style
- `css/style.css` — Stylesheet principal (glassmorphism, dark mode)

## Procédure d'audit

Effectue les vérifications suivantes **dans l'ordre**, en lisant le code source de chaque fichier :

### Phase 1 — Cohérence des données
1. **Flux d'ajout d'aliment** : Vérifie que tous les points d'entrée (search, camera, voice, chat, barcode, custom) passent correctement la date sélectionnée, le type de repas, et toutes les données nutritionnelles (calories, protein, carbs, fat, fiber, micros).
2. **Calculs nutritionnels** : Vérifie que les totaux journaliers (getDayTotals) correspondent bien à la somme des entrées. Vérifie les arrondis.
3. **Micro-nutriments** : Vérifie que estimateFromLog et estimateForFood ne font pas de double-scaling. Vérifie que les micros API (déjà scalés au poids) ne sont pas re-multipliés.
4. **Eau** : Vérifie la conversion verres/litres (0.25L par verre), les limites, et la cohérence d'affichage.
5. **Poids** : Vérifie que les entrées de poids sont bien associées à la bonne date.
6. **Sync** : Vérifie que toutes les clés dans SYNC_KEYS sont effectivement utilisées et sauvegardées.

### Phase 2 — UI / UX
7. **Modals aliment** : Vérifie que toutes les infos nutritionnelles sont affichées (calories, protéines, glucides, lipides, fibres). Vérifie la mise à jour dynamique quand on change le poids.
8. **Badges repas** : Vérifie l'alignement des compteurs d'aliments pour chaque type de repas.
9. **Couleurs** : Vérifie que les boutons du dashboard (eau, salle, compléments, poids) ont des couleurs distinctes.
10. **Thème sombre** : Vérifie que toutes les pages sont lisibles en dark mode.
11. **Responsive** : Vérifie que le layout fonctionne sur mobile (320px) et tablette.
12. **Animations** : Vérifie qu'il n'y a pas de jank ou de layout shifts.

### Phase 3 — Robustesse
13. **Gestion d'erreurs** : Vérifie les try/catch dans les appels API (vision, speech, sync, payment).
14. **Cas limites** : Que se passe-t-il avec 0g ? Avec des valeurs négatives ? Avec un log vide ?
15. **Offline** : Vérifie que l'app fonctionne sans réseau (local-first).
16. **Permissions** : Vérifie la gestion des refus caméra/micro.
17. **Sécurité** : Vérifie l'absence d'injection XSS dans les noms d'aliments personnalisés/communautaires. Vérifie la validation côté serveur.

### Phase 4 — Backend
18. **Fonctions Netlify** : Vérifie les validations d'entrée, la gestion des erreurs, les timeouts.
19. **Auth** : Vérifie que toutes les fonctions protégées vérifient bien le token Firebase.
20. **Paiement** : Vérifie les webhooks Stripe/PayPal (signature, idempotence).
21. **Community Foods** : Vérifie le filtrage des contenus inappropriés et la déduplication.

### Phase 5 — Performance
22. **Taille des données** : Vérifie que localStorage ne déborde pas (community_foods limité à 500, etc.).
23. **Requêtes réseau** : Vérifie les caches, les debounces, les retries.
24. **Rendu** : Vérifie qu'il n'y a pas de re-render inutiles ou de fuites mémoire.

## Format de sortie

Pour chaque problème trouvé, produis :

```
### [CATEGORIE] Titre du problème
- **Fichier** : chemin:ligne
- **Gravité** : Critique / Important / Mineur / Cosmétique
- **Description** : Ce qui ne va pas
- **Correction** : Applique le fix directement dans le code
```

Après les corrections, produis une section :

```
## Propositions d'amélioration
1. [Priorité haute] Description...
2. [Priorité moyenne] Description...
3. [Priorité basse] Description...
```

## Règles

- **Lis chaque fichier** avant de le juger. Ne suppose rien.
- **Corrige directement** les bugs trouvés (utilise Edit).
- Pour les évolutions, **propose seulement** (ne code pas sans demander).
- Sois exhaustif mais pragmatique : priorise les bugs qui affectent l'utilisateur.
- Utilise des agents en parallèle pour accélérer l'audit quand possible.
- Termine par un résumé clair des corrections faites et des propositions.
