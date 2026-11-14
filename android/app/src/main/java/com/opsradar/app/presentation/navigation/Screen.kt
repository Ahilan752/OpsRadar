package com.opsradar.app.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String? = null, val icon: ImageVector? = null) {
    // Auth routes
    object Login : Screen("login")
    object Register : Screen("register")

    // Primary Bottom Navigation tabs
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Infrastructure : Screen("infrastructure", "Infrastructure", Icons.Default.Dns)
    object Alarms : Screen("alarms", "Alarms", Icons.Default.Notifications)
    object Billing : Screen("billing", "Billing", Icons.Default.AttachMoney)
    object Settings : Screen("settings", "Settings", Icons.Default.Settings)

    // Secondary / Detail routes
    object EC2Detail : Screen("ec2_detail/{instanceId}") {
        fun createRoute(instanceId: String) = "ec2_detail/$instanceId"
    }

    object AlarmDetail : Screen("alarm_detail/{alarmName}") {
        fun createRoute(alarmName: String) = "alarm_detail/$alarmName"
    }

    object ConnectAccount : Screen("connect_account")
}

val BottomNavItems = listOf(
    Screen.Dashboard,
    Screen.Infrastructure,
    Screen.Alarms,
    Screen.Billing,
    Screen.Settings
)

