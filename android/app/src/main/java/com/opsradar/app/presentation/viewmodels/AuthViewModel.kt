package com.opsradar.app.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.opsradar.app.core.Resource
import com.opsradar.app.data.models.AuthResponseData
import com.opsradar.app.data.repositories.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null,
    val data: AuthResponseData? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    val isLoggedIn = authRepository.isLoggedIn
    val userName = authRepository.userName
    val userEmail = authRepository.userEmail

    private val _loginState = MutableStateFlow(AuthUiState())
    val loginState: StateFlow<AuthUiState> = _loginState.asStateFlow()

    private val _registerState = MutableStateFlow(AuthUiState())
    val registerState: StateFlow<AuthUiState> = _registerState.asStateFlow()

    fun login(email: String, pass: String) {
        viewModelScope.launch {
            authRepository.login(email, pass).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _loginState.value = AuthUiState(isLoading = true)
                    is Resource.Success -> _loginState.value = AuthUiState(isSuccess = true, data = resource.data)
                    is Resource.Error -> _loginState.value = AuthUiState(error = resource.message)
                }
            }
        }
    }

    fun register(name: String, email: String, pass: String) {
        viewModelScope.launch {
            authRepository.register(name, email, pass).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _registerState.value = AuthUiState(isLoading = true)
                    is Resource.Success -> _registerState.value = AuthUiState(isSuccess = true, data = resource.data)
                    is Resource.Error -> _registerState.value = AuthUiState(error = resource.message)
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }

    fun resetState() {
        _loginState.value = AuthUiState()
        _registerState.value = AuthUiState()
    }
}
