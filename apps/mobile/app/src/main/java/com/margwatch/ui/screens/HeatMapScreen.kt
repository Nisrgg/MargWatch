package com.margwatch.ui.screens

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.margwatch.data.local.TokenManager
import com.margwatch.data.model.HeatMapPoint
import com.margwatch.data.repository.MargWatchRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HeatMapScreen(
    onNavigateBack: () -> Unit,
    heatMapViewModel: HeatMapViewModel = viewModel()
) {
    val uiState by heatMapViewModel.uiState.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val tokenManager = remember { TokenManager(context) }
    
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var dateRange by remember { mutableStateOf<Pair<String?, String?>?>(null) }
    var showFilters by remember { mutableStateOf(false) }
    
    // Available categories
    val categories = listOf(
        "POTHOLE" to "Potholes",
        "CRACK" to "Cracks", 
        "DAMAGE" to "Damage",
        "OBSTRUCTION" to "Obstructions",
        "OTHER" to "Other"
    )
    
    // Load heatmap data when filters change
    LaunchedEffect(selectedCategory, dateRange) {
        tokenManager.getToken().collect { token ->
            if (token != null) {
                heatMapViewModel.loadHeatMapData(
                    token = token,
                    category = selectedCategory,
                    dateFrom = dateRange?.first,
                    dateTo = dateRange?.second
                )
            }
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Top App Bar
            TopAppBar(
                title = { Text("Complaint Heatmap") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showFilters = !showFilters }) {
                        Icon(Icons.Default.Settings, contentDescription = "Filters")
                    }
                }
            )

            // Filters Panel
            if (showFilters) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Filter Options",
                            style = MaterialTheme.typography.titleMedium
                        )
                        
                        // Category Filter
                        Text(
                            text = "Category",
                            style = MaterialTheme.typography.labelMedium
                        )
                        LazyColumn(
                            modifier = Modifier.height(120.dp)
                        ) {
                            items(categories) { (value, label) ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(
                                        selected = selectedCategory == value,
                                        onClick = { 
                                            selectedCategory = if (selectedCategory == value) null else value
                                        }
                                    )
                                    Text(
                                        text = label,
                                        modifier = Modifier.padding(start = 8.dp)
                                    )
                                }
                            }
                        }
                        
                        // Date Range Filter
                        Text(
                            text = "Date Range (Optional)",
                            style = MaterialTheme.typography.labelMedium
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = dateRange?.first ?: "",
                                onValueChange = { 
                                    dateRange = dateRange?.copy(first = it) ?: Pair(it, null)
                                },
                                label = { Text("From (YYYY-MM-DD)") },
                                modifier = Modifier.weight(1f),
                                placeholder = { Text("2024-01-01") }
                            )
                            OutlinedTextField(
                                value = dateRange?.second ?: "",
                                onValueChange = { 
                                    dateRange = dateRange?.copy(second = it) ?: Pair(null, it)
                                },
                                label = { Text("To (YYYY-MM-DD)") },
                                modifier = Modifier.weight(1f),
                                placeholder = { Text("2024-12-31") }
                            )
                        }
                        
                        // Clear Filters
                        Button(
                            onClick = {
                                selectedCategory = null
                                dateRange = null
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Clear Filters")
                        }
                    }
                }
            }

            // Map
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) {
                GoogleMap(
                    modifier = Modifier.fillMaxSize(),
                    cameraPositionState = CameraPositionState(
                        position = CameraPosition.fromLatLngZoom(
                            LatLng(23.0225, 72.5714), // Center on Gujarat
                            8f
                        )
                    ),
                    onMapLoaded = {
                        android.util.Log.d("HeatMapScreen", "Map loaded with ${uiState.heatMapPoints.size} points")
                    }
                ) {
                    // Individual markers for complaint locations
                    uiState.heatMapPoints.take(100).forEach { point ->
                        Marker(
                            state = MarkerState(position = LatLng(point.latitude, point.longitude)),
                            title = "Complaint Area",
                            snippet = "Category: ${point.category}"
                        )
                    }
                }

                // Loading indicator
                if (uiState.isLoading) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Card(
                            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(24.dp),
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text("Loading heatmap data...")
                            }
                        }
                    }
                }

                // Error message
                if (uiState.error != null) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    Icons.Default.Warning,
                                    contentDescription = "Error",
                                    tint = MaterialTheme.colorScheme.onErrorContainer
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Failed to load heatmap data",
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                                Text(
                                    text = uiState.error ?: "Unknown error",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(
                                    onClick = {
                                        scope.launch {
                                            tokenManager.getToken().collect { token ->
                                                if (token != null) {
                                                    heatMapViewModel.loadHeatMapData(
                                                        token = token,
                                                        category = selectedCategory,
                                                        dateFrom = dateRange?.first,
                                                        dateTo = dateRange?.second
                                                    )
                                                }
                                            }
                                        }
                                    }
                                ) {
                                    Text("Retry")
                                }
                            }
                        }
                    }
                }

                // Stats overlay
                if (uiState.heatMapPoints.isNotEmpty()) {
                    Card(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(16.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp)
                        ) {
                            Text(
                                text = "📊 Heatmap Stats",
                                style = MaterialTheme.typography.labelMedium
                            )
                            Text(
                                text = "Total Points: ${uiState.heatMapPoints.size}",
                                style = MaterialTheme.typography.bodySmall
                            )
                            Text(
                                text = "Categories: ${uiState.heatMapPoints.map { it.category }.distinct().size}",
                                style = MaterialTheme.typography.bodySmall
                            )
                            if (selectedCategory != null) {
                                Text(
                                    text = "Filtered: ${selectedCategory}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ViewModel for HeatMap
class HeatMapViewModel : androidx.lifecycle.ViewModel() {
    private val repository = MargWatchRepository()
    
    private val _uiState = MutableStateFlow(HeatMapUiState())
    val uiState: StateFlow<HeatMapUiState> = _uiState.asStateFlow()
    
    fun loadHeatMapData(
        token: String,
        category: String? = null,
        dateFrom: String? = null,
        dateTo: String? = null
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            try {
                val result = repository.getHeatMapData(category, dateFrom, dateTo)
                result.onSuccess { response ->
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            heatMapPoints = response.heatMapData,
                            error = null
                        )
                    }
                    android.util.Log.d("HeatMapViewModel", "Loaded ${response.heatMapData.size} heatmap points")
                }.onFailure { error ->
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            error = error.message ?: "Unknown error"
                        )
                    }
                    android.util.Log.e("HeatMapViewModel", "Failed to load heatmap data: ${error.message}")
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Unknown error"
                    )
                }
                android.util.Log.e("HeatMapViewModel", "Exception loading heatmap data: ${e.message}")
            }
        }
    }
}

// UI State for HeatMap
data class HeatMapUiState(
    val isLoading: Boolean = false,
    val heatMapPoints: List<HeatMapPoint> = emptyList(),
    val error: String? = null
)
