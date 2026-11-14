package com.opsradar.app.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.opsradar.app.core.Resource
import com.opsradar.app.data.models.AWSConnectionDto
import com.opsradar.app.data.models.DashboardOverviewDto
import com.opsradar.app.data.repositories.AWSConnectionRepository
import com.opsradar.app.data.repositories.AuthRepository
import com.opsradar.app.data.repositories.MonitoringRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val isLoading: Boolean = false,
    val overview: DashboardOverviewDto? = null,
    val error: String? = null,
    val connections: List<AWSConnectionDto> = emptyList(),
    val selectedConnection: AWSConnectionDto? = null,
    val selectedRegion: String = "us-east-1",
    val availableRegions: List<String> = listOf("us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "ap-south-1")
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val monitoringRepository: MonitoringRepository,
    private val connectionRepository: AWSConnectionRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadConnections()
    }

    fun loadConnections() {
        viewModelScope.launch {
            connectionRepository.listConnections().collect { res ->
                if (res is Resource.Success) {
                    val conns = res.data
                    val currentSelectedId = authRepository.selectedConnectionId.firstOrNull()
                    val active = conns.find { it._id == currentSelectedId } ?: conns.firstOrNull()

                    _uiState.update {
                        it.copy(
                            connections = conns,
                            selectedConnection = active,
                            selectedRegion = active?.defaultRegion ?: it.selectedRegion
                        )
                    }

                    if (active != null) {
                        authRepository.selectConnection(active._id, active.defaultRegion)
                        loadOverview(active.defaultRegion)
                        loadRegions(active._id)
                    }
                }
            }
        }
    }

    fun loadOverview(region: String? = null) {
        val reg = region ?: _uiState.value.selectedRegion
        viewModelScope.launch {
            monitoringRepository.getDashboardOverview(reg).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true, error = null) }
                    is Resource.Success -> _uiState.update { it.copy(isLoading = false, overview = resource.data, error = null) }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    private fun loadRegions(connectionId: String) {
        viewModelScope.launch {
            connectionRepository.getRegions(connectionId).collect { res ->
                if (res is Resource.Success && res.data.isNotEmpty()) {
                    _uiState.update { it.copy(availableRegions = res.data) }
                }
            }
        }
    }

    fun selectConnection(connection: AWSConnectionDto) {
        viewModelScope.launch {
            authRepository.selectConnection(connection._id, connection.defaultRegion)
            _uiState.update {
                it.copy(
                    selectedConnection = connection,
                    selectedRegion = connection.defaultRegion
                )
            }
            loadOverview(connection.defaultRegion)
            loadRegions(connection._id)
        }
    }

    fun selectRegion(region: String) {
        viewModelScope.launch {
            authRepository.selectRegion(region)
            _uiState.update { it.copy(selectedRegion = region) }
            loadOverview(region)
        }
    }
}
