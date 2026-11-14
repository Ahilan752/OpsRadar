package com.opsradar.app.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.opsradar.app.presentation.theme.*

@Composable
fun StatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val (dotColor, textColor, bgColor) = when (status.uppercase()) {
        "RUNNING", "OK", "HEALTHY", "CONNECTED" -> Triple(
            StatusGreen,
            StatusGreenText,
            StatusGreen.copy(alpha = 0.15f)
        )
        "ALARM", "CRITICAL", "FAILED", "ERROR" -> Triple(
            StatusRed,
            StatusRedText,
            StatusRed.copy(alpha = 0.15f)
        )
        "PENDING", "INSUFFICIENT_DATA", "WARNING" -> Triple(
            StatusAmber,
            StatusAmberText,
            StatusAmber.copy(alpha = 0.15f)
        )
        "STOPPED", "TERMINATED", "DISCONNECTED" -> Triple(
            StatusNeutral,
            TextSecondary,
            BorderDark.copy(alpha = 0.3f)
        )
        else -> Triple(
            TextMuted,
            TextSecondary,
            BorderDark.copy(alpha = 0.2f)
        )
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(dotColor)
            )
            Text(
                text = status.uppercase(),
                color = textColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(start = 6.dp)
            )
        }
    }
}

