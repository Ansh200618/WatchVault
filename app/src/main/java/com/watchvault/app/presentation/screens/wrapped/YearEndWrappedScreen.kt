package com.watchvault.app.presentation.screens.wrapped

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.watchvault.app.presentation.components.FloatingBackButton
import com.watchvault.app.presentation.viewmodel.ProfileViewModel

@Composable
fun YearEndWrappedScreen(navController: NavHostController, viewModel: ProfileViewModel = hiltViewModel()) {
    val stats by viewModel.stats.collectAsState()
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        FloatingBackButton { navController.popBackStack() }
        Spacer(Modifier.height(16.dp))
        Text("2026 Wrapped", style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(16.dp))
        WrappedCard("Total watch hours", stats.totalWatchHours.toString(), "Your entertainment year in one number.")
        WrappedCard("Top genre", stats.mostWatchedGenre, "The mood you returned to the most.")
        WrappedCard("Most watched language", stats.mostWatchedLanguage, "Your language pattern this year.")
        WrappedCard("Most watched type", "Anime + Series", "Based on completed episodes and titles.")
        WrappedCard("Most binged series", "Mystery Manor", "Your fastest local binge result.")
        WrappedCard("Completed titles", (stats.totalMoviesWatched + stats.totalSeriesWatched + stats.totalAnimeCompleted).toString(), "All local progress only.")
    }
}

@Composable
private fun WrappedCard(title: String, value: String, body: String) {
    Surface(shape = RoundedCornerShape(32.dp), color = Color.Transparent, modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Box(Modifier.background(Brush.linearGradient(listOf(Color(0xFF070707), Color(0xFF243B55)))).padding(24.dp)) {
            Column { Text(title, color = Color.White.copy(alpha = 0.72f)); Text(value, color = Color.White, style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold); Text(body, color = Color.White.copy(alpha = 0.72f)) }
        }
    }
}
