package com.watchvault.app.presentation.screens.tracker

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.watchvault.app.domain.model.Episode
import com.watchvault.app.presentation.components.*
import com.watchvault.app.presentation.viewmodel.EpisodeTrackerViewModel

@Composable
fun EpisodeTrackerScreen(navController: NavHostController, mediaId: Long, viewModel: EpisodeTrackerViewModel = hiltViewModel()) {
    val state by viewModel.state(mediaId).collectAsState()
    var pendingEpisode by remember { mutableStateOf<Episode?>(null) }

    if (pendingEpisode != null) {
        AlertDialog(
            onDismissRequest = { pendingEpisode = null },
            title = { Text("Mark previous episodes as watched too?") },
            text = { Text("You selected S${pendingEpisode!!.seasonNumber} E${pendingEpisode!!.episodeNumber}.") },
            confirmButton = { TextButton(onClick = { pendingEpisode?.let { viewModel.markEpisode(mediaId, it.seasonNumber, it.episodeNumber, true) }; pendingEpisode = null }) { Text("Yes, mark previous") } },
            dismissButton = { TextButton(onClick = { pendingEpisode?.let { viewModel.markEpisode(mediaId, it.seasonNumber, it.episodeNumber, false) }; pendingEpisode = null }) { Text("No, only this episode") } }
        )
    }

    Scaffold(
        topBar = {
            Surface(shadowElevation = 2.dp) { Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) { FloatingBackButton { navController.popBackStack() }; Spacer(Modifier.width(12.dp)); Text("Episode Tracker", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) } }
        },
        bottomBar = {
            Surface(shadowElevation = 8.dp) {
                Row(Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedButton(onClick = { viewModel.resetShow(mediaId) }, modifier = Modifier.weight(1f), shape = MaterialTheme.shapes.large) { Text("Reset") }
                    GradientButton("Mark show watched", Modifier.weight(1.4f)) { viewModel.markShow(mediaId) }
                }
            }
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            val progress = state.status?.progressPercentage ?: 0
            Text("Progress $progress%", fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp)); AnimatedProgressBar(progress, Modifier.fillMaxWidth()); Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf("Seasons", "Episodes", "Progress").forEach { StatusChip(it) } }
            Spacer(Modifier.height(10.dp))
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.seasons) { season ->
                    var expanded by remember(season.id) { mutableStateOf(true) }
                    Surface(shape = MaterialTheme.shapes.large, color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp, modifier = Modifier.fillMaxWidth().animateContentSize()) {
                        Column(Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) { Text(season.title, fontWeight = FontWeight.Bold); Text(if (season.isCompleted) "Completed" else "${season.episodeCount} episodes", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)) }
                                TextButton(onClick = { if (season.isCompleted) viewModel.unmarkSeason(mediaId, season.seasonNumber) else viewModel.markSeason(mediaId, season.seasonNumber) }) { Text(if (season.isCompleted) "Unmark" else "Mark all") }
                                IconButton(onClick = { expanded = !expanded }) { Icon(Icons.Filled.ExpandMore, null) }
                            }
                            if (expanded) state.episodes.filter { it.seasonNumber == season.seasonNumber }.forEach { ep ->
                                EpisodeRow(ep, onToggle = { checked -> if (checked) pendingEpisode = ep else viewModel.unmarkEpisode(mediaId, ep.seasonNumber, ep.episodeNumber) })
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EpisodeRow(episode: Episode, onToggle: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Checkbox(checked = episode.isWatched, onCheckedChange = { onToggle(it) })
        Column(Modifier.weight(1f)) {
            Text("S${episode.seasonNumber} E${episode.episodeNumber} · ${episode.title}", fontWeight = FontWeight.SemiBold)
            Text("${episode.airDate} · ${episode.runtime} min", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
        }
    }
}
