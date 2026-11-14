package com.opsradar.app.data.models

data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null,
    val error: ApiError? = null
)

data class ApiError(
    val code: String,
    val details: Any? = null
)

data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val createdAt: String
)

data class TokenPairDto(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: String
)

data class AuthResponseData(
    val user: UserDto,
    val tokens: TokenPairDto
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RefreshTokenRequest(
    val refreshToken: String
)

