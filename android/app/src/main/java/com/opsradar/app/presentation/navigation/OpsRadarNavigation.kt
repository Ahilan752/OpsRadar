package com.opsradar.app.presentation.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.opsradar.app.presentation.screens.*
import com.opsradar.app.presentation.theme.*
import com.opsradar.app.presentation.viewmodels.*

@Composable
fun OpsRadarNavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel = hiltViewModel(),
    dashboardViewModel: DashboardViewModel = hiltViewModel(),
    infrastructureViewModel: InfrastructureViewModel = hiltViewModel(),
    alarmsViewModel: AlarmsViewModel = hiltViewModel(),
    billingViewModel: BillingViewModel = hiltViewModel(),
    connectionViewModel: ConnectionViewModel = hiltViewModel()
) {
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState(initial = false)
    val startDestination = if (isLoggedIn) Screen.Dashboard.route else Screen.Login.route

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val isTopLevelRoute = BottomNavItems.any { it.route == currentRoute }

    Scaffold(
        containerColor = BgDarkNavy,
        bottomBar = {
            if (isLoggedIn && isTopLevelRoute) {
                NavigationBar(
                    containerColor = SurfaceDarkNavy,
                    tonalElevation = 0.dp
                ) {
                    BottomNavItems.forEach { screen ->
                        val isSelected = currentRoute == screen.route
                        NavigationBarItem(
                            icon = {
                                screen.icon?.let {
                                    Icon(
                                        imageVector = it,
                                        contentDescription = screen.title,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            },
                            label = {
                                Text(
                                    text = screen.title ?: "",
                                    fontSize = 10.sp,
                                    fontWeight = if (isSelected) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Normal
                                )
                            },
                            selected = isSelected,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AwsOrange,
                                selectedTextColor = AwsOrange,
                                unselectedIconColor = TextMuted,
                                unselectedTextColor = TextMuted,
                                indicatorColor = SurfaceDarkNavy
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding)
        ) {
            // Authentication
            composable(Screen.Login.route) {
                LoginScreen(
                    authViewModel = authViewModel,
                    onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                    onLoginSuccess = {
                        dashboardViewModel.loadConnections()
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.Register.route) {
                RegisterScreen(
                    authViewModel = authViewModel,
                    onNavigateToLogin = { navController.popBackStack() },
                    onRegisterSuccess = {
                        navController.navigate(Screen.ConnectAccount.route) {
                            popUpTo(Screen.Register.route) { inclusive = true }
                        }
                    }
                )
            }

            // Primary Tabs
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    dashboardViewModel = dashboardViewModel,
                    onNavigateToConnect = { navController.navigate(Screen.ConnectAccount.route) },
                    onNavigateToEC2Detail = { instanceId ->
                        navController.navigate(Screen.EC2Detail.createRoute(instanceId))
                    },
                    onNavigateToAlarmDetail = { alarmName ->
                        navController.navigate(Screen.AlarmDetail.createRoute(alarmName))
                    }
                )
            }

            composable(Screen.Infrastructure.route) {
                InfrastructureScreen(
                    infrastructureViewModel = infrastructureViewModel,
                    onNavigateToDetail = { instanceId ->
                        navController.navigate(Screen.EC2Detail.createRoute(instanceId))
                    }
                )
            }

            composable(Screen.Alarms.route) {
                AlarmsScreen(
                    alarmsViewModel = alarmsViewModel,
                    onNavigateToDetail = { alarmName ->
                        navController.navigate(Screen.AlarmDetail.createRoute(alarmName))
                    }
                )
            }

            composable(Screen.Billing.route) {
                BillingScreen(
                    billingViewModel = billingViewModel
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen(
                    authViewModel = authViewModel,
                    dashboardViewModel = dashboardViewModel,
                    onNavigateToConnect = { navController.navigate(Screen.ConnectAccount.route) },
                    onLoggedOut = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            // Secondary / Detail Routes
            composable(Screen.ConnectAccount.route) {
                ConnectionWizardScreen(
                    connectionViewModel = connectionViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onConnectionComplete = {
                        dashboardViewModel.loadConnections()
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.ConnectAccount.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(
                route = Screen.EC2Detail.route,
                arguments = listOf(navArgument("instanceId") { type = NavType.StringType })
            ) { backStackEntry ->
                val instanceId = backStackEntry.arguments?.getString("instanceId") ?: ""
                EC2DetailScreen(
                    instanceId = instanceId,
                    infrastructureViewModel = infrastructureViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(
                route = Screen.AlarmDetail.route,
                arguments = listOf(navArgument("alarmName") { type = NavType.StringType })
            ) { backStackEntry ->
                val alarmName = backStackEntry.arguments?.getString("alarmName") ?: ""
                AlarmDetailScreen(
                    alarmName = alarmName,
                    alarmsViewModel = alarmsViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}

