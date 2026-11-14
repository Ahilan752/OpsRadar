package com.opsradar.app.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.opsradar.app.core.Resource
import com.opsradar.app.data.models.AlarmHistoryItemDto
import com.opsradar.app.data.models.CloudWatchAlarmDto
import com.opsradar.app.data.repositories.AuthRepository
import com.opsradar.app.data.repositories.MonitoringRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AlarmsUiState(
    val isLoading: Boolean = false,
    val alarms: List<CloudWatchAlarmDto> = emptyList(),
    val totalCount: Int = 0,
    val inAlarmCount: Int = 0,
    val okCount: Int = 0,
    val stateFilter: String = "ALL", // ALL, ALARM, OK, INSUFFICIENT_DATA
    val searchQuery: String = "",
    val error: String? = null,
    val selectedAlarm: CloudWatchAlarmDto? = null,
    val alarmHistory: List<AlarmHistoryItemDto> = emptyList(),
    val isHistoryLoading: Boolean = false
)

@HiltViewModel
class AlarmsViewModel @Inject constructor(
    private val monitoringRepository: MonitoringRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AlarmsUiState())
    val uiState: StateFlow<AlarmsUiState> = _uiState.asStateFlow()

    init {
        loadAlarms()
    }

    fun loadAlarms() {
        viewModelScope.launch {
            val region = authRepository.selectedRegion.firstOrNull() ?: "us-east-1"
            val state = if (_uiState.value.stateFilter == "ALL") null else _uiState.value.stateFilter
            val search = _uiState.value.searchQuery.ifBlank { null }

            monitoringRepository.getCloudWatchAlarms(region, state, search).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true, error = null) }
                    is Resource.Success -> {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                alarms = resource.data.alarms,
                                totalCount = resource.data.total,
                                inAlarmCount = resource.data.inAlarm,
                                okCount = resource.data.ok,
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
        loadAlarms()
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadAlarms()
    }

    fun selectAlarm(alarm: CloudWatchAlarmDto) {
        _uiState.update { it.copy(selectedAlarm = alarm) }
        loadAlarmHistory(alarm.alarmName)
    }

    fun loadAlarmHistory(alarmName: String) {
        viewModelScope.launch {
            val region = authRepository.selectedRegion.firstOrNull() ?: "us-east-1"
            _uiState.update { it.copy(isHistoryLoading = true) }

            monitoringRepository.getAlarmHistory(alarmName, region).collect { res ->
                when (res) {
                    is Resource.Success -> _uiState.update { it.copy(alarmHistory = res.data, isHistoryLoading = false) }
                    is Resource.Error -> _uiState.update { it.copy(isHistoryLoading = false) }
                    else -> {}
                }
            }
        }
    }
}
