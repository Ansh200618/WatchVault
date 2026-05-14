package com.watchvault.app.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.watchvault.app.domain.repository.LocalTrackingRepository
import com.watchvault.app.notification.ReminderScheduler
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first

@HiltWorker
class ReminderWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: LocalTrackingRepository,
    private val scheduler: ReminderScheduler
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        repository.getReminders().first().filter { it.isEnabled }.forEach { scheduler.schedule(it) }
        return Result.success()
    }
}
