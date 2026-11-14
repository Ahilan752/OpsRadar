package com.opsradar.app.data.network

import com.opsradar.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface OpsRadarApi {

    // Authentication
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<AuthResponseData>>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponseData>>

    @POST("api/auth/refresh")
    suspend fun refresh(@Body request: RefreshTokenRequest): Response<ApiResponse<Map<String, TokenPairDto>>>

    @POST("api/auth/logout")
    suspend fun logout(): Response<ApiResponse<Unit>>

    @GET("api/auth/me")
    suspend fun getProfile(): Response<ApiResponse<Map<String, UserDto>>>

    // AWS Connections
    @POST("api/aws/connections")
    suspend fun initiateConnection(@Body request: InitiateConnectionRequest): Response<ApiResponse<ConnectionInitiationResponse>>

    @POST("api/aws/connections/validate")
    suspend fun completeConnection(@Body request: CompleteConnectionRequest): Response<ApiResponse<AWSConnectionDto>>

    @GET("api/aws/connections")
    suspend fun listConnections(): Response<ApiResponse<List<AWSConnectionDto>>>

    @GET("api/aws/connections/{id}")
    suspend fun getConnection(@Path("id") id: String): Response<ApiResponse<AWSConnectionDto>>

    @DELETE("api/aws/connections/{id}")
    suspend fun deleteConnection(@Path("id") id: String): Response<ApiResponse<Unit>>

    @GET("api/aws/connections/{id}/regions")
    suspend fun getRegions(@Path("id") id: String): Response<ApiResponse<RegionsResponse>>

    // Dashboard Overview
    @GET("api/dashboard/overview")
    suspend fun getDashboardOverview(
        @Query("region") region: String? = null
    ): Response<ApiResponse<DashboardOverviewDto>>

    // EC2 Infrastructure
    @GET("api/aws/ec2/instances")
    suspend fun getEC2Instances(
        @Query("region") region: String? = null,
        @Query("state") state: String? = null,
        @Query("search") search: String? = null
    ): Response<ApiResponse<EC2ListResponse>>

    @GET("api/aws/ec2/instances/{instanceId}")
    suspend fun getEC2InstanceDetails(
        @Path("instanceId") instanceId: String,
        @Query("region") region: String? = null
    ): Response<ApiResponse<EC2InstanceDto>>

    // CloudWatch Metrics & Alarms
    @GET("api/aws/cloudwatch/metrics")
    suspend fun getCloudWatchMetrics(
        @Query("instanceId") instanceId: String,
        @Query("region") region: String? = null,
        @Query("timeRange") timeRange: String = "1h",
        @Query("metrics") metrics: String? = null
    ): Response<ApiResponse<Map<String, MetricSeriesDto>>>

    @GET("api/aws/cloudwatch/alarms")
    suspend fun getCloudWatchAlarms(
        @Query("region") region: String? = null,
        @Query("state") state: String? = null,
        @Query("search") search: String? = null
    ): Response<ApiResponse<AlarmsListResponse>>

    @GET("api/aws/cloudwatch/alarms/{alarmName}/history")
    suspend fun getAlarmHistory(
        @Path("alarmName") alarmName: String,
        @Query("region") region: String? = null
    ): Response<ApiResponse<AlarmHistoryResponse>>

    // AWS Billing & Cost Explorer
    @GET("api/aws/billing/summary")
    suspend fun getBillingSummary(): Response<ApiResponse<BillingSummaryDto>>
}
