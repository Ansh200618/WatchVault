package com.watchvault.app.presentation.screens.splash

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.watchvault.app.R
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(onNavigate: () -> Unit) {
    val scale by animateFloatAsState(1f, label = "splashScale")
    LaunchedEffect(Unit) { delay(900); onNavigate() }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Surface(
            shape = RoundedCornerShape(32.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.scale(scale),
            shadowElevation = 10.dp
        ) {
            Column(Modifier.padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Image(painter = painterResource(id = R.drawable.ic_watchvault_logo), contentDescription = "WatchVault Logo", modifier = Modifier.size(80.dp))
                Spacer(Modifier.height(10.dp))
                Text(
                    "WatchVault",
                    color = MaterialTheme.colorScheme.onSurface,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
