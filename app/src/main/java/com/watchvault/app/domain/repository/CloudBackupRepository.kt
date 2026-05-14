package com.watchvault.app.domain.repository

interface CloudBackupRepository {
    suspend fun uploadBackup(json: String): Result<Unit>
    suspend fun downloadBackup(): Result<String>
}

class GoogleDriveBackupRepository : CloudBackupRepository {
    override suspend fun uploadBackup(json: String): Result<Unit> {
        // TODO: Add Google Drive API upload when API credentials are configured.
        return Result.failure(UnsupportedOperationException("Google Drive backup is not configured yet."))
    }

    override suspend fun downloadBackup(): Result<String> {
        // TODO: Add Google Drive API download when API credentials are configured.
        return Result.failure(UnsupportedOperationException("Google Drive backup is not configured yet."))
    }
}
