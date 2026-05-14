package com.watchvault.app.presentation.components

import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.watchvault.app.domain.model.*

@Composable
fun GradientButton(text: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = modifier.height(52.dp),
        shape = RoundedCornerShape(28.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Black, contentColor = Color.White)
    ) { Text(text, fontWeight = FontWeight.SemiBold) }
}

@Composable
fun StatusChip(text: String, modifier: Modifier = Modifier) {
    Surface(modifier = modifier, shape = RoundedCornerShape(50), color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)) {
        Text(text, modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun PriorityChip(priority: Priority, selected: Boolean = false, onClick: (() -> Unit)? = null) {
    val label = when (priority) { Priority.HIGH -> "High"; Priority.MEDIUM -> "Medium"; Priority.LOW -> "Low"; Priority.WATCH_LATER -> "Watch later" }
    Surface(
        modifier = Modifier.clickable(enabled = onClick != null) { onClick?.invoke() },
        shape = RoundedCornerShape(50),
        color = if (selected) Color.Black else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f),
        contentColor = if (selected) Color.White else MaterialTheme.colorScheme.onSurface
    ) { Text(label, modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold) }
}

@Composable
fun AnimatedProgressBar(progress: Int, modifier: Modifier = Modifier) {
    val animated by animateFloatAsState(targetValue = progress.coerceIn(0, 100) / 100f, label = "progress")
    LinearProgressIndicator(
        progress = { animated },
        modifier = modifier.height(8.dp).clip(RoundedCornerShape(50)),
        color = Color.Black,
        trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
    )
}

@Composable
fun RatingCard(label: String, value: String) {
    Surface(shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.surface, shadowElevation = 1.dp) {
        Column(modifier = Modifier.width(94.dp).padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontWeight = FontWeight.Bold, maxLines = 1)
            Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f), maxLines = 1)
        }
    }
}

@Composable
fun ProviderCard(provider: WatchProvider, onClick: () -> Unit = {}) {
    Surface(modifier = Modifier.fillMaxWidth().clickable { onClick() }, shape = RoundedCornerShape(20.dp), color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(42.dp).clip(CircleShape).background(Color.Black), contentAlignment = Alignment.Center) { Text(provider.providerName.take(1), color = Color.White, fontWeight = FontWeight.Bold) }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(provider.providerName, fontWeight = FontWeight.SemiBold)
                Text(provider.providerType.name.lowercase().replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            }
            Icon(Icons.Filled.OpenInNew, contentDescription = null)
        }
    }
}

@Composable
fun WatchBrainCard(insight: WatchBrainInsight) {
    Surface(shape = RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surface, shadowElevation = 3.dp, modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(44.dp).clip(CircleShape).background(Color.Black), contentAlignment = Alignment.Center) { Icon(Icons.Filled.Psychology, null, tint = Color.White) }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(insight.title, fontWeight = FontWeight.Bold)
                Text(insight.body, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.66f), maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
fun MoodPicker(selectedMood: String, onMoodSelected: (String) -> Unit) {
    val moods = listOf("Action", "Relaxing", "Emotional", "Dark", "Comedy", "Thriller", "Short watch", "Binge-worthy", "Family-friendly")
    androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(moods.size) { index ->
            val mood = moods[index]
            FilterChip(selected = selectedMood == mood, onClick = { onMoodSelected(mood) }, label = { Text(mood) })
        }
    }
}

@Composable
fun GoalCard(goal: WatchGoal) {
    val progress = if (goal.targetCount == 0) 0 else (goal.currentCount * 100 / goal.targetCount).coerceIn(0, 100)
    Surface(shape = RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(goal.title, Modifier.weight(1f), fontWeight = FontWeight.Bold)
                StatusChip(if (goal.isCompleted) "Done" else "$progress%")
            }
            Spacer(Modifier.height(10.dp))
            AnimatedProgressBar(progress, Modifier.fillMaxWidth())
            Spacer(Modifier.height(6.dp))
            Text("${goal.currentCount}/${goal.targetCount} · ${goal.endDate}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
        }
    }
}

@Composable
fun StatsCard(title: String, value: String, modifier: Modifier = Modifier) {
    Surface(shape = RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surface, shadowElevation = 2.dp, modifier = modifier) {
        Column(Modifier.padding(16.dp)) {
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(title, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
        }
    }
}

@Composable
fun MiniBarChart(values: List<Int>, modifier: Modifier = Modifier) {
    val color = MaterialTheme.colorScheme.onSurface
    val track = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
    Canvas(modifier = modifier.height(120.dp).fillMaxWidth()) {
        val max = values.maxOrNull()?.coerceAtLeast(1) ?: 1
        val width = size.width / values.size
        values.forEachIndexed { i, v ->
            val barHeight = (v / max.toFloat()) * size.height
            drawRoundRect(track, topLeft = Offset(i * width + width * 0.2f, 0f), size = Size(width * 0.6f, size.height), cornerRadius = androidx.compose.ui.geometry.CornerRadius(18f,18f))
            drawRoundRect(color, topLeft = Offset(i * width + width * 0.2f, size.height - barHeight), size = Size(width * 0.6f, barHeight), cornerRadius = androidx.compose.ui.geometry.CornerRadius(18f,18f))
        }
    }
}

@Composable
fun EmptyStateView(title: String, body: String) {
    Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Filled.MovieFilter, null, modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.35f))
        Spacer(Modifier.height(10.dp))
        Text(title, fontWeight = FontWeight.Bold)
        Text(body, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
    }
}

@Composable
fun PressScaleCard(modifier: Modifier = Modifier, onClick: () -> Unit, content: @Composable BoxScope.() -> Unit) {
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(if (pressed) 0.97f else 1f, label = "press")
    Box(modifier.scale(scale).clickable { pressed = true; onClick(); pressed = false }.then(modifier), content = content)
}
