package com.watchvault.app.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.watchvault.app.R
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat

private fun lightColors(context: android.content.Context): ColorScheme {
    val background = ContextCompat.getColor(context, R.color.color_background_light)
    val surface = ContextCompat.getColor(context, R.color.color_card_light)
    val primaryText = ContextCompat.getColor(context, R.color.color_primary_text_light)
    val secondaryText = ContextCompat.getColor(context, R.color.color_secondary_text_light)
    val accentStart = ContextCompat.getColor(context, R.color.color_accent_start)
    val accentEnd = ContextCompat.getColor(context, R.color.color_accent_end)
    return lightColorScheme(
        primary = Color(primaryText),
        onPrimary = Color(surface),
        secondary = Color(secondaryText),
        onSecondary = Color(surface),
        background = Color(background),
        onBackground = Color(primaryText),
        surface = Color(surface),
        onSurface = Color(primaryText)
    )
}

private fun darkColors(context: android.content.Context): ColorScheme {
    val background = ContextCompat.getColor(context, R.color.color_background_dark)
    val surface = ContextCompat.getColor(context, R.color.color_card_dark)
    val primaryText = ContextCompat.getColor(context, R.color.color_primary_text_dark)
    val secondaryText = ContextCompat.getColor(context, R.color.color_secondary_text_dark)
    return darkColorScheme(
        primary = Color(primaryText),
        onPrimary = Color(surface),
        secondary = Color(secondaryText),
        onSecondary = Color(surface),
        background = Color(background),
        onBackground = Color(primaryText),
        surface = Color(surface),
        onSurface = Color(primaryText)
    )
}

@Composable
fun WatchVaultTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val colors = if (darkTheme) darkColors(context) else lightColors(context)
    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}