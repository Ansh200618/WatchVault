package com.watchvault.app.presentation.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.watchvault.app.domain.model.GoalType
import com.watchvault.app.presentation.components.*
import com.watchvault.app.presentation.navigation.Screen
import com.watchvault.app.presentation.viewmodel.ProfileViewModel

@Composable
fun ProfileScreen(navController: NavHostController, viewModel: ProfileViewModel = hiltViewModel()) {
    val stats by viewModel.stats.collectAsState()
    val goals by viewModel.goals.collectAsState()
    val brain by viewModel.brain.collectAsState()
    val backup by viewModel.backupJson.collectAsState()

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column { Text("Profile & Stats", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold); Text("Your local watch intelligence", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f)) }
            Row { IconButton(onClick = { navController.navigate(Screen.Wrapped.route) }) { Icon(Icons.Filled.Stars, null) }; IconButton(onClick = { navController.navigate(Screen.Settings.route) }) { Icon(Icons.Filled.Settings, null) } }
        }
        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) { StatsCard("Watch hours", stats.totalWatchHours.toString(), Modifier.weight(1f)); StatsCard("Episodes", stats.totalEpisodesWatched.toString(), Modifier.weight(1f)) }
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) { StatsCard("Completed", stats.completionRate.toString() + "%", Modifier.weight(1f)); StatsCard("Pending", stats.pendingCount.toString(), Modifier.weight(1f)) }
        Spacer(Modifier.height(18.dp))
        Surface(shape = RoundedCornerShape(28.dp), color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp, modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) { Text("Monthly watch graph", fontWeight = FontWeight.Bold); Spacer(Modifier.height(8.dp)); MiniBarChart(stats.monthlyCounts); Text("Top genre: ${stats.mostWatchedGenre} · Language: ${stats.mostWatchedLanguage}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f)) }
        }
        Spacer(Modifier.height(18.dp))
        Text("Watch streaks", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        Surface(shape = RoundedCornerShape(28.dp), modifier = Modifier.fillMaxWidth(), color = Color.Transparent) {
            Box(Modifier.background(Brush.horizontalGradient(listOf(Color(0xFF111111), Color(0xFF2A2A2A)))).padding(18.dp)) {
                Column { Text("7-day streak", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold); Text("Longest streak: 14 days · Missed days: 2 · Badge: Consistent Vault Keeper", color = Color.White.copy(alpha = 0.75f)) }
            }
        }
        Spacer(Modifier.height(18.dp))
        Text("Goals", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        goals.forEach { GoalCard(it); Spacer(Modifier.height(10.dp)) }
        GradientButton("Add sample episode goal", Modifier.fillMaxWidth()) { viewModel.addGoal("Finish 20 episodes this month", GoalType.EPISODES, 20) }
        Spacer(Modifier.height(18.dp))
        Text("Watch Brain", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        brain.take(3).forEach { WatchBrainCard(it); Spacer(Modifier.height(10.dp)) }
        Spacer(Modifier.height(18.dp))
        OutlinedButton(onClick = { navController.navigate(Screen.ImportLists.route) }, modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) { Icon(Icons.Filled.FileDownload, null); Spacer(Modifier.width(8.dp)); Text("Import / Backup tools") }
        Text("Backup JSON is generated locally. Preview size: ${backup.length} characters.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f), modifier = Modifier.padding(top = 8.dp))
        Spacer(Modifier.height(24.dp))
    }
}
