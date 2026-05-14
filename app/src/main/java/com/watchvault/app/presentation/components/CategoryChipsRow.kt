package com.watchvault.app.presentation.components

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * Displays a row of category filter chips. The selected category is highlighted. Clicking a chip
 * triggers the provided callback with the selected category.
 */
@Composable
fun CategoryChipsRow(
    categories: List<String>,
    modifier: Modifier = Modifier,
    onCategorySelected: (String) -> Unit
) {
    var selected by remember { mutableStateOf(categories.first()) }
    Row(modifier = modifier) {
        categories.forEachIndexed { index, category ->
            FilterChip(
                selected = selected == category,
                onClick = {
                    selected = category
                    onCategorySelected(category)
                },
                label = { Text(text = category) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                    selectedLabelColor = MaterialTheme.colorScheme.primary,
                    containerColor = MaterialTheme.colorScheme.surface,
                    labelColor = MaterialTheme.colorScheme.onSurface
                )
            )
            if (index < categories.lastIndex) {
                Spacer(modifier = Modifier.padding(horizontal = 4.dp))
            }
        }
    }
}