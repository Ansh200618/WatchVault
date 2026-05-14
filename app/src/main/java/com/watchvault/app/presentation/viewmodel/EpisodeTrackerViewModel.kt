package com.watchvault.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.watchvault.app.domain.model.Episode
import com.watchvault.app.domain.model.Season
import com.watchvault.app.domain.model.UserMediaStatus
import com.watchvault.app.domain.repository.LocalTrackingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TrackerUiState(
    val seasons: List<Season> = emptyList(),
    val episodes: List<Episode> = emptyList(),
    val status: UserMediaStatus? = null
)

@HiltViewModel
class EpisodeTrackerViewModel @Inject constructor(private val repository: LocalTrackingRepository) : ViewModel() {
    fun state(mediaId: Long): StateFlow<TrackerUiState> = combine(
        repository.getSeasons(mediaId),
        repository.getEpisodes(mediaId),
        repository.getUserStatus(mediaId)
    ) { seasons, episodes, status -> TrackerUiState(seasons, episodes, status) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), TrackerUiState())

    fun markEpisode(mediaId: Long, season: Int, episode: Int, markPrevious: Boolean) = viewModelScope.launch { repository.markEpisodeWatched(mediaId, season, episode, markPrevious) }
    fun unmarkEpisode(mediaId: Long, season: Int, episode: Int) = viewModelScope.launch { repository.unmarkEpisode(mediaId, season, episode) }
    fun markSeason(mediaId: Long, season: Int) = viewModelScope.launch { repository.markSeasonWatched(mediaId, season) }
    fun unmarkSeason(mediaId: Long, season: Int) = viewModelScope.launch { repository.unmarkSeason(mediaId, season) }
    fun markShow(mediaId: Long) = viewModelScope.launch { repository.markShowWatched(mediaId) }
    fun resetShow(mediaId: Long) = viewModelScope.launch { repository.resetShowProgress(mediaId) }
}
