package com.watchvault.app.data.repository

import android.content.Context
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.watchvault.app.BuildConfig
import com.watchvault.app.data.local.dao.WatchVaultDao
import com.watchvault.app.data.local.entity.*
import com.watchvault.app.data.remote.anime.JikanAnimeDto
import com.watchvault.app.data.remote.omdb.OmdbResponse
import com.watchvault.app.data.remote.tmdb.TmdbMediaDto
import com.watchvault.app.domain.model.*
import com.watchvault.app.domain.repository.LocalTrackingRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalDateTime
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.roundToInt

@Singleton
class RoomLocalTrackingRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val dao: WatchVaultDao,
    private val tmdbRepository: TmdbRepository,
    private val omdbRepository: OmdbRepository,
    private val animeRepository: AnimeRepository,
    private val gson: Gson
) : LocalTrackingRepository {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    init {
        scope.launch {
            bootstrapIfNeeded()
            refreshRemoteData()
        }
    }

    override fun getAllMedia(): Flow<List<MediaItem>> = dao.observeMedia().map { list ->
        list.map { it.toDomain() }.sortedByDescending { it.popularity }
    }

    override fun getFeatured(): Flow<List<MediaItem>> = getAllMedia().map { list -> list.sortedByDescending { it.popularity }.take(1) }

    override fun getContinueWatching(): Flow<List<MediaItem>> = combine(getAllMedia(), getStatuses()) { media, statuses ->
        val ids = statuses.filter { it.status == UserWatchStatus.WATCHING }.map { it.mediaId }.toSet()
        media.filter { it.id in ids }.take(10)
    }

    override fun getTrending(): Flow<List<MediaItem>> = getAllMedia().map { it.sortedByDescending { item -> item.popularity }.take(20) }

    override fun getUpcoming(): Flow<List<MediaItem>> = getAllMedia().map { list ->
        val today = LocalDate.now()
        list.filter {
            it.status == MediaStatus.UPCOMING || runCatching { LocalDate.parse(it.releaseDate).isAfter(today.minusDays(1)) }.getOrDefault(false)
        }.sortedBy { it.releaseDate }
    }

    override fun getMediaById(id: Long): Flow<MediaItem?> = dao.observeMediaById(id).map { it?.toDomain() }

    override fun getSeasons(mediaId: Long): Flow<List<Season>> = combine(dao.observeSeasons(mediaId), dao.observeEpisodes(mediaId)) { seasons, episodes ->
        seasons.map { season ->
            val seasonEpisodes = episodes.filter { it.seasonNumber == season.seasonNumber }
            season.toDomain(isCompleted = seasonEpisodes.isNotEmpty() && seasonEpisodes.all { it.isWatched })
        }
    }

    override fun getEpisodes(mediaId: Long): Flow<List<Episode>> = dao.observeEpisodes(mediaId).map { it.map(EpisodeEntity::toDomain) }

    override fun getUserStatus(mediaId: Long): Flow<UserMediaStatus?> = dao.observeStatus(mediaId).map { it?.toDomain() }

    override fun getStatuses(): Flow<List<UserMediaStatus>> = dao.observeStatuses().map { it.map(UserMediaStatusEntity::toDomain) }

    override fun getProviders(mediaId: Long): Flow<List<WatchProvider>> = dao.observeProviders(mediaId).map { it.map(WatchProviderEntity::toDomain) }

    override fun getReminders(): Flow<List<Reminder>> = dao.observeReminders().map { it.map(ReminderEntity::toDomain) }

    override fun getWatchEvents(): Flow<List<WatchEvent>> = combine(
        dao.observeMedia(), dao.observeAllEpisodes(), dao.observeReminders(), dao.observeStatuses()
    ) { media, episodes, reminders, statuses ->
        val releaseEvents = media.map {
            WatchEvent(it.id * 10, it.id, WatchEventType.RELEASE_DATE, it.releaseDate, it.title, "Release date")
        }
        val episodeEvents = episodes.filter { it.airDate.isNotBlank() }.map {
            WatchEvent(10000 + it.id, it.mediaId, WatchEventType.EPISODE_DATE, it.airDate, it.title, "S${it.seasonNumber} E${it.episodeNumber}")
        }
        val reminderEvents = reminders.map {
            WatchEvent(20000 + it.id, it.mediaId, WatchEventType.REMINDER, it.reminderDateTime.take(10), it.mediaTitle, "Reminder")
        }
        val completedEvents = statuses.filter { it.status == UserWatchStatus.COMPLETED }.map {
            WatchEvent(30000 + it.mediaId, it.mediaId, WatchEventType.WATCH_COMPLETED, it.updatedAt.take(10), "Completed", "You completed this title")
        }
        (releaseEvents + episodeEvents + reminderEvents + completedEvents).sortedBy { it.eventDate }
    }

    override fun getWatchBrainInsights(): Flow<List<WatchBrainInsight>> = combine(getUpcoming(), getStatuses(), dao.observeEpisodes()) { upcoming, statuses, episodes ->
        val pendingEpisodes = episodes.count { !it.isWatched && it.airDate <= LocalDate.now().toString() }
        val tomorrow = LocalDate.now().plusDays(1).toString()
        val tomorrowTitle = upcoming.firstOrNull { it.releaseDate == tomorrow }?.title
        val highPriority = statuses.count { it.priority == Priority.HIGH && it.status != UserWatchStatus.COMPLETED }
        listOf(
            WatchBrainInsight(1, "Pending episodes", "You have $pendingEpisodes pending episodes.", "Open tracker", Priority.HIGH),
            WatchBrainInsight(2, "Tomorrow release", tomorrowTitle?.let { "$it releases tomorrow." } ?: "No major release tomorrow.", "Open upcoming", Priority.MEDIUM),
            WatchBrainInsight(3, "Priority queue", "$highPriority high-priority titles are still pending.", "Review", Priority.MEDIUM)
        )
    }

    override fun getGoals(): Flow<List<WatchGoal>> = dao.observeGoals().map { it.map(WatchGoalEntity::toDomain) }

    override fun getCollections(): Flow<List<WatchCollection>> = dao.observeCollections().map { it.map(CollectionEntity::toDomain) }

    override fun getStatsSummary(): Flow<StatsSummary> = combine(getAllMedia(), getStatuses(), dao.observeAllEpisodes()) { media, statuses, episodes ->
        val completedIds = statuses.filter { it.status == UserWatchStatus.COMPLETED }.map { it.mediaId }.toSet()
        val completed = media.filter { it.id in completedIds }
        val watchedEpisodes = episodes.filter { it.isWatched }
        val genre = completed.flatMap { it.genres }.groupingBy { it }.eachCount().maxByOrNull { it.value }?.key ?: "N/A"
        val lang = completed.groupingBy { it.originalLanguageName }.eachCount().maxByOrNull { it.value }?.key ?: "N/A"
        val completionRate = if (statuses.isEmpty()) 0 else ((statuses.count { it.status == UserWatchStatus.COMPLETED } * 100f) / statuses.size).roundToInt()
        val totalHours = ((completed.sumOf { it.runtime } + watchedEpisodes.sumOf { it.runtime }) / 60)
        StatsSummary(
            totalMoviesWatched = completed.count { it.type == MediaType.MOVIE },
            totalSeriesWatched = completed.count { it.type == MediaType.SERIES },
            totalAnimeCompleted = completed.count { it.type == MediaType.ANIME },
            totalEpisodesWatched = watchedEpisodes.size,
            totalWatchHours = totalHours,
            mostWatchedGenre = genre,
            mostWatchedLanguage = lang,
            completionRate = completionRate,
            pendingCount = statuses.count { it.status != UserWatchStatus.COMPLETED },
            monthlyCounts = (1..12).map { month ->
                watchedEpisodes.count { it.watchedAt?.substring(5, 7)?.toIntOrNull() == month }
            }
        )
    }

    override fun getRecommendationsForMood(mood: String): Flow<List<MediaItem>> = combine(getAllMedia(), getStatuses()) { media, statuses ->
        val activeIds = statuses.filter { it.status != UserWatchStatus.COMPLETED }.map { it.mediaId }.toSet()
        val active = media.filter { it.id in activeIds }
        val result = when (mood) {
            "Action" -> active.filter { "Action" in it.genres }
            "Relaxing" -> active.filter { "Drama" in it.genres || "Family" in it.genres }
            "Emotional" -> active.filter { "Drama" in it.genres || "Romance" in it.genres }
            "Dark" -> active.filter { "Thriller" in it.genres }
            "Comedy" -> active.filter { "Comedy" in it.genres }
            "Short watch" -> active.filter { it.runtime in 1..100 || (it.totalEpisodes ?: 999) <= 12 }
            else -> active
        }
        result.ifEmpty { active }.sortedByDescending { it.ratingTmdb ?: 0.0 }.take(10)
    }

    override fun createBackupJson(): Flow<String> = combine(getStatuses(), getEpisodesFlat(), getReminders(), getCollections(), getGoals()) { statuses, episodes, reminders, collections, goals ->
        gson.toJson(BackupPayload(statuses, episodes, reminders, collections, goals, LocalDateTime.now().toString()))
    }

    override suspend fun markMovieWatched(mediaId: Long) {
        val now = LocalDateTime.now().toString()
        upsertStatus(mediaId) { current -> current.copy(status = UserWatchStatus.COMPLETED, progressPercentage = 100, updatedAt = now) }
    }

    override suspend fun toggleFavorite(mediaId: Long) {
        upsertStatus(mediaId) { current -> current.copy(isFavorite = !current.isFavorite, updatedAt = LocalDateTime.now().toString()) }
    }

    override suspend fun setPriority(mediaId: Long, priority: Priority) {
        upsertStatus(mediaId) { current -> current.copy(priority = priority, priorityScore = priority.toPriorityScore(), updatedAt = LocalDateTime.now().toString()) }
    }

    override suspend fun addToLibrary(mediaId: Long, status: UserWatchStatus) {
        upsertStatus(mediaId) { current -> current.copy(status = status, updatedAt = LocalDateTime.now().toString()) }
    }

    override suspend fun markEpisodeWatched(mediaId: Long, seasonNumber: Int, episodeNumber: Int, markPrevious: Boolean) {
        dao.markEpisodeWatchedTransaction(mediaId, seasonNumber, episodeNumber, markPrevious, LocalDateTime.now().toString())
    }

    override suspend fun unmarkEpisode(mediaId: Long, seasonNumber: Int, episodeNumber: Int) {
        val episodes = dao.getEpisodesNow(mediaId).map {
            if (it.seasonNumber == seasonNumber && it.episodeNumber == episodeNumber) it.copy(isWatched = false, watchedAt = null) else it
        }
        dao.upsertEpisodes(episodes)
        updateProgressStatus(mediaId)
    }

    override suspend fun markSeasonWatched(mediaId: Long, seasonNumber: Int) {
        val now = LocalDateTime.now().toString()
        val episodes = dao.getEpisodesNow(mediaId).map {
            if (it.seasonNumber == seasonNumber) it.copy(isWatched = true, watchedAt = now) else it
        }
        dao.upsertEpisodes(episodes)
        updateProgressStatus(mediaId)
    }

    override suspend fun unmarkSeason(mediaId: Long, seasonNumber: Int) {
        val episodes = dao.getEpisodesNow(mediaId).map {
            if (it.seasonNumber == seasonNumber) it.copy(isWatched = false, watchedAt = null) else it
        }
        dao.upsertEpisodes(episodes)
        updateProgressStatus(mediaId)
    }

    override suspend fun markShowWatched(mediaId: Long) {
        val now = LocalDateTime.now().toString()
        val episodes = dao.getEpisodesNow(mediaId).map { it.copy(isWatched = true, watchedAt = now) }
        dao.upsertEpisodes(episodes)
        updateProgressStatus(mediaId)
    }

    override suspend fun resetShowProgress(mediaId: Long) {
        val episodes = dao.getEpisodesNow(mediaId).map { it.copy(isWatched = false, watchedAt = null) }
        dao.upsertEpisodes(episodes)
        upsertStatus(mediaId) { current ->
            current.copy(
                status = UserWatchStatus.PLAN_TO_WATCH,
                progressPercentage = 0,
                lastWatchedSeason = null,
                lastWatchedEpisode = null,
                updatedAt = LocalDateTime.now().toString()
            )
        }
    }

    override suspend fun createReminder(reminder: Reminder) {
        dao.upsertReminder(reminder.toEntity())
    }

    override suspend fun deleteReminder(id: Long) {
        dao.deleteReminder(id)
    }

    override suspend fun createGoal(goal: WatchGoal) {
        dao.upsertGoal(goal.toEntity())
    }

    override suspend fun updateGoal(goal: WatchGoal) {
        dao.upsertGoal(goal.toEntity())
    }

    override suspend fun createCollection(collection: WatchCollection) {
        dao.upsertCollection(collection.toEntity())
    }

    override suspend fun updateCollection(collection: WatchCollection) {
        dao.upsertCollection(collection.toEntity())
    }

    override suspend fun deleteCollection(collectionId: Long) {
        dao.observeCollections().first().firstOrNull { it.id == collectionId }?.let { dao.deleteCollection(it) }
    }

    override suspend fun restoreFromJson(json: String): Boolean = runCatching {
        val payload = gson.fromJson(json, BackupPayload::class.java)
        dao.upsertStatuses(payload.statuses.map { it.toEntity() })
        dao.upsertEpisodes(payload.episodes.map { it.toEntity() })
        payload.reminders.forEach { dao.upsertReminder(it.toEntity()) }
        payload.collections.forEach { dao.upsertCollection(it.toEntity()) }
        payload.goals.forEach { dao.upsertGoal(it.toEntity()) }
        true
    }.getOrDefault(false)

    suspend fun clearLocalData() {
        dao.clearAll()
    }

    fun apiKeysConfigured(): Boolean = BuildConfig.TMDB_API_KEY.isNotBlank() || BuildConfig.OMDB_API_KEY.isNotBlank()

    private fun getEpisodesFlat(): Flow<List<Episode>> = dao.observeAllEpisodes().map { it.map(EpisodeEntity::toDomain) }

    private suspend fun bootstrapIfNeeded() {
        if (dao.countMedia() > 0) return
        val fallback = readFallbackPayload()
        dao.upsertMedia(fallback.media.map { it.toEntity() })
        dao.upsertSeasons(fallback.seasons.map { it.toEntity() })
        dao.upsertEpisodes(fallback.episodes.map { it.toEntity() })
        dao.upsertProviders(fallback.providers.map { it.toEntity() })
        fallback.media.take(3).forEach {
            dao.upsertStatus(
                UserMediaStatusEntity(
                    mediaId = it.id,
                    status = UserWatchStatus.PLAN_TO_WATCH,
                    isFavorite = false,
                    priority = Priority.MEDIUM,
                    personalRating = null,
                    lastWatchedSeason = null,
                    lastWatchedEpisode = null,
                    progressPercentage = 0,
                    priorityScore = 50,
                    updatedAt = LocalDateTime.now().toString()
                )
            )
        }
    }

    private suspend fun refreshRemoteData() {
        val tmdbKey = BuildConfig.TMDB_API_KEY
        if (tmdbKey.isBlank()) return

        val now = LocalDateTime.now().toString()
        val movieItems = tmdbRepository.getTrendingMovies(tmdbKey).mapNotNull { it.toMediaEntity(MediaType.MOVIE, now) }
        val seriesItems = tmdbRepository.getTrendingSeries(tmdbKey).mapNotNull { it.toMediaEntity(MediaType.SERIES, now) }
        val upcomingItems = tmdbRepository.getUpcomingMovies(tmdbKey).mapNotNull { it.toMediaEntity(MediaType.MOVIE, now, forceUpcoming = true) }
        val animeItems = animeRepository.topAnime().map { it.toMediaEntity(now) }

        val merged = (movieItems + seriesItems + upcomingItems + animeItems).distinctBy { it.id }
        val enriched = merged.map { item ->
            val omdb = runCatching { omdbRepository.getRatings(BuildConfig.OMDB_API_KEY, item.imdbId) }.getOrNull()
            if (omdb != null && item.imdbId.isNotBlank()) {
                item.copy(
                    imdbRating = omdb.imdbRating?.toDoubleOrNull(),
                    rottenTomatoesRating = omdb.rottenTomatoes(),
                    metacriticRating = omdb.metascore
                )
            } else item
        }
        dao.upsertMedia(enriched)
    }

    private suspend fun updateProgressStatus(mediaId: Long) {
        val episodes = dao.getEpisodesNow(mediaId)
        val total = episodes.size.coerceAtLeast(1)
        val watched = episodes.count { it.isWatched }
        val last = episodes.filter { it.isWatched }.maxWithOrNull(compareBy<EpisodeEntity> { it.seasonNumber }.thenBy { it.episodeNumber })
        val newStatus = when {
            watched == 0 -> UserWatchStatus.PLAN_TO_WATCH
            watched == total -> UserWatchStatus.COMPLETED
            else -> UserWatchStatus.WATCHING
        }
        upsertStatus(mediaId) { current ->
            current.copy(
                status = newStatus,
                progressPercentage = (watched * 100) / total,
                lastWatchedSeason = last?.seasonNumber,
                lastWatchedEpisode = last?.episodeNumber,
                updatedAt = LocalDateTime.now().toString()
            )
        }
    }

    private suspend fun upsertStatus(mediaId: Long, transform: (UserMediaStatusEntity) -> UserMediaStatusEntity) {
        val current = dao.getStatusNow(mediaId) ?: UserMediaStatusEntity(
            mediaId = mediaId,
            status = UserWatchStatus.PLAN_TO_WATCH,
            isFavorite = false,
            priority = Priority.MEDIUM,
            personalRating = null,
            lastWatchedSeason = null,
            lastWatchedEpisode = null,
            progressPercentage = 0,
            priorityScore = 50,
            updatedAt = LocalDateTime.now().toString()
        )
        dao.upsertStatus(transform(current))
    }

    private fun readFallbackPayload(): FallbackPayload {
        val json = context.assets.open("fallback_media.json").bufferedReader().use { it.readText() }
        return gson.fromJson(json, FallbackPayload::class.java)
    }
}

private data class FallbackPayload(
    @SerializedName("media") val media: List<FallbackMedia>,
    @SerializedName("seasons") val seasons: List<FallbackSeason>,
    @SerializedName("episodes") val episodes: List<FallbackEpisode>,
    @SerializedName("providers") val providers: List<FallbackProvider>
)

private data class FallbackMedia(
    val id: Long,
    val tmdbId: String = "",
    val imdbId: String = "",
    val anilistId: String = "",
    val title: String,
    val originalTitle: String = "",
    val overview: String,
    val posterUrl: String,
    val bannerUrl: String,
    val trailerUrl: String,
    val type: String,
    val releaseDate: String,
    val nextEpisodeDate: String? = null,
    val status: String,
    val language: String,
    val languageName: String,
    val country: String,
    val tmdbRating: Double? = null,
    val imdbRating: Double? = null,
    val ratingRottenTomatoes: String? = null,
    val ratingMetacritic: String? = null,
    val genres: List<String> = emptyList(),
    val runtime: Int = 0,
    val totalSeasons: Int? = null,
    val totalEpisodes: Int? = null,
    val popularity: Int = 50
)

private data class FallbackSeason(
    val id: Long,
    val mediaId: Long,
    val seasonNumber: Int,
    val title: String,
    val episodeCount: Int
)

private data class FallbackEpisode(
    val id: Long,
    val mediaId: Long,
    val seasonId: Long,
    val seasonNumber: Int,
    val episodeNumber: Int,
    val title: String,
    val overview: String,
    val airDate: String,
    val runtime: Int,
    val thumbnailUrl: String
)

private data class FallbackProvider(
    val id: Long,
    val mediaId: Long,
    val providerName: String,
    val providerLogoUrl: String,
    val providerType: String,
    val region: String,
    val deepLinkUrl: String
)

private fun FallbackMedia.toEntity(): MediaEntity = MediaEntity(
    id = id,
    tmdbId = tmdbId,
    imdbId = imdbId,
    anilistId = anilistId,
    title = title,
    originalTitle = originalTitle.ifBlank { title },
    overview = overview,
    posterUrl = posterUrl,
    bannerUrl = bannerUrl,
    trailerUrl = trailerUrl,
    type = runCatching { MediaType.valueOf(type) }.getOrDefault(MediaType.MOVIE),
    releaseDate = releaseDate,
    nextEpisodeDate = nextEpisodeDate,
    status = runCatching { MediaStatus.valueOf(status) }.getOrDefault(MediaStatus.RELEASED),
    language = language,
    languageName = languageName,
    country = country,
    tmdbRating = tmdbRating,
    imdbRating = imdbRating,
    rottenTomatoesRating = ratingRottenTomatoes,
    metacriticRating = ratingMetacritic,
    genres = genres,
    runtime = runtime,
    totalSeasons = totalSeasons,
    totalEpisodes = totalEpisodes,
    popularity = popularity,
    createdAt = LocalDateTime.now().toString(),
    updatedAt = LocalDateTime.now().toString()
)

private fun FallbackSeason.toEntity(): SeasonEntity = SeasonEntity(id, mediaId, seasonNumber, title, episodeCount, false)
private fun FallbackEpisode.toEntity(): EpisodeEntity = EpisodeEntity(id, mediaId, seasonId, seasonNumber, episodeNumber, title, overview, airDate, runtime, thumbnailUrl, false, null)
private fun FallbackProvider.toEntity(): WatchProviderEntity = WatchProviderEntity(
    id = id,
    mediaId = mediaId,
    providerName = providerName,
    providerLogoUrl = providerLogoUrl,
    providerType = runCatching { ProviderType.valueOf(providerType) }.getOrDefault(ProviderType.STREAM),
    region = region,
    deepLinkUrl = deepLinkUrl
)

private fun MediaEntity.toDomain(): MediaItem = MediaItem(
    id = id,
    tmdbId = tmdbId,
    imdbId = imdbId,
    anilistId = anilistId,
    title = title,
    originalTitle = originalTitle.ifBlank { title },
    overview = overview,
    posterUrl = posterUrl,
    bannerUrl = bannerUrl,
    trailerUrl = trailerUrl,
    type = type,
    releaseDate = releaseDate,
    nextEpisodeDate = nextEpisodeDate,
    status = status,
    originalLanguageCode = language,
    originalLanguageName = languageName.ifBlank { language },
    countryOfOrigin = country,
    ratingTmdb = tmdbRating,
    ratingImdb = imdbRating,
    ratingRottenTomatoes = rottenTomatoesRating,
    ratingMetacritic = metacriticRating,
    genres = genres,
    runtime = runtime,
    totalSeasons = totalSeasons,
    totalEpisodes = totalEpisodes,
    popularity = popularity,
    createdAt = createdAt,
    updatedAt = updatedAt
)

private fun SeasonEntity.toDomain(isCompleted: Boolean = this.isCompleted): Season =
    Season(id, mediaId, seasonNumber, title, episodeCount, isCompleted)

private fun EpisodeEntity.toDomain(): Episode = Episode(
    id = id,
    mediaId = mediaId,
    seasonId = seasonId,
    seasonNumber = seasonNumber,
    episodeNumber = episodeNumber,
    title = title,
    overview = overview,
    airDate = airDate,
    runtime = runtime,
    thumbnailUrl = thumbnailUrl,
    isWatched = isWatched,
    watchedAt = watchedAt
)

private fun UserMediaStatusEntity.toDomain(): UserMediaStatus = UserMediaStatus(
    mediaId = mediaId,
    status = status,
    isFavorite = isFavorite,
    priority = priority,
    personalRating = personalRating,
    lastWatchedSeason = lastWatchedSeason,
    lastWatchedEpisode = lastWatchedEpisode,
    progressPercentage = progressPercentage,
    priorityScore = priorityScore,
    updatedAt = updatedAt
)

private fun WatchProviderEntity.toDomain(): WatchProvider = WatchProvider(
    id = id,
    mediaId = mediaId,
    providerName = providerName,
    providerLogoUrl = providerLogoUrl,
    providerType = providerType,
    region = region,
    deepLinkUrl = deepLinkUrl
)

private fun ReminderEntity.toDomain(): Reminder = Reminder(
    id = id,
    mediaId = mediaId,
    mediaTitle = mediaTitle,
    mediaType = mediaType,
    posterUrl = posterUrl,
    releaseDate = releaseDate,
    reminderDateTime = reminderDateTime,
    reminderType = reminderType,
    isEnabled = isEnabled,
    createdAt = createdAt
)

private fun WatchGoalEntity.toDomain(): WatchGoal = WatchGoal(
    id = id,
    title = title,
    goalType = goalType,
    targetCount = targetCount,
    currentCount = currentCount,
    startDate = startDate,
    endDate = endDate,
    isCompleted = isCompleted
)

private fun CollectionEntity.toDomain(): WatchCollection = WatchCollection(
    id = id,
    name = name,
    description = description,
    coverPosterUrl = coverPosterUrl,
    mediaIds = mediaIds,
    createdAt = createdAt,
    updatedAt = updatedAt
)

private fun UserMediaStatus.toEntity(): UserMediaStatusEntity = UserMediaStatusEntity(
    mediaId = mediaId,
    status = status,
    isFavorite = isFavorite,
    priority = priority,
    personalRating = personalRating,
    lastWatchedSeason = lastWatchedSeason,
    lastWatchedEpisode = lastWatchedEpisode,
    progressPercentage = progressPercentage,
    priorityScore = priorityScore,
    updatedAt = updatedAt
)

private fun Episode.toEntity(): EpisodeEntity = EpisodeEntity(
    id = id,
    mediaId = mediaId,
    seasonId = seasonId,
    seasonNumber = seasonNumber,
    episodeNumber = episodeNumber,
    title = title,
    overview = overview,
    airDate = airDate,
    runtime = runtime,
    thumbnailUrl = thumbnailUrl,
    isWatched = isWatched,
    watchedAt = watchedAt
)

private fun Reminder.toEntity(): ReminderEntity = ReminderEntity(
    id = id,
    mediaId = mediaId,
    mediaTitle = mediaTitle,
    mediaType = mediaType,
    posterUrl = posterUrl,
    releaseDate = releaseDate,
    reminderDateTime = reminderDateTime,
    reminderType = reminderType,
    isEnabled = isEnabled,
    createdAt = createdAt
)

private fun WatchCollection.toEntity(): CollectionEntity = CollectionEntity(
    id = id,
    name = name,
    description = description,
    coverPosterUrl = coverPosterUrl,
    mediaIds = mediaIds,
    createdAt = createdAt,
    updatedAt = updatedAt
)

private fun WatchGoal.toEntity(): WatchGoalEntity = WatchGoalEntity(
    id = id,
    title = title,
    goalType = goalType,
    targetCount = targetCount,
    currentCount = currentCount,
    startDate = startDate,
    endDate = endDate,
    isCompleted = isCompleted
)

private fun Priority.toPriorityScore(): Int = when (this) {
    Priority.HIGH -> 90
    Priority.MEDIUM -> 65
    Priority.LOW -> 40
    Priority.WATCH_LATER -> 20
}

private fun TmdbMediaDto.toMediaEntity(type: MediaType, now: String, forceUpcoming: Boolean = false): MediaEntity? {
    val titleValue = title ?: name ?: return null
    val release = releaseDate ?: firstAirDate ?: LocalDate.now().toString()
    val poster = posterPath?.let { "https://image.tmdb.org/t/p/w500$it" } ?: ""
    val banner = backdropPath?.let { "https://image.tmdb.org/t/p/w780$it" } ?: poster
    val status = if (forceUpcoming || runCatching { LocalDate.parse(release).isAfter(LocalDate.now()) }.getOrDefault(false)) MediaStatus.UPCOMING else MediaStatus.RELEASED
    return MediaEntity(
        id = id,
        tmdbId = id.toString(),
        imdbId = "",
        anilistId = "",
        title = titleValue,
        originalTitle = originalTitle ?: originalName ?: titleValue,
        overview = overview.orEmpty(),
        posterUrl = poster,
        bannerUrl = banner,
        trailerUrl = "https://www.youtube.com/results?search_query=${titleValue.replace(' ', '+')}+official+trailer",
        type = type,
        releaseDate = release,
        nextEpisodeDate = null,
        status = status,
        language = originalLanguage ?: "en",
        languageName = (originalLanguage ?: "en").uppercase(),
        country = "US",
        tmdbRating = voteAverage,
        imdbRating = null,
        rottenTomatoesRating = null,
        metacriticRating = null,
        genres = emptyList(),
        runtime = if (type == MediaType.MOVIE) 120 else 45,
        totalSeasons = if (type == MediaType.MOVIE) null else 1,
        totalEpisodes = if (type == MediaType.MOVIE) null else 10,
        popularity = (popularity ?: 50.0).roundToInt(),
        createdAt = now,
        updatedAt = now
    )
}

private fun JikanAnimeDto.toMediaEntity(now: String): MediaEntity {
    val titleValue = titleEnglish ?: title ?: "Anime"
    val poster = images?.jpg?.largeImageUrl ?: images?.jpg?.imageUrl ?: ""
    val release = aired?.from?.take(10) ?: LocalDate.now().toString()
    val currentStatus = if ((status ?: "").contains("air", true)) MediaStatus.AIRING else MediaStatus.RELEASED
    return MediaEntity(
        id = 1_000_000L + malId,
        tmdbId = "",
        imdbId = "",
        anilistId = malId.toString(),
        title = titleValue,
        originalTitle = title ?: titleValue,
        overview = synopsis.orEmpty(),
        posterUrl = poster,
        bannerUrl = poster,
        trailerUrl = trailer?.url ?: "https://www.youtube.com/results?search_query=${titleValue.replace(' ', '+')}+trailer",
        type = MediaType.ANIME,
        releaseDate = release,
        nextEpisodeDate = null,
        status = currentStatus,
        language = "ja",
        languageName = "Japanese",
        country = "JP",
        tmdbRating = score,
        imdbRating = null,
        rottenTomatoesRating = null,
        metacriticRating = null,
        genres = genres.map { it.name },
        runtime = 24,
        totalSeasons = 1,
        totalEpisodes = episodes,
        popularity = ((score ?: 7.0) * 10).roundToInt(),
        createdAt = now,
        updatedAt = now
    )
}

private fun OmdbResponse.rottenTomatoes(): String? = ratings.firstOrNull { it.source == "Rotten Tomatoes" }?.value

private suspend fun WatchVaultDao.upsertStatuses(statuses: List<UserMediaStatusEntity>) {
    statuses.forEach { upsertStatus(it) }
}
