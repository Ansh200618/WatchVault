package com.watchvault.app.presentation.navigation

import com.watchvault.app.domain.model.MediaType

sealed class Screen(val route: String, val label: String) {
    object Splash : Screen("splash", "Splash")
    object Home : Screen("home", "Home")
    object Discover : Screen("discover", "Discover")
    object Library : Screen("library", "Library")
    object Upcoming : Screen("upcoming", "Upcoming")
    object Calendar : Screen("calendar", "Calendar")
    object Profile : Screen("stats", "Stats")
    object Settings : Screen("settings", "Settings")
    object Wrapped : Screen("wrapped", "Wrapped")
    object ImportLists : Screen("import_lists", "Import")
    object Detail : Screen("detail/{mediaId}/{mediaType}", "Detail") {
        fun createRoute(mediaId: Long, mediaType: MediaType) = "detail/$mediaId/${mediaType.name.lowercase()}"
    }
    object EpisodeTracker : Screen("tracker/{mediaId}", "Tracker") { fun createRoute(mediaId: Long) = "tracker/$mediaId" }
}
