package com.watchvault.app.data.remote.tmdb

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface TmdbApi {
    @GET("3/trending/movie/week")
    suspend fun trendingMovies(
        @Query("api_key") apiKey: String,
        @Query("language") language: String = "en-US"
    ): TmdbListResponse

    @GET("3/trending/tv/week")
    suspend fun trendingTv(
        @Query("api_key") apiKey: String,
        @Query("language") language: String = "en-US"
    ): TmdbListResponse

    @GET("3/movie/upcoming")
    suspend fun upcomingMovies(
        @Query("api_key") apiKey: String,
        @Query("language") language: String = "en-US",
        @Query("region") region: String = "US"
    ): TmdbListResponse

    @GET("3/search/multi")
    suspend fun searchMulti(
        @Query("api_key") apiKey: String,
        @Query("query") query: String,
        @Query("language") language: String = "en-US"
    ): TmdbListResponse

    @GET("3/movie/{movieId}")
    suspend fun movieDetail(
        @Path("movieId") movieId: Long,
        @Query("api_key") apiKey: String,
        @Query("append_to_response") appendToResponse: String = "videos,watch/providers",
        @Query("language") language: String = "en-US"
    ): TmdbDetailResponse

    @GET("3/tv/{tvId}")
    suspend fun tvDetail(
        @Path("tvId") tvId: Long,
        @Query("api_key") apiKey: String,
        @Query("append_to_response") appendToResponse: String = "videos,watch/providers",
        @Query("language") language: String = "en-US"
    ): TmdbDetailResponse

    @GET("3/tv/{tvId}/season/{seasonNumber}")
    suspend fun tvSeason(
        @Path("tvId") tvId: Long,
        @Path("seasonNumber") seasonNumber: Int,
        @Query("api_key") apiKey: String,
        @Query("language") language: String = "en-US"
    ): TmdbSeasonResponse
}
