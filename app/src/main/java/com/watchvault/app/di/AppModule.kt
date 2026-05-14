package com.watchvault.app.di

import android.content.Context
import androidx.room.Room
import com.google.gson.Gson
import com.watchvault.app.data.local.database.WatchVaultDatabase
import com.watchvault.app.data.remote.anime.JikanApi
import com.watchvault.app.data.remote.omdb.OmdbApi
import com.watchvault.app.data.remote.tmdb.TmdbApi
import com.watchvault.app.data.repository.DataStoreSettingsRepository
import com.watchvault.app.data.repository.BackupRepository
import com.watchvault.app.data.repository.RoomLocalTrackingRepository
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
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
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
    fun provideDao(database: WatchVaultDatabase) = database.watchVaultDao()

    @Provides @Singleton
    fun provideGson(): Gson = Gson()

    @Provides @Singleton
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder().build()

    @Provides @Singleton
    fun provideTmdbApi(client: OkHttpClient): TmdbApi = Retrofit.Builder()
        .baseUrl("https://api.themoviedb.org/")
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(TmdbApi::class.java)

    @Provides @Singleton
    fun provideOmdbApi(client: OkHttpClient): OmdbApi = Retrofit.Builder()
        .baseUrl("https://www.omdbapi.com/")
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(OmdbApi::class.java)

    @Provides @Singleton
    fun provideJikanApi(client: OkHttpClient): JikanApi = Retrofit.Builder()
        .baseUrl("https://api.jikan.moe/")
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(JikanApi::class.java)

    @Provides @Singleton
    fun provideLocalTrackingRepository(impl: RoomLocalTrackingRepository): LocalTrackingRepository = impl

    @Provides @Singleton
    fun provideSettingsRepository(@ApplicationContext context: Context): SettingsRepository = DataStoreSettingsRepository(context)

    @Provides @Singleton
    fun provideMoodRecommendationUseCase(repository: LocalTrackingRepository): MoodRecommendationUseCase = MoodRecommendationUseCase(repository)

    @Provides @Singleton
    fun provideReminderNotificationManager(@ApplicationContext context: Context): ReminderNotificationManager = ReminderNotificationManager(context)

    @Provides @Singleton
    fun provideReminderScheduler(@ApplicationContext context: Context): ReminderScheduler = ReminderScheduler(context)

    @Provides @Singleton
    fun provideBackupRepository(@ApplicationContext context: Context): BackupRepository = BackupRepository(context)
}
