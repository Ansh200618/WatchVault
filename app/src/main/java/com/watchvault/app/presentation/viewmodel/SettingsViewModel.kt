package com.watchvault.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.watchvault.app.data.repository.BackupRepository
import com.watchvault.app.data.repository.RoomLocalTrackingRepository
import com.watchvault.app.domain.model.SpoilerSettings
import com.watchvault.app.domain.repository.LocalTrackingRepository
import com.watchvault.app.domain.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val repository: SettingsRepository,
    private val localTrackingRepository: LocalTrackingRepository,
    private val roomRepository: RoomLocalTrackingRepository,
    private val backupRepository: BackupRepository
) : ViewModel() {
    val settings: StateFlow<SpoilerSettings> = repository.spoilerSettings.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SpoilerSettings())
    private val _actionMessage = MutableStateFlow<String?>(null)
    val actionMessage: StateFlow<String?> = _actionMessage
    private val _exportedFile = MutableStateFlow<File?>(null)
    val exportedFile: StateFlow<File?> = _exportedFile
    fun hideEpisodeDescriptions(value: Boolean) = viewModelScope.launch { repository.setHideEpisodeDescriptions(value) }
    fun hideUpcomingDetails(value: Boolean) = viewModelScope.launch { repository.setHideUpcomingEpisodeDetails(value) }
    fun blurCastPlot(value: Boolean) = viewModelScope.launch { repository.setBlurCastPlotDetails(value) }
    fun hideRatings(value: Boolean) = viewModelScope.launch { repository.setHideRatingsUntilWatched(value) }

    fun exportBackup() = viewModelScope.launch {
        val json = localTrackingRepository.createBackupJson().first()
        _exportedFile.value = backupRepository.writeBackupFile(json)
        _actionMessage.value = "Backup exported to cache/backups."
    }

    fun importBackupFromText(json: String) = viewModelScope.launch {
        val ok = localTrackingRepository.restoreFromJson(json)
        _actionMessage.value = if (ok) "Backup imported." else "Import failed."
    }

    fun clearLocalData() = viewModelScope.launch {
        roomRepository.clearLocalData()
        _actionMessage.value = "Local data cleared."
    }

    fun clearMessage() {
        _actionMessage.value = null
    }
}
