package com.opsradar.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.opsradar.app.data.models.AWSConnectionDto
import com.opsradar.app.presentation.theme.*

@Composable
fun TopBarWithAccountSelector(
    title: String,
    connections: List<AWSConnectionDto>,
    selectedConnection: AWSConnectionDto?,
    selectedRegion: String,
    availableRegions: List<String>,
    onSelectConnection: (AWSConnectionDto) -> Unit,
    onSelectRegion: (String) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    var accountMenuExpanded by remember { mutableStateOf(false) }
    var regionMenuExpanded by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(BgDarkNavy)
            .padding(horizontal = 16.dp, vertical = 10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "OPS",
                    color = TextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "RADAR",
                    color = AwsOrange,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = title.uppercase(),
                    color = TextSecondary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            IconButton(onClick = onRefresh) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = "Refresh Data",
                    tint = TextSecondary
                )
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Selectors row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Account Selector Box
            Box(modifier = Modifier.weight(1f)) {
                Surface(
                    shape = MaterialTheme.shapes.extraSmall,
                    color = SurfaceDarkNavy,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { if (connections.isNotEmpty()) accountMenuExpanded = true }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = selectedConnection?.accountName ?: if (connections.isEmpty()) "No AWS Account" else "Select Account",
                            color = TextPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            maxLines = 1
                        )
                        Icon(
                            imageVector = Icons.Default.ArrowDropDown,
                            contentDescription = "Select Account",
                            tint = TextSecondary,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                DropdownMenu(
                    expanded = accountMenuExpanded,
                    onDismissRequest = { accountMenuExpanded = false },
                    modifier = Modifier.background(SurfaceDarkNavy)
                ) {
                    connections.forEach { conn ->
                        DropdownMenuItem(
                            text = {
                                Column {
                                    Text(conn.accountName, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                    Text(conn.accountId, color = TextSecondary, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                                }
                            },
                            onClick = {
                                onSelectConnection(conn)
                                accountMenuExpanded = false
                            }
                        )
                    }
                }
            }

            // Region Selector Box
            Box {
                Surface(
                    shape = MaterialTheme.shapes.extraSmall,
                    color = SurfaceDarkNavy,
                    modifier = Modifier.clickable { regionMenuExpanded = true }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Public,
                            contentDescription = "Region",
                            tint = AwsOrange,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = selectedRegion,
                            color = TextPrimary,
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        Icon(
                            imageVector = Icons.Default.ArrowDropDown,
                            contentDescription = "Select Region",
                            tint = TextSecondary,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                DropdownMenu(
                    expanded = regionMenuExpanded,
                    onDismissRequest = { regionMenuExpanded = false },
                    modifier = Modifier.background(SurfaceDarkNavy)
                ) {
                    availableRegions.forEach { reg ->
                        DropdownMenuItem(
                            text = { Text(reg, color = TextPrimary, fontSize = 12.sp, fontFamily = FontFamily.Monospace) },
                            onClick = {
                                onSelectRegion(reg)
                                regionMenuExpanded = false
                            }
                        )
                    }
                }
            }
        }

        HorizontalDivider(
            color = BorderDark,
            thickness = 1.dp,
            modifier = Modifier.padding(top = 10.dp)
        )
    }
}
