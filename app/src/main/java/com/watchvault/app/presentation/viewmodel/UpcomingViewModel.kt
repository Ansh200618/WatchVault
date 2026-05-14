package com.watchvault.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.watchvault.app.domain.model.MediaItem
import com.watchvault.app.domain.model.Reminder
import com.watchvault.app.domain.model.ReminderType
import com.watchvault.app.domain.repository.LocalTrackingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import javax.inject.Inject

@HiltViewModel
class UpcomingViewModel @Inject constructor(
    private val repository: LocalTrackingRepository
) : ViewModel() {
    val upcoming: StateFlow<List<MediaItem>> = repository.getUpcoming().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun createReminder(item: MediaItem) = viewModelScope.launch {
        repository.createReminder(
            Reminder(
                id = System.currentTimeMillis(),
                mediaId = item.id,
                mediaTitle = item.title,
                mediaType = item.type,
                posterUrl = item.posterUrl,
                releaseDate = item.releaseDate,
                reminderDateTime = item.releaseDate + "T09:00:00",
                reminderType = ReminderType.RELEASE_DAY,
                createdAt = LocalDateTime.now().toString()
            )
        )
    }
}
