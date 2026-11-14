package com.opsradar.app.data.network

import com.opsradar.app.data.datastore.UserPreferencesRepository
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthInterceptor @Inject constructor(
    private val preferencesRepository: UserPreferencesRepository
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val requestBuilder = originalRequest.newBuilder()

        // Read token and selected AWS connection ID synchronously for network dispatch
        val token = runBlocking { preferencesRepository.accessToken.firstOrNull() }
        val connectionId = runBlocking { preferencesRepository.selectedConnectionId.firstOrNull() }

        if (!token.isNullOrBlank()) {
            requestBuilder.addHeader("Authorization", "Bearer $token")
        }

        if (!connectionId.isNullOrBlank()) {
            requestBuilder.addHeader("x-aws-connection-id", connectionId)
        }

        return chain.proceed(requestBuilder.build())
    }
}

