package com.watchvault.app.data.repository

import com.google.gson.Gson
import com.watchvault.app.domain.model.*
import com.watchvault.app.domain.repository.LocalTrackingRepository
import kotlinx.coroutines.flow.*
import java.time.LocalDate
import java.time.LocalDateTime
import kotlin.math.roundToInt

class MockLocalTrackingRepository : LocalTrackingRepository {
    private val gson = Gson()
    private val today: LocalDate = LocalDate.now()

    private val mediaState = MutableStateFlow(mockMedia())
    private val episodesState = MutableStateFlow(mockEpisodes())
    private val seasonsState = MutableStateFlow(mockSeasons())
    private val statusesState = MutableStateFlow(mockStatuses())
    private val remindersState = MutableStateFlow(mockReminders())
    private val collectionsState = MutableStateFlow(mockCollections())
    private val goalsState = MutableStateFlow(mockGoals())
    private val providersState = MutableStateFlow(mockProviders())

    override fun getAllMedia(): Flow<List<MediaItem>> = mediaState
    override fun getFeatured(): Flow<List<MediaItem>> = mediaState.map { listOf(it.first()) }
    override fun getContinueWatching(): Flow<List<MediaItem>> = combine(mediaState, statusesState) { media, statuses ->
        val watchingIds = statuses.filter { it.status == UserWatchStatus.WATCHING }.map { it.mediaId }.toSet()
        media.filter { it.id in watchingIds }.ifEmpty { media.take(4) }
    }
    override fun getTrending(): Flow<List<MediaItem>> = mediaState.map { it.sortedByDescending { item -> item.popularity }.take(10) }
    override fun getUpcoming(): Flow<List<MediaItem>> = mediaState.map { items ->
        items.filter { it.status == MediaStatus.UPCOMING || runCatching { LocalDate.parse(it.releaseDate).isAfter(today.minusDays(1)) }.getOrDefault(false) }
    }
    override fun getMediaById(id: Long): Flow<MediaItem?> = mediaState.map { list -> list.firstOrNull { it.id == id } }
    override fun getSeasons(mediaId: Long): Flow<List<Season>> = combine(seasonsState, episodesState) { seasons, episodes ->
        seasons.filter { it.mediaId == mediaId }.map { season ->
            val seasonEpisodes = episodes.filter { it.mediaId == mediaId && it.seasonNumber == season.seasonNumber }
            season.copy(isCompleted = seasonEpisodes.isNotEmpty() && seasonEpisodes.all { it.isWatched })
        }
    }
    override fun getEpisodes(mediaId: Long): Flow<List<Episode>> = episodesState.map { it.filter { ep -> ep.mediaId == mediaId } }
    override fun getUserStatus(mediaId: Long): Flow<UserMediaStatus?> = statusesState.map { it.firstOrNull { status -> status.mediaId == mediaId } }
    override fun getStatuses(): Flow<List<UserMediaStatus>> = statusesState
    override fun getProviders(mediaId: Long): Flow<List<WatchProvider>> = providersState.map { it.filter { provider -> provider.mediaId == mediaId } }
    override fun getReminders(): Flow<List<Reminder>> = remindersState
    override fun getWatchEvents(): Flow<List<WatchEvent>> = combine(mediaState, episodesState, remindersState, statusesState) { media, episodes, reminders, statuses ->
        val releaseEvents = media.map {
            WatchEvent(it.id * 10, it.id, WatchEventType.RELEASE_DATE, it.releaseDate, it.title, "Release date")
        }
        val episodeEvents = episodes.map {
            WatchEvent(10000 + it.id, it.mediaId, WatchEventType.EPISODE_DATE, it.airDate, "${it.title}", "S${it.seasonNumber} E${it.episodeNumber}")
        }
        val reminderEvents = reminders.map {
            WatchEvent(20000 + it.id, it.mediaId, WatchEventType.REMINDER, it.reminderDateTime.take(10), it.mediaTitle, "Reminder")
        }
        val completedEvents = statuses.filter { it.status == UserWatchStatus.COMPLETED }.map {
            WatchEvent(30000 + it.mediaId, it.mediaId, WatchEventType.WATCH_COMPLETED, it.updatedAt.take(10).ifBlank { today.toString() }, "Completed", "You completed this title")
        }
        releaseEvents + episodeEvents + reminderEvents + completedEvents
    }

    override fun getWatchBrainInsights(): Flow<List<WatchBrainInsight>> = combine(episodesState, mediaState, statusesState) { episodes, media, statuses ->
        val pendingToday = episodes.count { !it.isWatched && it.airDate <= today.toString() }
        val tomorrowRelease = media.firstOrNull { it.releaseDate == today.plusDays(1).toString() }
        val highPriority = statuses.count { it.priority == Priority.HIGH && it.status != UserWatchStatus.COMPLETED }
        listOf(
            WatchBrainInsight(1, "Pending episodes", "You have $pendingToday pending episodes today.", "Open tracker", Priority.HIGH),
            WatchBrainInsight(2, "Tomorrow release", tomorrowRelease?.let { "${it.title} releases tomorrow." } ?: "No major release tomorrow.", "View calendar", Priority.MEDIUM),
            WatchBrainInsight(3, "Continue watching", "You have not continued Mystery Manor for 18 days.", "Continue", Priority.MEDIUM),
            WatchBrainInsight(4, "Your pattern", "You usually complete dark anime faster.", "Pick anime", Priority.LOW),
            WatchBrainInsight(5, "Weekend plan", "This weekend is perfect for finishing a short season.", "See picks", Priority.MEDIUM),
            WatchBrainInsight(6, "High priority", "$highPriority high-priority titles are still pending.", "Review", Priority.HIGH)
        )
    }

    override fun getGoals(): Flow<List<WatchGoal>> = goalsState
    override fun getCollections(): Flow<List<WatchCollection>> = collectionsState
    override fun getStatsSummary(): Flow<StatsSummary> = combine(mediaState, episodesState, statusesState) { media, episodes, statuses ->
        val completedIds = statuses.filter { it.status == UserWatchStatus.COMPLETED }.map { it.mediaId }.toSet()
        val completedMedia = media.filter { it.id in completedIds }
        val watchedEpisodes = episodes.filter { it.isWatched }
        val totalHours = (completedMedia.sumOf { it.runtime } + watchedEpisodes.sumOf { it.runtime }) / 60
        val completionRate = if (statuses.isEmpty()) 0 else ((statuses.count { it.status == UserWatchStatus.COMPLETED } * 100f) / statuses.size).roundToInt()
        val genre = completedMedia.flatMap { it.genres }.groupingBy { it }.eachCount().maxByOrNull { it.value }?.key ?: "Thriller"
        val language = completedMedia.groupingBy { it.originalLanguageName }.eachCount().maxByOrNull { it.value }?.key ?: "English"
        StatsSummary(
            totalMoviesWatched = completedMedia.count { it.type == MediaType.MOVIE },
            totalSeriesWatched = completedMedia.count { it.type == MediaType.SERIES },
            totalAnimeCompleted = completedMedia.count { it.type == MediaType.ANIME },
            totalEpisodesWatched = watchedEpisodes.size,
            totalWatchHours = totalHours,
            mostWatchedGenre = genre,
            mostWatchedLanguage = language,
            completionRate = completionRate,
            pendingCount = statuses.count { it.status != UserWatchStatus.COMPLETED },
            monthlyCounts = listOf(1, 2, 1, 4, 3, 6, 4, 5, 3, 7, 8, 4),
            yearlyCounts = listOf(8, 12, 21, 30)
        )
    }

    override fun getRecommendationsForMood(mood: String): Flow<List<MediaItem>> = combine(mediaState, statusesState) { media, statuses ->
        val pendingIds = statuses.filter { it.status != UserWatchStatus.COMPLETED }.map { it.mediaId }.toSet()
        val pending = media.filter { it.id in pendingIds }
        val filtered = when (mood) {
            "Action" -> pending.filter { "Action" in it.genres || it.popularity > 80 }
            "Relaxing" -> pending.filter { "Drama" in it.genres || it.ratingTmdb.orZero() > 7.5 }
            "Emotional" -> pending.filter { "Drama" in it.genres || "Romance" in it.genres }
            "Dark" -> pending.filter { "Thriller" in it.genres || "Dark" in it.genres }
            "Comedy" -> pending.filter { "Comedy" in it.genres }
            "Thriller" -> pending.filter { "Thriller" in it.genres }
            "Short watch" -> pending.filter { it.runtime in 1..100 || it.totalEpisodes.orZero() <= 12 }
            "Binge-worthy" -> pending.filter { it.type != MediaType.MOVIE && it.totalEpisodes.orZero() <= 24 }
            "Family-friendly" -> pending.filter { "Family" in it.genres || "Adventure" in it.genres }
            else -> pending
        }
        filtered.ifEmpty { pending }.sortedByDescending { it.ratingTmdb ?: 0.0 }.take(8)
    }

    override fun createBackupJson(): Flow<String> = combine(statusesState, episodesState, remindersState, collectionsState, goalsState) { statuses, episodes, reminders, collections, goals ->
        gson.toJson(BackupPayload(statuses, episodes, reminders, collections, goals, LocalDateTime.now().toString()))
    }

    override suspend fun markMovieWatched(mediaId: Long) {
        val now = LocalDateTime.now().toString()
        upsertStatus(mediaId) { current -> current.copy(status = UserWatchStatus.COMPLETED, progressPercentage = 100, updatedAt = now) }
    }

    override suspend fun toggleFavorite(mediaId: Long) { upsertStatus(mediaId) { it.copy(isFavorite = !it.isFavorite) } }
    override suspend fun setPriority(mediaId: Long, priority: Priority) { upsertStatus(mediaId) { it.copy(priority = priority, priorityScore = autoPriority(mediaId, priority)) } }
    override suspend fun addToLibrary(mediaId: Long, status: UserWatchStatus) { upsertStatus(mediaId) { it.copy(status = status) } }

    override suspend fun markEpisodeWatched(mediaId: Long, seasonNumber: Int, episodeNumber: Int, markPrevious: Boolean) {
        val now = LocalDateTime.now().toString()
        episodesState.value = episodesState.value.map { episode ->
            val shouldMark = episode.mediaId == mediaId && if (markPrevious) {
                episode.seasonNumber < seasonNumber || (episode.seasonNumber == seasonNumber && episode.episodeNumber <= episodeNumber)
            } else episode.seasonNumber == seasonNumber && episode.episodeNumber == episodeNumber
            if (shouldMark) episode.copy(isWatched = true, watchedAt = now) else episode
        }
        updateProgress(mediaId)
    }

    override suspend fun unmarkEpisode(mediaId: Long, seasonNumber: Int, episodeNumber: Int) {
        episodesState.value = episodesState.value.map { ep ->
            if (ep.mediaId == mediaId && ep.seasonNumber == seasonNumber && ep.episodeNumber == episodeNumber) ep.copy(isWatched = false, watchedAt = null) else ep
        }
        updateProgress(mediaId)
    }

    override suspend fun markSeasonWatched(mediaId: Long, seasonNumber: Int) {
        val now = LocalDateTime.now().toString()
        episodesState.value = episodesState.value.map { ep -> if (ep.mediaId == mediaId && ep.seasonNumber == seasonNumber) ep.copy(isWatched = true, watchedAt = now) else ep }
        updateProgress(mediaId)
    }

    override suspend fun unmarkSeason(mediaId: Long, seasonNumber: Int) {
        episodesState.value = episodesState.value.map { ep -> if (ep.mediaId == mediaId && ep.seasonNumber == seasonNumber) ep.copy(isWatched = false, watchedAt = null) else ep }
        updateProgress(mediaId)
    }

    override suspend fun markShowWatched(mediaId: Long) {
        val now = LocalDateTime.now().toString()
        episodesState.value = episodesState.value.map { ep -> if (ep.mediaId == mediaId) ep.copy(isWatched = true, watchedAt = now) else ep }
        updateProgress(mediaId)
    }

    override suspend fun resetShowProgress(mediaId: Long) {
        episodesState.value = episodesState.value.map { ep -> if (ep.mediaId == mediaId) ep.copy(isWatched = false, watchedAt = null) else ep }
        upsertStatus(mediaId) { it.copy(status = UserWatchStatus.PLAN_TO_WATCH, progressPercentage = 0, lastWatchedSeason = null, lastWatchedEpisode = null) }
    }

    override suspend fun createReminder(reminder: Reminder) { remindersState.value = remindersState.value + reminder }
    override suspend fun deleteReminder(id: Long) { remindersState.value = remindersState.value.filterNot { it.id == id } }
    override suspend fun createGoal(goal: WatchGoal) { goalsState.value = goalsState.value + goal }
    override suspend fun updateGoal(goal: WatchGoal) { goalsState.value = goalsState.value.map { if (it.id == goal.id) goal else it } }
    override suspend fun createCollection(collection: WatchCollection) { collectionsState.value = collectionsState.value + collection }
    override suspend fun updateCollection(collection: WatchCollection) { collectionsState.value = collectionsState.value.map { if (it.id == collection.id) collection else it } }
    override suspend fun deleteCollection(collectionId: Long) { collectionsState.value = collectionsState.value.filterNot { it.id == collectionId } }
    override suspend fun restoreFromJson(json: String): Boolean = runCatching {
        val payload = gson.fromJson(json, BackupPayload::class.java)
        statusesState.value = payload.statuses
        episodesState.value = payload.episodes
        remindersState.value = payload.reminders
        collectionsState.value = payload.collections
        goalsState.value = payload.goals
        true
    }.getOrDefault(false)

    private fun updateProgress(mediaId: Long) {
        val episodes = episodesState.value.filter { it.mediaId == mediaId }
        val total = episodes.size.coerceAtLeast(1)
        val watched = episodes.count { it.isWatched }
        val last = episodes.filter { it.isWatched }.maxWithOrNull(compareBy<Episode> { it.seasonNumber }.thenBy { it.episodeNumber })
        val status = when {
            watched == 0 -> UserWatchStatus.PLAN_TO_WATCH
            watched == total -> UserWatchStatus.COMPLETED
            else -> UserWatchStatus.WATCHING
        }
        val now = LocalDateTime.now().toString()
        upsertStatusSync(mediaId) { current ->
            current.copy(
                status = status,
                lastWatchedSeason = last?.seasonNumber,
                lastWatchedEpisode = last?.episodeNumber,
                progressPercentage = (watched * 100) / total,
                updatedAt = now
            )
        }
    }

    private suspend fun upsertStatus(mediaId: Long, transform: (UserMediaStatus) -> UserMediaStatus) = upsertStatusSync(mediaId, transform)
    private fun upsertStatusSync(mediaId: Long, transform: (UserMediaStatus) -> UserMediaStatus) {
        val current = statusesState.value.firstOrNull { it.mediaId == mediaId } ?: UserMediaStatus(mediaId = mediaId, priorityScore = autoPriority(mediaId, Priority.WATCH_LATER))
        val updated = transform(current)
        statusesState.value = statusesState.value.filterNot { it.mediaId == mediaId } + updated
    }

    private fun autoPriority(mediaId: Long, manual: Priority): Int {
        val item = mediaState.value.firstOrNull { it.id == mediaId }
        val manualScore = when (manual) { Priority.HIGH -> 35; Priority.MEDIUM -> 20; Priority.LOW -> 10; Priority.WATCH_LATER -> 0 }
        val rating = ((item?.ratingTmdb ?: 0.0) * 5).roundToInt()
        val upcoming = if (item?.status == MediaStatus.UPCOMING) 10 else 0
        return (manualScore + rating + (item?.popularity ?: 0) / 3 + upcoming).coerceIn(0, 100)
    }

    private fun Double?.orZero() = this ?: 0.0
    private fun Int?.orZero() = this ?: 0

    private fun mockMedia(): List<MediaItem> = listOf(
        MediaItem(1, title = "The Cosmic Voyage", overview = "A legal mock sci-fi adventure through fractured space.", posterUrl = "https://picsum.photos/seed/cosmic/300/450", bannerUrl = "https://picsum.photos/seed/cosmicwide/900/500", type = MediaType.MOVIE, releaseDate = today.minusMonths(5).toString(), ratingTmdb = 8.2, ratingImdb = 8.0, ratingRottenTomatoes = "88%", ratingMetacritic = "74", genres = listOf("Action", "Adventure"), runtime = 126, popularity = 92),
        MediaItem(2, title = "Mystery Manor", overview = "A premium mystery series about a family archive and a haunted hill estate.", posterUrl = "https://picsum.photos/seed/manor/300/450", bannerUrl = "https://picsum.photos/seed/manorwide/900/500", type = MediaType.SERIES, releaseDate = today.minusYears(1).toString(), nextEpisodeDate = today.plusDays(3).toString(), ratingTmdb = 7.8, ratingImdb = 7.7, ratingRottenTomatoes = "81%", ratingMetacritic = "70", genres = listOf("Thriller", "Dark"), runtime = 48, totalSeasons = 2, totalEpisodes = 12, popularity = 85),
        MediaItem(3, title = "Samurai Saga", overview = "A dark anime about honor, memory, and rival clans.", posterUrl = "https://picsum.photos/seed/samurai/300/450", bannerUrl = "https://picsum.photos/seed/samuraiwide/900/500", type = MediaType.ANIME, releaseDate = today.minusMonths(9).toString(), ratingTmdb = 8.9, ratingImdb = 8.6, ratingRottenTomatoes = "94%", ratingMetacritic = "82", genres = listOf("Action", "Dark"), runtime = 24, totalSeasons = 1, totalEpisodes = 12, popularity = 96, originalLanguageName = "Japanese"),
        MediaItem(4, title = "Future Tech", overview = "A smart documentary about ethical technology and human futures.", posterUrl = "https://picsum.photos/seed/tech/300/450", bannerUrl = "https://picsum.photos/seed/techwide/900/500", type = MediaType.MOVIE, releaseDate = today.minusDays(20).toString(), ratingTmdb = 7.5, genres = listOf("Documentary"), runtime = 94, popularity = 60),
        MediaItem(5, title = "Chrono Chronicles", overview = "Time investigators solve emotional paradoxes.", posterUrl = "https://picsum.photos/seed/chrono/300/450", bannerUrl = "https://picsum.photos/seed/chronowide/900/500", type = MediaType.SERIES, releaseDate = today.plusDays(1).toString(), status = MediaStatus.UPCOMING, ratingTmdb = 8.5, genres = listOf("Thriller", "Sci-Fi"), runtime = 45, totalSeasons = 1, totalEpisodes = 8, popularity = 91),
        MediaItem(6, title = "Dragon Kingdom", overview = "A fantasy anime with legal mock metadata and language availability.", posterUrl = "https://picsum.photos/seed/dragon/300/450", bannerUrl = "https://picsum.photos/seed/dragonwide/900/500", type = MediaType.ANIME, releaseDate = today.minusMonths(1).toString(), nextEpisodeDate = today.toString(), ratingTmdb = 9.1, genres = listOf("Adventure", "Family"), runtime = 24, totalSeasons = 2, totalEpisodes = 20, popularity = 98, originalLanguageName = "Japanese"),
        MediaItem(7, title = "Ocean's Whisper", overview = "A relaxing island drama for an easy evening watch.", posterUrl = "https://picsum.photos/seed/ocean/300/450", bannerUrl = "https://picsum.photos/seed/oceanwide/900/500", type = MediaType.MOVIE, releaseDate = today.minusWeeks(3).toString(), ratingTmdb = 7.9, genres = listOf("Drama", "Romance"), runtime = 110, popularity = 72),
        MediaItem(8, title = "Cybernetica", overview = "A premium cyberpunk series about AI, memory, and law.", posterUrl = "https://picsum.photos/seed/cyber/300/450", bannerUrl = "https://picsum.photos/seed/cyberwide/900/500", type = MediaType.SERIES, releaseDate = today.minusMonths(2).toString(), ratingTmdb = 8.0, genres = listOf("Sci-Fi", "Thriller"), runtime = 50, totalSeasons = 1, totalEpisodes = 10, popularity = 83),
        MediaItem(9, title = "Hidden Treasures", overview = "An adventure documentary uncovering ancient stories.", posterUrl = "https://picsum.photos/seed/treasures/300/450", bannerUrl = "https://picsum.photos/seed/treasureswide/900/500", type = MediaType.MOVIE, releaseDate = today.minusYears(1).toString(), ratingTmdb = 7.3, genres = listOf("Adventure", "Family"), runtime = 101, popularity = 65),
        MediaItem(10, title = "Quantum Quest", overview = "A bright anime for short binge sessions.", posterUrl = "https://picsum.photos/seed/quantum/300/450", bannerUrl = "https://picsum.photos/seed/quantumwide/900/500", type = MediaType.ANIME, releaseDate = today.minusMonths(4).toString(), ratingTmdb = 8.7, genres = listOf("Comedy", "Adventure"), runtime = 22, totalSeasons = 2, totalEpisodes = 24, popularity = 88, originalLanguageName = "Japanese")
    )

    private fun mockSeasons(): List<Season> = listOf(
        Season(21, 2, 1, "Season 1", 6), Season(22, 2, 2, "Season 2", 6),
        Season(31, 3, 1, "Season 1", 12), Season(51, 5, 1, "Season 1", 8),
        Season(61, 6, 1, "Season 1", 10), Season(62, 6, 2, "Season 2", 10),
        Season(81, 8, 1, "Season 1", 10), Season(101, 10, 1, "Season 1", 12), Season(102, 10, 2, "Season 2", 12)
    )

    private fun mockEpisodes(): List<Episode> = mockSeasons().flatMap { season ->
        (1..season.episodeCount).map { ep ->
            Episode(
                id = season.id * 100 + ep,
                mediaId = season.mediaId,
                seasonId = season.id,
                seasonNumber = season.seasonNumber,
                episodeNumber = ep,
                title = "Episode $ep",
                overview = "A spoiler-sensitive mock description for episode $ep.",
                airDate = today.minusDays((season.episodeCount - ep).toLong()).toString(),
                runtime = if (season.mediaId == 3L || season.mediaId == 6L || season.mediaId == 10L) 24 else 48,
                thumbnailUrl = "https://picsum.photos/seed/${season.id}-$ep/320/180",
                isWatched = season.mediaId == 2L && season.seasonNumber == 1 && ep <= 3,
                watchedAt = if (season.mediaId == 2L && season.seasonNumber == 1 && ep <= 3) today.minusDays((5 - ep).toLong()).toString() else null
            )
        }
    }

    private fun mockStatuses(): List<UserMediaStatus> = listOf(
        UserMediaStatus(1, UserWatchStatus.PLAN_TO_WATCH, priority = Priority.HIGH, priorityScore = 91),
        UserMediaStatus(2, UserWatchStatus.WATCHING, isFavorite = true, priority = Priority.HIGH, lastWatchedSeason = 1, lastWatchedEpisode = 3, progressPercentage = 25, priorityScore = 88, updatedAt = today.minusDays(18).toString()),
        UserMediaStatus(3, UserWatchStatus.PLAN_TO_WATCH, priority = Priority.MEDIUM, priorityScore = 80),
        UserMediaStatus(6, UserWatchStatus.WATCHING, priority = Priority.HIGH, progressPercentage = 10, priorityScore = 95),
        UserMediaStatus(9, UserWatchStatus.COMPLETED, priority = Priority.LOW, progressPercentage = 100, updatedAt = today.minusDays(2).toString())
    )

    private fun mockReminders(): List<Reminder> = listOf(
        Reminder(1, 5, "Chrono Chronicles", MediaType.SERIES, "https://picsum.photos/seed/chrono/300/450", today.plusDays(1).toString(), today.toString() + "T09:00", ReminderType.ONE_DAY_BEFORE)
    )

    private fun mockCollections(): List<WatchCollection> = listOf(
        WatchCollection(1, "Dark anime", "Moody anime with intense atmosphere.", "https://picsum.photos/seed/samurai/300/450", listOf(3, 6), today.minusDays(10).toString(), today.minusDays(2).toString()),
        WatchCollection(2, "Weekend binge", "Short seasons and fast movies.", "https://picsum.photos/seed/quantum/300/450", listOf(2, 10), today.minusDays(7).toString(), today.minusDays(1).toString())
    )

    private fun mockGoals(): List<WatchGoal> = listOf(
        WatchGoal(1, "Watch 5 movies this month", GoalType.MOVIES, 5, 2, today.withDayOfMonth(1).toString(), today.withDayOfMonth(today.lengthOfMonth()).toString()),
        WatchGoal(2, "Finish 20 episodes this month", GoalType.EPISODES, 20, 7, today.withDayOfMonth(1).toString(), today.withDayOfMonth(today.lengthOfMonth()).toString())
    )

    private fun mockProviders(): List<WatchProvider> = listOf(
        WatchProvider(1, 1, "Prime Video", providerType = ProviderType.RENT, deepLinkUrl = "https://www.primevideo.com/"),
        WatchProvider(2, 2, "Netflix", providerType = ProviderType.STREAM, deepLinkUrl = "https://www.netflix.com/"),
        WatchProvider(3, 3, "Crunchyroll", providerType = ProviderType.STREAM, deepLinkUrl = "https://www.crunchyroll.com/"),
        WatchProvider(4, 6, "Disney+", providerType = ProviderType.STREAM, deepLinkUrl = "https://www.hotstar.com/"),
        WatchProvider(5, 9, "YouTube", providerType = ProviderType.FREE, deepLinkUrl = "https://www.youtube.com/")
    )
}
