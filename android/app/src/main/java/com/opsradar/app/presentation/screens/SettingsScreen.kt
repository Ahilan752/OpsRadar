package com.opsradar.app.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Security
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
import com.opsradar.app.presentation.viewmodels.AuthViewModel
import com.opsradar.app.presentation.viewmodels.DashboardViewModel

@Composable
fun SettingsScreen(
    authViewModel: AuthViewModel,
    dashboardViewModel: DashboardViewModel,
    onNavigateToConnect: () -> Unit,
    onLoggedOut: () -> Unit
) {
    val userName by authViewModel.userName.collectAsState(initial = "DevOps Engineer")
    val userEmail by authViewModel.userEmail.collectAsState(initial = "")
    val dashState by dashboardViewModel.uiState.collectAsState()

    var alarmNotifsEnabled by remember { mutableStateOf(true) }
    var infraNotifsEnabled by remember { mutableStateOf(true) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDarkNavy)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // User Profile Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(SurfaceDarkNavy)
                    .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                    .padding(16.dp)
            ) {
                Column {
                    Text(
                        text = "SIGNED IN AS",
                        color = TextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = userName ?: "DevOps Engineer",
                        color = TextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = userEmail ?: "",
                        color = TextSecondary,
                        fontSize = 12.sp
                    )
                }
            }
        }

        // Connected AWS Accounts Section
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "CONNECTED AWS ACCOUNTS",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )

                TextButton(onClick = onNavigateToConnect) {
                    Icon(Icons.Default.Add, contentDescription = null, tint = AwsOrange, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Account", color = AwsOrange, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        if (dashState.connections.isEmpty()) {
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
                    Text("No AWS accounts connected", color = TextMuted, fontSize = 12.sp)
                }
            }
        } else {
            items(dashState.connections) { conn ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(SurfaceDarkNavy)
                        .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                        .padding(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = conn.accountName,
                                color = TextPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(3.dp))
                            Text(
                                text = "Account ID: ${conn.accountId}",
                                color = TextSecondary,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = "Default Region: ${conn.defaultRegion}",
                                color = TextMuted,
                                fontSize = 11.sp
                            )
                        }

                        StatusBadge(status = conn.connectionStatus)
                    }
                }
            }
        }

        // Notification Preferences
        item {
            Text(
                text = "NOTIFICATIONS",
                color = TextSecondary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
        }

        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(SurfaceDarkNavy)
                    .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("CloudWatch Alarm Alerts", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            Text("Notify when an alarm enters ALARM state", color = TextMuted, fontSize = 11.sp)
                        }
                        Switch(
                            checked = alarmNotifsEnabled,
                            onCheckedChange = { alarmNotifsEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = AwsOrange, checkedTrackColor = AwsOrange.copy(alpha = 0.3f))
                        )
                    }

                    Divider(color = BorderDark, thickness = 1.dp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Infrastructure State Alerts", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            Text("Notify when EC2 instances unexpectedly stop", color = TextMuted, fontSize = 11.sp)
                        }
                        Switch(
                            checked = infraNotifsEnabled,
                            onCheckedChange = { infraNotifsEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = AwsOrange, checkedTrackColor = AwsOrange.copy(alpha = 0.3f))
                        )
                    }
                }
            }
        }

        // Security Architecture Info
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(SurfaceDarkNavy)
                    .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                    .padding(14.dp)
            ) {
                Row(verticalAlignment = Alignment.Top) {
                    Icon(Icons.Default.Security, contentDescription = null, tint = StatusGreen, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text("Zero Permanent Credential Storage", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "OpsRadar connects via AWS STS AssumeRole with least-privilege read-only permissions and an External ID. AWS root credentials and secret keys are never requested or stored.",
                            color = TextMuted,
                            fontSize = 11.sp,
                            lineHeight = 15.sp
                        )
                    }
                }
            }
        }

        // Sign Out Button
        item {
            OutlinedButton(
                onClick = {
                    authViewModel.logout()
                    onLoggedOut()
                },
                colors = ButtonDefaults.outlinedButtonColors(contentColor = StatusRed),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(46.dp)
            ) {
                Icon(Icons.Default.ExitToApp, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
