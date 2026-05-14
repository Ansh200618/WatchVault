package com.watchvault.app.data.repository

import android.content.Context
import java.io.File

class BackupRepository(private val context: Context) {
    fun writeBackupFile(json: String): File {
        val dir = File(context.cacheDir, "backups").apply { mkdirs() }
        return File(dir, "watchvault-backup-${System.currentTimeMillis()}.json").apply { writeText(json) }
    }

    fun parseLocalBackup(json: String): String = json
}
