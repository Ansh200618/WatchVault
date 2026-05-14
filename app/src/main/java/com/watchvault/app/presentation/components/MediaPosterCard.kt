package com.watchvault.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.watchvault.app.domain.model.MediaItem

@Composable
fun MediaPosterCard(item: MediaItem, modifier: Modifier = Modifier, progress: Int? = null, onClick: (MediaItem) -> Unit) {
    Card(modifier = modifier.clip(RoundedCornerShape(20.dp)).clickable { onClick(item) }, shape = RoundedCornerShape(20.dp), elevation = CardDefaults.cardElevation(3.dp)) {
        Box(modifier = Modifier.fillMaxSize()) {
            AsyncImage(item.posterUrl, contentDescription = item.title, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
            Box(Modifier.matchParentSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xDD000000)))))
            Column(Modifier.align(Alignment.BottomStart).padding(12.dp)) {
                Text(item.title, color = Color.White, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                val rating = item.ratingTmdb?.toString() ?: "N/A"
                Text("${item.type} · $rating", color = Color.White.copy(alpha = 0.8f), style = MaterialTheme.typography.bodySmall)
                if (progress != null) {
                    Spacer(Modifier.height(6.dp))
                    LinearProgressIndicator(progress = { progress / 100f }, modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(50)), color = Color.White, trackColor = Color.White.copy(alpha = 0.25f))
                }
            }
        }
    }
}
