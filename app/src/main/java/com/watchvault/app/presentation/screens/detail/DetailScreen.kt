package com.watchvault.app.presentation.screens.detail

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import coil.compose.AsyncImage
import com.watchvault.app.domain.model.*
import com.watchvault.app.presentation.components.*
import com.watchvault.app.presentation.navigation.Screen
import com.watchvault.app.presentation.viewmodel.DetailViewModel

@Composable
fun DetailScreen(navController: NavHostController, mediaId: Long, viewModel: DetailViewModel = hiltViewModel()) {
    val item by viewModel.getMedia(mediaId).collectAsStateWithLifecycle()
    val status by viewModel.getStatus(mediaId).collectAsStateWithLifecycle()
    val providers by viewModel.getProviders(mediaId).collectAsStateWithLifecycle()
    val spoilers by viewModel.spoilerSettings.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var showReminderDialog by remember { mutableStateOf(false) }
    val media = item ?: return EmptyStateView("Title not found", "Add API key to enable live data or save titles for offline view.")

    if (showReminderDialog) {
        AlertDialog(
            onDismissRequest = { showReminderDialog = false },
            title = { Text("Release reminder") },
            text = {
                Column {
                    listOf(
                        ReminderType.RELEASE_DAY to "On release day",
                        ReminderType.ONE_DAY_BEFORE to "1 day before",
                        ReminderType.THREE_DAYS_BEFORE to "3 days before",
                        ReminderType.ONE_WEEK_BEFORE to "1 week before",
                        ReminderType.CUSTOM to "Custom date/time"
                    ).forEach { option ->
                        TextButton(onClick = { viewModel.createReminder(media, option.first); showReminderDialog = false }) { Text(option.second) }
                    }
                }
            },
            confirmButton = {}
        )
    }

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            Box(Modifier.fillMaxWidth().height(330.dp)) {
                AsyncImage(media.bannerUrl, media.title, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                Box(Modifier.matchParentSize().background(Brush.verticalGradient(listOf(Color.Transparent, MaterialTheme.colorScheme.background), startY = 200f)))
                Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    FloatingBackButton { navController.popBackStack() }
                    FloatingFavoriteButton(status?.isFavorite == true) { viewModel.toggleFavorite(media.id) }
                }
            }
            Surface(Modifier.fillMaxWidth().offset(y = (-36).dp).padding(horizontal = 16.dp), shape = RoundedCornerShape(30.dp), color = MaterialTheme.colorScheme.surface, shadowElevation = 8.dp) {
                Column(Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(media.title, Modifier.weight(1f), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        StatusChip(media.type.name)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text("${media.releaseDate.take(4)} · ${media.runtime} min · ${media.originalLanguageName}", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
                    Spacer(Modifier.height(14.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        RatingCard("TMDB", if (spoilers.hideRatingsUntilWatched && status?.status != UserWatchStatus.COMPLETED) "Hidden" else media.ratingTmdb?.toString() ?: "N/A")
                        RatingCard("IMDb", if (spoilers.hideRatingsUntilWatched && status?.status != UserWatchStatus.COMPLETED) "Hidden" else media.ratingImdb?.toString() ?: "N/A")
                        RatingCard("RT", media.ratingRottenTomatoes ?: "N/A")
                        RatingCard("MC", media.ratingMetacritic ?: "N/A")
                    }
                    Spacer(Modifier.height(16.dp))
                    Text("Overview", fontWeight = FontWeight.Bold)
                    Text(if (spoilers.blurCastPlotDetails) "Spoiler hidden" else media.overview, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.72f))
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        GradientButton("Trailer", Modifier.weight(1f)) { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(media.trailerUrl))) }
                        OutlinedButton(onClick = { viewModel.addToLibrary(media.id) }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(28.dp)) { Text("Add") }
                    }
                    Spacer(Modifier.height(10.dp))
                    OutlinedButton(onClick = { showReminderDialog = true }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(28.dp)) { Text("Remind Me") }
                    if (media.type != MediaType.MOVIE) {
                        Spacer(Modifier.height(10.dp))
                        Button(onClick = { navController.navigate(Screen.EpisodeTracker.createRoute(media.id)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(28.dp)) {
                            Icon(Icons.Filled.TrackChanges, null); Spacer(Modifier.width(8.dp)); Text("Open Episode Tracker")
                        }
                    } else {
                        Spacer(Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Button(onClick = { viewModel.markWatched(media.id) }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(28.dp)) { Text("Mark watched") }
                            OutlinedButton(onClick = { viewModel.markUnwatched(media.id) }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(28.dp)) { Text("Mark unwatched") }
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Text("Priority", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { Priority.values().forEach { PriorityChip(it, status?.priority == it) { viewModel.setPriority(media.id, it) } } }
                    Spacer(Modifier.height(16.dp))
                    Text("Where to watch legally", fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    if (providers.isEmpty()) Text("Availability information is not available for your region yet.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)) else providers.forEach { ProviderCard(it) { if (it.deepLinkUrl.isNotBlank()) context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(it.deepLinkUrl))) }; Spacer(Modifier.height(8.dp)) }
                    Spacer(Modifier.height(12.dp))
                    Text("Languages", fontWeight = FontWeight.Bold)
                    Text("Original: ${media.originalLanguageName} · Metadata only (no streaming links).", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f))
                }
            }
        }
    }
}
