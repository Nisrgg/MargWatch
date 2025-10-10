package com.margwatch.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.google.android.gms.location.LocationServices

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun MapScreen(
    initialLatitude: Float? = null,
    initialLongitude: Float? = null,
    onLocationSelected: (Float, Float, String?) -> Unit,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    
    var currentLatitude by remember { mutableStateOf(initialLatitude) }
    var currentLongitude by remember { mutableStateOf(initialLongitude) }
    var selectedLatitude by remember { mutableStateOf(initialLatitude) }
    var selectedLongitude by remember { mutableStateOf(initialLongitude) }
    
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
                    currentLatitude = it.latitude.toFloat()
                    currentLongitude = it.longitude.toFloat()
                    selectedLatitude = it.latitude.toFloat()
                    selectedLongitude = it.longitude.toFloat()
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
                    currentLatitude = it.latitude.toFloat()
                    currentLongitude = it.longitude.toFloat()
                    selectedLatitude = it.latitude.toFloat()
                    selectedLongitude = it.longitude.toFloat()
                }
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
            // Top bar
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
                                        currentLatitude = it.latitude.toFloat()
                                        currentLongitude = it.longitude.toFloat()
                                        selectedLatitude = it.latitude.toFloat()
                                        selectedLongitude = it.longitude.toFloat()
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

            if (locationPermissionsState.allPermissionsGranted) {
                // Location input form
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Location Selection",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    // Current location display
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        elevation = CardDefaults.cardElevation(4.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Current Location",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Latitude: ${currentLatitude ?: "Not available"}")
                            Text("Longitude: ${currentLongitude ?: "Not available"}")
                        }
                    }
                    
                    // Manual location input
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        elevation = CardDefaults.cardElevation(4.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Manual Location Entry",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            var latInput by remember { mutableStateOf(selectedLatitude?.toString() ?: "") }
                            var lngInput by remember { mutableStateOf(selectedLongitude?.toString() ?: "") }
                            
                            OutlinedTextField(
                                value = latInput,
                                onValueChange = { 
                                    latInput = it
                                    it.toFloatOrNull()?.let { lat ->
                                        selectedLatitude = lat
                                    }
                                },
                                label = { Text("Latitude") },
                                modifier = Modifier.fillMaxWidth()
                            )
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            OutlinedTextField(
                                value = lngInput,
                                onValueChange = { 
                                    lngInput = it
                                    it.toFloatOrNull()?.let { lng ->
                                        selectedLongitude = lng
                                    }
                                },
                                label = { Text("Longitude") },
                                modifier = Modifier.fillMaxWidth()
                            )
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
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = {
                                        selectedLatitude = 37.7749f
                                        selectedLongitude = -122.4194f
                                    },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("San Francisco")
                                }
                                
                                Button(
                                    onClick = {
                                        selectedLatitude = 40.7128f
                                        selectedLongitude = -74.0060f
                                    },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("New York")
                                }
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.weight(1f))
                    
                    // Confirm button
                    Button(
                        onClick = {
                            if (selectedLatitude != null && selectedLongitude != null) {
                                onLocationSelected(
                                    selectedLatitude!!,
                                    selectedLongitude!!,
                                    "Selected Location"
                                )
                            } else {
                                Toast.makeText(context, "Please select a location", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = selectedLatitude != null && selectedLongitude != null
                    ) {
                        Icon(Icons.Default.Check, contentDescription = "Confirm Location")
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Confirm Location")
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
                        text = "Location Permission Required",
                        style = MaterialTheme.typography.headlineMedium,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                    
                    Text(
                        text = "We need location permission to show your current location.",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(bottom = 24.dp)
                    )
                    
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

