package com.watchvault.app.presentation.screens.imports

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.watchvault.app.presentation.components.FloatingBackButton

@Composable
fun ImportListsScreen(navController: NavHostController) {
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row { FloatingBackButton { navController.popBackStack() }; Spacer(Modifier.width(12.dp)); Text("Import & Backup", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        Spacer(Modifier.height(18.dp))
        ImportCard("JSON import/export", "Local structure is ready for user media statuses, watched episodes, reminders, collections, goals, and settings.")
        ImportCard("CSV import", "Future-ready local parser screen for simple watchlist imports.")
        ImportCard("MyAnimeList", "Connect/import support will be added when API configuration is available.")
        ImportCard("AniList", "Connect/import support will be added when API configuration is available.")
        ImportCard("IMDb watchlist", "Connect/import support will be added when API configuration is available.")
    }
}

@Composable
private fun ImportCard(title: String, body: String) {
    Surface(shape = MaterialTheme.shapes.large, color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp, modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Row(Modifier.padding(16.dp)) { Icon(Icons.Filled.UploadFile, null); Spacer(Modifier.width(12.dp)); Column { Text(title, fontWeight = FontWeight.Bold); Text(body, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f)) } }
    }
}
