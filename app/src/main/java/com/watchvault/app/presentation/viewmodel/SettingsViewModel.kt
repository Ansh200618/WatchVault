package com.watchvault.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.watchvault.app.domain.model.SpoilerSettings
import com.watchvault.app.domain.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(private val repository: SettingsRepository) : ViewModel() {
    val settings: StateFlow<SpoilerSettings> = repository.spoilerSettings.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SpoilerSettings())
    fun hideEpisodeDescriptions(value: Boolean) = viewModelScope.launch { repository.setHideEpisodeDescriptions(value) }
    fun hideUpcomingDetails(value: Boolean) = viewModelScope.launch { repository.setHideUpcomingEpisodeDetails(value) }
    fun blurCastPlot(value: Boolean) = viewModelScope.launch { repository.setBlurCastPlotDetails(value) }
    fun hideRatings(value: Boolean) = viewModelScope.launch { repository.setHideRatingsUntilWatched(value) }
}
