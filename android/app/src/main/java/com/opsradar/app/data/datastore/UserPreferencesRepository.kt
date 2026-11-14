package com.opsradar.app.data.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "opsradar_preferences")

@Singleton
class UserPreferencesRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        val KEY_ACCESS_TOKEN = stringPreferencesKey("access_token")
        val KEY_REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val KEY_USER_ID = stringPreferencesKey("user_id")
        val KEY_USER_NAME = stringPreferencesKey("user_name")
        val KEY_USER_EMAIL = stringPreferencesKey("user_email")
        val KEY_SELECTED_CONNECTION_ID = stringPreferencesKey("selected_connection_id")
        val KEY_SELECTED_REGION = stringPreferencesKey("selected_region")
    }

    val accessToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_ACCESS_TOKEN]
    }

    val refreshToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_REFRESH_TOKEN]
    }

    val userEmail: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_USER_EMAIL]
    }

    val userName: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_USER_NAME]
    }

    val selectedConnectionId: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_SELECTED_CONNECTION_ID]
    }

    val selectedRegion: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_SELECTED_REGION] ?: "us-east-1"
    }

    suspend fun saveAuth(accessToken: String, refreshToken: String, userId: String, name: String, email: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_ACCESS_TOKEN] = accessToken
            preferences[KEY_REFRESH_TOKEN] = refreshToken
            preferences[KEY_USER_ID] = userId
            preferences[KEY_USER_NAME] = name
            preferences[KEY_USER_EMAIL] = email
        }
    }

    suspend fun saveSelectedConnection(connectionId: String, defaultRegion: String? = null) {
        context.dataStore.edit { preferences ->
            preferences[KEY_SELECTED_CONNECTION_ID] = connectionId
            if (defaultRegion != null) {
                preferences[KEY_SELECTED_REGION] = defaultRegion
            }
        }
    }

    suspend fun saveSelectedRegion(region: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_SELECTED_REGION] = region
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { preferences ->
            preferences.remove(KEY_ACCESS_TOKEN)
            preferences.remove(KEY_REFRESH_TOKEN)
            preferences.remove(KEY_USER_ID)
            preferences.remove(KEY_USER_NAME)
            preferences.remove(KEY_USER_EMAIL)
            preferences.remove(KEY_SELECTED_CONNECTION_ID)
        }
    }
}

