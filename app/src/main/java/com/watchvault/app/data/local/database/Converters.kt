package com.watchvault.app.data.local.database

import androidx.room.TypeConverter
import com.watchvault.app.domain.model.*

class Converters {

    // ── List<String> ──────────────────────────────────────────────────────────
    @TypeConverter fun stringListToString(v: List<String>): String = v.joinToString("||")
    @TypeConverter fun stringToStringList(v: String): List<String> =
        if (v.isBlank()) emptyList() else v.split("||")

    // ── List<Long> ────────────────────────────────────────────────────────────
    @TypeConverter fun longListToString(v: List<Long>): String = v.joinToString(",")
    @TypeConverter fun stringToLongList(v: String): List<Long> =
        if (v.isBlank()) emptyList() else v.split(",").mapNotNull { it.toLongOrNull() }

    // ── MediaType ─────────────────────────────────────────────────────────────
    @TypeConverter fun mediaTypeToString(v: MediaType): String = v.name
    @TypeConverter fun stringToMediaType(v: String): MediaType = MediaType.valueOf(v)

    // ── MediaStatus ───────────────────────────────────────────────────────────
    @TypeConverter fun mediaStatusToString(v: MediaStatus): String = v.name
    @TypeConverter fun stringToMediaStatus(v: String): MediaStatus = MediaStatus.valueOf(v)

    // ── UserWatchStatus ───────────────────────────────────────────────────────
    @TypeConverter fun userWatchStatusToString(v: UserWatchStatus): String = v.name
    @TypeConverter fun stringToUserWatchStatus(v: String): UserWatchStatus = UserWatchStatus.valueOf(v)

    // ── Priority ──────────────────────────────────────────────────────────────
    @TypeConverter fun priorityToString(v: Priority): String = v.name
    @TypeConverter fun stringToPriority(v: String): Priority = Priority.valueOf(v)

    // ── ReminderType ──────────────────────────────────────────────────────────
    @TypeConverter fun reminderTypeToString(v: ReminderType): String = v.name
    @TypeConverter fun stringToReminderType(v: String): ReminderType = ReminderType.valueOf(v)

    // ── WatchEventType ────────────────────────────────────────────────────────
    @TypeConverter fun watchEventTypeToString(v: WatchEventType): String = v.name
    @TypeConverter fun stringToWatchEventType(v: String): WatchEventType = WatchEventType.valueOf(v)

    // ── GoalType ──────────────────────────────────────────────────────────────
    @TypeConverter fun goalTypeToString(v: GoalType): String = v.name
    @TypeConverter fun stringToGoalType(v: String): GoalType = GoalType.valueOf(v)

    // ── ProviderType ──────────────────────────────────────────────────────────
    @TypeConverter fun providerTypeToString(v: ProviderType): String = v.name
    @TypeConverter fun stringToProviderType(v: String): ProviderType = ProviderType.valueOf(v)
}
