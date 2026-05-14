package com.watchvault.app.notification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val mediaId = intent.getLongExtra("mediaId", 0L)
        val title = intent.getStringExtra("title") ?: "A title"
        ReminderNotificationManager(context).showReleaseReminder(mediaId, title)
    }
}
