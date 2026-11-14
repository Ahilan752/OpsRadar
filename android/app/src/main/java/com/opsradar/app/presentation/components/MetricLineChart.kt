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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.opsradar.app.data.models.MetricDataPointDto
import com.opsradar.app.presentation.theme.*

@Composable
fun MetricLineChart(
    title: String,
    unit: String,
    dataPoints: List<MetricDataPointDto>,
    modifier: Modifier = Modifier,
    lineColor: Color = AwsOrange
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

                if (dataPoints.isNotEmpty()) {
                    val latestVal = dataPoints.last().value
                    Text(
                        text = "$latestVal $unit",
                        color = lineColor,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (dataPoints.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(130.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No CloudWatch data available for selected period",
                        color = TextMuted,
                        fontSize = 12.sp
                    )
                }
            } else {
                val maxVal = (dataPoints.maxOfOrNull { it.value } ?: 100.0).coerceAtLeast(1.0)
                val minVal = (dataPoints.minOfOrNull { it.value } ?: 0.0).coerceAtLeast(0.0)

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(130.dp)
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val width = size.width
                        val height = size.height

                        // Horizontal guideline (50%)
                        drawLine(
                            color = BorderDark,
                            start = Offset(0f, height / 2),
                            end = Offset(width, height / 2),
                            strokeWidth = 1f
                        )

                        // Bottom baseline
                        drawLine(
                            color = BorderDark,
                            start = Offset(0f, height),
                            end = Offset(width, height),
                            strokeWidth = 1f
                        )

                        val range = (maxVal - minVal).coerceAtLeast(0.0001)
                        val stepX = if (dataPoints.size > 1) width / (dataPoints.size - 1) else width

                        val path = Path()
                        val fillPath = Path()

                        dataPoints.forEachIndexed { index, point ->
                            val x = index * stepX
                            val normalizedY = ((point.value - minVal) / range).toFloat()
                            val y = height - (normalizedY * (height - 10f)) - 5f

                            if (index == 0) {
                                path.moveTo(x, y)
                                fillPath.moveTo(x, height)
                                fillPath.lineTo(x, y)
                            } else {
                                path.lineTo(x, y)
                                fillPath.lineTo(x, y)
                            }

                            if (index == dataPoints.size - 1) {
                                fillPath.lineTo(x, height)
                                fillPath.close()
                            }
                        }

                        // Gradient fill
                        drawPath(
                            path = fillPath,
                            brush = Brush.verticalGradient(
                                colors = listOf(lineColor.copy(alpha = 0.25f), Color.Transparent)
                            )
                        )

                        // Data line
                        drawPath(
                            path = path,
                            color = lineColor,
                            style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round)
                        )
                    }

                    // Max & Min values indicators
                    Text(
                        text = "max: ${Math.round(maxVal * 10) / 10.0} $unit",
                        color = TextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.align(Alignment.TopEnd)
                    )
                    Text(
                        text = "min: ${Math.round(minVal * 10) / 10.0} $unit",
                        color = TextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.align(Alignment.BottomEnd)
                    )
                }
            }
        }
    }
}
