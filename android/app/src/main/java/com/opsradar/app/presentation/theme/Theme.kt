package com.opsradar.app.presentation.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = AwsOrange,
    onPrimary = TextPrimary,
    primaryContainer = SurfaceVariantDark,
    onPrimaryContainer = AwsOrangeHover,
    secondary = AwsBlue,
    onSecondary = BgDarkNavy,
    background = BgDarkNavy,
    onBackground = TextPrimary,
    surface = SurfaceDarkNavy,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = TextSecondary,
    outline = BorderDark,
    error = StatusRed,
    onError = TextPrimary
)

@Composable
fun OpsRadarTheme(
    darkTheme: Boolean = true, // OpsRadar enforces dark theme as primary
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            window?.let {
                it.statusBarColor = BgDarkNavy.toArgb()
                it.navigationBarColor = BgDarkNavy.toArgb()
                WindowCompat.getInsetsController(it, view).isAppearanceLightStatusBars = false
                WindowCompat.getInsetsController(it, view).isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

