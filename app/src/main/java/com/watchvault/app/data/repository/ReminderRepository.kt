package com.watchvault.app.data.repository

import com.watchvault.app.domain.model.Reminder
import com.watchvault.app.notification.ReminderScheduler
import javax.inject.Inject

class ReminderRepository @Inject constructor(
    private val localRepository: RoomLocalTrackingRepository,
    private val scheduler: ReminderScheduler
) {
    suspend fun createReminder(reminder: Reminder) {
        localRepository.createReminder(reminder)
        scheduler.schedule(reminder)
    }

    suspend fun deleteReminder(id: Long) {
        localRepository.deleteReminder(id)
        scheduler.cancel(id)
    }
}
