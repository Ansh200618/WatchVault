package com.watchvault.app.di

import android.content.Context
import androidx.room.Room
import com.watchvault.app.data.local.database.WatchVaultDatabase
import com.watchvault.app.data.repository.DataStoreSettingsRepository
import com.watchvault.app.data.repository.MockLocalTrackingRepository
import com.watchvault.app.domain.repository.LocalTrackingRepository
import com.watchvault.app.domain.repository.SettingsRepository
import com.watchvault.app.domain.usecase.MoodRecommendationUseCase
import com.watchvault.app.notification.ReminderNotificationManager
import com.watchvault.app.notification.ReminderScheduler
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides @Singleton
    fun provideDatabase(@ApplicationContext context: Context): WatchVaultDatabase =
        Room.databaseBuilder(context, WatchVaultDatabase::class.java, "watchvault.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides @Singleton
    fun provideLocalTrackingRepository(): LocalTrackingRepository = MockLocalTrackingRepository()

    @Provides @Singleton
    fun provideSettingsRepository(@ApplicationContext context: Context): SettingsRepository = DataStoreSettingsRepository(context)

    @Provides @Singleton
    fun provideMoodRecommendationUseCase(repository: LocalTrackingRepository): MoodRecommendationUseCase = MoodRecommendationUseCase(repository)

    @Provides @Singleton
    fun provideReminderNotificationManager(@ApplicationContext context: Context): ReminderNotificationManager = ReminderNotificationManager(context)

    @Provides @Singleton
    fun provideReminderScheduler(@ApplicationContext context: Context): ReminderScheduler = ReminderScheduler(context)
}
