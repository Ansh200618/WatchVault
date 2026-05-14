package com.watchvault.app.data.repository

import com.watchvault.app.domain.model.StatsSummary
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class StatsRepository @Inject constructor(
    private val localRepository: RoomLocalTrackingRepository
) {
    fun getStats(): Flow<StatsSummary> = localRepository.getStatsSummary()
}
