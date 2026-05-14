package com.watchvault.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.watchvault.app.domain.model.MediaItem

@Composable
fun FeaturedMediaCard(item: MediaItem, modifier: Modifier = Modifier, onClick: (MediaItem) -> Unit) {
    Card(modifier = modifier.fillMaxWidth().height(250.dp).clip(RoundedCornerShape(30.dp)).clickable { onClick(item) }, shape = RoundedCornerShape(30.dp), elevation = CardDefaults.cardElevation(4.dp)) {
        Box {
            AsyncImage(item.bannerUrl, contentDescription = item.title, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
            Box(Modifier.matchParentSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xE5000000)))))
            Column(Modifier.align(Alignment.BottomStart).padding(18.dp)) {
                StatusChip(item.status.name.lowercase().replaceFirstChar { it.uppercase() })
                Spacer(Modifier.height(8.dp))
                Text(item.title, color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                val rating = item.ratingTmdb?.toString() ?: "N/A"
                Text("★ $rating · ${item.releaseDate.take(4)} · ${item.type}", color = Color.White.copy(alpha = 0.82f), style = MaterialTheme.typography.bodyMedium)
            }
            Surface(Modifier.align(Alignment.BottomEnd).padding(18.dp), shape = RoundedCornerShape(50), color = Color.White) {
                Icon(Icons.Filled.ArrowForward, null, modifier = Modifier.padding(14.dp), tint = Color.Black)
            }
        }
    }
}
