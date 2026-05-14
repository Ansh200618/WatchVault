package com.watchvault.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.watchvault.app.presentation.screens.calendar.CalendarScreen
import com.watchvault.app.presentation.screens.detail.DetailScreen
import com.watchvault.app.presentation.screens.discover.DiscoverScreen
import com.watchvault.app.presentation.screens.home.HomeScreen
import com.watchvault.app.presentation.screens.imports.ImportListsScreen
import com.watchvault.app.presentation.screens.library.LibraryScreen
import com.watchvault.app.presentation.screens.profile.ProfileScreen
import com.watchvault.app.presentation.screens.settings.SettingsScreen
import com.watchvault.app.presentation.screens.splash.SplashScreen
import com.watchvault.app.presentation.screens.tracker.EpisodeTrackerScreen
import com.watchvault.app.presentation.screens.wrapped.YearEndWrappedScreen

@Composable
fun AppNavGraph(navController: NavHostController = rememberNavController(), modifier: Modifier = Modifier) {
    NavHost(navController = navController, startDestination = Screen.Splash.route, modifier = modifier) {
        composable(Screen.Splash.route) { SplashScreen { navController.navigate(Screen.Home.route) { popUpTo(Screen.Splash.route) { inclusive = true } } } }
        composable(Screen.Home.route) { HomeScreen(navController) }
        composable(Screen.Discover.route) { DiscoverScreen(navController) }
        composable(Screen.Library.route) { LibraryScreen(navController) }
        composable(Screen.Calendar.route) { CalendarScreen(navController) }
        composable(Screen.Profile.route) { ProfileScreen(navController) }
        composable(Screen.Settings.route) { SettingsScreen(navController) }
        composable(Screen.Wrapped.route) { YearEndWrappedScreen(navController) }
        composable(Screen.ImportLists.route) { ImportListsScreen(navController) }
        composable(Screen.Detail.route) { backStackEntry -> DetailScreen(navController, backStackEntry.arguments?.getString("mediaId")?.toLongOrNull() ?: 0L) }
        composable(Screen.EpisodeTracker.route) { backStackEntry -> EpisodeTrackerScreen(navController, backStackEntry.arguments?.getString("mediaId")?.toLongOrNull() ?: 0L) }
    }
}
