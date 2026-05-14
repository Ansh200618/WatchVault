package com.watchvault.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.watchvault.app.domain.model.*
import com.watchvault.app.domain.repository.LocalTrackingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(private val repository: LocalTrackingRepository) : ViewModel() {
    val stats: StateFlow<StatsSummary> = repository.getStatsSummary().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), StatsSummary())
    val goals: StateFlow<List<WatchGoal>> = repository.getGoals().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val brain: StateFlow<List<WatchBrainInsight>> = repository.getWatchBrainInsights().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val backupJson: StateFlow<String> = repository.createBackupJson().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "{}")
    fun addGoal(title: String, type: GoalType, target: Int) = viewModelScope.launch {
        val today = java.time.LocalDate.now()
        repository.createGoal(WatchGoal(System.currentTimeMillis(), title, type, target, 0, today.toString(), today.plusMonths(1).toString()))
    }
}
