# WatchVault

<p align="center">
  <img src="logo/Logo.png" alt="WatchVault Logo" width="360" />
</p>

WatchVault is a native Android watch-tracking app for movies, series, anime, episodes, reminders, and personal watch progress.

The app focuses on legal metadata and personal tracking only. It does not stream movies, series, or anime, and it does not provide pirated links.

## Current Android App

- Package: `com.watchvault.app`
- Native Android APK direction
- Java/AppCompat native screens
- Material-style light UI
- Backend-powered media data
- Per-user progress storage using internal WatchVault user/device identifiers
- Episode tracker foundation
- Reminder notification receiver
- Signed release APK workflow

## Branding

Main logo path:

```txt
logo/Logo.png
```

This logo should be used for repository branding, release notes, and app presentation assets. Android launcher icons still use the generated `mipmap` icon resources and can be replaced later with properly sized adaptive icon assets generated from this logo.

## Backend

The backend is a Node.js/Express API used for media, TV, anime, ratings, provider data, and user progress.

Install backend dependencies:

```bash
npm --prefix backend install
```

Start the backend locally:

```bash
npm run dev:backend
```

Useful backend checks:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/status
curl http://localhost:5000/api/media/popular
```

## Android Build

Compile-check the native Android app:

```bash
cd android
./gradlew compileReleaseJavaWithJavac --stacktrace --no-daemon
```

Build signed release APK:

```bash
cd android
./gradlew assembleRelease --stacktrace --no-daemon
```

Release signing requires these GitHub secrets:

```txt
WATCHVAULT_KEYSTORE_BASE64
WATCHVAULT_KEYSTORE_PASSWORD
WATCHVAULT_KEY_ALIAS
WATCHVAULT_KEY_PASSWORD
```

## GitHub Actions

The APK workflow builds signed release APKs on `main` and uses compile-only checks on pull requests.

The latest release should publish one clean latest APK asset:

```txt
WatchVault-latest.apk
```

Versioned APKs should be kept in versioned releases.

## Native-only APK Rule

The Android APK should remain native-only.

Do not re-add:

```txt
BridgeActivity
android.webkit.WebView
com.getcapacitor
capacitor-android
capacitor-cordova
npx cap sync android
```

## Legal Scope

WatchVault is only for watch tracking and legal entertainment metadata. It must not include streaming, piracy, or unauthorized content links.
