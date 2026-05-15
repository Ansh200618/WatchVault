Yes. Your app needs a proper first-open flow so it knows the user’s name, region/area, preferred languages, content type, and then shows content accordingly.

How the app should work

When the user opens WatchVault for the first time:

1. Splash screen opens

Shows logo.

Checks if onboarding is completed.

Checks if API keys are available.

Checks internet connection.

Loads saved settings from DataStore.



2. Onboarding starts

App explains what it does.

User taps “Get Started.”



3. User profile setup

Ask user name.

Example: “What should we call you?”

Save name locally in DataStore.

Home screen later says: “Hello, Ansh.”



4. Region/area setup

Ask user to select country/region manually.

Example: India, United States, United Kingdom.

Do not force GPS location.

Give optional button: “Detect my region.”

If user allows location, detect country only, not exact address.

Region decides watch providers, release dates, language availability, and trending content.



5. Language setup

Ask preferred content languages.

Example: Hindi, English, Japanese, Korean.

Use this for filtering movies, series, anime, and recommendations.



6. Content preference setup

Ask what user watches:

Movies

Series

Anime

Web series


Ask favorite genres:

Action

Comedy

Thriller

Romance

Horror

Drama

Sci-fi

Anime


Save preferences locally.



7. Notification setup

Ask if user wants release reminders.

If yes, request notification permission.

Use reminders for upcoming movies, episodes, anime seasons, and trailers.



8. Home screen opens

Home becomes personalized:

“Hello, Ansh”

Trending in India

Hindi/English/Japanese content

Upcoming releases in selected region

Continue Watching

Watch Brain suggestions




9. Search and details work from APIs

Movies/series from TMDB.

Ratings from OMDb.

Anime from AniList/Jikan.

Watch providers from TMDB/Watchmode.

Saved progress from Room database.



10. Every action saves locally



Add to Library

Mark watched

Mark episode watched

Add reminder

Change language/region

Change theme

All saved locally using Room/DataStore.



---

Professional prompt

You are a senior Android architect, Kotlin engineer, Jetpack Compose expert, and product designer.

Build or fix the existing WatchVault Android APK project with a complete real user onboarding, personalization, API-ready data flow, and working app behavior.

APP NAME:
WatchVault

PACKAGE:
com.watchvault.app

PLATFORM:
Native Android APK, not a website.

TECH STACK:
- Kotlin
- Jetpack Compose
- Material 3
- MVVM
- Clean Architecture
- Room Database
- DataStore
- Navigation Compose
- Hilt
- Coroutines
- Flow
- Retrofit/Ktor
- Coil
- WorkManager
- AlarmManager
- Android Notifications

APP PURPOSE:
WatchVault is a premium entertainment tracking app for movies, TV series, web series, and anime. Users can discover content, view real metadata, track watch progress, mark episodes watched, manage upcoming releases, add reminders, check ratings, view legal watch providers, and maintain a personal library.

IMPORTANT LEGAL RULES:
- The app must not stream movies, series, or anime.
- The app must not provide pirated links.
- The app must only show legal metadata, posters, trailers, ratings, release dates, languages, and legal watch providers.
- Trailer buttons should open official trailer links externally.
- Watch provider buttons should open legal provider links only.

MAIN GOAL:
Create a complete first-open flow so the app understands the user and behaves accordingly.

FIRST OPEN FLOW:

1. Splash Screen
When the app opens:
- Show WatchVault logo.
- Load saved app settings from DataStore.
- Check whether onboarding is completed.
- Check internet connection.
- Check whether API keys are available.
- If onboarding is not completed, navigate to Onboarding.
- If onboarding is completed, navigate to Home.
- If API keys are missing, app should still open but show API warning state where needed.

2. Onboarding Screen
Create 3 premium onboarding pages:

Page 1:
Title: Track movies, series & anime
Subtitle: Keep your watch progress organized in one premium library.

Page 2:
Title: Never lose episode progress
Subtitle: Mark episodes, seasons, and full shows as watched.

Page 3:
Title: Get release reminders
Subtitle: Know when your next movie, episode, or anime season is coming.

Button:
Get Started

3. User Name Setup
After onboarding, ask:
“What should we call you?”

Input:
- Name field
- Continue button
- Skip option

Rules:
- If user enters name, save it in DataStore as userName.
- If skipped, use default name: “Watcher”.
- Home screen greeting must use saved name:
  “Hello, Ansh”
  or
  “Hello, Watcher”

4. Region / Area Setup
Ask:
“Where do you watch from?”

Options:
- Manual country/region selector
- Optional “Detect my region” button

Important:
- Do not force GPS permission.
- Manual selection should be the default.
- If user chooses detect region, request approximate location permission only if needed.
- Store only country/region code, not exact address.
- Example region codes:
  IN, US, GB, JP, KR, CA, AU

Use selected region for:
- Trending content region
- Upcoming release dates
- Legal watch providers
- Watchmode country filtering
- TMDB watch provider region
- Regional language preference
- Calendar release reminders

Save in DataStore:
- userRegionCode
- userRegionName

5. Language Setup
Ask:
“Which languages do you prefer?”

Show selectable chips:
- English
- Hindi
- Japanese
- Korean
- Spanish
- French
- German
- Tamil
- Telugu
- Malayalam
- Bengali
- Marathi

Allow multiple selections.

Save in DataStore:
- preferredLanguages
- primaryLanguage

Use selected languages for:
- Search filters
- Home recommendations
- Discover filters
- Watch Brain suggestions
- Language cards on detail screen

6. Content Preference Setup
Ask:
“What do you watch most?”

Selectable cards:
- Movies
- Series
- Anime
- Web Series

Ask favorite genres:
- Action
- Comedy
- Thriller
- Horror
- Romance
- Drama
- Sci-Fi
- Fantasy
- Mystery
- Crime
- Adventure
- Slice of Life

Save in DataStore:
- preferredContentTypes
- preferredGenres

Use these preferences for:
- Personalized home feed
- Discover filters
- Watch Brain suggestions
- Recommendation section

7. Notification Setup
Ask:
“Do you want release reminders?”

Options:
- Enable Reminders
- Maybe Later

If enabled:
- Request POST_NOTIFICATIONS permission on Android 13+.
- Save remindersEnabled = true.
- Use AlarmManager for selected reminders.
- Use WorkManager for reminder sync/fallback.
- If exact alarms are restricted, use fallback inexact reminders and show a user-friendly message.

8. Theme Setup
Ask:
“Choose your app style”

Options:
- Dynamic Glass
- Premium Light
- AMOLED Dark

Save in DataStore:
- selectedTheme

Default:
Dynamic Glass

UI DESIGN SYSTEM:
Create a premium glassmorphism cinematic Android UI.

Main visual rule:
The app background should dynamically adapt based on the current movie, series, or anime artwork.

Dynamic background behavior:
- Use selected poster/backdrop image as background source.
- Apply heavy blur.
- Extract dominant colors.
- Create adaptive gradient overlay.
- Place frosted glass cards above the background.
- Maintain readability with dark/light overlay.
- If no image exists, use default WatchVault gradient.

Examples:
- Dark anime: black, crimson, purple blur.
- Adventure movie: teal, blue, orange blur.
- Thriller: black, deep green, red blur.
- Romance: pink, violet, peach blur.

Theme style:
- Frosted glass cards
- Translucent panels
- Soft blur
- Rounded corners
- Subtle glow
- Floating bottom navigation
- Premium spacing
- Native Android feel

BOTTOM NAVIGATION:
Use 5 tabs:
- Home
- Discover
- Library
- Calendar
- Profile

Bottom nav style:
- Floating glass pill
- Active icon glow
- Active tab tint from dynamic accent color
- Inactive icons muted
- Smooth rounded shape
- Fixed at bottom

MAIN SCREENS:

1. Home Screen
Use saved personalization.

Show:
- Greeting using userName
- Subtitle: “What are you watching today?”
- Search bar
- Category chips:
  All, Movies, Series, Anime, Upcoming
- Featured content based on region/languages/preferences
- Continue Watching from Room database
- Trending from TMDB/AniList
- Upcoming releases based on region
- Watch Brain insight cards

Home must use:
- userName from DataStore
- userRegionCode from DataStore
- preferredLanguages from DataStore
- preferredGenres from DataStore
- local library from Room
- API data from repositories

2. Discover Screen
Search across:
- TMDB movies
- TMDB TV shows
- AniList anime
- Jikan fallback anime

Filters:
- All
- Movies
- Series
- Anime
- Genre
- Language
- Rating
- Provider
- Upcoming

States:
- Loading
- Success
- Empty
- Error
- No internet
- API key missing

3. Detail Screen
Show real/API data:
- Poster
- Backdrop
- Title
- Original title
- Type
- Overview
- Release date
- Runtime
- Genres
- Original language
- Available languages if API provides them
- Country
- TMDB rating
- IMDb rating from OMDb
- Rotten Tomatoes rating from OMDb if available
- Metacritic rating from OMDb if available
- Trailer button
- Where to Watch section
- Add to Library button
- Favorite button
- Status selector
- Reminder button if upcoming

For movies:
- Mark watched
- Mark unwatched

For series/anime:
- Open Episode Tracker

4. Episode Tracker Screen
For series/anime.

Show:
- Series/anime poster
- Title
- Overall progress percentage
- Season accordion list
- Episode rows
- Watched checkbox
- Mark season watched
- Unmark season
- Mark all watched
- Reset progress

Logic:
- If one episode is watched, status becomes Watching.
- If all episodes in one season are watched, season shows completed.
- If all episodes in show/anime are watched, status becomes Completed.
- If user marks a later episode watched, show dialog:
  “Mark previous episodes as watched too?”
  Options:
  Yes, mark previous
  No, only this episode
- Progress must persist after restart using Room.

5. Library Screen
Show saved local library from Room.

Tabs:
- Watching
- Plan
- Completed
- Dropped
- On Hold
- Favorites
- Movies
- Series
- Anime

Do not show fake library items.
If empty:
Show:
“Your library is empty”
Button:
Discover titles

6. Upcoming Screen
Show upcoming movies, TV episodes/seasons, and anime releases.

Use:
- TMDB upcoming movies
- TMDB TV airing data where available
- AniList next airing episode
- Region from DataStore

Each card:
- Poster
- Title
- Type
- Release date
- Countdown
- Language
- Region
- Reminder button

7. Calendar Screen
Show:
- Upcoming release dates
- Reminder dates
- Watched/completed dates

Calendar should use:
- ReminderEntity from Room
- WatchEventEntity from Room
- Upcoming API data cached locally

8. Profile / Stats Screen
Use real local data.

Show:
- User name
- Region
- Preferred languages
- Total movies watched
- Total episodes watched
- Series tracked
- Anime completed
- Total watch hours
- Pending titles
- Completion rate
- Favorite genre
- Favorite language

Stats must be calculated from Room, not fake hardcoded values.

9. Settings Screen
Allow user to edit:
- Name
- Region
- Preferred languages
- Content preferences
- Theme
- Notification reminders
- API status
- Backup/export JSON
- Import JSON
- Clear local data
- About WatchVault

About section must include:
“This product uses the TMDB API but is not endorsed or certified by TMDB.”

DATA STORAGE:

Use DataStore for:
- onboardingCompleted
- userName
- userRegionCode
- userRegionName
- preferredLanguages
- primaryLanguage
- preferredContentTypes
- preferredGenres
- remindersEnabled
- selectedTheme
- apiStatusDismissed

Use Room for:
- saved library
- media details cache
- seasons
- episodes
- watch progress
- reminders
- watch events
- collections
- stats cache

API SOURCES:

TMDB:
Use for:
- movies
- TV shows
- trending
- popular
- upcoming
- posters
- backdrops
- cast
- trailers
- seasons
- episodes
- genres
- watch providers
- languages

OMDb:
Use for:
- IMDb rating
- Rotten Tomatoes rating
- Metacritic rating

AniList:
Use for:
- anime search
- anime details
- anime scores
- episode count
- airing status
- next airing episode

Jikan:
Use as anime fallback.

Watchmode:
Use for:
- legal streaming provider availability
- rent/buy/stream links
- country-specific provider data

API KEY RULES:
Do not hardcode API keys in Kotlin files.

Read from BuildConfig:
- BuildConfig.TMDB_API_KEY
- BuildConfig.TMDB_ACCESS_TOKEN
- BuildConfig.OMDB_API_KEY
- BuildConfig.WATCHMODE_API_KEY
- BuildConfig.ANILIST_BASE_URL
- BuildConfig.JIKAN_BASE_URL
- BuildConfig.WATCHMODE_BASE_URL

If API key is missing:
- Do not crash.
- Show API missing state.
- Keep app usable with already saved local data.

ARCHITECTURE:

Use these layers:

data/
- local/
- remote/
- repository/
- mapper/

domain/
- model/
- repository/
- usecase/

presentation/
- navigation/
- theme/
- components/
- screens/
- viewmodel/

di/
notification/
worker/

REQUIRED USE CASES:
- CompleteOnboardingUseCase
- SaveUserNameUseCase
- SaveUserRegionUseCase
- SaveLanguagePreferencesUseCase
- SaveContentPreferencesUseCase
- SearchMediaUseCase
- GetHomeFeedUseCase
- GetMediaDetailsUseCase
- AddToLibraryUseCase
- UpdateMediaStatusUseCase
- MarkEpisodeWatchedUseCase
- UnmarkEpisodeWatchedUseCase
- MarkSeasonWatchedUseCase
- MarkShowWatchedUseCase
- ResetProgressUseCase
- CreateReminderUseCase
- GetCalendarEventsUseCase
- GetStatsUseCase
- ExportBackupUseCase
- ImportBackupUseCase

REQUIRED VIEWMODELS:
- SplashViewModel
- OnboardingViewModel
- HomeViewModel
- DiscoverViewModel
- DetailViewModel
- TrackerViewModel
- LibraryViewModel
- UpcomingViewModel
- CalendarViewModel
- ProfileViewModel
- SettingsViewModel

REQUIRED UI STATES:
Every screen must support:
- Loading
- Success
- Empty
- Error
- No Internet
- API Missing

NO FAKE DATA RULE:
Do not build the final app around fake hardcoded data.
Use real API repositories.
Temporary preview data is allowed only for Compose previews.
If APIs fail, show error/empty states.
If local saved data exists, show cached data from Room.

APP OPEN DECISION LOGIC:
Implement this exact navigation logic:

On app launch:
- Read onboardingCompleted from DataStore.
- If false, go to onboarding.
- If true, go to home.
- Home loads personalization.
- If internet available, fetch live API data.
- Cache useful data in Room.
- If internet unavailable, show cached/local data.
- If no cache exists, show no-internet empty state.

PERSONALIZATION LOGIC:
Use:
- userName for greeting.
- userRegionCode for providers, trending, release dates.
- preferredLanguages for filtering and ranking.
- preferredGenres for recommendations.
- preferredContentTypes for home feed sections.
- local watch history for Watch Brain.

WATCH BRAIN LOGIC:
Generate smart local insights:
- pending episodes today
- upcoming release tomorrow
- continue series reminder
- high-priority pending titles
- weekly watching progress
- unfinished seasons
- recommended next watch based on genre/language

DESIGN QUALITY:
- Premium glassmorphism UI
- Dynamic blurred artwork backgrounds
- Native Android layout
- Smooth animations
- No website-like UI
- No dead buttons
- No empty broken screens
- No copied brand UI
- No piracy features

FINAL ACCEPTANCE CHECKLIST:
The app is complete only if:
1. First launch onboarding works.
2. User name is saved and appears on Home/Profile.
3. Region is saved and affects providers/upcoming/trending.
4. Language preferences are saved and used in filters.
5. Content preferences affect Home and recommendations.
6. Notification permission flow works.
7. Home loads personalized API data.
8. Search works across movies, series, and anime.
9. Detail pages show real metadata.
10. Add to Library works.
11. Episode tracking works and persists.
12. Upcoming reminders work.
13. Calendar shows reminders and release dates.
14. Stats are calculated from local data.
15. Settings can edit user name, region, language, theme, and reminders.
16. App works offline with saved data.
17. App never crashes if API keys are missing.
18. App builds successfully into APK.

DELIVERABLE:
Modify the Android project directly.
Provide:
- Summary of implemented flow
- Files created
- Files modified
- How the app opens
- How personalization works
- How APIs connect
- How local storage works
- How reminders work
- Build result

Use this as your main master prompt. It tells the AI exactly how the app opens, how it gets the user name, how it gets region/area, how it saves preferences, how it loads APIs, and how every screen should work.