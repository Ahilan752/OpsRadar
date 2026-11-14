package com.opsradar.app.data.models

data class MetricDataPointDto(
    val timestamp: String,
    val value: Double
)

data class MetricSeriesDto(
    val metricName: String,
    val unit: String,
    val dataPoints: List<MetricDataPointDto>,
    val average: Double? = null,
    val maximum: Double? = null,
    val minimum: Double? = null
)

data class AlarmDimensionDto(
    val name: String,
    val value: String
)

data class CloudWatchAlarmDto(
    val alarmName: String,
    val alarmArn: String,
    val stateValue: String, // OK, ALARM, INSUFFICIENT_DATA
    val stateReason: String,
    val stateUpdatedTimestamp: String? = null,
    val metricName: String? = null,
    val namespace: String? = null,
    val statistic: String? = null,
    val threshold: Double? = null,
    val comparisonOperator: String? = null,
    val evaluationPeriods: Int? = null,
    val period: Int? = null,
    val dimensions: List<AlarmDimensionDto> = emptyList()
)

data class AlarmsListResponse(
    val alarms: List<CloudWatchAlarmDto>,
    val total: Int,
    val inAlarm: Int,
    val ok: Int
)

data class AlarmHistoryItemDto(
    val timestamp: String? = null,
    val historyItemType: String? = null,
    val historySummary: String? = null,
    val historyData: String? = null
)

data class AlarmHistoryResponse(
    val history: List<AlarmHistoryItemDto>
)

