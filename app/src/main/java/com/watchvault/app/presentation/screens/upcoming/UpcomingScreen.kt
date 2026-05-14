package com.watchvault.app.presentation.screens.upcoming

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.watchvault.app.presentation.components.EmptyStateView
import com.watchvault.app.presentation.navigation.Screen
import com.watchvault.app.presentation.viewmodel.UpcomingViewModel
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Composable
fun UpcomingScreen(navController: NavHostController, viewModel: UpcomingViewModel = hiltViewModel()) {
    val upcoming by viewModel.upcoming.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Upcoming", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        if (upcoming.isEmpty()) {
            EmptyStateView("No upcoming releases", "Add API key to enable live data or keep using offline saved data.")
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(upcoming) { item ->
                    Surface(
                        shape = MaterialTheme.shapes.large,
                        color = MaterialTheme.colorScheme.surface,
                        shadowElevation = 2.dp,
                        modifier = Modifier.fillMaxWidth().clickable { navController.navigate(Screen.Detail.createRoute(item.id, item.type)) }
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Text(item.title, fontWeight = FontWeight.Bold)
                            Text(item.releaseDate, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f))
                            Text(countdownLabel(item.releaseDate), style = MaterialTheme.typography.bodySmall)
                            Spacer(Modifier.height(8.dp))
                            Button(onClick = { viewModel.createReminder(item) }, shape = MaterialTheme.shapes.large) {
                                Text("Reminder")
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun countdownLabel(releaseDate: String): String {
    val release = runCatching { LocalDate.parse(releaseDate) }.getOrNull() ?: return "Date unavailable"
    val days = ChronoUnit.DAYS.between(LocalDate.now(), release)
    return when {
        days == 0L -> "Released today"
        days == 1L -> "Releasing tomorrow"
        days > 1L -> "Coming in $days days"
        else -> "Released ${-days} days ago"
    }
}
