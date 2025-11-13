package com.margwatch.ui.screens

import android.net.Uri
import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.rememberAsyncImagePainter
import com.margwatch.data.local.TokenManager
import com.margwatch.shared.types.UserRole
import com.margwatch.shared.types.WorkOrder
import com.margwatch.ui.components.StatusChip
import com.margwatch.ui.components.MargWatchSnackbarHost
import com.margwatch.ui.components.StatusType
import com.margwatch.ui.components.ImageSelectionDialog
import androidx.core.content.FileProvider
import androidx.core.content.ContextCompat
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkerDashboardScreen(
    onNavigateBack: () -> Unit,
    onNavigateToHeatmap: () -> Unit = {},
    workOrderViewModel: WorkOrderViewModel = viewModel(),
    authViewModel: AuthViewModel = viewModel()
) {
    val uiState by workOrderViewModel.uiState.collectAsState()
    val context = LocalContext.current
    val tokenManager = remember { TokenManager(context) }
    val currentUser = authViewModel.currentUser
    val snackbarHostState = remember { SnackbarHostState() }

    // Load work orders when screen is first composed
    LaunchedEffect(Unit) {
        workOrderViewModel.loadWorkOrders(tokenManager)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Worker Dashboard") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { workOrderViewModel.loadWorkOrders(tokenManager) }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    IconButton(onClick = onNavigateToHeatmap) {
                        Icon(Icons.Default.LocationOn, contentDescription = "Heatmap")
                    }
                }
            )
        },
        snackbarHost = {
            MargWatchSnackbarHost(snackbarHostState)
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(48.dp),
                            strokeWidth = 4.dp
                        )
                        Text(
                            text = "Loading work orders...",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            
            uiState.workOrders.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Icon(
                            Icons.Default.List,
                            contentDescription = "No Work Orders",
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "No Work Orders Assigned",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = "You don't have any work orders assigned yet. Check back later!",
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Quick Stats Card
                    item {
                        WorkStatsCard(workOrders = uiState.workOrders)
                    }
                    
                    // Quick Actions Card
                    item {
                        QuickActionsCard(
                            onNavigateToHeatmap = onNavigateToHeatmap,
                            onRefresh = { workOrderViewModel.loadWorkOrders(tokenManager) }
                        )
                    }
                    
                    // Work Orders List Header
                    item {
                        Text(
                            text = "My Work Orders",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    // Work Orders List
                    items(uiState.workOrders) { workOrder ->
                        WorkOrderCard(
                            workOrder = workOrder,
                            onUpdateStatus = { workOrderViewModel.showUpdateDialog(workOrder) },
                            onComplete = { workOrderViewModel.showCompleteDialog(workOrder) }
                        )
                    }
                }
            }
        }
    }

    // Update Status Dialog
    if (uiState.showUpdateDialog && uiState.selectedWorkOrder != null) {
        UpdateWorkStatusDialog(
            workOrder = uiState.selectedWorkOrder!!,
            onDismiss = { workOrderViewModel.hideDialogs() },
            onUpdate = { status, description, progress, images ->
                // Convert URIs to Files for upload
                val imageFiles = images?.map { uri ->
                    val fileName = "work_image_${System.currentTimeMillis()}_${uri.hashCode()}.jpg"
                    val file = File(context.cacheDir, fileName)
                    
                    try {
                        context.contentResolver.openInputStream(uri)?.use { input ->
                            file.outputStream().use { output ->
                                input.copyTo(output)
                            }
                        }
                        file
                    } catch (e: Exception) {
                        android.util.Log.e("WorkerDashboard", "Failed to convert URI to file: ${e.message}", e)
                        null
                    }
                }?.filterNotNull() ?: emptyList()
                
                val userRole = currentUser?.role
                if (userRole == null) {
                    android.util.Log.e("WorkerDashboard", "Current user role is null! User: $currentUser")
                } else {
                    android.util.Log.d("WorkerDashboard", "Updating work order with role: $userRole")
                }
                
                workOrderViewModel.updateWorkOrderStatus(
                    tokenManager,
                    uiState.selectedWorkOrder!!.id,
                    status,
                    description,
                    progress,
                    imageFiles,
                    userRole ?: UserRole.USER
                ) { success, error ->
                    if (success) {
                        workOrderViewModel.hideDialogs()
                        workOrderViewModel.loadWorkOrders(tokenManager) // Refresh after update
                    } else {
                        // Error is already shown via showError in ViewModel
                        // Dialog will stay open so user can retry or cancel
                        android.util.Log.e("WorkerDashboard", "Failed to update work order: $error")
                    }
                }
            }
        )
    }

    // Complete Work Dialog
    if (uiState.showCompleteDialog && uiState.selectedWorkOrder != null) {
        CompleteWorkDialog(
            workOrder = uiState.selectedWorkOrder!!,
            uiState = uiState,
            onDismiss = { workOrderViewModel.hideDialogs() },
            onComplete = { 
                val userRole = currentUser?.role
                if (userRole == null) {
                    android.util.Log.e("WorkerDashboard", "Current user role is null for complete! User: $currentUser")
                } else {
                    android.util.Log.d("WorkerDashboard", "Completing work order with role: $userRole")
                }
                
                workOrderViewModel.completeWorkOrder(
                    tokenManager,
                    context,
                    userRole ?: UserRole.USER
                ) { success, error ->
                    if (success) {
                        workOrderViewModel.hideDialogs()
                        workOrderViewModel.loadWorkOrders(tokenManager) // Refresh after completion
                    } else {
                        // Error is already shown via showError in ViewModel
                        // Dialog will stay open so user can retry or cancel
                        android.util.Log.e("WorkerDashboard", "Failed to complete work order: $error")
                    }
                }
            },
            onPhotoCaptured = { uri -> workOrderViewModel.onPhotoCaptured(uri) },
            onRemoveImage = { uri -> workOrderViewModel.removeCompletionImage(uri) },
            onDescriptionChange = { description -> workOrderViewModel.updateCompletionDescription(description) },
            onCostChange = { cost -> workOrderViewModel.updateCompletionCost(cost) }
        )
    }
}

@Composable
fun WorkStatsCard(workOrders: List<WorkOrder>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "Work Summary",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatCard(
                    title = "Total Orders",
                    value = workOrders.size.toString(),
                    icon = Icons.Default.List
                )
                
                StatCard(
                    title = "In Progress",
                    value = workOrders.count { it.status.name.lowercase() == "processing" }.toString(),
                    icon = Icons.Default.Refresh
                )
                
                StatCard(
                    title = "Completed",
                    value = workOrders.count { it.status.name.lowercase() == "completed" }.toString(),
                    icon = Icons.Default.CheckCircle
                )
            }
        }
    }
}

@Composable
fun QuickActionsCard(
    onNavigateToHeatmap: () -> Unit,
    onRefresh: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "Quick Actions",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                modifier = Modifier.padding(bottom = 12.dp)
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                ActionButton(
                    icon = Icons.Default.LocationOn,
                    text = "View Heatmap",
                    onClick = onNavigateToHeatmap
                )
                
                ActionButton(
                    icon = Icons.Default.Refresh,
                    text = "Refresh Data",
                    onClick = onRefresh
                )
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            icon,
            contentDescription = title,
            modifier = Modifier.size(32.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = title,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun ActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .size(56.dp)
                .background(
                    MaterialTheme.colorScheme.primary,
                    RoundedCornerShape(16.dp)
                )
        ) {
            Icon(
                icon,
                contentDescription = text,
                tint = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
    }
}

@Composable
fun WorkOrderCard(
    workOrder: WorkOrder,
    onUpdateStatus: () -> Unit,
    onComplete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = workOrder.complaint?.title ?: "Work Order #${workOrder.id}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                StatusChip(
                    status = workOrder.status.name,
                    type = StatusType.WORK_ORDER
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Details
            Text(
                text = workOrder.complaint?.description ?: "No description available",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Location
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.LocationOn,
                    contentDescription = "Location",
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = workOrder.complaint?.address ?: "Location not specified",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Assigned Date
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.DateRange,
                    contentDescription = "Date",
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Assigned: ${formatDate(workOrder.assignedAt)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (workOrder.status.name.lowercase() != "completed") {
                    // Show Update Status button for ASSIGNED, IN_PROGRESS, or PENDING_REVIEW
                    if (workOrder.status.name == "ASSIGNED" || 
                        workOrder.status.name == "IN_PROGRESS" || 
                        workOrder.status.name == "PENDING_REVIEW") {
                        Button(
                            onClick = onUpdateStatus,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = "Update", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Update Status")
                        }
                    }
                    
                    // Show Complete button only for IN_PROGRESS status
                    // Workers can only complete work that is in progress
                    if (workOrder.status.name == "IN_PROGRESS") {
                        Button(
                            onClick = onComplete,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.tertiary
                            )
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = "Complete", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Complete")
                        }
                    }
                } else {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.CheckCircle,
                                contentDescription = "Completed",
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Work Completed",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UpdateWorkStatusDialog(
    workOrder: WorkOrder,
    onDismiss: () -> Unit,
    onUpdate: (String, String?, Int?, List<Uri>?) -> Unit
) {
    var status by rememberSaveable { mutableStateOf(workOrder.status.name) }
    var description by rememberSaveable { mutableStateOf(workOrder.description ?: "") }
    var progress by rememberSaveable { mutableStateOf("") }
    var selectedImages by rememberSaveable(
        stateSaver = listSaver(
            save = { list -> list.map { it.toString() } },
            restore = { list -> list.map { Uri.parse(it) } }
        )
    ) { mutableStateOf<List<Uri>>(emptyList()) }
    var showImageDialog by rememberSaveable { mutableStateOf(false) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Update Work Status") },
        text = {
            Column {
                // Status dropdown - only show valid transitions for workers
                var expanded by remember { mutableStateOf(false) }
                // Workers can transition: ASSIGNED -> IN_PROGRESS, or PENDING_REVIEW -> IN_PROGRESS
                val statusOptions = when (workOrder.status.name) {
                    "ASSIGNED" -> listOf("IN_PROGRESS")
                    "PENDING_REVIEW" -> listOf("IN_PROGRESS")
                    "IN_PROGRESS" -> listOf("IN_PROGRESS") // Can update progress while in progress
                    else -> listOf(workOrder.status.name) // Keep current status if no valid transitions
                }
                
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = status,
                        onValueChange = { status = it },
                        label = { Text("Status") },
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        statusOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.replace("_", " ")) },
                                onClick = {
                                    status = option
                                    expanded = false
                                }
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Description
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Progress (0-100)
                OutlinedTextField(
                    value = progress,
                    onValueChange = { newValue ->
                        // Only allow numbers 0-100
                        if (newValue.isEmpty() || (newValue.toIntOrNull() != null && newValue.toInt() in 0..100)) {
                            progress = newValue
                        }
                    },
                    label = { Text("Progress (%)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Number),
                    supportingText = { Text("Enter progress percentage (0-100)") }
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Image selection section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Work Progress Images",
                                style = MaterialTheme.typography.titleSmall
                            )
                            TextButton(
                                onClick = { showImageDialog = true }
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Add Images", modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Add Images")
                            }
                        }
                        
                        if (selectedImages.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(selectedImages) { uri ->
                                    Box {
                                        Image(
                                            painter = rememberAsyncImagePainter(uri),
                                            contentDescription = "Selected Image",
                                            modifier = Modifier
                                                .size(60.dp)
                                                .clip(RoundedCornerShape(8.dp)),
                                            contentScale = ContentScale.Crop
                                        )
                                        
                                        // Remove button
                                        IconButton(
                                            onClick = {
                                                selectedImages = selectedImages.filter { it != uri }
                                            },
                                            modifier = Modifier
                                                .align(Alignment.TopEnd)
                                                .size(20.dp)
                                        ) {
                                            Icon(
                                                Icons.Default.Close,
                                                contentDescription = "Remove",
                                                modifier = Modifier.size(12.dp),
                                                tint = MaterialTheme.colorScheme.error
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onUpdate(
                        status,
                        description.ifEmpty { null },
                        progress.toIntOrNull(),
                        selectedImages.ifEmpty { null }
                    )
                }
            ) {
                Text("Update")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
    
    // Image Selection Dialog
    ImageSelectionDialog(
        isOpen = showImageDialog,
        onDismiss = { showImageDialog = false },
        onImagesSelected = { images ->
            selectedImages = images
        },
        maxImages = 3
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompleteWorkDialog(
    workOrder: WorkOrder,
    uiState: WorkOrderUiState,
    onDismiss: () -> Unit,
    onComplete: () -> Unit,
    onPhotoCaptured: (Uri) -> Unit,
    onRemoveImage: (Uri) -> Unit,
    onDescriptionChange: (String) -> Unit,
    onCostChange: (String) -> Unit
) {
    val context = LocalContext.current
    
    // Check camera permission
    val hasCameraPermission = ContextCompat.checkSelfPermission(
        context, Manifest.permission.CAMERA
    ) == PackageManager.PERMISSION_GRANTED
    
    // Create a temporary file for the camera
    val tempImageFile = remember {
        File(context.cacheDir, "temp_camera_image_${System.currentTimeMillis()}.jpg")
    }
    val tempImageUri = remember {
        FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            tempImageFile
        )
    }
    
    // Camera launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            // Photo was taken successfully, add it to the completion images
            onPhotoCaptured(tempImageUri)
        }
    }
    
    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            // Permission granted, launch camera
            cameraLauncher.launch(tempImageUri)
        }
    }
    
    // Function to handle camera button click
    val launchCamera = {
        if (hasCameraPermission) {
            cameraLauncher.launch(tempImageUri)
        } else {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Complete Work Order") },
        text = {
            Column {
                // Description
                OutlinedTextField(
                    value = uiState.completionDescription,
                    onValueChange = onDescriptionChange,
                    label = { Text("Work Description") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3,
                    placeholder = { Text("Describe the completed work...") }
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Cost
                OutlinedTextField(
                    value = uiState.completionCost,
                    onValueChange = onCostChange,
                    label = { Text("Final Cost") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal),
                    placeholder = { Text("Enter final cost...") }
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Image selection section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Completion Images",
                                style = MaterialTheme.typography.titleSmall
                            )
                            Button(
                                onClick = launchCamera,
                                modifier = Modifier.size(40.dp)
                            ) {
                                Icon(
                                    Icons.Default.Add, 
                                    contentDescription = "Take Photo", 
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        
                        if (uiState.completionImages.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(uiState.completionImages) { uri ->
                                    Box {
                                        Image(
                                            painter = rememberAsyncImagePainter(uri),
                                            contentDescription = "Selected Image",
                                            modifier = Modifier
                                                .size(60.dp)
                                                .clip(RoundedCornerShape(8.dp)),
                                            contentScale = ContentScale.Crop
                                        )
                                        
                                        // Remove button
                                        IconButton(
                                            onClick = { onRemoveImage(uri) },
                                            modifier = Modifier
                                                .align(Alignment.TopEnd)
                                                .size(20.dp)
                                        ) {
                                            Icon(
                                                Icons.Default.Close,
                                                contentDescription = "Remove",
                                                modifier = Modifier.size(12.dp),
                                                tint = MaterialTheme.colorScheme.error
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Error message
                if (uiState.error != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = uiState.error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onComplete,
                enabled = !uiState.isCompleting
            ) {
                if (uiState.isCompleting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text("Complete Work")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !uiState.isCompleting
            ) {
                Text("Cancel")
            }
        }
    )
}

private fun formatDate(dateString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
        val date = inputFormat.parse(dateString)
        outputFormat.format(date ?: Date())
    } catch (e: Exception) {
        dateString
    }
}
