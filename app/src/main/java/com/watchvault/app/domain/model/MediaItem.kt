package com.watchvault.app.domain.model

data class MediaItem(
    val id: Long,
    val apiId: String = "",
    val imdbId: String = "",
    val tmdbId: String = "",
    val anilistId: String = "",
    val title: String,
    val originalTitle: String = title,
    val overview: String,
    val posterUrl: String,
    val bannerUrl: String,
    val trailerUrl: String = "https://www.youtube.com/results?search_query=$title official trailer",
    val trailerThumbnailUrl: String = posterUrl,
    val type: MediaType,
    val releaseDate: String,
    val nextEpisodeDate: String? = null,
    val status: MediaStatus = MediaStatus.RELEASED,
    val originalLanguageCode: String = "en",
    val originalLanguageName: String = "English",
    val countryOfOrigin: String = "US",
    val ratingTmdb: Double? = null,
    val ratingImdb: Double? = null,
    val ratingRottenTomatoes: String? = null,
    val ratingMetacritic: String? = null,
    val genres: List<String> = emptyList(),
    val runtime: Int = 0,
    val totalSeasons: Int? = null,
    val totalEpisodes: Int? = null,
    val popularity: Int = 50,
    val createdAt: String = "2026-01-01",
    val updatedAt: String = "2026-01-01"
)

enum class MediaType { MOVIE, SERIES, ANIME }
enum class MediaStatus { RELEASED, UPCOMING, AIRING, ENDED, CANCELLED }
enum class UserWatchStatus { PLAN_TO_WATCH, WATCHING, COMPLETED, DROPPED, ON_HOLD }
enum class Priority { HIGH, MEDIUM, LOW, WATCH_LATER }
enum class ProviderType { STREAM, RENT, BUY, FREE, THEATRE }
enum class WatchEventType { RELEASE_DATE, EPISODE_DATE, REMINDER, WATCH_COMPLETED }
enum class ReminderType { RELEASE_DAY, ONE_DAY_BEFORE, THREE_DAYS_BEFORE, ONE_WEEK_BEFORE, CUSTOM }
enum class GoalType { MOVIES, SERIES, ANIME, EPISODES, WATCHLIST }
