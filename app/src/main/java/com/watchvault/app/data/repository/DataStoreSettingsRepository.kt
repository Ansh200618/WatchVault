package com.watchvault.app.data.repository

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import com.watchvault.app.domain.model.SpoilerSettings
import com.watchvault.app.domain.repository.SettingsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.watchVaultDataStore by preferencesDataStore("watchvault_settings")

class DataStoreSettingsRepository(private val context: Context) : SettingsRepository {
    private object Keys {
        val HIDE_EPISODE_DESCRIPTIONS = booleanPreferencesKey("hide_episode_descriptions")
        val HIDE_UPCOMING_DETAILS = booleanPreferencesKey("hide_upcoming_details")
        val BLUR_CAST_PLOT = booleanPreferencesKey("blur_cast_plot")
        val HIDE_RATINGS_UNTIL_WATCHED = booleanPreferencesKey("hide_ratings_until_watched")
    }

    override val spoilerSettings: Flow<SpoilerSettings> = context.watchVaultDataStore.data.map { prefs ->
        SpoilerSettings(
            hideEpisodeDescriptions = prefs[Keys.HIDE_EPISODE_DESCRIPTIONS] ?: false,
            hideUpcomingEpisodeDetails = prefs[Keys.HIDE_UPCOMING_DETAILS] ?: false,
            blurCastPlotDetails = prefs[Keys.BLUR_CAST_PLOT] ?: false,
            hideRatingsUntilWatched = prefs[Keys.HIDE_RATINGS_UNTIL_WATCHED] ?: false
        )
    }

    override suspend fun setHideEpisodeDescriptions(value: Boolean) { context.watchVaultDataStore.edit { it[Keys.HIDE_EPISODE_DESCRIPTIONS] = value } }
    override suspend fun setHideUpcomingEpisodeDetails(value: Boolean) { context.watchVaultDataStore.edit { it[Keys.HIDE_UPCOMING_DETAILS] = value } }
    override suspend fun setBlurCastPlotDetails(value: Boolean) { context.watchVaultDataStore.edit { it[Keys.BLUR_CAST_PLOT] = value } }
    override suspend fun setHideRatingsUntilWatched(value: Boolean) { context.watchVaultDataStore.edit { it[Keys.HIDE_RATINGS_UNTIL_WATCHED] = value } }
}
