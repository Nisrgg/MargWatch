package com.margwatch.ui.screens

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.margwatch.data.local.TokenManager
import com.margwatch.data.model.Complaint
import com.margwatch.ui.components.EmptyState
import com.margwatch.ui.components.StatusChip
import com.margwatch.ui.components.StatusType
import com.margwatch.ui.theme.MargWatchTheme
import com.margwatch.ui.theme.GradientStart
import com.margwatch.ui.theme.GradientEnd
import java.text.SimpleDateFormat
import java.util.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComplaintsListScreen(
    onNavigateBack: () -> Unit,
    onNavigateToComplaintDetail: (String) -> Unit = {},
    complaintViewModel: ComplaintViewModel = viewModel()
) {
    val uiState by complaintViewModel.uiState.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val tokenManager = remember { TokenManager(context) }

    // Load complaints when screen opens
    LaunchedEffect(Unit) {
        android.util.Log.d("ComplaintsList", "Starting token check...")
        tokenManager.getToken().collect { token ->
            android.util.Log.d("ComplaintsList", "Token flow emitted: ${token?.take(20) ?: "null"}...")
            if (token != null) {
                android.util.Log.d("ComplaintsList", "Token found: ${token.take(20)}...")
                complaintViewModel.getUserComplaints(token)
            } else {
                android.util.Log.d("ComplaintsList", "No token found")
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        text = "My Complaints",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { 
                        coroutineScope.launch {
                            tokenManager.getToken().collect { token ->
                                if (token != null) {
                                    complaintViewModel.getUserComplaints(token)
                                }
                            }
                        }
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
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
                                GradientStart.copy(alpha = 0.05f),
                                Color.White,
                                GradientEnd.copy(alpha = 0.03f)
                            )
                        )
                    )
            )

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
                                text = "Loading your complaints...",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                
                uiState.complaints.isEmpty() -> {
                    EmptyState(
                        title = "No Complaints Yet",
                        subtitle = "You haven't submitted any complaints yet. Start by reporting a road issue!",
                        icon = Icons.Default.Warning,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .padding(32.dp)
                    )
                }
                
                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            // Header with count
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surface
                                ),
                                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(20.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Card(
                                        modifier = Modifier.size(48.dp),
                                        colors = CardDefaults.cardColors(
                                            containerColor = MaterialTheme.colorScheme.primaryContainer
                                        ),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier.fillMaxSize(),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.List,
                                                contentDescription = "Complaints",
                                                modifier = Modifier.size(24.dp),
                                                tint = MaterialTheme.colorScheme.onPrimaryContainer
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Column {
                                        Text(
                                            text = "Your Complaints",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "${uiState.complaints.size} total submissions",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                        
                        items(uiState.complaints) { complaint ->
                            EnhancedComplaintCard(
                                complaint = complaint,
                                onClick = { onNavigateToComplaintDetail(complaint.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EnhancedComplaintCard(
    complaint: Complaint,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            // Header with title and status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = complaint.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                StatusChip(
                    text = complaint.status,
                    status = getStatusType(complaint.status)
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Description
            Text(
                text = complaint.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Details row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Category and location
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = "Category",
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = complaint.category,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    if (complaint.address != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = "Location",
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = complaint.address,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
                
                // Date and arrow
                Column(
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = formatDate(complaint.createdAt),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowRight,
                        contentDescription = "View Details",
                        modifier = Modifier.size(20.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            // ML Prediction and Image count indicator
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // ML Prediction indicator
                if (complaint.mlCategory != null && complaint.mlConfidence != null) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = "ML Prediction",
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.secondary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "AI: ${formatCategoryName(complaint.mlCategory)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.secondary,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        // Confidence indicator
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(
                                    when {
                                        complaint.mlConfidence >= 0.8f -> Color.Green
                                        complaint.mlConfidence >= 0.6f -> Color(0xFFFF9800) // Orange
                                        else -> Color.Red
                                    }
                                )
                        )
                    }
                }
                
                // Image count indicator
                if (complaint.imageCount > 0) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Images",
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${complaint.imageCount} photo${if (complaint.imageCount > 1) "s" else ""}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}

private fun formatDate(dateString: String): String {
    return try {
        val date = Date(dateString.toLongOrNull() ?: System.currentTimeMillis())
        SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(date)
    } catch (e: Exception) {
        "Unknown date"
    }
}

private fun formatCategoryName(category: String) = when (category.uppercase()) {
    "POTHOLE" -> "Pothole"
    "ROAD_INSTABILITY" -> "Road Instability"
    "STREETLIGHT_DAMAGE" -> "Streetlight Damage"
    "TREE_DAMAGE" -> "Tree Damage"
    "OTHER" -> "Other"
    else -> category.replace("_", " ").lowercase().replaceFirstChar { it.uppercase() }
}

private fun getStatusType(status: String): StatusType {
    return when (status.uppercase()) {
        "PENDING" -> StatusType.WARNING
        "APPROVED", "COMPLETED" -> StatusType.SUCCESS
        "REJECTED", "CANCELLED" -> StatusType.ERROR
        "IN_PROGRESS", "PROCESSING" -> StatusType.INFO
        else -> StatusType.NEUTRAL
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewComplaintsListScreen() {
    MargWatchTheme {
        ComplaintsListScreen(
            onNavigateBack = {},
            complaintViewModel = viewModel()
        )
    }
}

@Preview(showBackground = true)
@Composable
fun PreviewEnhancedComplaintCard() {
    MargWatchTheme {
        EnhancedComplaintCard(
            complaint = Complaint(
                id = "1",
                title = "Pothole on Main Street",
                description = "Large pothole causing traffic issues and potential damage to vehicles",
                category = "POTHOLE",
                status = "PENDING",
                latitude = 40.7128f,
                longitude = -74.0060f,
                address = "Main Street, New York, NY",
                imageUrl = null,
                imageUrls = emptyList(),
                imageCount = 3,
                mlCategory = "POTHOLE",
                mlConfidence = 0.87f,
                mlModelVersion = "v1.0",
                mlProcessingTime = 0.23f,
                userId = "user123",
                user = null,
                approvedBy = null,
                approvedAt = null,
                createdAt = "2024-01-15T10:30:00Z",
                updatedAt = "2024-01-15T10:30:00Z"
            ),
            onClick = {}
        )
    }
}