package com.opsradar.app.data.models

data class DailyCostDto(
    val date: String,
    val amount: Double
)

data class ServiceCostDto(
    val service: String,
    val amount: Double,
    val percentage: Int
)

data class BillingSummaryDto(
    val currentMonthToDate: Double,
    val lastMonthTotal: Double,
    val currency: String,
    val forecastCost: Double? = null,
    val dailyCosts: List<DailyCostDto> = emptyList(),
    val serviceBreakdown: List<ServiceCostDto> = emptyList(),
    val reportingDelayNotice: String
)
