package com.margwatch.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.margwatch.data.model.User
import com.margwatch.data.model.UserRole
import com.margwatch.ui.theme.MargWatchTheme
import com.margwatch.utils.SimpleNotificationManager
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit,
    onNavigateToComplaintSubmission: () -> Unit = {},
    onNavigateToComplaintsList: () -> Unit = {},
    onNavigateToHeatmap: () -> Unit = {},
    onNavigateToWorkOrders: () -> Unit = {},
    authViewModel: AuthViewModel = viewModel()
) {
    val uiState by authViewModel.uiState.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var showEditDialog by remember { mutableStateOf(false) }
    var showChangePasswordDialog by remember { mutableStateOf(false) }
    var showErrorDialog by remember { mutableStateOf(false) }

    // Load user profile when screen is first composed
    LaunchedEffect(Unit) {
        if (uiState.user == null && !uiState.isLoading) {
            authViewModel.getUserProfile()
        }
    }

    // Show error dialog if there's an error
    LaunchedEffect(uiState.error) {
        if (uiState.error != null) {
            showErrorDialog = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (uiState.user != null) {
                        IconButton(onClick = { showEditDialog = true }) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit Profile")
                        }
                    }
                }
            )
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                // Loading State
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
                            text = "Loading profile...",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            
            uiState.user != null -> {
                // Profile Content
                ProfileContent(
                    user = uiState.user!!,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    onEditProfile = { showEditDialog = true },
                    onChangePassword = { showChangePasswordDialog = true },
                    onSignOut = {
                        coroutineScope.launch {
                            authViewModel.logout()
                        }
                    },
                    onNavigateToComplaintSubmission = onNavigateToComplaintSubmission,
                    onNavigateToComplaintsList = onNavigateToComplaintsList,
                    onNavigateToHeatmap = onNavigateToHeatmap,
                    onNavigateToWorkOrders = onNavigateToWorkOrders
                )
            }
            
            else -> {
                // Error State
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.padding(32.dp)
                    ) {
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = "Error",
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.error
                        )
                        Text(
                            text = "Failed to load profile",
                            style = MaterialTheme.typography.headlineSmall,
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = uiState.error ?: "Unknown error occurred",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                        Button(
                            onClick = { authViewModel.getUserProfile() }
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Retry")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Retry")
                        }
                    }
                }
            }
        }
    }

    // Edit Profile Dialog
    if (showEditDialog) {
        EditProfileDialog(
            user = uiState.user,
            onDismiss = { showEditDialog = false },
            onSave = { firstName, lastName, phone ->
                authViewModel.updateProfile(firstName, lastName, phone) { success, error ->
                    if (success) {
                        showEditDialog = false
                    }
                }
            }
        )
    }

    // Change Password Dialog
    if (showChangePasswordDialog) {
        ChangePasswordDialog(
            onDismiss = { showChangePasswordDialog = false },
            onChangePassword = { oldPassword, newPassword ->
                authViewModel.changePassword(oldPassword, newPassword) { success, error ->
                    if (success) {
                        showChangePasswordDialog = false
                    }
                }
            }
        )
    }

    // Error Dialog
    if (showErrorDialog) {
        AlertDialog(
            onDismissRequest = { 
                showErrorDialog = false
                authViewModel.clearError()
            },
            title = { Text("Error") },
            text = { Text(uiState.error ?: "Unknown error") },
            confirmButton = {
                TextButton(onClick = { 
                    showErrorDialog = false
                    authViewModel.clearError()
                }) {
                    Text("OK")
                }
            }
        )
    }
}

@Composable
fun ProfileContent(
    user: User,
    modifier: Modifier = Modifier,
    onEditProfile: () -> Unit,
    onChangePassword: () -> Unit,
    onSignOut: () -> Unit,
    onNavigateToComplaintSubmission: () -> Unit = {},
    onNavigateToComplaintsList: () -> Unit = {},
    onNavigateToHeatmap: () -> Unit = {},
    onNavigateToWorkOrders: () -> Unit = {}
) {
    val context = LocalContext.current
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Profile Header Card
        ProfileHeaderCard(user = user)
        
        // Profile Information Card
        ProfileInfoCard(user = user)
        
        // Role-Specific Actions
        when (user.role) {
            UserRole.USER -> UserActionsCard(
                onNavigateToComplaintSubmission = onNavigateToComplaintSubmission,
                onNavigateToComplaintsList = onNavigateToComplaintsList,
                onNavigateToHeatmap = onNavigateToHeatmap
            )
            UserRole.WORKER -> WorkerActionsCard(
                onNavigateToWorkOrders = onNavigateToWorkOrders,
                onNavigateToHeatmap = onNavigateToHeatmap
            )
            UserRole.ADMIN -> AdminActionsCard()
        }
        
        // Account Actions Card
        AccountActionsCard(
            onEditProfile = onEditProfile,
            onChangePassword = onChangePassword,
            onSignOut = onSignOut
        )
    }
}

@Composable
fun ProfileHeaderCard(user: User) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(8.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Profile Avatar with Gradient Background
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(
                        when (user.role) {
                            UserRole.USER -> MaterialTheme.colorScheme.primaryContainer
                            UserRole.WORKER -> MaterialTheme.colorScheme.secondaryContainer
                            UserRole.ADMIN -> MaterialTheme.colorScheme.tertiaryContainer
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = "Profile",
                    modifier = Modifier.size(50.dp),
                    tint = when (user.role) {
                        UserRole.USER -> MaterialTheme.colorScheme.onPrimaryContainer
                        UserRole.WORKER -> MaterialTheme.colorScheme.onSecondaryContainer
                        UserRole.ADMIN -> MaterialTheme.colorScheme.onTertiaryContainer
                    }
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // User Name
            Text(
                text = user.fullName,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Role Badge
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = when (user.role) {
                        UserRole.USER -> MaterialTheme.colorScheme.primary
                        UserRole.WORKER -> MaterialTheme.colorScheme.secondary
                        UserRole.ADMIN -> MaterialTheme.colorScheme.tertiary
                    }
                ),
                shape = RoundedCornerShape(20.dp)
            ) {
                Text(
                    text = user.role.name,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Medium,
                    color = when (user.role) {
                        UserRole.USER -> MaterialTheme.colorScheme.onPrimary
                        UserRole.WORKER -> MaterialTheme.colorScheme.onSecondary
                        UserRole.ADMIN -> MaterialTheme.colorScheme.onTertiary
                    }
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Email
            Text(
                text = user.email,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun ProfileInfoCard(user: User) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "Profile Information",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            ProfileInfoRow(
                icon = Icons.Default.Person,
                label = "Full Name",
                value = user.fullName
            )
            
            ProfileInfoRow(
                icon = Icons.Default.Email,
                label = "Email",
                value = user.email
            )
            
            ProfileInfoRow(
                icon = Icons.Default.Phone,
                label = "Phone",
                value = user.phone ?: "Not provided"
            )
            
            ProfileInfoRow(
                icon = Icons.Default.Person,
                label = "Role",
                value = user.role.name
            )
            
            ProfileInfoRow(
                icon = Icons.Default.DateRange,
                label = "Member Since",
                value = user.createdAt.let { dateStr ->
                    try {
                        val date = Date(dateStr.toLongOrNull() ?: System.currentTimeMillis())
                        SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(date)
                    } catch (e: Exception) {
                        "Not available"
                    }
                }
            )
        }
    }
}

@Composable
fun ProfileInfoRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            modifier = Modifier.size(24.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun UserActionsCard(
    onNavigateToComplaintSubmission: () -> Unit = {},
    onNavigateToComplaintsList: () -> Unit = {},
    onNavigateToHeatmap: () -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "User Actions",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            ProfileActionButton(
                icon = Icons.Default.Add,
                text = "Submit New Complaint",
                onClick = onNavigateToComplaintSubmission
            )
            
            ProfileActionButton(
                icon = Icons.Default.List,
                text = "View My Complaints",
                onClick = onNavigateToComplaintsList
            )
            
            ProfileActionButton(
                icon = Icons.Default.LocationOn,
                text = "View Heat Map",
                onClick = onNavigateToHeatmap
            )
        }
    }
}

@Composable
fun WorkerActionsCard(
    onNavigateToWorkOrders: () -> Unit = {},
    onNavigateToHeatmap: () -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "Worker Actions",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            ProfileActionButton(
                icon = Icons.Default.List,
                text = "Worker Dashboard",
                onClick = onNavigateToWorkOrders
            )
            
            ProfileActionButton(
                icon = Icons.Default.LocationOn,
                text = "View Heatmap",
                onClick = onNavigateToHeatmap
            )
        }
    }
}

@Composable
fun AdminActionsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "Admin Actions",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            Text(
                text = "Admin features are available on the web portal",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            ProfileActionButton(
                icon = Icons.Default.Add,
                text = "Open Web Portal",
                onClick = { /* TODO: Open web browser to admin portal */ }
            )
        }
    }
}

@Composable
fun AccountActionsCard(
    onEditProfile: () -> Unit,
    onChangePassword: () -> Unit,
    onSignOut: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "Account Actions",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            ProfileActionButton(
                icon = Icons.Default.Edit,
                text = "Edit Profile",
                onClick = onEditProfile
            )
            
            ProfileActionButton(
                icon = Icons.Default.Lock,
                text = "Change Password",
                onClick = onChangePassword
            )
            
            ProfileActionButton(
                icon = Icons.Default.ExitToApp,
                text = "Sign Out",
                onClick = onSignOut,
                isDestructive = true
            )
        }
    }
}

@Composable
fun ProfileActionButton(
    icon: ImageVector,
    text: String,
    onClick: () -> Unit,
    isDestructive: Boolean = false
) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = if (isDestructive) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
        ),
        border = ButtonDefaults.outlinedButtonBorder
    ) {
        Icon(
            imageVector = icon,
            contentDescription = text,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = text,
            fontWeight = FontWeight.Medium
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileDialog(
    user: User?,
    onDismiss: () -> Unit,
    onSave: (String, String, String?) -> Unit
) {
    var firstName by remember { mutableStateOf(user?.firstName ?: "") }
    var lastName by remember { mutableStateOf(user?.lastName ?: "") }
    var phone by remember { mutableStateOf(user?.phone ?: "") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Profile") },
        text = {
            Column {
                OutlinedTextField(
                    value = firstName,
                    onValueChange = { firstName = it },
                    label = { Text("First Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                OutlinedTextField(
                    value = lastName,
                    onValueChange = { lastName = it },
                    label = { Text("Last Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(onClick = {
                onSave(firstName, lastName, phone.ifEmpty { null })
            }) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChangePasswordDialog(
    onDismiss: () -> Unit,
    onChangePassword: (String, String) -> Unit
) {
    var oldPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Change Password") },
        text = {
            Column {
                OutlinedTextField(
                    value = oldPassword,
                    onValueChange = { oldPassword = it },
                    label = { Text("Current Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                OutlinedTextField(
                    value = newPassword,
                    onValueChange = { newPassword = it },
                    label = { Text("New Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = { Text("Confirm New Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    isError = confirmPassword.isNotEmpty() && newPassword != confirmPassword,
                    supportingText = if (confirmPassword.isNotEmpty() && newPassword != confirmPassword) {
                        { Text("Passwords don't match") }
                    } else null,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (newPassword == confirmPassword && newPassword.isNotEmpty() && oldPassword.isNotEmpty()) {
                        onChangePassword(oldPassword, newPassword)
                    }
                },
                enabled = newPassword == confirmPassword && newPassword.isNotEmpty() && oldPassword.isNotEmpty()
            ) {
                Text("Change")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Preview(showBackground = true)
@Composable
fun PreviewProfileScreen() {
    MargWatchTheme {
        ProfileScreen(onNavigateBack = {})
    }
}