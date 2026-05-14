package com.watchvault.app.presentation.navigation

sealed class Screen(val route: String, val label: String) {
    object Splash : Screen("splash", "Splash")
    object Home : Screen("home", "Home")
    object Discover : Screen("discover", "Discover")
    object Library : Screen("library", "Library")
    object Calendar : Screen("calendar", "Calendar")
    object Profile : Screen("profile", "Profile")
    object Settings : Screen("settings", "Settings")
    object Wrapped : Screen("wrapped", "Wrapped")
    object ImportLists : Screen("import_lists", "Import")
    object Detail : Screen("detail/{mediaId}", "Detail") { fun createRoute(mediaId: Long) = "detail/$mediaId" }
    object EpisodeTracker : Screen("tracker/{mediaId}", "Tracker") { fun createRoute(mediaId: Long) = "tracker/$mediaId" }
}
