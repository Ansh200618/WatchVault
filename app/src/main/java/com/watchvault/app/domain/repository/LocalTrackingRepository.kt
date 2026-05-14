package com.watchvault.app.domain.repository

import com.watchvault.app.domain.model.*
import kotlinx.coroutines.flow.Flow

interface LocalTrackingRepository {
    fun getAllMedia(): Flow<List<MediaItem>>
    fun getFeatured(): Flow<List<MediaItem>>
    fun getContinueWatching(): Flow<List<MediaItem>>
    fun getTrending(): Flow<List<MediaItem>>
    fun getUpcoming(): Flow<List<MediaItem>>
    fun getMediaById(id: Long): Flow<MediaItem?>
    fun getSeasons(mediaId: Long): Flow<List<Season>>
    fun getEpisodes(mediaId: Long): Flow<List<Episode>>
    fun getUserStatus(mediaId: Long): Flow<UserMediaStatus?>
    fun getStatuses(): Flow<List<UserMediaStatus>>
    fun getProviders(mediaId: Long): Flow<List<WatchProvider>>
    fun getReminders(): Flow<List<Reminder>>
    fun getWatchEvents(): Flow<List<WatchEvent>>
    fun getWatchBrainInsights(): Flow<List<WatchBrainInsight>>
    fun getGoals(): Flow<List<WatchGoal>>
    fun getCollections(): Flow<List<WatchCollection>>
    fun getStatsSummary(): Flow<StatsSummary>
    fun getRecommendationsForMood(mood: String): Flow<List<MediaItem>>
    fun createBackupJson(): Flow<String>

    suspend fun markMovieWatched(mediaId: Long)
    suspend fun toggleFavorite(mediaId: Long)
    suspend fun setPriority(mediaId: Long, priority: Priority)
    suspend fun addToLibrary(mediaId: Long, status: UserWatchStatus = UserWatchStatus.PLAN_TO_WATCH)
    suspend fun markEpisodeWatched(mediaId: Long, seasonNumber: Int, episodeNumber: Int, markPrevious: Boolean)
    suspend fun unmarkEpisode(mediaId: Long, seasonNumber: Int, episodeNumber: Int)
    suspend fun markSeasonWatched(mediaId: Long, seasonNumber: Int)
    suspend fun unmarkSeason(mediaId: Long, seasonNumber: Int)
    suspend fun markShowWatched(mediaId: Long)
    suspend fun resetShowProgress(mediaId: Long)
    suspend fun createReminder(reminder: Reminder)
    suspend fun deleteReminder(id: Long)
    suspend fun createGoal(goal: WatchGoal)
    suspend fun updateGoal(goal: WatchGoal)
    suspend fun createCollection(collection: WatchCollection)
    suspend fun updateCollection(collection: WatchCollection)
    suspend fun deleteCollection(collectionId: Long)
    suspend fun restoreFromJson(json: String): Boolean
}
