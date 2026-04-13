# OneFood — Android Build Setup (Capacitor)

This guide explains how to build and release the OneFood Android app using Capacitor.

## Prerequisites

- **Node.js** 18 or newer (20 LTS recommended)
- **Android Studio** (Hedgehog 2023.1.1 or newer)
- **JDK 17** (Android Gradle Plugin 8.x requires Java 17 exactly)
- **Android SDK** — API 34 (targetSdk) and build-tools 34
- A registered **Google Play Console** developer account (25 USD one-time)

Make sure `ANDROID_HOME` is set and `JAVA_HOME` points at JDK 17.

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

## 1. Install dependencies and add the Android platform

From the repo root:

```bash
npm install
npx cap add android
```

This creates an `android/` directory with the native project.

## 2. Build the web assets and sync

The web assets live in `public/` (see `webDir` in `capacitor.config.json`). The
`build.js` script prepares this folder.

```bash
npm run build           # produces /public
npm run cap:sync        # copies /public into android/app/src/main/assets
npm run cap:open        # opens Android Studio
```

Shortcut that does all three:

```bash
npm run android:build
```

## 3. Configure the app

Edit `android/app/build.gradle` and make sure:

- `applicationId` is `fr.onefood.app`
- `minSdkVersion` is `22` (Capacitor 6 minimum)
- `targetSdkVersion` is `34`
- `compileSdkVersion` is `34`
- `versionCode` is incremented on each release
- `versionName` matches the semver in `version.json`

Add signing config to `android/app/build.gradle` (or better, `keystore.properties`):

```gradle
signingConfigs {
    release {
        storeFile file(RELEASE_STORE_FILE)
        storePassword RELEASE_STORE_PASSWORD
        keyAlias RELEASE_KEY_ALIAS
        keyPassword RELEASE_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

## 4. Create a release keystore (one time)

```bash
keytool -genkey -v -keystore onefood-release.keystore \
    -alias onefood -keyalg RSA -keysize 2048 -validity 10000
```

**Back it up.** Losing the keystore means you can never update the app on Play.

## 5. Build a signed release (AAB)

From Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.

Or from the command line:

```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## 6. Google Play Console setup

1. Create a new app in the Play Console
2. Package name: `fr.onefood.app`
3. App category: **Health & Fitness**
4. Content rating: complete the IARC questionnaire (no violence / no ads to minors)
5. Target audience: 16+
6. Privacy Policy URL: **https://1food.fr/privacy.html**
7. Upload the signed AAB to **Internal testing** first, then promote to Production

### Required store listing assets

- App icon 512x512 PNG
- Feature graphic 1024x500 PNG
- At least 2 phone screenshots
- Short description (80 chars) and full description (4000 chars)

## 7. Data Safety form guidance

Declare the following data collection in the Data Safety section:

| Data type | Collected | Shared | Required | Purpose |
|-----------|-----------|--------|----------|---------|
| Email address | Yes | No | No | Account management |
| Name | Yes | No | No | Account management |
| Health & fitness info | Yes | No | No | App functionality, personalization |
| Photos | Yes | Yes (Google Gemini) | No | App functionality (AI food recognition, not stored) |
| App activity (in-app actions) | Yes | No | No | Analytics, app functionality |
| Device IDs (FCM token) | Yes | No | No | Push notifications |

Security practices:

- Data encrypted in transit (TLS)
- Users can request data deletion via Settings → Delete account
- Independent security review: not applicable (solo dev)

## 8. Target SDK and permissions

`targetSdk 34` is required by Google Play as of August 2024. Declare only the
permissions that are actually used:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-feature android:name="android.hardware.camera" android:required="false"/>
```

## 9. Release checklist

- [ ] `versionCode` bumped in `android/app/build.gradle`
- [ ] `versionName` matches `version.json`
- [ ] `npm run build && npm run cap:sync` ran cleanly
- [ ] Release AAB tested on a real device via Internal testing track
- [ ] Release notes in French added in Play Console
- [ ] Privacy policy URL verified: https://1food.fr/privacy.html
- [ ] Data safety form up to date

## Troubleshooting

- **"SDK location not found"** — create `android/local.properties` with `sdk.dir=/absolute/path/to/Android/Sdk`
- **Gradle fails with Java version error** — ensure `JAVA_HOME` points at JDK 17
- **White screen at launch** — check that `public/` exists and `npm run cap:sync` was run
- **Push notifications not received** — verify `google-services.json` is in `android/app/` and Firebase sender IDs match
