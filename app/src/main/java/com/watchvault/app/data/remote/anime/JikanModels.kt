package com.watchvault.app.data.remote.anime

import com.google.gson.annotations.SerializedName

data class JikanListResponse(
    @SerializedName("data") val data: List<JikanAnimeDto> = emptyList()
)

data class JikanAnimeDto(
    @SerializedName("mal_id") val malId: Long,
    @SerializedName("title") val title: String? = null,
    @SerializedName("title_english") val titleEnglish: String? = null,
    @SerializedName("synopsis") val synopsis: String? = null,
    @SerializedName("images") val images: JikanImages? = null,
    @SerializedName("trailer") val trailer: JikanTrailer? = null,
    @SerializedName("score") val score: Double? = null,
    @SerializedName("genres") val genres: List<JikanGenre> = emptyList(),
    @SerializedName("episodes") val episodes: Int? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("aired") val aired: JikanAired? = null
)

data class JikanImages(
    @SerializedName("jpg") val jpg: JikanImageUrls? = null,
    @SerializedName("webp") val webp: JikanImageUrls? = null
)

data class JikanImageUrls(
    @SerializedName("image_url") val imageUrl: String? = null,
    @SerializedName("large_image_url") val largeImageUrl: String? = null
)

data class JikanTrailer(
    @SerializedName("url") val url: String? = null
)

data class JikanGenre(
    @SerializedName("name") val name: String
)

data class JikanAired(
    @SerializedName("from") val from: String? = null,
    @SerializedName("to") val to: String? = null
)
