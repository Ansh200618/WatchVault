package com.watchvault.app.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.watchvault.app.data.local.dao.WatchVaultDao
import com.watchvault.app.data.local.entity.*

@Database(
    entities = [
        MediaEntity::class,
        SeasonEntity::class,
        EpisodeEntity::class,
        UserMediaStatusEntity::class,
        ReminderEntity::class,
        WatchEventEntity::class,
        CollectionEntity::class,
        WatchGoalEntity::class,
        WatchProviderEntity::class
    ],
    version = 2,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class WatchVaultDatabase : RoomDatabase() {
    abstract fun watchVaultDao(): WatchVaultDao
}
