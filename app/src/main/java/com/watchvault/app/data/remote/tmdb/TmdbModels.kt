package com.watchvault.app.data.remote.tmdb

import com.google.gson.annotations.SerializedName

data class TmdbListResponse(
    @SerializedName("results") val results: List<TmdbMediaDto> = emptyList()
)

data class TmdbMediaDto(
    @SerializedName("id") val id: Long,
    @SerializedName("title") val title: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("original_title") val originalTitle: String? = null,
    @SerializedName("original_name") val originalName: String? = null,
    @SerializedName("overview") val overview: String? = null,
    @SerializedName("poster_path") val posterPath: String? = null,
    @SerializedName("backdrop_path") val backdropPath: String? = null,
    @SerializedName("media_type") val mediaType: String? = null,
    @SerializedName("release_date") val releaseDate: String? = null,
    @SerializedName("first_air_date") val firstAirDate: String? = null,
    @SerializedName("vote_average") val voteAverage: Double? = null,
    @SerializedName("genre_ids") val genreIds: List<Int> = emptyList(),
    @SerializedName("original_language") val originalLanguage: String? = null,
    @SerializedName("popularity") val popularity: Double? = null
)

data class TmdbDetailResponse(
    @SerializedName("id") val id: Long,
    @SerializedName("title") val title: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("original_title") val originalTitle: String? = null,
    @SerializedName("original_name") val originalName: String? = null,
    @SerializedName("overview") val overview: String? = null,
    @SerializedName("poster_path") val posterPath: String? = null,
    @SerializedName("backdrop_path") val backdropPath: String? = null,
    @SerializedName("release_date") val releaseDate: String? = null,
    @SerializedName("first_air_date") val firstAirDate: String? = null,
    @SerializedName("vote_average") val voteAverage: Double? = null,
    @SerializedName("genres") val genres: List<TmdbGenreDto> = emptyList(),
    @SerializedName("runtime") val runtime: Int? = null,
    @SerializedName("episode_run_time") val episodeRunTime: List<Int> = emptyList(),
    @SerializedName("number_of_seasons") val numberOfSeasons: Int? = null,
    @SerializedName("number_of_episodes") val numberOfEpisodes: Int? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("original_language") val originalLanguage: String? = null,
    @SerializedName("spoken_languages") val spokenLanguages: List<TmdbLanguageDto> = emptyList(),
    @SerializedName("videos") val videos: TmdbVideosDto? = null,
    @SerializedName("watch/providers") val watchProviders: TmdbWatchProvidersResponse? = null
)

data class TmdbGenreDto(
    @SerializedName("id") val id: Int,
    @SerializedName("name") val name: String
)

data class TmdbLanguageDto(
    @SerializedName("iso_639_1") val code: String,
    @SerializedName("english_name") val name: String
)

data class TmdbVideosDto(
    @SerializedName("results") val results: List<TmdbVideoDto> = emptyList()
)

data class TmdbVideoDto(
    @SerializedName("site") val site: String,
    @SerializedName("type") val type: String,
    @SerializedName("key") val key: String
)

data class TmdbWatchProvidersResponse(
    @SerializedName("results") val results: Map<String, TmdbRegionProviders> = emptyMap()
)

data class TmdbRegionProviders(
    @SerializedName("flatrate") val flatrate: List<TmdbProviderDto> = emptyList(),
    @SerializedName("rent") val rent: List<TmdbProviderDto> = emptyList(),
    @SerializedName("buy") val buy: List<TmdbProviderDto> = emptyList(),
    @SerializedName("link") val link: String? = null
)

data class TmdbProviderDto(
    @SerializedName("provider_id") val providerId: Int,
    @SerializedName("provider_name") val providerName: String,
    @SerializedName("logo_path") val logoPath: String? = null
)

data class TmdbSeasonResponse(
    @SerializedName("id") val id: Long,
    @SerializedName("name") val name: String? = null,
    @SerializedName("season_number") val seasonNumber: Int,
    @SerializedName("episodes") val episodes: List<TmdbEpisodeDto> = emptyList()
)

data class TmdbEpisodeDto(
    @SerializedName("id") val id: Long,
    @SerializedName("name") val name: String? = null,
    @SerializedName("overview") val overview: String? = null,
    @SerializedName("episode_number") val episodeNumber: Int,
    @SerializedName("air_date") val airDate: String? = null,
    @SerializedName("runtime") val runtime: Int? = null,
    @SerializedName("still_path") val stillPath: String? = null
)
