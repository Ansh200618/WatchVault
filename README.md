# WatchVault

WatchVault is a native Android entertainment tracking application built with Kotlin, Jetpack Compose, Material 3, MVVM, Hilt, Room-ready persistence, DataStore, WorkManager, AlarmManager, and offline mock data.

## What changed in v1.1

- Added full local episode tracking logic: single episode, previous episodes, season, full show, reset, progress percentage, and last watched episode.
- Added Room-ready entities, DAO, database, and TypeConverters for media, episodes, statuses, reminders, collections, goals, providers, and watch events.
- Added release reminder system classes: `ReminderScheduler`, `ReminderReceiver`, `ReminderNotificationManager`, and `ReminderWorker`.
- Added Android 13 notification permission request and exact alarm fallback logic.
- Added Watch Calendar with monthly date grid, event dots, selected-date events, and bottom sheet.
- Added Watch Brain local assistant cards.
- Added Mood Recommendation use case and mood picker.
- Added Watch Goals UI and goal models.
- Added Watch Streak / badge section in Profile.
- Added local Collections model and Library collection UI.
- Added advanced Stats Dashboard with custom Compose bar chart.
- Added Year-End Wrapped screen.
- Added spoiler-protection DataStore settings.
- Added backup/import future-ready structure for JSON/CSV and external services.
- Added legal Where-to-Watch provider section.
- Added priority chip, priority score, sorting, and filters.
- Improved premium Compose UI: rounded cards, black pill buttons, animated progress, bottom sheets, empty states, and AMOLED-safe colors.

## Build instructions

1. Open the `WatchVault` folder in Android Studio.
2. Let Gradle sync.
3. Select a device or emulator.
4. Build APK: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. APK output: `app/build/outputs/apk/debug/app-debug.apk`.

## API keys

The app runs without API keys and without login. Future metadata integrations should be added inside `data/remote/` and wired through repositories.

Suggested future APIs:

- TMDB for movie/TV metadata, posters, trailers, and legal watch providers.
- OMDb for IMDb/Rotten Tomatoes/Metacritic-style rating data.
- AniList or Jikan for anime metadata.

## Legal note

WatchVault does not stream movies, series, or anime. It does not provide pirated links. It only tracks user progress and shows legal metadata, reminders, ratings, trailers, languages, and legal watch provider labels.
