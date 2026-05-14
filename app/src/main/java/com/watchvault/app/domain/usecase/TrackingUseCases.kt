package com.watchvault.app.domain.usecase

import com.watchvault.app.domain.model.MediaItem
import com.watchvault.app.domain.model.Priority
import com.watchvault.app.domain.model.Reminder
import com.watchvault.app.domain.model.StatsSummary
import com.watchvault.app.domain.model.UserWatchStatus
import com.watchvault.app.domain.repository.LocalTrackingRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import javax.inject.Inject

class SearchMediaUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    operator fun invoke(): Flow<List<MediaItem>> = repository.getAllMedia()
}

class GetMediaDetailsUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    operator fun invoke(mediaId: Long): Flow<MediaItem?> = repository.getMediaById(mediaId)
}

class AddToLibraryUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    suspend operator fun invoke(mediaId: Long, status: UserWatchStatus = UserWatchStatus.PLAN_TO_WATCH) = repository.addToLibrary(mediaId, status)
}

class UpdateMediaStatusUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    suspend operator fun invoke(mediaId: Long, status: UserWatchStatus, priority: Priority? = null) {
        repository.addToLibrary(mediaId, status)
        if (priority != null) repository.setPriority(mediaId, priority)
    }
}

class MarkEpisodeWatchedUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    suspend operator fun invoke(mediaId: Long, season: Int, episode: Int, markPrevious: Boolean) = repository.markEpisodeWatched(mediaId, season, episode, markPrevious)
}

class UnmarkEpisodeWatchedUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    suspend operator fun invoke(mediaId: Long, season: Int, episode: Int) = repository.unmarkEpisode(mediaId, season, episode)
}

class MarkSeasonWatchedUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    suspend operator fun invoke(mediaId: Long, season: Int) = repository.markSeasonWatched(mediaId, season)
}

class UnmarkSeasonWatchedUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    suspend operator fun invoke(mediaId: Long, season: Int) = repository.unmarkSeason(mediaId, season)
}

class MarkShowWatchedUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    suspend operator fun invoke(mediaId: Long) = repository.markShowWatched(mediaId)
}

class ResetProgressUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    suspend operator fun invoke(mediaId: Long) = repository.resetShowProgress(mediaId)
}

class CalculateProgressUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    operator fun invoke(mediaId: Long): Flow<Int> = repository.getUserStatus(mediaId).combine(repository.getEpisodes(mediaId)) { status, episodes ->
        status?.progressPercentage ?: if (episodes.isEmpty()) 0 else (episodes.count { it.isWatched } * 100) / episodes.size
    }
}

class CreateReminderUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    suspend operator fun invoke(reminder: Reminder) = repository.createReminder(reminder)
}

class GetStatsUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    operator fun invoke(): Flow<StatsSummary> = repository.getStatsSummary()
}

class ExportBackupUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    operator fun invoke(): Flow<String> = repository.createBackupJson()
}

class ImportBackupUseCase @Inject constructor(private val repository: LocalTrackingRepository) {
    suspend operator fun invoke(json: String): Boolean = repository.restoreFromJson(json)
}
