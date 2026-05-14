package com.watchvault.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.watchvault.app.domain.model.MediaItem
import com.watchvault.app.domain.model.WatchBrainInsight
import com.watchvault.app.domain.repository.LocalTrackingRepository
import com.watchvault.app.domain.usecase.MoodRecommendationUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    repository: LocalTrackingRepository,
    private val moodRecommendationUseCase: MoodRecommendationUseCase
) : ViewModel() {
    val featured: StateFlow<List<MediaItem>> = repository.getFeatured().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val continueWatching: StateFlow<List<MediaItem>> = repository.getContinueWatching().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val trending: StateFlow<List<MediaItem>> = repository.getTrending().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val upcoming: StateFlow<List<MediaItem>> = repository.getUpcoming().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val watchBrain: StateFlow<List<WatchBrainInsight>> = repository.getWatchBrainInsights().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val selectedMood = MutableStateFlow("Action")
    val moodRecommendations: StateFlow<List<MediaItem>> = selectedMood.flatMapLatest { moodRecommendationUseCase(it) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun selectMood(mood: String) { selectedMood.value = mood }
}
