package com.opsradar.app.data.models

data class DashboardAccountMetaDto(
    val id: String,
    val accountName: String,
    val accountId: String,
    val selectedRegion: String
)

data class DashboardSummaryDto(
    val totalAccounts: Int,
    val totalInstances: Int,
    val runningInstances: Int,
    val stoppedInstances: Int,
    val activeAlarms: Int,
    val monthToDateCost: Double,
    val currency: String
)

data class DashboardOverviewDto(
    val account: DashboardAccountMetaDto,
    val summary: DashboardSummaryDto,
    val recentInstances: List<EC2InstanceDto> = emptyList(),
    val triggeredAlarms: List<CloudWatchAlarmDto> = emptyList(),
    val spendingTrend: List<DailyCostDto> = emptyList()
)

