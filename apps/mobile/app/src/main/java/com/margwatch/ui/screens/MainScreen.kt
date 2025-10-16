package com.margwatch.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.List
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
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.margwatch.data.local.TokenManager
import com.margwatch.data.model.UserRole
import com.margwatch.ui.components.*
import com.margwatch.ui.theme.MargWatchTheme
import com.margwatch.ui.theme.GradientStart
import com.margwatch.ui.theme.GradientEnd

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onNavigateToComplaintSubmission: () -> Unit,
    onNavigateToComplaintsList: () -> Unit,
    onNavigateToMap: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToWorkOrders: () -> Unit = {},
    onNavigateToNotifications: () -> Unit = {},
    onLogout: () -> Unit,
    authViewModel: AuthViewModel = viewModel()
) {
    val uiState by authViewModel.uiState.collectAsState()
    val context = LocalContext.current
    val currentUser = authViewModel.currentUser
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "MargWatch",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            ),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = currentUser?.role?.name ?: "USER",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToNotifications) {
                        Icon(Icons.Default.Notifications, contentDescription = "Notifications")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            BottomAppBar(
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.onSurface
            ) {
                when (currentUser?.role) {
                    UserRole.USER -> {
                        // User Navigation
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.List, contentDescription = "My Complaints") },
                            label = { Text("Complaints") },
                            selected = false,
                            onClick = onNavigateToComplaintsList
                        )
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.Add, contentDescription = "Submit Complaint") },
                            label = { Text("Submit") },
                            selected = false,
                            onClick = onNavigateToComplaintSubmission
                        )
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.LocationOn, contentDescription = "Heatmap") },
                            label = { Text("Heatmap") },
                            selected = false,
                            onClick = onNavigateToMap
                        )
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                            label = { Text("Profile") },
                            selected = false,
                            onClick = onNavigateToProfile
                        )
                    }
                    UserRole.WORKER -> {
                        // Worker Navigation - Simplified
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.List, contentDescription = "Dashboard") },
                            label = { Text("Dashboard") },
                            selected = false,
                            onClick = onNavigateToWorkOrders
                        )
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.LocationOn, contentDescription = "Heatmap") },
                            label = { Text("Heatmap") },
                            selected = false,
                            onClick = onNavigateToMap
                        )
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                            label = { Text("Profile") },
                            selected = false,
                            onClick = onNavigateToProfile
                        )
                    }
                    UserRole.ADMIN -> {
                        // Admin Navigation (minimal since admin uses web portal)
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                            label = { Text("Profile") },
                            selected = false,
                            onClick = onNavigateToProfile
                        )
                    }
                    else -> {
                        // Default navigation for unknown roles
                        NavigationBarItem(
                            icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                            label = { Text("Profile") },
                            selected = false,
                            onClick = onNavigateToProfile
                        )
                    }
                }
            }
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
            
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Welcome Section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp)
        ) {
            Text(
                            text = "Welcome back! 👋",
                style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Ready to monitor road infrastructure?",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // User Info
                        Row(
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
                                        imageVector = Icons.Default.Person,
                                        contentDescription = "User",
                                        modifier = Modifier.size(24.dp),
                                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "${currentUser?.firstName} ${currentUser?.lastName}",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = currentUser?.email ?: "user@example.com",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
                
                // Quick Actions Section
                Text(
                    text = "Quick Actions",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.Bold
                )
                
                when (currentUser?.role) {
                    UserRole.USER -> {
                        // User Quick Actions
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(getUserQuickActions(
                                onNavigateToComplaintSubmission,
                                onNavigateToComplaintsList,
                                onNavigateToMap
                            )) { action ->
                                QuickActionCard(
                                    title = action.title,
                                    subtitle = action.subtitle,
                                    icon = action.icon,
                                    onClick = action.onClick
                                )
                            }
                        }
                        
                        // Stats Section
                        Text(
                            text = "Your Activity",
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            StatsCard(
                                title = "Reports Submitted",
                                value = "12",
                                subtitle = "This month",
                                icon = Icons.Default.Warning,
                                modifier = Modifier.weight(1f)
                            )
                            StatsCard(
                                title = "Issues Resolved",
                                value = "8",
                                subtitle = "This month",
                                icon = Icons.Default.CheckCircle,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                    
                    UserRole.WORKER -> {
                        // Worker Quick Actions
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(getWorkerQuickActions(
                                onNavigateToWorkOrders,
                                onNavigateToMap
                            )) { action ->
                                QuickActionCard(
                                    title = action.title,
                                    subtitle = action.subtitle,
                                    icon = action.icon,
                                    onClick = action.onClick
                                )
                            }
                        }
                        
                        // Worker Stats
                        Text(
                            text = "Work Summary",
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            StatsCard(
                                title = "Active Orders",
                                value = "5",
                                subtitle = "In progress",
                                icon = Icons.Default.Build,
                                modifier = Modifier.weight(1f)
                            )
                            StatsCard(
                                title = "Completed",
                                value = "23",
                                subtitle = "This month",
                                icon = Icons.Default.CheckCircle,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                    
                    else -> {
                        // Default actions
                        EmptyState(
                            title = "Welcome to MargWatch",
                            subtitle = "Your road infrastructure monitoring platform",
                            icon = Icons.Default.Star,
                            actionText = "Get Started",
                            onAction = onNavigateToComplaintSubmission
                        )
                    }
                }
                
                // Test Notification Button
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Test Features",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        // Test notification button removed - using FCM notifications only
                    }
                }
            }
        }
    }
}

data class QuickAction(
    val title: String,
    val subtitle: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val onClick: () -> Unit
)

@Composable
fun QuickActionCard(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.width(160.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
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
                        imageVector = icon,
                        contentDescription = title,
                        modifier = Modifier.size(24.dp),
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

fun getUserQuickActions(
    onNavigateToComplaintSubmission: () -> Unit,
    onNavigateToComplaintsList: () -> Unit,
    onNavigateToMap: () -> Unit
): List<QuickAction> = listOf(
    QuickAction(
        title = "Report Issue",
        subtitle = "Submit new complaint",
        icon = Icons.Default.Add,
        onClick = onNavigateToComplaintSubmission
    ),
    QuickAction(
        title = "View Reports",
        subtitle = "Check your submissions",
        icon = Icons.Default.List,
        onClick = onNavigateToComplaintsList
    ),
    QuickAction(
        title = "Heat Map",
        subtitle = "See issue locations",
        icon = Icons.Default.LocationOn,
        onClick = onNavigateToMap
    )
)

fun getWorkerQuickActions(
    onNavigateToWorkOrders: () -> Unit,
    onNavigateToMap: () -> Unit
): List<QuickAction> = listOf(
    QuickAction(
        title = "Work Orders",
        subtitle = "View assigned tasks",
        icon = Icons.Default.Build,
        onClick = onNavigateToWorkOrders
    ),
    QuickAction(
        title = "Update Status",
        subtitle = "Report progress",
        icon = Icons.Default.Edit,
        onClick = {}
    ),
    QuickAction(
        title = "Heat Map",
        subtitle = "See work locations",
        icon = Icons.Default.LocationOn,
        onClick = onNavigateToMap
    )
)

@Preview(showBackground = true)
@Composable
fun PreviewMainScreen() {
    MargWatchTheme {
        MainScreen(
            onNavigateToComplaintSubmission = {},
            onNavigateToComplaintsList = {},
            onNavigateToMap = {},
            onNavigateToProfile = {},
            onLogout = {},
            authViewModel = viewModel()
        )
    }
}
