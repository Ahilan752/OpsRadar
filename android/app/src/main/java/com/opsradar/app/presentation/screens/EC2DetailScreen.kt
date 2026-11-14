package com.opsradar.app.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import com.opsradar.app.presentation.components.MetricLineChart
import com.opsradar.app.presentation.components.StatusBadge
import com.opsradar.app.presentation.theme.*
import com.opsradar.app.presentation.viewmodels.InfrastructureViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EC2DetailScreen(
    instanceId: String,
    infrastructureViewModel: InfrastructureViewModel,
    onNavigateBack: () -> Unit
) {
    val state by infrastructureViewModel.uiState.collectAsState()

    LaunchedEffect(instanceId) {
        infrastructureViewModel.loadInstanceDetails(instanceId)
    }

    val inst = state.selectedInstance
    val metrics = state.instanceMetrics
    val timeRanges = listOf("1h", "3h", "6h", "24h", "7d", "30d")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = inst?.name ?: instanceId,
                            color = TextPrimary,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = instanceId,
                            color = TextSecondary,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
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
            // Instance Metadata Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(SurfaceDarkNavy)
                        .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                        .padding(14.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "INSTANCE METADATA",
                                color = TextSecondary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp
                            )
                            inst?.let { StatusBadge(status = it.state) }
                        }

                        Divider(color = BorderDark, thickness = 1.dp)

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Type", color = TextSecondary, fontSize = 12.sp)
                            Text(inst?.type ?: "—", color = TextPrimary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Availability Zone", color = TextSecondary, fontSize = 12.sp)
                            Text(inst?.availabilityZone ?: "—", color = TextPrimary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Public IPv4", color = TextSecondary, fontSize = 12.sp)
                            Text(inst?.publicIp ?: "None (Private)", color = if (inst?.publicIp != null) AwsBlue else TextMuted, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Private IPv4", color = TextSecondary, fontSize = 12.sp)
                            Text(inst?.privateIp ?: "—", color = TextPrimary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Platform", color = TextSecondary, fontSize = 12.sp)
                            Text(inst?.platform ?: "Linux/UNIX", color = TextPrimary, fontSize = 12.sp)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("System Status Check", color = TextSecondary, fontSize = 12.sp)
                            Text(inst?.systemStatus?.uppercase() ?: "OK", color = StatusGreenText, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Instance Status Check", color = TextSecondary, fontSize = 12.sp)
                            Text(inst?.instanceStatus?.uppercase() ?: "OK", color = StatusGreenText, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // CloudWatch Time Range Selector
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "CLOUDWATCH METRICS",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )

                    if (state.isMetricsLoading) {
                        CircularProgressIndicator(color = AwsOrange, modifier = Modifier.size(16.dp))
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(timeRanges) { tr ->
                        val isSelected = state.selectedTimeRange == tr
                        FilterChip(
                            selected = isSelected,
                            onClick = { infrastructureViewModel.loadMetrics(instanceId, tr) },
                            label = { Text(tr, fontSize = 11.sp, color = if (isSelected) TextPrimary else TextSecondary) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = AwsOrange.copy(alpha = 0.2f),
                                containerColor = SurfaceDarkNavy
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isSelected,
                                borderColor = if (isSelected) AwsOrange else BorderDark
                            )
                        )
                    }
                }
            }

            // Metric 1: CPU Utilization
            item {
                val cpuMetric = metrics["CPUUtilization"]
                MetricLineChart(
                    title = "CPU Utilization",
                    unit = "%",
                    dataPoints = cpuMetric?.dataPoints ?: emptyList(),
                    lineColor = AwsOrange
                )
            }

            // Metric 2: Network In
            item {
                val netIn = metrics["NetworkIn"]
                MetricLineChart(
                    title = "Network In",
                    unit = "Bytes",
                    dataPoints = netIn?.dataPoints ?: emptyList(),
                    lineColor = AwsBlue
                )
            }

            // Metric 3: Network Out
            item {
                val netOut = metrics["NetworkOut"]
                MetricLineChart(
                    title = "Network Out",
                    unit = "Bytes",
                    dataPoints = netOut?.dataPoints ?: emptyList(),
                    lineColor = Color(0xFFA371F7)
                )
            }

            // Metric 4: Disk Read & Write Bytes
            item {
                val diskRead = metrics["DiskReadBytes"]
                MetricLineChart(
                    title = "Disk Read",
                    unit = "Bytes",
                    dataPoints = diskRead?.dataPoints ?: emptyList(),
                    lineColor = StatusGreen
                )
            }

            // Memory note callout
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(6.dp))
                        .background(SurfaceDarkNavy)
                        .border(1.dp, BorderDark, RoundedCornerShape(6.dp))
                        .padding(12.dp)
                ) {
                    Text(
                        text = "ℹ️ EC2 memory utilization requires the CloudWatch Agent installed inside the operating system. Standard hypervisor metrics do not report OS-level memory.",
                        color = TextMuted,
                        fontSize = 11.sp,
                        lineHeight = 15.sp
                    )
                }
            }
        }
    }
}
