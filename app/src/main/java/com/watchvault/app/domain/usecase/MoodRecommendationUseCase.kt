package com.watchvault.app.domain.usecase

import com.watchvault.app.domain.model.MediaItem
import com.watchvault.app.domain.repository.LocalTrackingRepository
import kotlinx.coroutines.flow.Flow

class MoodRecommendationUseCase(private val repository: LocalTrackingRepository) {
    operator fun invoke(mood: String): Flow<List<MediaItem>> = repository.getRecommendationsForMood(mood)
}
