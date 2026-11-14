package com.opsradar.app.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.opsradar.app.core.Resource
import com.opsradar.app.data.models.AWSConnectionDto
import com.opsradar.app.data.models.ConnectionInitiationResponse
import com.opsradar.app.data.repositories.AWSConnectionRepository
import com.opsradar.app.data.repositories.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ConnectionWizardUiState(
    val step: Int = 1, // 1: Name & Region, 2: Instructions & Policies, 3: Role ARN Input & Validation
    val accountName: String = "",
    val defaultRegion: String = "us-east-1",
    val accountId: String = "",
    val roleArn: String = "",
    val initiationData: ConnectionInitiationResponse? = null,
    val isLoading: Boolean = false,
    val isCompleted: Boolean = false,
    val connectedAccount: AWSConnectionDto? = null,
    val error: String? = null
)

@HiltViewModel
class ConnectionViewModel @Inject constructor(
    private val connectionRepository: AWSConnectionRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ConnectionWizardUiState())
    val uiState: StateFlow<ConnectionWizardUiState> = _uiState.asStateFlow()

    fun setAccountName(name: String) {
        _uiState.update { it.copy(accountName = name) }
    }

    fun setDefaultRegion(region: String) {
        _uiState.update { it.copy(defaultRegion = region) }
    }

    fun setAccountId(id: String) {
        _uiState.update { it.copy(accountId = id) }
    }

    fun setRoleArn(arn: String) {
        _uiState.update { it.copy(roleArn = arn) }
    }

    fun initiateConnection() {
        if (_uiState.value.accountName.isBlank()) {
            _uiState.update { it.copy(error = "Please enter an account name") }
            return
        }

        viewModelScope.launch {
            connectionRepository.initiateConnection(
                _uiState.value.accountName,
                _uiState.value.defaultRegion
            ).collect { res ->
                when (res) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true, error = null) }
                    is Resource.Success -> {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                initiationData = res.data,
                                step = 2,
                                error = null
                            )
                        }
                    }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = res.message) }
                }
            }
        }
    }

    fun goToStep3() {
        _uiState.update { it.copy(step = 3, error = null) }
    }

    fun completeConnection() {
        val state = _uiState.value
        val init = state.initiationData ?: return

        if (state.accountId.length != 12) {
            _uiState.update { it.copy(error = "AWS Account ID must be exactly 12 numeric digits") }
            return
        }

        if (!state.roleArn.startsWith("arn:aws:iam::")) {
            _uiState.update { it.copy(error = "Role ARN must start with arn:aws:iam::") }
            return
        }

        viewModelScope.launch {
            connectionRepository.completeConnection(
                connectionId = init.connectionId,
                accountId = state.accountId,
                roleArn = state.roleArn,
                defaultRegion = state.defaultRegion
            ).collect { res ->
                when (res) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true, error = null) }
                    is Resource.Success -> {
                        authRepository.selectConnection(res.data._id, res.data.defaultRegion)
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                isCompleted = true,
                                connectedAccount = res.data,
                                error = null
                            )
                        }
                    }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = res.message) }
                }
            }
        }
    }

    fun resetWizard() {
        _uiState.value = ConnectionWizardUiState()
    }
}
