package com.watchvault.app.data.repository

import com.watchvault.app.data.remote.anime.JikanApi
import com.watchvault.app.data.remote.anime.JikanAnimeDto
import javax.inject.Inject

class AnimeRepository @Inject constructor(
    private val api: JikanApi
) {
    suspend fun topAnime(): List<JikanAnimeDto> = runCatching { api.topAnime().data }.getOrDefault(emptyList())
    suspend fun searchAnime(query: String): List<JikanAnimeDto> =
        if (query.isBlank()) emptyList() else runCatching { api.searchAnime(query).data }.getOrDefault(emptyList())
}
