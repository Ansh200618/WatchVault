package com.watchvault.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.watchvault.app.domain.model.*
import com.watchvault.app.domain.repository.LocalTrackingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LibraryItem(val media: MediaItem, val status: UserMediaStatus?)

@HiltViewModel
class LibraryViewModel @Inject constructor(private val repository: LocalTrackingRepository) : ViewModel() {
    val libraryItems: StateFlow<List<LibraryItem>> = combine(repository.getAllMedia(), repository.getStatuses()) { media, statuses ->
        media.map { item -> LibraryItem(item, statuses.firstOrNull { it.mediaId == item.id }) }
            .sortedByDescending { it.status?.priorityScore ?: 0 }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val collections: StateFlow<List<WatchCollection>> = repository.getCollections().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    fun setPriority(mediaId: Long, priority: Priority) = viewModelScope.launch { repository.setPriority(mediaId, priority) }
    fun createCollection(name: String, description: String) = viewModelScope.launch {
        repository.createCollection(WatchCollection(System.currentTimeMillis(), name, description, "", emptyList(), java.time.LocalDate.now().toString(), java.time.LocalDate.now().toString()))
    }
}
