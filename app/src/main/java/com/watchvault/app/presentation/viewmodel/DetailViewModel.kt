package com.watchvault.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.watchvault.app.domain.model.*
import com.watchvault.app.domain.repository.LocalTrackingRepository
import com.watchvault.app.domain.repository.SettingsRepository
import com.watchvault.app.notification.ReminderScheduler
import java.time.LocalDate
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DetailViewModel @Inject constructor(
    private val repository: LocalTrackingRepository,
    settingsRepository: SettingsRepository,
    private val scheduler: ReminderScheduler
) : ViewModel() {
    val spoilerSettings: StateFlow<SpoilerSettings> = settingsRepository.spoilerSettings.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SpoilerSettings())
    fun getMedia(id: Long): StateFlow<MediaItem?> = repository.getMediaById(id).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)
    fun getStatus(id: Long): StateFlow<UserMediaStatus?> = repository.getUserStatus(id).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)
    fun getProviders(id: Long): StateFlow<List<WatchProvider>> = repository.getProviders(id).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    fun addToLibrary(id: Long) = viewModelScope.launch { repository.addToLibrary(id) }
    fun markWatched(id: Long) = viewModelScope.launch { repository.markMovieWatched(id) }
    fun markUnwatched(id: Long) = viewModelScope.launch { repository.addToLibrary(id, UserWatchStatus.PLAN_TO_WATCH) }
    fun toggleFavorite(id: Long) = viewModelScope.launch { repository.toggleFavorite(id) }
    fun setPriority(id: Long, priority: Priority) = viewModelScope.launch { repository.setPriority(id, priority) }

    fun createReminder(media: MediaItem, type: ReminderType) = viewModelScope.launch {
        val release = runCatching { LocalDate.parse(media.releaseDate) }.getOrDefault(LocalDate.now().plusDays(1))
        val reminderDate = when (type) {
            ReminderType.RELEASE_DAY -> release
            ReminderType.ONE_DAY_BEFORE -> release.minusDays(1)
            ReminderType.THREE_DAYS_BEFORE -> release.minusDays(3)
            ReminderType.ONE_WEEK_BEFORE -> release.minusWeeks(1)
            ReminderType.CUSTOM -> release.minusDays(1)
        }
        val reminder = Reminder(
            id = System.currentTimeMillis(),
            mediaId = media.id,
            mediaTitle = media.title,
            mediaType = media.type,
            posterUrl = media.posterUrl,
            releaseDate = media.releaseDate,
            reminderDateTime = reminderDate.toString() + "T09:00:00",
            reminderType = type,
            createdAt = java.time.LocalDateTime.now().toString()
        )
        repository.createReminder(reminder)
        scheduler.schedule(reminder)
    }
}
