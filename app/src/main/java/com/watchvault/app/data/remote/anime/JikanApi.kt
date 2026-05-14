package com.watchvault.app.data.remote.anime

import retrofit2.http.GET
import retrofit2.http.Query

interface JikanApi {
    @GET("v4/top/anime")
    suspend fun topAnime(@Query("limit") limit: Int = 10): JikanListResponse

    @GET("v4/anime")
    suspend fun searchAnime(
        @Query("q") query: String,
        @Query("limit") limit: Int = 15
    ): JikanListResponse
}
