package com.watchvault.app.presentation.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.watchvault.app.BuildConfig
import com.watchvault.app.presentation.components.FloatingBackButton
import com.watchvault.app.presentation.viewmodel.SettingsViewModel

@Composable
fun SettingsScreen(navController: NavHostController, viewModel: SettingsViewModel = hiltViewModel()) {
    val settings by viewModel.settings.collectAsStateWithLifecycle()
    val message by viewModel.actionMessage.collectAsStateWithLifecycle()
    var importText by remember { mutableStateOf("") }
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
        Spacer(Modifier.height(18.dp))
        Text("API key setup", fontWeight = FontWeight.Bold)
        Text("Add TMDB_API_KEY and OMDB_API_KEY in local.properties. Current TMDB key configured: ${BuildConfig.TMDB_API_KEY.isNotBlank()}.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f))
        Spacer(Modifier.height(18.dp))
        Text("Backup", fontWeight = FontWeight.Bold)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { viewModel.exportBackup() }, shape = MaterialTheme.shapes.large) { Text("Export JSON") }
            OutlinedButton(onClick = { viewModel.clearLocalData() }, shape = MaterialTheme.shapes.large) { Text("Clear local data") }
        }
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            value = importText,
            onValueChange = { importText = it },
            label = { Text("Paste backup JSON") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))
        Button(onClick = { viewModel.importBackupFromText(importText) }, shape = MaterialTheme.shapes.large) { Text("Import JSON") }
        if (!message.isNullOrBlank()) {
            Spacer(Modifier.height(8.dp))
            Text(message.orEmpty(), color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun SettingSwitch(title: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), horizontalArrangement = Arrangement.SpaceBetween) { Text(title, Modifier.weight(1f)); Switch(checked = checked, onCheckedChange = onChange) }
}
