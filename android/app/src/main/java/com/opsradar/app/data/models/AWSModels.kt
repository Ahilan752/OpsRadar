package com.opsradar.app.data.models

data class AWSConnectionDto(
    val _id: String,
    val accountName: String,
    val accountId: String,
    val roleArn: String,
    val externalId: String,
    val defaultRegion: String,
    val connectionStatus: String, // PENDING, CONNECTED, ERROR, DISCONNECTED
    val lastErrorMessage: String? = null,
    val lastValidatedAt: String? = null,
    val createdAt: String? = null
)

data class InitiateConnectionRequest(
    val accountName: String,
    val defaultRegion: String = "us-east-1"
)

data class ConnectionInitiationResponse(
    val connectionId: String,
    val accountName: String,
    val externalId: String,
    val backendPrincipalArn: String,
    val backendAccountId: String,
    val suggestedRoleName: String,
    val trustPolicyJson: String,
    val permissionsPolicyJson: String,
    val cloudFormationTemplateUrl: String
)

data class CompleteConnectionRequest(
    val connectionId: String,
    val accountId: String,
    val roleArn: String,
    val defaultRegion: String = "us-east-1"
)

data class RegionsResponse(
    val regions: List<String>
)
