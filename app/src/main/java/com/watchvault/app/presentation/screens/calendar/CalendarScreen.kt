package com.watchvault.app.presentation.screens.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.watchvault.app.domain.model.WatchEvent
import com.watchvault.app.presentation.viewmodel.CalendarViewModel
import java.time.LocalDate
import java.time.YearMonth

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScreen(navController: NavHostController, viewModel: CalendarViewModel = hiltViewModel()) {
    val events by viewModel.events.collectAsState()
    val month = remember { YearMonth.now() }
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }
    val selectedEvents = events.filter { it.eventDate == selectedDate.toString() }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var showSheet by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Watch Calendar", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(month.month.name.lowercase().replaceFirstChar { it.uppercase() } + " ${month.year}", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f))
        Spacer(Modifier.height(16.dp))
        CalendarGrid(month, events, selectedDate) { date -> selectedDate = date; showSheet = true }
        Spacer(Modifier.height(18.dp))
        Text("Selected date events", fontWeight = FontWeight.Bold)
        if (selectedEvents.isEmpty()) Text("No events for this date.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f), modifier = Modifier.padding(top = 8.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) { items(selectedEvents) { EventRow(it) } }
    }
    if (showSheet) {
        ModalBottomSheet(onDismissRequest = { showSheet = false }, sheetState = sheetState) {
            Column(Modifier.padding(20.dp)) {
                Text(selectedDate.toString(), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(12.dp))
                if (selectedEvents.isEmpty()) Text("No watch activity, reminders, or releases on this day.") else selectedEvents.forEach { EventRow(it) }
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun CalendarGrid(month: YearMonth, events: List<WatchEvent>, selected: LocalDate, onSelect: (LocalDate) -> Unit) {
    val days = (1..month.lengthOfMonth()).map { month.atDay(it) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        days.chunked(7).forEach { week ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                week.forEach { date ->
                    val hasEvents = events.any { it.eventDate == date.toString() }
                    Column(Modifier.size(44.dp).clip(CircleShape).background(if (date == selected) Color.Black else Color.Transparent).clickable { onSelect(date) }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                        Text(date.dayOfMonth.toString(), color = if (date == selected) Color.White else MaterialTheme.colorScheme.onSurface, fontWeight = if (hasEvents) FontWeight.Bold else FontWeight.Normal)
                        if (hasEvents) Box(Modifier.size(5.dp).clip(CircleShape).background(if (date == selected) Color.White else Color.Black))
                    }
                }
                repeat(7 - week.size) { Spacer(Modifier.size(44.dp)) }
            }
        }
    }
}

@Composable
private fun EventRow(event: WatchEvent) {
    Surface(shape = MaterialTheme.shapes.large, color = MaterialTheme.colorScheme.surface, shadowElevation = 1.dp, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp)) { Text(event.title, fontWeight = FontWeight.Bold); Text("${event.eventType} · ${event.description}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.62f)) }
    }
}
