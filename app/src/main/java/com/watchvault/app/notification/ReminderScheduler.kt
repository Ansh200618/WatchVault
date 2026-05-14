package com.watchvault.app.notification

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.watchvault.app.domain.model.Reminder
import com.watchvault.app.worker.ReminderWorker
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.concurrent.TimeUnit

class ReminderScheduler(private val context: Context) {
    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    fun schedule(reminder: Reminder) {
        val triggerMillis = runCatching {
            LocalDateTime.parse(reminder.reminderDateTime).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        }.getOrElse { System.currentTimeMillis() + 60_000L }
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            putExtra("mediaId", reminder.mediaId)
            putExtra("title", reminder.mediaTitle)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            reminder.id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val canExact = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) alarmManager.canScheduleExactAlarms() else true
        if (canExact) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerMillis, pendingIntent)
        } else {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerMillis, pendingIntent)
            scheduleWorkFallback(reminder, triggerMillis)
        }
    }

    fun cancel(reminderId: Long) {
        val intent = Intent(context, ReminderReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(context, reminderId.toInt(), intent, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
        if (pendingIntent != null) alarmManager.cancel(pendingIntent)
    }

    private fun scheduleWorkFallback(reminder: Reminder, triggerMillis: Long) {
        val delayMs = (triggerMillis - System.currentTimeMillis()).coerceAtLeast(0L)
        val request = OneTimeWorkRequestBuilder<ReminderWorker>()
            .setInitialDelay(delayMs, TimeUnit.MILLISECONDS)
            .setInputData(ReminderWorker.inputData(reminder.mediaId, reminder.mediaTitle))
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork("reminder-${reminder.id}", ExistingWorkPolicy.REPLACE, request)
    }
}
