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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.maps.GoogleMapOptions
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.margwatch.data.local.TokenManager
import com.margwatch.shared.types.HeatMapData
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
                // Check if Google Maps API key is available
                val mapsApiKey = try {
                    val appInfo = context.packageManager.getApplicationInfo(context.packageName, android.content.pm.PackageManager.GET_META_DATA)
                    appInfo.metaData?.getString("com.google.android.geo.API_KEY") ?: ""
                } catch (e: Exception) {
                    android.util.Log.e("HeatMapScreen", "Failed to get Maps API key", e)
                    ""
                }
                
                android.util.Log.d("HeatMapScreen", "=== GOOGLE MAPS API KEY CHECK ===")
                android.util.Log.d("HeatMapScreen", "API Key present: ${mapsApiKey.isNotEmpty()}")
                android.util.Log.d("HeatMapScreen", "API Key length: ${mapsApiKey.length}")
                if (mapsApiKey.isEmpty()) {
                    android.util.Log.e("HeatMapScreen", "❌ API Key is EMPTY!")
                    android.util.Log.e("HeatMapScreen", "Please add GOOGLE_MAPS_API_KEY to local.properties and rebuild")
                } else {
                    android.util.Log.d("HeatMapScreen", "✅ API Key loaded (first 10 chars: ${mapsApiKey.take(10)}...)")
                }
                android.util.Log.d("HeatMapScreen", "HeatMap points count: ${uiState.heatMapPoints.size}")
                
                if (mapsApiKey.isEmpty()) {
                    // Show error if API key is missing
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
                                    text = "Google Maps API Key Missing",
                                    color = MaterialTheme.colorScheme.onErrorContainer,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Please configure GOOGLE_MAPS_API_KEY in local.properties and rebuild the app.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "SHA-1: 95:4A:0F:1B:D5:A8:47:91:C6:CF:86:02:38:70:E4:99:6C:27:76:E4",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onErrorContainer,
                                    fontFamily = FontFamily.Monospace
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Package: com.margwatch",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onErrorContainer,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                } else {
                    var mapLoaded by remember { mutableStateOf(false) }
                    var mapError by remember { mutableStateOf<String?>(null) }
                    
                    GoogleMap(
                        modifier = Modifier.fillMaxSize(),
                        cameraPositionState = CameraPositionState(
                            position = CameraPosition.fromLatLngZoom(
                                LatLng(20.5937, 78.9629), // Center on India
                                5f // Wider zoom for Pan India view
                            )
                        ),
                        // Remove hardcoded mapId - it's optional and might not exist
                        properties = MapProperties(
                            isMyLocationEnabled = false
                        ),
                        onMapLoaded = {
                            mapLoaded = true
                            android.util.Log.d("HeatMapScreen", "✅ Map loaded successfully")
                            android.util.Log.d("HeatMapScreen", "  - HeatMap points: ${uiState.heatMapPoints.size}")
                            android.util.Log.d("HeatMapScreen", "  - API Key configured: Yes")
                        },
                        uiSettings = MapUiSettings(
                            zoomControlsEnabled = true,
                            myLocationButtonEnabled = false
                        )
                    ) {
                        // Individual markers for complaint locations
                        android.util.Log.d("HeatMapScreen", "Rendering ${uiState.heatMapPoints.take(100).size} markers")
                        uiState.heatMapPoints.take(100).forEachIndexed { index, point ->
                            // Create marker - coordinates are already Double from API
                            Marker(
                                state = MarkerState(position = LatLng(point.latitude.toDouble(), point.longitude.toDouble())),
                                title = "Complaint Area",
                                snippet = "Category: ${point.category}"
                            )
                            if (index == 0) {
                                android.util.Log.d("HeatMapScreen", "First marker at: ${point.latitude}, ${point.longitude}")
                            }
                        }
                    }
                    
                    // Show loading indicator while map is loading
                    if (!mapLoaded && mapError == null) {
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
                                    Text("Loading map...")
                                }
                            }
                        }
                    }
                    
                    // Show error if map failed to load
                    mapError?.let { error ->
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
                                        text = "Map Loading Error",
                                        color = MaterialTheme.colorScheme.onErrorContainer
                                    )
                                    Text(
                                        text = error,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onErrorContainer
                                    )
                                }
                            }
                        }
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
    val heatMapPoints: List<HeatMapData> = emptyList(),
    val error: String? = null
)
