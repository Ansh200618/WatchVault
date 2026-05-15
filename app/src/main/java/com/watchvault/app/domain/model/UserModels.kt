package com.watchvault.app.domain.model

data class UserMediaStatus(
    val mediaId: Long,
    val status: UserWatchStatus = UserWatchStatus.PLAN_TO_WATCH,
    val isFavorite: Boolean = false,
    val priority: Priority = Priority.WATCH_LATER,
    val personalRating: Double? = null,
    val lastWatchedSeason: Int? = null,
    val lastWatchedEpisode: Int? = null,
    val progressPercentage: Int = 0,
    val priorityScore: Int = 0,
    val updatedAt: String = ""
)

data class WatchProvider(
    val id: Long,
    val mediaId: Long,
    val providerName: String,
    val providerLogoUrl: String = "",
    val providerType: ProviderType,
    val region: String = "IN",
    val deepLinkUrl: String = ""
)

data class LanguageAvailability(
    val id: Long,
    val mediaId: Long,
    val originalLanguageCode: String,
    val originalLanguageName: String,
    val audioLanguages: List<String>,
    val subtitleLanguages: List<String>,
    val dubbedLanguages: List<String>,
    val availableRegions: List<String>,
    val dataSource: String = "Mock",
    val lastUpdated: String = "2026-01-01"
)

data class Reminder(
    val id: Long,
    val mediaId: Long,
    val mediaTitle: String,
    val mediaType: MediaType,
    val posterUrl: String,
    val releaseDate: String,
    val reminderDateTime: String,
    val reminderType: ReminderType,
    val isEnabled: Boolean = true,
    val createdAt: String = ""
)

data class WatchCollection(
    val id: Long,
    val name: String,
    val description: String,
    val coverPosterUrl: String,
    val mediaIds: List<Long>,
    val createdAt: String,
    val updatedAt: String
)

data class WatchGoal(
    val id: Long,
    val title: String,
    val goalType: GoalType,
    val targetCount: Int,
    val currentCount: Int,
    val startDate: String,
    val endDate: String,
    val isCompleted: Boolean = false
)

data class WatchEvent(
    val id: Long,
    val eventType: WatchEventType,
    val eventDate: String,
    val title: String,
    val description: String,
    val mediaId: Long = 0L
)

data class WatchBrainInsight(
    val id: Long,
    val title: String,
    val body: String,
    val actionLabel: String = "View",
    val priority: Priority = Priority.MEDIUM
)

data class StatsSummary(
    val totalMoviesWatched: Int = 0,
    val totalSeriesWatched: Int = 0,
    val totalAnimeCompleted: Int = 0,
    val totalEpisodesWatched: Int = 0,
    val totalWatchHours: Int = 0,
    val mostWatchedGenre: String = "Thriller",
    val mostWatchedLanguage: String = "English",
    val completionRate: Int = 0,
    val pendingCount: Int = 0,
    val monthlyCounts: List<Int> = List(12) { 0 },
    val yearlyCounts: List<Int> = listOf(2, 6, 10, 12)
)

data class BackupPayload(
    val statuses: List<UserMediaStatus>,
    val episodes: List<Episode>,
    val reminders: List<Reminder>,
    val collections: List<WatchCollection>,
    val goals: List<WatchGoal>,
    val exportedAt: String
)

data class SpoilerSettings(
    val hideEpisodeDescriptions: Boolean = false,
    val hideUpcomingEpisodeDetails: Boolean = false,
    val blurCastPlotDetails: Boolean = false,
    val hideRatingsUntilWatched: Boolean = false
)
