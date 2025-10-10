package com.margwatch.ui.screens

import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.margwatch.data.model.WorkOrder
import com.margwatch.ui.components.ImageSelectionDialog
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkerDashboardScreen(
    onNavigateBack: () -> Unit,
    onNavigateToHeatmap: () -> Unit = {},
    workOrderViewModel: WorkOrderViewModel = viewModel()
) {
    val uiState by workOrderViewModel.uiState.collectAsState()
    val context = LocalContext.current
    val tokenManager = remember { TokenManager(context) }

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
            onUpdate = { status, description, cost, images ->
                // Convert URIs to Files for upload
                val imageFiles = images?.map { uri ->
                    val fileName = "work_image_${System.currentTimeMillis()}.jpg"
                    val file = File(context.cacheDir, fileName)
                    
                    context.contentResolver.openInputStream(uri)?.use { input ->
                        file.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                    file
                } ?: emptyList()
                
                workOrderViewModel.updateWorkOrderStatus(
                    tokenManager,
                    uiState.selectedWorkOrder!!.id,
                    status,
                    description,
                    cost,
                    imageFiles
                ) { success, error ->
                    if (success) {
                        workOrderViewModel.hideDialogs()
                        workOrderViewModel.loadWorkOrders(tokenManager) // Refresh after update
                    }
                }
            }
        )
    }

    // Complete Work Dialog
    if (uiState.showCompleteDialog && uiState.selectedWorkOrder != null) {
        CompleteWorkDialog(
            workOrder = uiState.selectedWorkOrder!!,
            onDismiss = { workOrderViewModel.hideDialogs() },
            onComplete = { description, cost, images ->
                // Convert URIs to Files for upload
                val imageFiles = images?.map { uri ->
                    val fileName = "completion_image_${System.currentTimeMillis()}.jpg"
                    val file = File(context.cacheDir, fileName)
                    
                    context.contentResolver.openInputStream(uri)?.use { input ->
                        file.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                    file
                } ?: emptyList()
                
                workOrderViewModel.completeWorkOrder(
                    tokenManager,
                    uiState.selectedWorkOrder!!.id,
                    description,
                    cost,
                    imageFiles
                ) { success, error ->
                    if (success) {
                        workOrderViewModel.hideDialogs()
                        workOrderViewModel.loadWorkOrders(tokenManager) // Refresh after completion
                    }
                }
            }
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
                    value = workOrders.count { it.status.lowercase() == "processing" }.toString(),
                    icon = Icons.Default.Refresh
                )
                
                StatCard(
                    title = "Completed",
                    value = workOrders.count { it.status.lowercase() == "completed" }.toString(),
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
                
                WorkOrderStatusChip(status = workOrder.status)
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
                if (workOrder.status.lowercase() != "completed") {
                    Button(
                        onClick = onUpdateStatus,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Update", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Update Status")
                    }
                    
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

@Composable
fun WorkOrderStatusChip(status: String) {
    val (backgroundColor, textColor) = when (status.lowercase()) {
        "assigned" -> MaterialTheme.colorScheme.primary to MaterialTheme.colorScheme.onPrimary
        "processing" -> MaterialTheme.colorScheme.secondary to MaterialTheme.colorScheme.onSecondary
        "completed" -> MaterialTheme.colorScheme.tertiary to MaterialTheme.colorScheme.onTertiary
        else -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    }
    
    Card(
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) {
        Text(
            text = status.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UpdateWorkStatusDialog(
    workOrder: WorkOrder,
    onDismiss: () -> Unit,
    onUpdate: (String, String?, Double?, List<Uri>?) -> Unit
) {
    var status by remember { mutableStateOf(workOrder.status) }
    var description by remember { mutableStateOf(workOrder.description ?: "") }
    var cost by remember { mutableStateOf(workOrder.cost?.toString() ?: "") }
    var selectedImages by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var showImageDialog by remember { mutableStateOf(false) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Update Work Status") },
        text = {
            Column {
                // Status dropdown
                var expanded by remember { mutableStateOf(false) }
                val statusOptions = listOf("ASSIGNED", "PROCESSING", "IN_PROGRESS")
                
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
                
                // Cost
                OutlinedTextField(
                    value = cost,
                    onValueChange = { cost = it },
                    label = { Text("Cost") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal)
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
                        cost.toDoubleOrNull(),
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
    onDismiss: () -> Unit,
    onComplete: (String?, Double?, List<Uri>?) -> Unit
) {
    var description by remember { mutableStateOf(workOrder.description ?: "") }
    var cost by remember { mutableStateOf(workOrder.cost?.toString() ?: "") }
    var selectedImages by remember { mutableStateOf<List<Uri>>(emptyList()) }
    var showImageDialog by remember { mutableStateOf(false) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Complete Work Order") },
        text = {
            Column {
                // Description
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Work Description") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3,
                    placeholder = { Text("Describe the completed work...") }
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Cost
                OutlinedTextField(
                    value = cost,
                    onValueChange = { cost = it },
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
                    onComplete(
                        description.ifEmpty { null },
                        cost.toDoubleOrNull(),
                        selectedImages.ifEmpty { null }
                    )
                }
            ) {
                Text("Complete Work")
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
