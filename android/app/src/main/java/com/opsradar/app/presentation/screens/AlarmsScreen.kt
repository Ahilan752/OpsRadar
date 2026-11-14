package com.opsradar.app.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.opsradar.app.presentation.components.EmptyStateView
import com.opsradar.app.presentation.components.ErrorRetryView
import com.opsradar.app.presentation.components.StatusBadge
import com.opsradar.app.presentation.theme.*
import com.opsradar.app.presentation.viewmodels.AlarmsViewModel

@Composable
fun AlarmsScreen(
    alarmsViewModel: AlarmsViewModel,
    onNavigateToDetail: (String) -> Unit
) {
    val state by alarmsViewModel.uiState.collectAsState()
    var searchInput by remember { mutableStateOf(state.searchQuery) }

    val filterOptions = listOf("ALL", "ALARM", "OK", "INSUFFICIENT_DATA")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDarkNavy)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        // Search bar
        OutlinedTextField(
            value = searchInput,
            onValueChange = {
                searchInput = it
                alarmsViewModel.setSearchQuery(it)
            },
            placeholder = { Text("Search CloudWatch alarm name...", color = TextMuted, fontSize = 13.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AwsOrange,
                unfocusedBorderColor = BorderDark,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary,
                focusedContainerColor = SurfaceDarkNavy,
                unfocusedContainerColor = SurfaceDarkNavy
            ),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(10.dp))

        // State filter chips
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(filterOptions) { opt ->
                val isSelected = state.stateFilter == opt
                FilterChip(
                    selected = isSelected,
                    onClick = { alarmsViewModel.setStateFilter(opt) },
                    label = {
                        Text(
                            text = opt,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) TextPrimary else TextSecondary
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = when (opt) {
                            "ALARM" -> StatusRed.copy(alpha = 0.2f)
                            "OK" -> StatusGreen.copy(alpha = 0.2f)
                            "INSUFFICIENT_DATA" -> StatusAmber.copy(alpha = 0.2f)
                            else -> AwsOrange.copy(alpha = 0.2f)
                        },
                        containerColor = SurfaceDarkNavy
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = isSelected,
                        borderColor = when (opt) {
                            "ALARM" -> StatusRed
                            "OK" -> StatusGreen
                            "INSUFFICIENT_DATA" -> StatusAmber
                            else -> AwsOrange
                        }
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Alarms count summary
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${state.alarms.size} ALARMS",
                color = TextSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("In Alarm: ${state.inAlarmCount}", color = StatusRedText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text("•", color = TextMuted, fontSize = 11.sp)
                Text("OK: ${state.okCount}", color = StatusGreenText, fontSize = 11.sp)
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        if (state.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AwsOrange)
            }
        } else if (state.error != null) {
            ErrorRetryView(
                message = state.error!!,
                onRetry = { alarmsViewModel.loadAlarms() },
                modifier = Modifier.weight(1f)
            )
        } else if (state.alarms.isEmpty()) {
            EmptyStateView(
                title = "No CloudWatch Alarms",
                message = if (state.searchQuery.isNotBlank() || state.stateFilter != "ALL") {
                    "No alarms match the active filters."
                } else {
                    "No CloudWatch alarms configured in this region."
                },
                modifier = Modifier.weight(1f)
            )
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(state.alarms) { alarm ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(SurfaceDarkNavy)
                            .border(
                                1.dp,
                                if (alarm.stateValue == "ALARM") StatusRed.copy(alpha = 0.5f) else BorderDark,
                                RoundedCornerShape(8.dp)
                            )
                            .clickable {
                                alarmsViewModel.selectAlarm(alarm)
                                onNavigateToDetail(alarm.alarmName)
                            }
                            .padding(14.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = alarm.alarmName,
                                    color = TextPrimary,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.weight(1f)
                                )
                                StatusBadge(status = alarm.stateValue)
                            }

                            Spacer(modifier = Modifier.height(6.dp))

                            Text(
                                text = alarm.stateReason,
                                color = TextSecondary,
                                fontSize = 12.sp,
                                maxLines = 2,
                                lineHeight = 16.sp
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${alarm.namespace ?: "AWS"} / ${alarm.metricName ?: "Metric"}",
                                    color = TextMuted,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = "Details",
                                    tint = TextMuted
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

