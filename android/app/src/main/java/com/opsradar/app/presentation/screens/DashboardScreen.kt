package com.opsradar.app.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.opsradar.app.presentation.components.*
import com.opsradar.app.presentation.theme.*
import com.opsradar.app.presentation.viewmodels.DashboardViewModel

@Composable
fun DashboardScreen(
    dashboardViewModel: DashboardViewModel,
    onNavigateToConnect: () -> Unit,
    onNavigateToEC2Detail: (String) -> Unit,
    onNavigateToAlarmDetail: (String) -> Unit
) {
    val state by dashboardViewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDarkNavy)
    ) {
        TopBarWithAccountSelector(
            title = "Dashboard",
            connections = state.connections,
            selectedConnection = state.selectedConnection,
            selectedRegion = state.selectedRegion,
            availableRegions = state.availableRegions,
            onSelectConnection = { dashboardViewModel.selectConnection(it) },
            onSelectRegion = { dashboardViewModel.selectRegion(it) },
            onRefresh = { dashboardViewModel.loadOverview() }
        )

        if (state.connections.isEmpty()) {
            EmptyStateView(
                title = "No AWS Accounts Connected",
                message = "Connect your AWS Account using a secure, read-only IAM Role to begin monitoring EC2, CloudWatch metrics, and AWS costs.",
                actionButtonText = "Connect AWS Account",
                onActionClick = onNavigateToConnect,
                modifier = Modifier.weight(1f)
            )
        } else if (state.isLoading && state.overview == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AwsOrange)
            }
        } else if (state.error != null && state.overview == null) {
            ErrorRetryView(
                message = state.error!!,
                onRetry = { dashboardViewModel.loadOverview() },
                modifier = Modifier.weight(1f)
            )
        } else {
            val overview = state.overview

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Overview Summary Cards Grid
                item {
                    val summary = overview?.summary
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            StatCard(
                                title = "Running EC2",
                                value = "${summary?.runningInstances ?: 0}",
                                subtitle = "of ${summary?.totalInstances ?: 0} total",
                                highlightColor = StatusGreen,
                                modifier = Modifier.weight(1f)
                            )
                            StatCard(
                                title = "Active Alarms",
                                value = "${summary?.activeAlarms ?: 0}",
                                subtitle = if ((summary?.activeAlarms ?: 0) == 0) "All healthy" else "Needs attention",
                                highlightColor = if ((summary?.activeAlarms ?: 0) > 0) StatusRed else StatusGreen,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            StatCard(
                                title = "Month-to-Date Spend",
                                value = "${summary?.currency ?: "USD"} ${summary?.monthToDateCost ?: 0.0}",
                                subtitle = "AWS Cost Explorer",
                                highlightColor = AwsOrange,
                                modifier = Modifier.weight(1f)
                            )
                            StatCard(
                                title = "Stopped Instances",
                                value = "${summary?.stoppedInstances ?: 0}",
                                subtitle = "Region ${state.selectedRegion}",
                                highlightColor = TextSecondary,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }

                // Spending Trend Chart
                if (overview?.spendingTrend?.isNotEmpty() == true) {
                    item {
                        SpendingBarChart(
                            title = "Recent Daily Spending Trend",
                            currency = overview.summary.currency,
                            dailyCosts = overview.spendingTrend
                        )
                    }
                }

                // Active / Triggered Alarms
                if (overview?.triggeredAlarms?.isNotEmpty() == true) {
                    item {
                        Text(
                            text = "TRIGGERED ALARMS",
                            color = StatusRedText,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                    }

                    items(overview.triggeredAlarms) { alarm ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceDarkNavy)
                                .border(1.dp, StatusRed.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .clickable { onNavigateToAlarmDetail(alarm.alarmName) }
                                .padding(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = alarm.alarmName,
                                        color = TextPrimary,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = alarm.stateReason,
                                        color = TextSecondary,
                                        fontSize = 11.sp,
                                        maxLines = 2
                                    )
                                }
                                StatusBadge(status = "ALARM")
                            }
                        }
                    }
                }

                // Recent EC2 Instances
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "INSTANCES (${state.selectedRegion.uppercase()})",
                            color = TextSecondary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                        Text(
                            text = "${overview?.recentInstances?.size ?: 0} displayed",
                            color = TextMuted,
                            fontSize = 11.sp
                        )
                    }
                }

                if (overview?.recentInstances.isNullOrEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceDarkNavy)
                                .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                                .padding(20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No EC2 instances running in ${state.selectedRegion}",
                                color = TextMuted,
                                fontSize = 12.sp
                            )
                        }
                    }
                } else {
                    items(overview?.recentInstances ?: emptyList()) { inst ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceDarkNavy)
                                .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                                .clickable { onNavigateToEC2Detail(inst.id) }
                                .padding(14.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = inst.name,
                                        color = TextPrimary,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(3.dp))
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = inst.id,
                                            color = TextSecondary,
                                            fontSize = 11.sp,
                                            fontFamily = FontFamily.Monospace
                                        )
                                        Text(text = " • ", color = TextMuted, fontSize = 11.sp)
                                        Text(
                                            text = inst.type,
                                            color = AwsBlue,
                                            fontSize = 11.sp,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    StatusBadge(status = inst.state)
                                    Icon(
                                        imageVector = Icons.Default.ChevronRight,
                                        contentDescription = null,
                                        tint = TextMuted,
                                        modifier = Modifier.padding(start = 6.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
