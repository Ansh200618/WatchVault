package com.watchvault.app.data.repository

import com.watchvault.app.domain.model.MediaItem
import com.watchvault.app.domain.model.MediaType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class SearchRepository @Inject constructor(
    private val localRepository: RoomLocalTrackingRepository
) {
    fun search(query: String, filter: String): Flow<List<MediaItem>> = localRepository.getAllMedia().map { list ->
        list.filter { item ->
            val typeMatch = when (filter) {
                "Movies" -> item.type == MediaType.MOVIE
                "Series" -> item.type == MediaType.SERIES
                "Anime" -> item.type == MediaType.ANIME
                "Upcoming" -> item.releaseDate >= java.time.LocalDate.now().toString()
                else -> true
            }
            typeMatch && (query.isBlank() || item.title.contains(query, true) || item.originalTitle.contains(query, true))
        }
    }
}
