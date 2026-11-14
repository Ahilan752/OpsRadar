package com.opsradar.app.data.models

data class EC2InstanceDto(
    val id: String,
    val name: String,
    val type: String,
    val state: String, // running, stopped, pending, terminated
    val region: String,
    val availabilityZone: String,
    val privateIp: String? = null,
    val publicIp: String? = null,
    val launchTime: String? = null,
    val platform: String? = null,
    val monitoringState: String? = null,
    val systemStatus: String? = null,
    val instanceStatus: String? = null,
    val tags: Map<String, String> = emptyMap()
)

data class EC2ListResponse(
    val instances: List<EC2InstanceDto>,
    val total: Int,
    val running: Int,
    val stopped: Int
)
