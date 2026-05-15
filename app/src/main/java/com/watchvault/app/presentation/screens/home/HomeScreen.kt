package com.watchvault.app.presentation.screens.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.Image
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import coil.compose.AsyncImage
import com.watchvault.app.BuildConfig
import com.watchvault.app.R
import com.watchvault.app.domain.model.MediaItem
import com.watchvault.app.presentation.components.*
import com.watchvault.app.presentation.navigation.Screen
import com.watchvault.app.presentation.viewmodel.HomeViewModel

@Composable
fun HomeScreen(navController: NavHostController, viewModel: HomeViewModel = hiltViewModel()) {
    val featured by viewModel.featured.collectAsStateWithLifecycle()
    val continueWatching by viewModel.continueWatching.collectAsStateWithLifecycle()
    val trending by viewModel.trending.collectAsStateWithLifecycle()
    val upcoming by viewModel.upcoming.collectAsStateWithLifecycle()
    val brain by viewModel.watchBrain.collectAsStateWithLifecycle()
    val recommendations by viewModel.moodRecommendations.collectAsStateWithLifecycle()
    var query by rememberSaveable { mutableStateOf("") }
    var mood by rememberSaveable { mutableStateOf("Action") }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Image(
                        painter = painterResource(id = R.drawable.ic_watchvault_logo),
                        contentDescription = "WatchVault",
                        modifier = Modifier.size(28.dp)
                    )
                    Text("WatchVault", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                }
                Text("Your premium watch tracker", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
            }
            AsyncImage("https://picsum.photos/seed/ansh/80", null, contentScale = ContentScale.Crop, modifier = Modifier.size(48.dp).clip(MaterialTheme.shapes.large))
        }
        Spacer(Modifier.height(16.dp))
        if (BuildConfig.TMDB_API_KEY.isBlank()) {
            Text("Add API key to enable live data", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            Spacer(Modifier.height(8.dp))
        }
        SearchBar(query, { query = it }, placeholder = "Search movies, series, anime...")
        Spacer(Modifier.height(16.dp))
        CategoryChipsRow(listOf("All", "Movies", "Series", "Anime", "Upcoming", "Completed")) {}
        Spacer(Modifier.height(18.dp))
        featured.firstOrNull()?.let { FeaturedMediaCard(it) { navController.navigate(Screen.Detail.createRoute(it.id, it.type)) } }
        Spacer(Modifier.height(24.dp))
        Text("Watch Brain", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))
        brain.take(2).forEach { WatchBrainCard(it); Spacer(Modifier.height(10.dp)) }
        Spacer(Modifier.height(12.dp))
        Text("What should I watch?", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))
        MoodPicker(mood) { selected -> mood = selected; viewModel.selectMood(selected) }
        Spacer(Modifier.height(12.dp))
        MediaRow("Recommended for $mood", recommendations, navController)
        Spacer(Modifier.height(20.dp))
        MediaRow("Continue Watching", continueWatching, navController)
        Spacer(Modifier.height(20.dp))
        MediaRow("Trending Now", trending, navController)
        Spacer(Modifier.height(20.dp))
        MediaRow("Upcoming Releases", upcoming, navController)
        Spacer(Modifier.height(36.dp))
    }
}

@Composable
private fun MediaRow(title: String, items: List<MediaItem>, navController: NavHostController) {
    Column {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("See all", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.52f))
        }
        Spacer(Modifier.height(10.dp))
        if (items.isEmpty()) EmptyStateView("Nothing here", "Add titles to your library to see recommendations.") else LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            items(items) { item -> MediaPosterCard(item, Modifier.size(142.dp, 214.dp)) { navController.navigate(Screen.Detail.createRoute(it.id, it.type)) } }
        }
    }
}
