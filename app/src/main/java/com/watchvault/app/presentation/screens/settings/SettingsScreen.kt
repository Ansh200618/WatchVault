package com.watchvault.app.presentation.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.watchvault.app.presentation.components.FloatingBackButton
import com.watchvault.app.presentation.viewmodel.SettingsViewModel

@Composable
fun SettingsScreen(navController: NavHostController, viewModel: SettingsViewModel = hiltViewModel()) {
    val settings by viewModel.settings.collectAsState()
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row { FloatingBackButton { navController.popBackStack() }; Spacer(Modifier.width(12.dp)); Text("Settings", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        Spacer(Modifier.height(18.dp))
        Text("Spoiler protection", fontWeight = FontWeight.Bold)
        SettingSwitch("Hide episode descriptions", settings.hideEpisodeDescriptions, viewModel::hideEpisodeDescriptions)
        SettingSwitch("Hide upcoming episode details", settings.hideUpcomingEpisodeDetails, viewModel::hideUpcomingDetails)
        SettingSwitch("Blur cast/plot details", settings.blurCastPlotDetails, viewModel::blurCastPlot)
        SettingSwitch("Hide user ratings until watched", settings.hideRatingsUntilWatched, viewModel::hideRatings)
        Spacer(Modifier.height(18.dp))
        Text("Theme", fontWeight = FontWeight.Bold)
        Text("Premium light theme is default. AMOLED dark is supported by system dark mode in this version.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f))
    }
}

@Composable
private fun SettingSwitch(title: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), horizontalArrangement = Arrangement.SpaceBetween) { Text(title, Modifier.weight(1f)); Switch(checked = checked, onCheckedChange = onChange) }
}
