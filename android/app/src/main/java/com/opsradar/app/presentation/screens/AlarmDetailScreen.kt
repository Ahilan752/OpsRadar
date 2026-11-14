package com.opsradar.app.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.opsradar.app.presentation.components.StatusBadge
import com.opsradar.app.presentation.theme.*
import com.opsradar.app.presentation.viewmodels.AlarmsViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlarmDetailScreen(
    alarmName: String,
    alarmsViewModel: AlarmsViewModel,
    onNavigateBack: () -> Unit
) {
    val state by alarmsViewModel.uiState.collectAsState()

    LaunchedEffect(alarmName) {
        alarmsViewModel.loadAlarmHistory(alarmName)
    }

    val alarm = state.selectedAlarm ?: state.alarms.find { it.alarmName == alarmName }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = alarmName,
                        color = TextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BgDarkNavy)
            )
        },
        containerColor = BgDarkNavy
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Alarm Status Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(SurfaceDarkNavy)
                        .border(
                            1.dp,
                            if (alarm?.stateValue == "ALARM") StatusRed.copy(alpha = 0.5f) else BorderDark,
                            RoundedCornerShape(8.dp)
                        )
                        .padding(14.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "CURRENT ALARM STATE",
                                color = TextSecondary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp
                            )
                            StatusBadge(status = alarm?.stateValue ?: "OK")
                        }

                        Text(
                            text = alarm?.stateReason ?: "No detailed state reason provided.",
                            color = TextPrimary,
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )

                        Divider(color = BorderDark, thickness = 1.dp)

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Metric Namespace", color = TextSecondary, fontSize = 12.sp)
                            Text(alarm?.namespace ?: "AWS/EC2", color = TextPrimary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Metric Name", color = TextSecondary, fontSize = 12.sp)
                            Text(alarm?.metricName ?: "—", color = AwsOrange, fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.SemiBold)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Threshold Condition", color = TextSecondary, fontSize = 12.sp)
                            Text("${alarm?.comparisonOperator ?: ">="} ${alarm?.threshold ?: 0.0}", color = TextPrimary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Evaluation Periods", color = TextSecondary, fontSize = 12.sp)
                            Text("${alarm?.evaluationPeriods ?: 1} period(s) of ${alarm?.period ?: 300}s", color = TextPrimary, fontSize = 12.sp)
                        }

                        if (alarm?.dimensions?.isNotEmpty() == true) {
                            alarm.dimensions.forEach { dim ->
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(dim.name, color = TextSecondary, fontSize = 12.sp)
                                    Text(dim.value, color = AwsBlue, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                                }
                            }
                        }
                    }
                }
            }

            // Alarm History Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "ALARM STATE HISTORY (AUDIT TRAIL)",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                    if (state.isHistoryLoading) {
                        CircularProgressIndicator(color = AwsOrange, modifier = Modifier.size(16.dp))
                    }
                }
            }

            if (state.alarmHistory.isEmpty() && !state.isHistoryLoading) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(SurfaceDarkNavy)
                            .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No recent state changes recorded in CloudWatch history",
                            color = TextMuted,
                            fontSize = 12.sp
                        )
                    }
                }
            } else {
                items(state.alarmHistory) { historyItem ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(SurfaceDarkNavy)
                            .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                            .padding(12.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = historyItem.historyItemType ?: "StateUpdate",
                                    color = TextPrimary,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = historyItem.timestamp?.substringBefore("T") ?: "",
                                    color = TextMuted,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = historyItem.historySummary ?: "State transition recorded.",
                                color = TextSecondary,
                                fontSize = 12.sp,
                                lineHeight = 16.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

