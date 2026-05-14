package com.watchvault.app.domain.model

data class Season(
    val id: Long,
    val mediaId: Long,
    val seasonNumber: Int,
    val title: String,
    val episodeCount: Int,
    val isCompleted: Boolean = false
)
