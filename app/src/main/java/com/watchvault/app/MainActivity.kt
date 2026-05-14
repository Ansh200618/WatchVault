package com.watchvault.app

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LibraryBooks
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.watchvault.app.presentation.navigation.AppNavGraph
import com.watchvault.app.presentation.navigation.Screen
import com.watchvault.app.presentation.theme.WatchVaultTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val notificationPermissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) {}
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        setContent { WatchVaultTheme { MainContent() } }
    }
}

@Composable
private fun MainContent() {
    val navController = rememberNavController()
    val items = listOf(Screen.Home, Screen.Discover, Screen.Library, Screen.Calendar, Screen.Profile)
    Scaffold(bottomBar = { BottomNavigationBar(navController, items) }) { innerPadding ->
        AppNavGraph(navController = navController, modifier = Modifier.padding(innerPadding))
    }
}

@Composable
private fun BottomNavigationBar(navController: androidx.navigation.NavHostController, items: List<Screen>) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val current = navBackStackEntry?.destination?.route
    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
        items.forEach { screen ->
            val selected = current == screen.route
            val icon = when (screen) {
                Screen.Home -> Icons.Filled.Home
                Screen.Discover -> Icons.Filled.Search
                Screen.Library -> Icons.Filled.LibraryBooks
                Screen.Calendar -> Icons.Filled.CalendarToday
                Screen.Profile -> Icons.Filled.Person
                else -> Icons.Filled.Home
            }
            NavigationBarItem(
                selected = selected,
                onClick = { navController.navigate(screen.route) { popUpTo(Screen.Home.route); launchSingleTop = true } },
                icon = { Icon(icon, contentDescription = screen.route) },
                label = { Text(screen.label) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.onSurface,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f),
                    selectedTextColor = MaterialTheme.colorScheme.onSurface,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f),
                    indicatorColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                )
            )
        }
    }
}
