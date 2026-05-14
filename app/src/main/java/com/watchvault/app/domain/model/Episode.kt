package com.watchvault.app.domain.model

data class Episode(
    val id: Long,
    val mediaId: Long,
    val seasonId: Long,
    val seasonNumber: Int,
    val episodeNumber: Int,
    val title: String,
    val overview: String,
    val airDate: String,
    val runtime: Int,
    val thumbnailUrl: String,
    val isWatched: Boolean = false,
    val watchedAt: String? = null
)
