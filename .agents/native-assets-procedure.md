# Native Assets Generation — Procedure

*À exécuter une fois après `npx cap add android` (et `cap add ios`).*

## Sources

Tout est dans `assets/native-sources/` :

| Fichier | Usage | Notes |
|---|---|---|
| `icon-only.svg` | Master icon (1024×1024) | Pour iOS App Icon + Android legacy icon |
| `icon-foreground.svg` | Adaptive icon — couche FOREGROUND (1024×1024, fond transparent) | "1" centré dans le 66% safe-zone |
| `icon-background.svg` | Adaptive icon — couche BACKGROUND (solid `#EF4444`) | Aplat rouge OneFood |
| `splash.svg` | Splash screen (2732×2732) | Fond rouge + logo + texte "OneFood" |

Couleur unique : **`#EF4444`** (OneFood primary). Aucun dégradé, aucun contour blanc.

## Commande de génération

```bash
# Une seule fois — installe le générateur officiel Capacitor
npm install --save-dev @capacitor/assets

# Génère TOUTES les tailles iOS + Android à partir des sources
npx capacitor-assets generate \
  --iconBackgroundColor "#EF4444" \
  --iconBackgroundColorDark "#EF4444" \
  --splashBackgroundColor "#EF4444" \
  --splashBackgroundColorDark "#EF4444" \
  --assetPath assets/native-sources
```

Cela écrit dans :
- `android/app/src/main/res/mipmap-*/` — adaptive icons (foreground + background + monochrome)
- `android/app/src/main/res/drawable-*/` — splash
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/` — icônes iOS
- `ios/App/App/Assets.xcassets/Splash.imageset/` — splash iOS

## Validation post-génération

### Android
1. Ouvrir `android/` dans Android Studio
2. Vérifier `res/mipmap-anydpi-v26/ic_launcher.xml` — doit référencer foreground + background
3. Tester le rendu adaptive icon : Android Studio → Image Asset Studio → Preview circle / squircle / rounded square
4. Build APK debug + installer sur device → icône doit s'afficher rouge avec "1" blanc, **sans contour blanc**

### iOS (quand sur Mac)
1. Ouvrir `ios/App.xcworkspace` dans Xcode
2. Asset Catalog → `AppIcon` → vérifier que toutes les tailles sont remplies
3. Build TestFlight → vérifier icône sur l'écran d'accueil

## Si tu modifies le logo plus tard

1. Modifier les 4 SVG dans `assets/native-sources/`
2. Re-run `npx capacitor-assets generate ...`
3. `npx cap sync` pour propager dans `android/` et `ios/`
4. Rebuild APK / IPA

## Source SVG vs PNG

@capacitor/assets accepte SVG directement depuis v3 (avril 2024). Le rendu PNG est fait via `sharp` en interne. Pas besoin de pré-rasterizer.

Pour le splash, le SVG est rastérisé à 2732×2732 puis redimensionné par Capacitor pour chaque device. Sur un iPhone 15 Pro Max (1290×2796), le logo central (~480px) apparaîtra à ~17% de la largeur de l'écran — taille correcte.
