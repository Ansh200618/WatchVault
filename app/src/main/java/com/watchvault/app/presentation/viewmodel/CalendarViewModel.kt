package com.watchvault.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.watchvault.app.domain.model.WatchEvent
import com.watchvault.app.domain.repository.LocalTrackingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class CalendarViewModel @Inject constructor(repository: LocalTrackingRepository) : ViewModel() {
    val events: StateFlow<List<WatchEvent>> = repository.getWatchEvents().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
}
