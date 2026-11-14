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
import com.opsradar.app.presentation.viewmodels.InfrastructureViewModel

@Composable
fun InfrastructureScreen(
    infrastructureViewModel: InfrastructureViewModel,
    onNavigateToDetail: (String) -> Unit
) {
    val state by infrastructureViewModel.uiState.collectAsState()
    var searchInput by remember { mutableStateOf(state.searchQuery) }

    val filterOptions = listOf("ALL", "RUNNING", "STOPPED", "PENDING", "TERMINATED")

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
                infrastructureViewModel.setSearchQuery(it)
            },
            placeholder = { Text("Search instance name, ID, or IP...", color = TextMuted, fontSize = 13.sp) },
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
                    onClick = { infrastructureViewModel.setStateFilter(opt) },
                    label = {
                        Text(
                            text = opt,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) TextPrimary else TextSecondary
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = AwsOrange.copy(alpha = 0.2f),
                        selectedLabelColor = AwsOrange,
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

        Spacer(modifier = Modifier.height(10.dp))

        // Counters row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${state.instances.size} INSTANCES FOUND",
                color = TextSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
            Text(
                text = "Running: ${state.runningCount} • Stopped: ${state.stoppedCount}",
                color = TextMuted,
                fontSize = 11.sp
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        if (state.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AwsOrange)
            }
        } else if (state.error != null) {
            ErrorRetryView(
                message = state.error!!,
                onRetry = { infrastructureViewModel.loadInstances() },
                modifier = Modifier.weight(1f)
            )
        } else if (state.instances.isEmpty()) {
            EmptyStateView(
                title = "No EC2 Instances Found",
                message = if (state.searchQuery.isNotBlank() || state.stateFilter != "ALL") {
                    "No instances matched your search or state filter."
                } else {
                    "No EC2 instances exist in this region. Switch region or deploy instances in your AWS console."
                },
                modifier = Modifier.weight(1f)
            )
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(state.instances) { inst ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(SurfaceDarkNavy)
                            .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                            .clickable { onNavigateToDetail(inst.id) }
                            .padding(14.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = inst.name,
                                    color = TextPrimary,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.weight(1f)
                                )
                                StatusBadge(status = inst.state)
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "ID: ${inst.id}",
                                        color = TextSecondary,
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace
                                    )
                                    Text(
                                        text = "Type: ${inst.type} • AZ: ${inst.availabilityZone}",
                                        color = TextMuted,
                                        fontSize = 11.sp
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = "Details",
                                    tint = TextMuted
                                )
                            }

                            if (inst.publicIp != null || inst.privateIp != null) {
                                Spacer(modifier = Modifier.height(6.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    if (inst.publicIp != null) {
                                        Text(
                                            text = "Public: ${inst.publicIp}",
                                            color = AwsBlue,
                                            fontSize = 11.sp,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                    if (inst.privateIp != null) {
                                        Text(
                                            text = "Private: ${inst.privateIp}",
                                            color = TextSecondary,
                                            fontSize = 11.sp,
                                            fontFamily = FontFamily.Monospace
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
}

