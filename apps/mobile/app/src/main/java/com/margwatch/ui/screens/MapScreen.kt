package com.margwatch.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMapOptions
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.margwatch.utils.GeocoderUtils
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun MapScreen(
    initialLocation: LatLng? = null,
    onLocationSelected: (LatLng, String?) -> Unit,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    val scope = rememberCoroutineScope()
    
    var selectedLocation by remember { mutableStateOf<LatLng?>(initialLocation) }
    var selectedAddress by remember { mutableStateOf<String?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    var searchSuggestions by remember { mutableStateOf<List<String>>(emptyList()) }
    var showSuggestions by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    
    var cameraPosition by remember {
        mutableStateOf(
            CameraPosition.fromLatLngZoom(
                initialLocation ?: LatLng(23.0724, 76.8601), // Default to India
                15f
            )
        )
    }
    
    val locationPermissionsState = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
    )

    val requestLocationLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true) {
            getCurrentLocation(context, fusedLocationClient) { location ->
                location?.let {
                    val latLng = LatLng(it.latitude, it.longitude)
                    selectedLocation = latLng
                    cameraPosition = CameraPosition.fromLatLngZoom(latLng, 15f)
                    
                    // Get address for current location
                    scope.launch {
                        val address = GeocoderUtils.getAddressFromLocation(context, it.latitude, it.longitude)
                        selectedAddress = address
                    }
                }
            }
        } else {
            Toast.makeText(context, "Location permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    LaunchedEffect(Unit) {
        if (locationPermissionsState.allPermissionsGranted) {
            getCurrentLocation(context, fusedLocationClient) { location ->
                location?.let {
                    val latLng = LatLng(it.latitude, it.longitude)
                    selectedLocation = latLng
                    cameraPosition = CameraPosition.fromLatLngZoom(latLng, 15f)
                    
                    // Get address for current location
                    scope.launch {
                        val address = GeocoderUtils.getAddressFromLocation(context, it.latitude, it.longitude)
                        selectedAddress = address
                    }
                }
            }
        }
    }

    // Search functionality
    val onSearch = {
        if (searchQuery.isNotBlank()) {
            isLoading = true
            scope.launch {
                val coordinates = GeocoderUtils.getLocationFromAddress(context, searchQuery)
                if (coordinates != null) {
                    val latLng = LatLng(coordinates.first, coordinates.second)
                    selectedLocation = latLng
                    cameraPosition = CameraPosition.fromLatLngZoom(latLng, 15f)
                    
                    // Get address for searched location
                    val address = GeocoderUtils.getAddressFromLocation(context, coordinates.first, coordinates.second)
                    selectedAddress = address
                    
                    showSuggestions = false
                } else {
                    Toast.makeText(context, "Location not found: $searchQuery", Toast.LENGTH_SHORT).show()
                }
                isLoading = false
            }
        }
    }

    // Get suggestions as user types
    LaunchedEffect(searchQuery) {
        if (searchQuery.length >= 3) {
            scope.launch {
                val suggestions = GeocoderUtils.getLocationSuggestions(context, searchQuery)
                searchSuggestions = suggestions.take(5) // Limit to 5 suggestions
                showSuggestions = suggestions.isNotEmpty()
            }
        } else {
            showSuggestions = false
            searchSuggestions = emptyList()
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Top bar with search
            TopAppBar(
                title = { Text("Select Location") },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            if (locationPermissionsState.allPermissionsGranted) {
                                getCurrentLocation(context, fusedLocationClient) { location ->
                                    location?.let {
                                        val latLng = LatLng(it.latitude, it.longitude)
                                        selectedLocation = latLng
                                        cameraPosition = CameraPosition.fromLatLngZoom(latLng, 15f)
                                        
                                        scope.launch {
                                            val address = GeocoderUtils.getAddressFromLocation(context, it.latitude, it.longitude)
                                            selectedAddress = address
                                        }
                                    }
                                }
                            } else {
                                requestLocationLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        }
                    ) {
                        Icon(Icons.Default.LocationOn, contentDescription = "My Location")
                    }
                }
            )

            // Search bar
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search for a location...") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        leadingIcon = {
                            Icon(Icons.Default.Search, contentDescription = "Search")
                        }
                    )
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = onSearch,
                        enabled = searchQuery.isNotBlank() && !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("Search")
                        }
                    }
                }
            }

            if (locationPermissionsState.allPermissionsGranted) {
                // Map with Google Maps integration
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                ) {
                    GoogleMap(
                        modifier = Modifier.fillMaxSize(),
                        cameraPositionState = CameraPositionState(
                            position = cameraPosition
                        ),
                        // Removed hardcoded mapId - it's optional and might not exist
                        properties = MapProperties(),
                        onMapLoaded = {
                            android.util.Log.d("MapScreen", "✅ Google Map loaded successfully")
                        },
                        onMapClick = { latLng ->
                            selectedLocation = latLng
                            scope.launch {
                                val address = GeocoderUtils.getAddressFromLocation(context, latLng.latitude, latLng.longitude)
                                selectedAddress = address
                            }
                        }
                    ) {
                        // Map markers
                        selectedLocation?.let { location ->
                            Marker(
                                state = MarkerState(position = location),
                                title = "Selected Location",
                                snippet = selectedAddress ?: "Tap to confirm this location"
                            )
                        }
                    }

                    // Search suggestions dropdown
                    if (showSuggestions && searchSuggestions.isNotEmpty()) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp)
                                .align(Alignment.TopCenter),
                            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                        ) {
                            LazyColumn(
                                modifier = Modifier.heightIn(max = 200.dp)
                            ) {
                                items(searchSuggestions) { suggestion ->
                                    TextButton(
                                        onClick = {
                                            searchQuery = suggestion
                                            onSearch()
                                        },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = suggestion,
                                            modifier = Modifier.fillMaxWidth(),
                                            textAlign = androidx.compose.ui.text.style.TextAlign.Start
                                        )
                                    }
                                }
                            }
                        }
                    }


                    // Confirm button
                    FloatingActionButton(
                        onClick = {
                            selectedLocation?.let { location ->
                                onLocationSelected(location, selectedAddress)
                            }
                        },
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(16.dp)
                    ) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = "Confirm Location"
                        )
                    }
                }
            } else {
                // Permission request
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "Location permission is required to use the map",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = {
                            requestLocationLauncher.launch(
                                arrayOf(
                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                    Manifest.permission.ACCESS_COARSE_LOCATION
                                )
                            )
                        }
                    ) {
                        Text("Grant Permission")
                    }
                }
            }
        }
    }
}

// Fallback manual location input when Google Maps API is not available
@Composable
fun ManualLocationInput(
    selectedLocation: LatLng?,
    selectedAddress: String?,
    onLocationChanged: (LatLng, String?) -> Unit
) {
    var manualLat by remember { mutableStateOf(selectedLocation?.latitude?.toString() ?: "") }
    var manualLng by remember { mutableStateOf(selectedLocation?.longitude?.toString() ?: "") }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Warning message
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "⚠️ Google Maps API Key Missing",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Please enter coordinates manually or search for a location above.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }
        
        // Current location display
        if (selectedLocation != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(4.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Selected Location",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Latitude: ${selectedLocation.latitude}")
                    Text("Longitude: ${selectedLocation.longitude}")
                    selectedAddress?.let { address ->
                        Text("Address: $address")
                    }
                }
            }
        }
        
        // Manual coordinate input
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(4.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Manual Coordinate Entry",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = manualLat,
                    onValueChange = { manualLat = it },
                    label = { Text("Latitude") },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("e.g., 22.4707") }
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = manualLng,
                    onValueChange = { manualLng = it },
                    label = { Text("Longitude") },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("e.g., 70.0577") }
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Button(
                    onClick = {
                        try {
                            val lat = manualLat.toDoubleOrNull()
                            val lng = manualLng.toDoubleOrNull()
                            if (lat != null && lng != null) {
                                val latLng = LatLng(lat, lng)
                                scope.launch {
                                    val address = GeocoderUtils.getAddressFromLocation(context, lat, lng)
                                    onLocationChanged(latLng, address)
                                }
                            } else {
                                Toast.makeText(context, "Invalid coordinates", Toast.LENGTH_SHORT).show()
                            }
                        } catch (e: Exception) {
                            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = manualLat.isNotBlank() && manualLng.isNotBlank()
                ) {
                    Text("Set Location")
                }
            }
        }
        
        // Quick location buttons
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(4.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Quick Locations",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            val latLng = LatLng(22.4707, 70.0577) // Jamnagar
                            scope.launch {
                                val address = GeocoderUtils.getAddressFromLocation(context, 22.4707, 70.0577)
                                onLocationChanged(latLng, address)
                            }
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Jamnagar")
                    }
                    
                    Button(
                        onClick = {
                            val latLng = LatLng(23.0225, 72.5714) // Ahmedabad
                            scope.launch {
                                val address = GeocoderUtils.getAddressFromLocation(context, 23.0225, 72.5714)
                                onLocationChanged(latLng, address)
                            }
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Ahmedabad")
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            val latLng = LatLng(19.0760, 72.8777) // Mumbai
                            scope.launch {
                                val address = GeocoderUtils.getAddressFromLocation(context, 19.0760, 72.8777)
                                onLocationChanged(latLng, address)
                            }
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Mumbai")
                    }
                    
                    Button(
                        onClick = {
                            val latLng = LatLng(28.6139, 77.2090) // Delhi
                            scope.launch {
                                val address = GeocoderUtils.getAddressFromLocation(context, 28.6139, 77.2090)
                                onLocationChanged(latLng, address)
                            }
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Delhi")
                    }
                }
            }
        }
    }
}

// Helper function to get current location
private fun getCurrentLocation(
    context: Context,
    fusedLocationClient: com.google.android.gms.location.FusedLocationProviderClient,
    onLocationResult: (Location?) -> Unit
) {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {

        fusedLocationClient.lastLocation
            .addOnSuccessListener { location: Location? ->
                onLocationResult(location)
            }
            .addOnFailureListener { e ->
                Toast.makeText(context, "Failed to get location: ${e.message}", Toast.LENGTH_SHORT).show()
                onLocationResult(null)
            }
    } else {
        onLocationResult(null)
    }
}
