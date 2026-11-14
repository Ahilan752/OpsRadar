package com.opsradar.app.data.repositories

import com.opsradar.app.core.Resource
import com.opsradar.app.data.models.*
import com.opsradar.app.data.network.OpsRadarApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MonitoringRepository @Inject constructor(
    private val api: OpsRadarApi
) {
    fun getDashboardOverview(region: String? = null): Flow<Resource<DashboardOverviewDto>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getDashboardOverview(region)
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to fetch dashboard data"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Failed to reach OpsRadar monitoring service"))
        }
    }

    fun getEC2Instances(region: String?, state: String?, search: String?): Flow<Resource<EC2ListResponse>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getEC2Instances(region, state, search)
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to fetch EC2 instances"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Failed to reach OpsRadar monitoring service"))
        }
    }

    fun getEC2InstanceDetails(instanceId: String, region: String?): Flow<Resource<EC2InstanceDto>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getEC2InstanceDetails(instanceId, region)
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to fetch instance details"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    fun getCloudWatchMetrics(
        instanceId: String,
        region: String?,
        timeRange: String
    ): Flow<Resource<Map<String, MetricSeriesDto>>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getCloudWatchMetrics(instanceId, region, timeRange)
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to load CloudWatch metrics"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    fun getCloudWatchAlarms(region: String?, state: String?, search: String?): Flow<Resource<AlarmsListResponse>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getCloudWatchAlarms(region, state, search)
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to load CloudWatch alarms"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    fun getAlarmHistory(alarmName: String, region: String?): Flow<Resource<List<AlarmHistoryItemDto>>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getAlarmHistory(alarmName, region)
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!.history))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to load alarm history"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    fun getBillingSummary(): Flow<Resource<BillingSummaryDto>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getBillingSummary()
            if (response.isSuccessful && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Failed to load AWS Cost Explorer data"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }
}

