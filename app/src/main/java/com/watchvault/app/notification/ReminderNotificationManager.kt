package com.watchvault.app.notification

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.watchvault.app.MainActivity
import com.watchvault.app.R

class ReminderNotificationManager(private val context: Context) {
    private val channelId = "release_reminders"

    fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Release reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for upcoming releases"
            }
            context.getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    fun showReleaseReminder(mediaId: Long, title: String) {
        // Android 13+ requires POST_NOTIFICATIONS permission at the call site
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) return

        ensureChannel()

        val intent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            putExtra("mediaId", mediaId)
            putExtra("openDetail", true)
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            mediaId.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentTitle("New release reminder")
            .setContentText("$title releases today.")
            .setStyle(NotificationCompat.BigTextStyle().bigText("$title releases today."))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .addAction(R.drawable.ic_launcher, "Open Details", pendingIntent)
            .build()

        NotificationManagerCompat.from(context).notify(mediaId.toInt(), notification)
    }
}
