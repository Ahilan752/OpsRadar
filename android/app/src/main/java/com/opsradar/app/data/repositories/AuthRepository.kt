package com.opsradar.app.data.repositories

import com.opsradar.app.core.Resource
import com.opsradar.app.data.datastore.UserPreferencesRepository
import com.opsradar.app.data.models.AuthResponseData
import com.opsradar.app.data.models.LoginRequest
import com.opsradar.app.data.models.RegisterRequest
import com.opsradar.app.data.network.OpsRadarApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: OpsRadarApi,
    private val preferencesRepository: UserPreferencesRepository
) {
    val isLoggedIn: Flow<Boolean> = kotlinx.coroutines.flow.map(preferencesRepository.accessToken) { token ->
        !token.isNullOrBlank()
    }

    val selectedConnectionId = preferencesRepository.selectedConnectionId
    val selectedRegion = preferencesRepository.selectedRegion
    val userName = preferencesRepository.userName
    val userEmail = preferencesRepository.userEmail

    fun register(name: String, email: String, pass: String): Flow<Resource<AuthResponseData>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.register(RegisterRequest(name, email, pass))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                preferencesRepository.saveAuth(
                    accessToken = data.tokens.accessToken,
                    refreshToken = data.tokens.refreshToken,
                    userId = data.user.id,
                    name = data.user.name,
                    email = data.user.email
                )
                emit(Resource.Success(data))
            } else {
                val errMsg = response.body()?.message ?: response.errorBody()?.string() ?: "Registration failed"
                emit(Resource.Error(errMsg))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network connection error"))
        }
    }

    fun login(email: String, pass: String): Flow<Resource<AuthResponseData>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.login(LoginRequest(email, pass))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                preferencesRepository.saveAuth(
                    accessToken = data.tokens.accessToken,
                    refreshToken = data.tokens.refreshToken,
                    userId = data.user.id,
                    name = data.user.name,
                    email = data.user.email
                )
                emit(Resource.Success(data))
            } else {
                val errMsg = response.body()?.message ?: "Invalid email or password"
                emit(Resource.Error(errMsg))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network connection error"))
        }
    }

    suspend fun logout() {
        try {
            api.logout()
        } catch (_: Exception) { }
        preferencesRepository.clearSession()
    }

    suspend fun selectConnection(connectionId: String, defaultRegion: String? = null) {
        preferencesRepository.saveSelectedConnection(connectionId, defaultRegion)
    }

    suspend fun selectRegion(region: String) {
        preferencesRepository.saveSelectedRegion(region)
    }
}

