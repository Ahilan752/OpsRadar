package com.opsradar.app.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.opsradar.app.core.Resource
import com.opsradar.app.data.models.EC2InstanceDto
import com.opsradar.app.data.models.MetricSeriesDto
import com.opsradar.app.data.repositories.AuthRepository
import com.opsradar.app.data.repositories.MonitoringRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class InfrastructureUiState(
    val isLoading: Boolean = false,
    val instances: List<EC2InstanceDto> = emptyList(),
    val totalCount: Int = 0,
    val runningCount: Int = 0,
    val stoppedCount: Int = 0,
    val stateFilter: String = "ALL",
    val searchQuery: String = "",
    val error: String? = null,
    val selectedInstance: EC2InstanceDto? = null,
    val instanceMetrics: Map<String, MetricSeriesDto> = emptyMap(),
    val isMetricsLoading: Boolean = false,
    val selectedTimeRange: String = "1h"
)

@HiltViewModel
class InfrastructureViewModel @Inject constructor(
    private val monitoringRepository: MonitoringRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(InfrastructureUiState())
    val uiState: StateFlow<InfrastructureUiState> = _uiState.asStateFlow()

    init {
        loadInstances()
    }

    fun loadInstances() {
        viewModelScope.launch {
            val region = authRepository.selectedRegion.firstOrNull() ?: "us-east-1"
            val state = if (_uiState.value.stateFilter == "ALL") null else _uiState.value.stateFilter
            val search = _uiState.value.searchQuery.ifBlank { null }

            monitoringRepository.getEC2Instances(region, state, search).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true, error = null) }
                    is Resource.Success -> {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                instances = resource.data.instances,
                                totalCount = resource.data.total,
                                runningCount = resource.data.running,
                                stoppedCount = resource.data.stopped,
                                error = null
                            )
                        }
                    }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun setStateFilter(filter: String) {
        _uiState.update { it.copy(stateFilter = filter) }
        loadInstances()
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadInstances()
    }

    fun loadInstanceDetails(instanceId: String) {
        viewModelScope.launch {
            val region = authRepository.selectedRegion.firstOrNull() ?: "us-east-1"
            monitoringRepository.getEC2InstanceDetails(instanceId, region).collect { res ->
                if (res is Resource.Success) {
                    _uiState.update { it.copy(selectedInstance = res.data) }
                }
            }
            loadMetrics(instanceId, _uiState.value.selectedTimeRange)
        }
    }

    fun loadMetrics(instanceId: String, timeRange: String) {
        viewModelScope.launch {
            val region = authRepository.selectedRegion.firstOrNull() ?: "us-east-1"
            _uiState.update { it.copy(selectedTimeRange = timeRange, isMetricsLoading = true) }

            monitoringRepository.getCloudWatchMetrics(instanceId, region, timeRange).collect { res ->
                when (res) {
                    is Resource.Success -> _uiState.update { it.copy(instanceMetrics = res.data, isMetricsLoading = false) }
                    is Resource.Error -> _uiState.update { it.copy(isMetricsLoading = false) }
                    else -> {}
                }
            }
        }
    }
}
