package com.opsradar.app.presentation.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.opsradar.app.data.models.DailyCostDto
import com.opsradar.app.presentation.theme.*

@Composable
fun SpendingBarChart(
    title: String,
    currency: String,
    dailyCosts: List<DailyCostDto>,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
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
                    text = title,
                    color = TextPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )

                if (dailyCosts.isNotEmpty()) {
                    val total = dailyCosts.sumOf { it.amount }
                    Text(
                        text = "$currency ${Math.round(total * 100) / 100.0}",
                        color = AwsOrange,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (dailyCosts.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No recent daily cost data available",
                        color = TextMuted,
                        fontSize = 12.sp
                    )
                }
            } else {
                val maxAmount = (dailyCosts.maxOfOrNull { it.amount } ?: 10.0).coerceAtLeast(1.0)

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp)
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val width = size.width
                        val height = size.height

                        val barCount = dailyCosts.size
                        val totalGap = width * 0.3f
                        val gapWidth = if (barCount > 1) totalGap / (barCount - 1) else 0f
                        val barWidth = (width - totalGap) / barCount

                        dailyCosts.forEachIndexed { index, cost ->
                            val x = index * (barWidth + gapWidth)
                            val normalizedHeight = (cost.amount / maxAmount).toFloat().coerceIn(0.04f, 1f)
                            val barHeight = normalizedHeight * (height - 18f)
                            val y = height - barHeight - 14f

                            drawRoundRect(
                                color = AwsOrange.copy(alpha = 0.85f),
                                topLeft = Offset(x, y),
                                size = Size(barWidth, barHeight),
                                cornerRadius = CornerRadius(2.dp.toPx(), 2.dp.toPx())
                            )
                        }
                    }

                    // Display date labels under bars
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.BottomCenter),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        dailyCosts.take(5).forEach { cost ->
                            val shortDate = if (cost.date.length >= 5) cost.date.substring(5) else cost.date
                            Text(
                                text = shortDate,
                                color = TextMuted,
                                fontSize = 9.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }
        }
    }
}

