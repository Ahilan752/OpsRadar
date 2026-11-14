package com.opsradar.app.data.repositories

import com.opsradar.app.core.Resource
import com.opsradar.app.data.models.*
import com.opsradar.app.data.network.OpsRadarApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AWSConnectionRepository @Inject constructor(
    private val api: OpsRadarApi
) {
    fun initiateConnection(accountName: String, defaultRegion: String): Flow<Resource<ConnectionInitiationResponse>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.initiateConnection(InitiateConnectionRequest(accountName, defaultRegion))
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to initiate AWS connection"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    fun completeConnection(
        connectionId: String,
        accountId: String,
        roleArn: String,
        defaultRegion: String
    ): Flow<Resource<AWSConnectionDto>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.completeConnection(CompleteConnectionRequest(connectionId, accountId, roleArn, defaultRegion))
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to assume AWS IAM role"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Failed to validate AWS role"))
        }
    }

    fun listConnections(): Flow<Resource<List<AWSConnectionDto>>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.listConnections()
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to fetch AWS connections"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    fun deleteConnection(connectionId: String): Flow<Resource<Unit>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.deleteConnection(connectionId)
            if (response.isSuccessful) {
                emit(Resource.Success(Unit))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to remove connection"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    fun getRegions(connectionId: String): Flow<Resource<List<String>>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getRegions(connectionId)
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!.regions))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to fetch regions"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }
}

