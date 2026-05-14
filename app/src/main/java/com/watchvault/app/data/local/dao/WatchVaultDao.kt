package com.watchvault.app.data.local.dao

import androidx.room.*
import com.watchvault.app.data.local.entity.*
import com.watchvault.app.domain.model.UserWatchStatus
import kotlinx.coroutines.flow.Flow

@Dao
abstract class WatchVaultDao {
    @Query("SELECT * FROM media") abstract fun observeMedia(): Flow<List<MediaEntity>>
    @Query("SELECT * FROM media WHERE id = :id") abstract fun observeMediaById(id: Long): Flow<MediaEntity?>
    @Query("SELECT * FROM seasons WHERE mediaId = :mediaId ORDER BY seasonNumber") abstract fun observeSeasons(mediaId: Long): Flow<List<SeasonEntity>>
    @Query("SELECT * FROM episodes WHERE mediaId = :mediaId ORDER BY seasonNumber, episodeNumber") abstract fun observeEpisodes(mediaId: Long): Flow<List<EpisodeEntity>>
    @Query("SELECT * FROM user_media_status") abstract fun observeStatuses(): Flow<List<UserMediaStatusEntity>>
    @Query("SELECT * FROM user_media_status WHERE mediaId = :mediaId") abstract fun observeStatus(mediaId: Long): Flow<UserMediaStatusEntity?>
    @Query("SELECT * FROM reminders") abstract fun observeReminders(): Flow<List<ReminderEntity>>
    @Query("SELECT * FROM watch_events") abstract fun observeEvents(): Flow<List<WatchEventEntity>>
    @Query("SELECT * FROM collections") abstract fun observeCollections(): Flow<List<CollectionEntity>>
    @Query("SELECT * FROM watch_goals") abstract fun observeGoals(): Flow<List<WatchGoalEntity>>
    @Query("SELECT * FROM providers WHERE mediaId = :mediaId") abstract fun observeProviders(mediaId: Long): Flow<List<WatchProviderEntity>>

    @Upsert abstract suspend fun upsertMedia(items: List<MediaEntity>)
    @Upsert abstract suspend fun upsertSeasons(items: List<SeasonEntity>)
    @Upsert abstract suspend fun upsertEpisodes(items: List<EpisodeEntity>)
    @Upsert abstract suspend fun upsertEpisode(item: EpisodeEntity)
    @Upsert abstract suspend fun upsertStatus(item: UserMediaStatusEntity)
    @Upsert abstract suspend fun upsertReminder(item: ReminderEntity)
    @Upsert abstract suspend fun upsertEvent(item: WatchEventEntity)
    @Upsert abstract suspend fun upsertCollection(item: CollectionEntity)
    @Upsert abstract suspend fun upsertGoal(item: WatchGoalEntity)
    @Delete abstract suspend fun deleteCollection(item: CollectionEntity)
    @Query("DELETE FROM reminders WHERE id = :id") abstract suspend fun deleteReminder(id: Long)
    @Query("SELECT * FROM episodes WHERE mediaId = :mediaId ORDER BY seasonNumber, episodeNumber") abstract suspend fun getEpisodesNow(mediaId: Long): List<EpisodeEntity>
    @Query("SELECT * FROM user_media_status WHERE mediaId = :mediaId") abstract suspend fun getStatusNow(mediaId: Long): UserMediaStatusEntity?

    @Transaction
    open suspend fun markEpisodeWatchedTransaction(
        mediaId: Long,
        seasonNumber: Int,
        episodeNumber: Int,
        markPrevious: Boolean,
        watchedAt: String
    ) {
        val updated = getEpisodesNow(mediaId).map { episode ->
            val shouldUpdate = if (markPrevious) {
                episode.seasonNumber < seasonNumber || (episode.seasonNumber == seasonNumber && episode.episodeNumber <= episodeNumber)
            } else episode.seasonNumber == seasonNumber && episode.episodeNumber == episodeNumber
            if (shouldUpdate) episode.copy(isWatched = true, watchedAt = watchedAt) else episode
        }
        upsertEpisodes(updated)
        val watched = updated.count { it.isWatched }
        val total = updated.size.coerceAtLeast(1)
        val last = updated.filter { it.isWatched }.maxWithOrNull(compareBy<EpisodeEntity> { it.seasonNumber }.thenBy { it.episodeNumber })
        val status = when {
            watched == 0 -> UserWatchStatus.PLAN_TO_WATCH
            watched == total -> UserWatchStatus.COMPLETED
            else -> UserWatchStatus.WATCHING
        }
        val current = getStatusNow(mediaId)
        upsertStatus(
            UserMediaStatusEntity(
                mediaId = mediaId,
                status = status,
                isFavorite = current?.isFavorite ?: false,
                priority = current?.priority ?: com.watchvault.app.domain.model.Priority.MEDIUM,
                personalRating = current?.personalRating,
                lastWatchedSeason = last?.seasonNumber,
                lastWatchedEpisode = last?.episodeNumber,
                progressPercentage = (watched * 100) / total,
                priorityScore = current?.priorityScore ?: 50,
                updatedAt = watchedAt
            )
        )
    }
}
