package com.margwatch.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import coil.compose.AsyncImage
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.google.android.gms.maps.model.LatLng
import com.margwatch.data.local.TokenManager
import com.margwatch.ui.theme.MargWatchTheme
import com.margwatch.utils.GeocoderUtils
import com.margwatch.utils.NetworkMonitor
import com.margwatch.data.local.OfflineComplaintManager
import com.margwatch.data.model.OfflineComplaint
import com.margwatch.ui.components.NetworkStatusIndicator
import com.margwatch.ui.components.GradientButton
import com.margwatch.utils.SimpleNotificationManager
import kotlinx.coroutines.launch
import java.io.File

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun ComplaintSubmissionScreen(
    onNavigateBack: () -> Unit,
    complaintViewModel: ComplaintViewModel = viewModel()
) {
    val uiState by complaintViewModel.uiState.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val tokenManager = remember { TokenManager(context) }
    
    // Network connectivity state
    var isOnline by remember { mutableStateOf(true) }

    var currentLatitude by remember { mutableStateOf<Float?>(null) }
    var currentLongitude by remember { mutableStateOf<Float?>(null) }
    var currentAddress by remember { mutableStateOf<String?>(null) }
    var capturedImages by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var authToken by remember { mutableStateOf<String?>(null) }
    var showCamera by remember { mutableStateOf(false) }
    var showMap by remember { mutableStateOf(false) }
    var showLocationDialog by remember { mutableStateOf(false) }

    val locationPermissionsState = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
    )

    val cameraPermissionState = rememberMultiplePermissionsState(
        permissions = listOf(Manifest.permission.CAMERA)
    )

    // Get token when screen opens
    LaunchedEffect(Unit) {
        tokenManager.getToken().collect { token ->
            authToken = token
        }
    }

    // Placeholder for location client
    val fusedLocationClient = remember { com.google.android.gms.location.LocationServices.getFusedLocationProviderClient(context) }

    val requestLocationLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true) {
            // Permissions granted, try to get location
            getLocation(context, fusedLocationClient) { location ->
                currentLatitude = location?.latitude?.toFloat()
                currentLongitude = location?.longitude?.toFloat()
                // TODO: Implement reverse geocoding to get address
                currentAddress = "Detected Address (Placeholder)"
            }
        } else {
            Toast.makeText(context, "Location permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    LaunchedEffect(uiState.submissionSuccess) {
        if (uiState.submissionSuccess) {
            Toast.makeText(context, "Complaint Submitted Successfully!", Toast.LENGTH_SHORT).show()
            complaintViewModel.submissionSuccessHandled()
            onNavigateBack() // Go back to previous screen (e.g., MainScreen)
        }
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            complaintViewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Report Road Issue",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        NetworkStatusIndicator(isOnline = isOnline)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier.fillMaxSize()
        ) {
            // Background Gradient
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.05f),
                                MaterialTheme.colorScheme.surface,
                                MaterialTheme.colorScheme.secondary.copy(alpha = 0.03f)
                            )
                        )
                    )
            )
            
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Header Section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Card(
                            modifier = Modifier.size(64.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            ),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = "Report Issue",
                                    modifier = Modifier.size(32.dp),
                                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Report Road Issue",
                            style = MaterialTheme.typography.headlineSmall,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Help us maintain safe roads by reporting infrastructure issues",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }

                // Location Section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = "Location",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Location Details", 
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Location Info Cards
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Card(
                                modifier = Modifier.weight(1f),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(12.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "Latitude",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = currentLatitude?.toString() ?: "N/A",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                            Card(
                                modifier = Modifier.weight(1f),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(12.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "Longitude",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = currentLongitude?.toString() ?: "N/A",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Address
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp)
                            ) {
                                Text(
                                    text = "Address",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = currentAddress ?: "No address detected",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            GradientButton(
                                text = "Get Current Location",
                                onClick = {
                                    android.util.Log.d("LocationButton", "Button clicked")
                                    if (locationPermissionsState.allPermissionsGranted) {
                                        android.util.Log.d("LocationButton", "Permissions granted, checking location services...")
                                        
                                        // Check if location services are enabled
                                        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as android.location.LocationManager
                                        val isLocationEnabled = locationManager.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER) || 
                                                               locationManager.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER)
                                        
                                        if (isLocationEnabled) {
                                            android.util.Log.d("LocationButton", "Location services enabled, getting location...")
                                            getLocation(context, fusedLocationClient) { location ->
                                                android.util.Log.d("LocationButton", "Location result: $location")
                                                if (location != null) {
                                                    currentLatitude = location.latitude.toFloat()
                                                    currentLongitude = location.longitude.toFloat()
                                                    android.util.Log.d("LocationButton", "Location set: lat=${currentLatitude}, lng=${currentLongitude}")
                                                    
                                                    // Get real address using geocoder
                                                    coroutineScope.launch {
                                                        try {
                                                            android.util.Log.d("LocationButton", "Getting address from coordinates...")
                                                            val address = GeocoderUtils.getAddressFromLocation(
                                                                context,
                                                                location.latitude,
                                                                location.longitude
                                                            )
                                                            currentAddress = address ?: "Address not found"
                                                            android.util.Log.d("LocationButton", "Address retrieved: $currentAddress")
                                                        } catch (e: Exception) {
                                                            android.util.Log.e("LocationButton", "Error getting address: ${e.message}")
                                                            currentAddress = "Address lookup failed"
                                                        }
                                                    }
                                                } else {
                                                    android.util.Log.d("LocationButton", "Location is null")
                                                    Toast.makeText(context, "Could not get current location. Please try manual entry.", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        } else {
                                            android.util.Log.d("LocationButton", "Location services disabled, showing dialog...")
                                            showLocationDialog = true
                                        }
                                    } else {
                                        android.util.Log.d("LocationButton", "Permissions not granted, requesting...")
                                        requestLocationLauncher.launch(
                                            arrayOf(
                                                Manifest.permission.ACCESS_FINE_LOCATION,
                                                Manifest.permission.ACCESS_COARSE_LOCATION
                                            )
                                        )
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                icon = Icons.Default.LocationOn
                            )
                            
                            OutlinedButton(
                                onClick = {
                                    if (locationPermissionsState.allPermissionsGranted) {
                                        showMap = true
                                    } else {
                                        requestLocationLauncher.launch(
                                            arrayOf(
                                                Manifest.permission.ACCESS_FINE_LOCATION,
                                                Manifest.permission.ACCESS_COARSE_LOCATION
                                            )
                                        )
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Place, contentDescription = "Map", modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Select on Map")
                            }
                        }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))

                // Image Section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Camera",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Photos (${capturedImages.size} captured)", 
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        GradientButton(
                            text = "Take Photo",
                            onClick = {
                                if (cameraPermissionState.allPermissionsGranted) {
                                    showCamera = true
                                } else {
                                    cameraPermissionState.launchMultiplePermissionRequest()
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            icon = Icons.Default.Add
                        )
                        
                        // Display captured images
                        if (capturedImages.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            // Image count header
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Captured Images (${capturedImages.size})",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                
                                TextButton(
                                    onClick = {
                                        capturedImages = emptyList()
                                    }
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = "Clear all")
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Clear All")
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(capturedImages.size) { index ->
                                    val imageUri = capturedImages[index]
                                    Card(
                                        modifier = Modifier.size(120.dp),
                                        elevation = CardDefaults.cardElevation(4.dp)
                                    ) {
                                        Box {
                                            AsyncImage(
                                                model = imageUri,
                                                contentDescription = "Captured image $index",
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .clip(MaterialTheme.shapes.medium),
                                                contentScale = ContentScale.Crop
                                            )
                                            
                                            // Image number badge
                                            Card(
                                                modifier = Modifier
                                                    .align(Alignment.TopStart)
                                                    .padding(4.dp),
                                                colors = CardDefaults.cardColors(
                                                    containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)
                                                )
                                            ) {
                                                Text(
                                                    text = "${index + 1}",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onPrimary,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                )
                                            }
                                            
                                            // Delete button
                                            IconButton(
                                                onClick = {
                                                    capturedImages = capturedImages.filterIndexed { i, _ -> i != index }
                                                },
                                                modifier = Modifier
                                                    .align(Alignment.TopEnd)
                                                    .padding(4.dp)
                                            ) {
                                                Card(
                                                    colors = CardDefaults.cardColors(
                                                        containerColor = MaterialTheme.colorScheme.error.copy(alpha = 0.8f)
                                                    ),
                                                    shape = MaterialTheme.shapes.small
                                                ) {
                                                    Icon(
                                                        Icons.Default.Close,
                                                        contentDescription = "Delete image",
                                                        tint = MaterialTheme.colorScheme.onError,
                                                        modifier = Modifier.padding(4.dp)
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(20.dp))

                // Submit Button Section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Ready to Submit?",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Make sure you have captured photos and location details",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        GradientButton(
                            text = if (uiState.isLoading) "Submitting..." else "Submit Report",
                            onClick = {
                    if (authToken != null && currentLatitude != null && currentLongitude != null && capturedImages.isNotEmpty()) {
                        coroutineScope.launch {
                            if (isOnline) {
                                // Online submission
                                android.util.Log.d("ComplaintSubmission", "Submitting online...")
                                val imageFiles = capturedImages.map { uri ->
                                    val fileName = "image_${System.currentTimeMillis()}.jpg"
                                    val file = File(context.cacheDir, fileName)
                                    
                                    context.contentResolver.openInputStream(uri)?.use { input ->
                                        file.outputStream().use { output ->
                                            input.copyTo(output)
                                        }
                                    }
                                    file
                                }
                                
                                complaintViewModel.submitComplaint(
                                    authToken!!,
                                    imageFiles,
                                    currentLatitude!!,
                                    currentLongitude!!,
                                    currentAddress
                                )
                                
                                // Show notification for successful submission
                                SimpleNotificationManager.showComplaintNotification(
                                    context,
                                    "Complaint Submitted",
                                    "Your complaint has been successfully submitted! 🎉"
                                )
                            } else {
                                // Offline submission - save locally
                                android.util.Log.d("ComplaintSubmission", "Saving complaint offline...")
                                val imageFiles = capturedImages.mapNotNull { uri ->
                                    try {
                                        val fileName = "image_${System.currentTimeMillis()}.jpg"
                                        val file = File(context.cacheDir, fileName)
                                        
                                        context.contentResolver.openInputStream(uri)?.use { input ->
                                            file.outputStream().use { output ->
                                                input.copyTo(output)
                                            }
                                        }
                                        
                                        if (file.exists() && file.length() > 0) {
                                            android.util.Log.d("ComplaintSubmission", "Created image file: ${file.name}, size: ${file.length()}")
                                            file
                                        } else {
                                            android.util.Log.w("ComplaintSubmission", "Image file creation failed or empty: ${file.name}")
                                            null
                                        }
                                    } catch (e: Exception) {
                                        android.util.Log.e("ComplaintSubmission", "Failed to create image file", e)
                                        null
                                    }
                                }
                                
                                if (imageFiles.isEmpty()) {
                                    Toast.makeText(
                                        context,
                                        "Failed to save images. Please try again.",
                                        Toast.LENGTH_LONG
                                    ).show()
                                    return@launch
                                }
                                
                                val offlineComplaint = OfflineComplaint(
                                    title = "Road Issue Report",
                                    description = "Reported via MargWatch app",
                                    category = "POTHOLE", // Default category
                                    latitude = currentLatitude!!,
                                    longitude = currentLongitude!!,
                                    address = currentAddress,
                                    imageFiles = imageFiles,
                                    imageUris = capturedImages.map { it.toString() },
                                    userId = "offline_user_${System.currentTimeMillis()}" // Temporary offline user ID
                                )
                                
                                // Save offline complaint
                                val offlineManager = OfflineComplaintManager(context)
                                coroutineScope.launch {
                                    try {
                                        val complaintId = offlineManager.saveOfflineComplaint(offlineComplaint)
                                        android.util.Log.d("ComplaintSubmission", "Saved offline complaint: $complaintId")
                                        
                                        // Show notification for offline save
                                        SimpleNotificationManager.showComplaintNotification(
                                            context,
                                            "Complaint Saved Offline",
                                            "Your complaint has been saved offline and will be uploaded when you're back online! 📱"
                                        )
                                    } catch (e: Exception) {
                                        android.util.Log.e("ComplaintSubmission", "Failed to save offline complaint", e)
                                        Toast.makeText(
                                            context,
                                            "Failed to save complaint offline: ${e.message}",
                                            Toast.LENGTH_LONG
                                        ).show()
                                    }
                                }
                            }
                        }
                    } else {
                        val message = when {
                            authToken == null -> "Please login first"
                            currentLatitude == null || currentLongitude == null -> "Please get location first"
                            capturedImages.isEmpty() -> "Please take at least one photo"
                            else -> "Please complete all required fields"
                        }
                        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !uiState.isLoading && currentLatitude != null && currentLongitude != null && capturedImages.isNotEmpty() && authToken != null
                    )
                }
            }
        }
    }
    
    // Camera Screen
    if (showCamera) {
        CameraScreen(
            onImageCaptured = { uri ->
                capturedImages = capturedImages + uri
                showCamera = false
            },
            onClose = {
                showCamera = false
            }
        )
    }
    
    // Map Screen - Using Enhanced MapScreen
    if (showMap) {
        val initialLocation = if (currentLatitude != null && currentLongitude != null) {
            LatLng(currentLatitude!!.toDouble(), currentLongitude!!.toDouble())
        } else null
        
        MapScreen(
            initialLocation = initialLocation,
            onLocationSelected = { latLng, address ->
                currentLatitude = latLng.latitude.toFloat()
                currentLongitude = latLng.longitude.toFloat()
                currentAddress = address ?: "Selected Location"
                showMap = false
            },
            onClose = { showMap = false }
        )
    }

    // Location Services Dialog
    if (showLocationDialog) {
        AlertDialog(
            onDismissRequest = { showLocationDialog = false },
            title = { Text("Location Services Disabled") },
            text = { Text("Please enable location services to get your current location.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        // Open location settings
                        val intent = android.content.Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS)
                        context.startActivity(intent)
                        showLocationDialog = false
                    }
                ) {
                    Text("Open Settings")
                }
            },
            dismissButton = {
                TextButton(onClick = { showLocationDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
    }
}

// Helper function to get location (simplified for brevity)
private fun getLocation(context: Context, fusedLocationClient: com.google.android.gms.location.FusedLocationProviderClient, onLocationResult: (Location?) -> Unit) {
    android.util.Log.d("getLocation", "Checking permissions...")
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {

        android.util.Log.d("getLocation", "Permissions OK, requesting last location...")
        fusedLocationClient.lastLocation
            .addOnSuccessListener { location : Location? ->
                android.util.Log.d("getLocation", "Last location result: $location")
                if (location != null) {
                    android.util.Log.d("getLocation", "Location found: lat=${location.latitude}, lng=${location.longitude}, accuracy=${location.accuracy}")
                    onLocationResult(location)
                } else {
                    android.util.Log.d("getLocation", "No last location available, requesting current location...")
                    // Try to get current location if last location is null
                    val locationRequest = com.google.android.gms.location.LocationRequest.Builder(
                        com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY,
                        1000
                    ).build()
                    
                    fusedLocationClient.requestLocationUpdates(
                        locationRequest,
                        object : com.google.android.gms.location.LocationCallback() {
                            override fun onLocationResult(locationResult: com.google.android.gms.location.LocationResult) {
                                android.util.Log.d("getLocation", "Current location result: ${locationResult.lastLocation}")
                                fusedLocationClient.removeLocationUpdates(this)
                                onLocationResult(locationResult.lastLocation)
                            }
                        },
                        android.os.Looper.getMainLooper()
                    )
                }
            }
            .addOnFailureListener { e ->
                android.util.Log.e("getLocation", "Failed to get location: ${e.message}")
                Toast.makeText(context, "Failed to get location: ${e.message}", Toast.LENGTH_SHORT).show()
                onLocationResult(null)
            }
    } else {
        android.util.Log.d("getLocation", "Permissions not granted")
        onLocationResult(null)
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewComplaintSubmissionScreen() {
    MargWatchTheme {
        ComplaintSubmissionScreen(
            onNavigateBack = {},
            complaintViewModel = viewModel()
        )
    }
}