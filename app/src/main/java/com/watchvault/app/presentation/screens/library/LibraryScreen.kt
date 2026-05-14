package com.watchvault.app.presentation.screens.library

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.watchvault.app.domain.model.*
import com.watchvault.app.presentation.components.*
import com.watchvault.app.presentation.navigation.Screen
import com.watchvault.app.presentation.viewmodel.LibraryViewModel

@Composable
fun LibraryScreen(navController: NavHostController, viewModel: LibraryViewModel = hiltViewModel()) {
    val items by viewModel.libraryItems.collectAsStateWithLifecycle()
    val collections by viewModel.collections.collectAsStateWithLifecycle()
    var selectedTab by remember { mutableStateOf("Watching") }
    val tabs = listOf("Watching", "Plan", "Completed", "Dropped", "On Hold", "Favorites", "Movies", "Series", "Anime")
    val filtered = items.filter { entry ->
        when (selectedTab) {
            "Watching" -> entry.status?.status == UserWatchStatus.WATCHING
            "Plan" -> entry.status?.status == UserWatchStatus.PLAN_TO_WATCH
            "Completed" -> entry.status?.status == UserWatchStatus.COMPLETED
            "Favorites" -> entry.status?.isFavorite == true
            "Movies" -> entry.media.type == MediaType.MOVIE
            "Series" -> entry.media.type == MediaType.SERIES
            "Anime" -> entry.media.type == MediaType.ANIME
            else -> true
        }
    }
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Library", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))
        androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { items(tabs) { tab -> FilterChip(selected = selectedTab == tab, onClick = { selectedTab = tab }, label = { Text(tab) }) } }
        Spacer(Modifier.height(12.dp))
        Text("Collections", fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { items(collections) { c -> StatusChip("${c.name} · ${c.mediaIds.size}") } }
        Spacer(Modifier.height(12.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(filtered) { entry ->
                Surface(shape = MaterialTheme.shapes.large, color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp) {
                    Row(Modifier.fillMaxWidth().padding(12.dp)) {
                        MediaPosterCard(entry.media, Modifier.size(88.dp, 132.dp), progress = entry.status?.progressPercentage) { navController.navigate(Screen.Detail.createRoute(it.id, it.type)) }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(entry.media.title, fontWeight = FontWeight.Bold)
                            val rating = entry.media.ratingTmdb?.toString() ?: "N/A"
                            Text("${entry.media.type} · ★ $rating", style = MaterialTheme.typography.bodySmall)
                            Spacer(Modifier.height(8.dp)); AnimatedProgressBar(entry.status?.progressPercentage ?: 0, Modifier.fillMaxWidth())
                            val lastSeason = entry.status?.lastWatchedSeason?.toString() ?: "-"
                            val lastEpisode = entry.status?.lastWatchedEpisode?.toString() ?: "-"
                            Text("Last: S$lastSeason E$lastEpisode", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                            Spacer(Modifier.height(8.dp)); Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { Priority.values().take(3).forEach { PriorityChip(it, entry.status?.priority == it) { viewModel.setPriority(entry.media.id, it) } } }
                        }
                    }
                }
            }
        }
    }
}
