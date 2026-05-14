package com.watchvault.app.domain.repository

import com.watchvault.app.domain.model.SpoilerSettings
import kotlinx.coroutines.flow.Flow

interface SettingsRepository {
    val spoilerSettings: Flow<SpoilerSettings>
    suspend fun setHideEpisodeDescriptions(value: Boolean)
    suspend fun setHideUpcomingEpisodeDetails(value: Boolean)
    suspend fun setBlurCastPlotDetails(value: Boolean)
    suspend fun setHideRatingsUntilWatched(value: Boolean)
}
