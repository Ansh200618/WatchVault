package com.watchvault.app.data.repository

import com.watchvault.app.data.remote.tmdb.TmdbApi
import com.watchvault.app.data.remote.tmdb.TmdbDetailResponse
import com.watchvault.app.data.remote.tmdb.TmdbMediaDto
import javax.inject.Inject

class TmdbRepository @Inject constructor(
    private val api: TmdbApi
) {
    suspend fun getTrendingMovies(apiKey: String): List<TmdbMediaDto> =
        if (apiKey.isBlank()) emptyList() else runCatching { api.trendingMovies(apiKey).results }.getOrDefault(emptyList())

    suspend fun getTrendingSeries(apiKey: String): List<TmdbMediaDto> =
        if (apiKey.isBlank()) emptyList() else runCatching { api.trendingTv(apiKey).results }.getOrDefault(emptyList())

    suspend fun getUpcomingMovies(apiKey: String): List<TmdbMediaDto> =
        if (apiKey.isBlank()) emptyList() else runCatching { api.upcomingMovies(apiKey).results }.getOrDefault(emptyList())

    suspend fun search(apiKey: String, query: String): List<TmdbMediaDto> =
        if (apiKey.isBlank() || query.isBlank()) emptyList() else runCatching { api.searchMulti(apiKey, query).results }.getOrDefault(emptyList())

    suspend fun movieDetail(apiKey: String, id: Long): TmdbDetailResponse? =
        if (apiKey.isBlank()) null else runCatching { api.movieDetail(id, apiKey) }.getOrNull()

    suspend fun tvDetail(apiKey: String, id: Long): TmdbDetailResponse? =
        if (apiKey.isBlank()) null else runCatching { api.tvDetail(id, apiKey) }.getOrNull()
}
