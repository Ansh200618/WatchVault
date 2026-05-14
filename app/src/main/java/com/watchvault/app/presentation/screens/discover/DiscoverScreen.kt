package com.watchvault.app.presentation.screens.discover

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.watchvault.app.domain.model.MediaType
import com.watchvault.app.presentation.components.*
import com.watchvault.app.presentation.navigation.Screen
import com.watchvault.app.presentation.viewmodel.DiscoverViewModel

@Composable
fun DiscoverScreen(navController: NavHostController, viewModel: DiscoverViewModel = hiltViewModel()) {
    var query by rememberSaveable { mutableStateOf("") }
    var selectedCategory by rememberSaveable { mutableStateOf("All") }
    val items by viewModel.items.collectAsState()
    val filtered = items.filter { item ->
        val categoryMatch = when (selectedCategory) {
            "Movies" -> item.type == MediaType.MOVIE
            "Series" -> item.type == MediaType.SERIES
            "Anime" -> item.type == MediaType.ANIME
            "Upcoming" -> item.releaseDate >= java.time.LocalDate.now().toString()
            else -> true
        }
        categoryMatch && (query.isBlank() || item.title.contains(query, ignoreCase = true) || item.genres.any { it.contains(query, ignoreCase = true) })
    }
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Discover", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        SearchBar(query = query, onQueryChange = { query = it }, placeholder = "Search movies, series, anime...")
        Spacer(Modifier.height(12.dp))
        androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(listOf("All", "Movies", "Series", "Anime", "Upcoming")) { category ->
                FilterChip(selected = selectedCategory == category, onClick = { selectedCategory = category }, label = { Text(category) })
            }
        }
        Spacer(Modifier.height(12.dp))
        if (filtered.isEmpty()) EmptyStateView("No result", "Try another genre, language, rating, or provider filter.") else LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(filtered) { item ->
                MediaPosterCard(item, modifier = Modifier.fillMaxWidth().height(220.dp)) { navController.navigate(Screen.Detail.createRoute(it.id)) }
            }
        }
    }
}
