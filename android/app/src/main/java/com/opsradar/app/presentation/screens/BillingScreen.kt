package com.opsradar.app.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.opsradar.app.presentation.viewmodels.BillingViewModel

@Composable
fun BillingScreen(
    billingViewModel: BillingViewModel
) {
    val state by billingViewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDarkNavy)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "AWS BILLING & COST EXPLORER",
                    color = TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Financial analytics & daily spending trend",
                    color = TextSecondary,
                    fontSize = 11.sp
                )
            }

            Button(
                onClick = { billingViewModel.loadBilling() },
                colors = ButtonDefaults.buttonColors(containerColor = SurfaceDarkNavy),
                shape = RoundedCornerShape(4.dp),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text("Refresh", color = TextPrimary, fontSize = 11.sp)
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        if (state.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AwsOrange)
            }
        } else if (state.error != null) {
            ErrorRetryView(
                message = state.error!!,
                onRetry = { billingViewModel.loadBilling() },
                modifier = Modifier.weight(1f)
            )
        } else if (state.billingSummary == null) {
            EmptyStateView(
                title = "Cost Explorer Unavailable",
                message = "Cost Explorer data is currently being aggregated by AWS or permissions need to be configured.",
                modifier = Modifier.weight(1f)
            )
        } else {
            val summary = state.billingSummary!!

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Cost Overview Cards
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            StatCard(
                                title = "Month-to-Date Cost",
                                value = "${summary.currency} ${summary.currentMonthToDate}",
                                subtitle = "Updated by AWS",
                                highlightColor = AwsOrange,
                                modifier = Modifier.weight(1f)
                            )
                            StatCard(
                                title = "Previous Month Total",
                                value = "${summary.currency} ${summary.lastMonthTotal}",
                                subtitle = "Full billing cycle",
                                highlightColor = TextPrimary,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        if (summary.forecastCost != null) {
                            StatCard(
                                title = "End-of-Month Forecast",
                                value = "${summary.currency} ${summary.forecastCost}",
                                subtitle = "Projected AWS spending",
                                highlightColor = AwsBlue,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }

                // Daily Spending Trend Chart
                item {
                    SpendingBarChart(
                        title = "Daily Spend (${summary.currency})",
                        currency = summary.currency,
                        dailyCosts = summary.dailyCosts
                    )
                }

                // Service Breakdown
                item {
                    Text(
                        text = "SERVICE-WISE SPENDING BREAKDOWN",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                }

                items(summary.serviceBreakdown) { serviceCost ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(SurfaceDarkNavy)
                            .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                            .padding(14.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = serviceCost.service,
                                    color = TextPrimary,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = "${summary.currency} ${serviceCost.amount}",
                                    color = TextPrimary,
                                    fontSize = 13.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            // Progress bar
                            LinearProgressIndicator(
                                progress = { (serviceCost.percentage / 100f).coerceIn(0f, 1f) },
                                color = AwsOrange,
                                trackColor = BorderDark,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp))
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = "${serviceCost.percentage}% of total AWS spending",
                                color = TextMuted,
                                fontSize = 11.sp
                            )
                        }
                    }
                }

                // Notice callout
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
                            text = "ℹ️ ${summary.reportingDelayNotice}",
                            color = TextMuted,
                            fontSize = 11.sp,
                            lineHeight = 15.sp
                        )
                    }
                }
            }
        }
    }
}
