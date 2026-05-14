package com.watchvault.app.data.remote.omdb

import com.google.gson.annotations.SerializedName

data class OmdbResponse(
    @SerializedName("imdbRating") val imdbRating: String? = null,
    @SerializedName("Metascore") val metascore: String? = null,
    @SerializedName("Ratings") val ratings: List<OmdbRatingDto> = emptyList(),
    @SerializedName("imdbID") val imdbId: String? = null,
    @SerializedName("Response") val response: String? = null
)

data class OmdbRatingDto(
    @SerializedName("Source") val source: String,
    @SerializedName("Value") val value: String
)
