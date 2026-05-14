package com.watchvault.app.data.repository

import com.watchvault.app.data.remote.omdb.OmdbApi
import com.watchvault.app.data.remote.omdb.OmdbResponse
import javax.inject.Inject

class OmdbRepository @Inject constructor(
    private val api: OmdbApi
) {
    suspend fun getRatings(apiKey: String, imdbId: String): OmdbResponse? =
        if (apiKey.isBlank() || imdbId.isBlank()) null else runCatching { api.getByImdbId(apiKey, imdbId) }.getOrNull()
}
