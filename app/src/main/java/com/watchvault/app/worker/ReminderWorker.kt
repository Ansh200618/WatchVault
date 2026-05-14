package com.watchvault.app.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.Data
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.watchvault.app.domain.repository.LocalTrackingRepository
import com.watchvault.app.notification.ReminderNotificationManager
import com.watchvault.app.notification.ReminderScheduler
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first

@HiltWorker
class ReminderWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: LocalTrackingRepository,
    private val scheduler: ReminderScheduler,
    private val notificationManager: ReminderNotificationManager
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val directMediaId = inputData.getLong(KEY_MEDIA_ID, 0L)
        val directTitle = inputData.getString(KEY_TITLE).orEmpty()
        if (directMediaId > 0 && directTitle.isNotBlank()) {
            notificationManager.showReleaseReminder(directMediaId, directTitle)
            return Result.success()
        }
        repository.getReminders().first().filter { it.isEnabled }.forEach { scheduler.schedule(it) }
        return Result.success()
    }

    companion object {
        const val KEY_MEDIA_ID = "media_id"
        const val KEY_TITLE = "title"

        fun inputData(mediaId: Long, title: String): Data = Data.Builder()
            .putLong(KEY_MEDIA_ID, mediaId)
            .putString(KEY_TITLE, title)
            .build()
    }
}
