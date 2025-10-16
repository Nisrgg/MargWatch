package com.margwatch

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.margwatch.data.local.TokenManager
import com.margwatch.ui.screens.*
import com.margwatch.ui.theme.MargWatchTheme
import com.margwatch.services.GlobalNotificationService
import com.google.firebase.FirebaseApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // FCM notification channels are created automatically by FirebaseNotificationService
        FirebaseApp.initializeApp(this)
        setContent {
            MargWatchTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MargWatchApp()
                }
            }
        }
    }
}

@Composable
fun MargWatchApp() {
    val navController = rememberNavController()
    val context = LocalContext.current
    val tokenManager = remember { TokenManager(context) }
    
    val authViewModel: AuthViewModel = remember { AuthViewModel(tokenManager = tokenManager) }
    val complaintViewModel: ComplaintViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
    
    val authUiState by authViewModel.uiState.collectAsState()

    // Initialize global notification service only when authenticated
    LaunchedEffect(authUiState.isAuthenticated) {
        if (authUiState.isAuthenticated) {
            android.util.Log.d("MainActivity", "User authenticated, initializing global notification service...")
            try {
                GlobalNotificationService.getInstance().initialize(context, tokenManager)
                android.util.Log.d("MainActivity", "Global notification service initialization completed")
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Failed to initialize global notifications: ${e.message}", e)
            }
        } else {
            android.util.Log.d("MainActivity", "User not authenticated, skipping global SSE initialization")
        }
    }

    // Show loading screen while checking authentication
    if (authUiState.isLoading) {
        androidx.compose.foundation.layout.Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = androidx.compose.ui.Alignment.Center
        ) {
            androidx.compose.material3.CircularProgressIndicator()
        }
        return
    }

    NavHost(
        navController = navController,
        startDestination = if (authUiState.isAuthenticated) "main" else "login"
    ) {
        composable("login") {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate("main") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate("register")
                },
                authViewModel = authViewModel
            )
        }

        composable("register") {
            RegistrationScreen(
                onRegistrationSuccess = {
                    navController.navigate("login") {
                        popUpTo("register") { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                },
                authViewModel = authViewModel
            )
        }

        composable("main") {
            MainScreen(
                onNavigateToComplaintSubmission = {
                    navController.navigate("complaint_submission")
                },
                onNavigateToComplaintsList = {
                    navController.navigate("complaints_list")
                },
                onNavigateToMap = {
                    navController.navigate("heatmap")
                },
                onNavigateToProfile = {
                    navController.navigate("profile")
                },
                onNavigateToWorkOrders = {
                    navController.navigate("work_orders")
                },
                onNavigateToNotifications = {
                    navController.navigate("notifications")
                },
                onLogout = {
                    authViewModel.logout()
                    navController.navigate("login") {
                        popUpTo("main") { inclusive = true }
                    }
                },
                authViewModel = authViewModel
            )
        }

        composable("complaints_list") {
            ComplaintsListScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                complaintViewModel = complaintViewModel
            )
        }

        composable("complaint_submission") {
            ComplaintSubmissionScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                complaintViewModel = complaintViewModel
            )
        }
        
        composable("profile") {
            ProfileScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToComplaintSubmission = {
                    navController.navigate("complaint_submission")
                },
                onNavigateToComplaintsList = {
                    navController.navigate("complaints_list")
                },
                onNavigateToHeatmap = {
                    navController.navigate("heatmap")
                },
                onNavigateToWorkOrders = {
                    navController.navigate("work_orders")
                },
                authViewModel = authViewModel
            )
        }

        // Worker-specific screens - Unified Dashboard
        composable("work_orders") {
            WorkerDashboardScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToHeatmap = {
                    navController.navigate("heatmap")
                },
                workOrderViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            )
        }

        // Keep old routes for backward compatibility (redirect to dashboard)
        composable("work_status") {
            WorkerDashboardScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToHeatmap = {
                    navController.navigate("heatmap")
                },
                workOrderViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            )
        }

        composable("work_completion") {
            WorkerDashboardScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToHeatmap = {
                    navController.navigate("heatmap")
                },
                workOrderViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            )
        }

        composable("notifications") {
            NotificationsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                notificationViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            )
        }
        
        composable("heatmap") {
            HeatMapScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                heatMapViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            )
        }
    }
}