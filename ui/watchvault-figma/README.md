# WatchVault New UI Import

This folder is reserved for the uploaded Figma/Vite React UI source.

Important:
- The uploaded ZIP is a React/Vite web prototype, not native Android Jetpack Compose code.
- I did not delete or modify Android backend, Room, repositories, Hilt, WorkManager, notifications, or data layer files.
- Do not replace Android `data/`, `domain/`, `di/`, `notification/`, or `worker/` files with this UI source.

Safe integration plan:
1. Keep the backend/native Android architecture untouched.
2. Convert the React UI screen-by-screen into Jetpack Compose.
3. Replace only files under `app/src/main/java/com/watchvault/app/presentation/`.
4. Keep ViewModels/repositories wired to the existing app data.

Uploaded UI source summary:
- React + Vite app
- Main UI entry: `src/app/App.tsx`
- WatchVault screens: `src/app/components/wv/screens/`
- Shared UI components: `src/app/components/wv/`
- Mock data: `src/app/data.ts`

Next step: convert this visual design into native Compose screens without touching backend logic.