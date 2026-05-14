package com.watchvault.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.watchvault.app.domain.model.*

@Entity(tableName = "media")
data class MediaEntity(
    @PrimaryKey val id: Long,
    val tmdbId: String = "",
    val imdbId: String = "",
    val anilistId: String = "",
    val title: String,
    val originalTitle: String = "",
    val overview: String,
    val posterUrl: String,
    val bannerUrl: String = "",
    val trailerUrl: String,
    val type: MediaType,
    val releaseDate: String,
    val nextEpisodeDate: String? = null,
    val status: MediaStatus,
    val language: String = "",
    val languageName: String = "",
    val country: String,
    val tmdbRating: Double?,
    val imdbRating: Double?,
    val rottenTomatoesRating: String? = null,
    val metacriticRating: String? = null,
    val genres: List<String>,
    val runtime: Int,
    val totalSeasons: Int?,
    val totalEpisodes: Int?,
    val popularity: Int,
    val createdAt: String = "",
    val updatedAt: String = ""
)

@Entity(tableName = "seasons")
data class SeasonEntity(
    @PrimaryKey val id: Long,
    val mediaId: Long,
    val seasonNumber: Int,
    val title: String,
    val episodeCount: Int,
    val isCompleted: Boolean
)

@Entity(tableName = "episodes")
data class EpisodeEntity(
    @PrimaryKey val id: Long,
    val mediaId: Long,
    val seasonId: Long,
    val seasonNumber: Int,
    val episodeNumber: Int,
    val title: String,
    val overview: String,
    val airDate: String,
    val runtime: Int,
    val thumbnailUrl: String,
    val isWatched: Boolean,
    val watchedAt: String?
)

@Entity(tableName = "user_media_status")
data class UserMediaStatusEntity(
    @PrimaryKey val mediaId: Long,
    val status: UserWatchStatus,
    val isFavorite: Boolean,
    val priority: Priority,
    val personalRating: Double?,
    val lastWatchedSeason: Int?,
    val lastWatchedEpisode: Int?,
    val progressPercentage: Int,
    val priorityScore: Int,
    val updatedAt: String
)

@Entity(tableName = "reminders")
data class ReminderEntity(
    @PrimaryKey val id: Long,
    val mediaId: Long,
    val mediaTitle: String,
    val mediaType: MediaType,
    val posterUrl: String,
    val releaseDate: String,
    val reminderDateTime: String,
    val reminderType: ReminderType,
    val isEnabled: Boolean,
    val createdAt: String
)

@Entity(tableName = "watch_events")
data class WatchEventEntity(
    @PrimaryKey val id: Long,
    val mediaId: Long,
    val eventType: WatchEventType,
    val eventDate: String,
    val title: String,
    val description: String
)

@Entity(tableName = "collections")
data class CollectionEntity(
    @PrimaryKey val id: Long,
    val name: String,
    val description: String,
    val coverPosterUrl: String,
    val mediaIds: List<Long>,
    val createdAt: String,
    val updatedAt: String
)

@Entity(tableName = "watch_goals")
data class WatchGoalEntity(
    @PrimaryKey val id: Long,
    val title: String,
    val goalType: GoalType,
    val targetCount: Int,
    val currentCount: Int,
    val startDate: String,
    val endDate: String,
    val isCompleted: Boolean
)

@Entity(tableName = "providers")
data class WatchProviderEntity(
    @PrimaryKey val id: Long,
    val mediaId: Long,
    val providerName: String,
    val providerLogoUrl: String,
    val providerType: ProviderType,
    val region: String,
    val deepLinkUrl: String
)

@Entity(tableName = "language_availability")
data class LanguageAvailabilityEntity(
    @PrimaryKey val id: Long,
    val mediaId: Long,
    val originalLanguageCode: String,
    val originalLanguageName: String,
    val audioLanguages: List<String>,
    val subtitleLanguages: List<String>,
    val dubbedLanguages: List<String>,
    val availableRegions: List<String>,
    val dataSource: String,
    val lastUpdated: String
)
