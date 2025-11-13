package com.margwatch.ui.screens

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.margwatch.data.local.TokenManager
import com.margwatch.shared.types.*
import com.margwatch.data.repository.MargWatchRepository
import com.margwatch.services.FirebaseNotificationManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class AuthUiState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val user: User? = null,
    val error: String? = null,
    val showLoginSuccess: Boolean = false,
    val showRegisterSuccess: Boolean = false
)

class AuthViewModel(
    private val repository: MargWatchRepository = MargWatchRepository(),
    private val tokenManager: TokenManager? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()
    
    // Current user for easy access
    val currentUser: User? get() = _uiState.value.user
    
    // Cooldown mechanism to prevent rapid API calls
    private var lastProfileFetchTime = 0L
    private val profileFetchCooldown = 5000L // 5 seconds

    init {
        // Check for existing authentication on initialization
        checkExistingAuth()
    }

    private fun checkExistingAuth() {
        viewModelScope.launch {
            // Set loading state while checking
            _uiState.update { it.copy(isLoading = true) }
            
            tokenManager?.getToken()?.collect { token ->
                if (token != null) {
                    android.util.Log.d("AuthViewModel", "Found existing token")
                    // Verify token is still valid by getting user profile
                    val result = repository.getUserProfile(token)
                    result.onSuccess { user ->
                        android.util.Log.d("AuthViewModel", "Token is valid, user: ${user.email}")
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                isAuthenticated = true,
                                user = user
                            )
                        }
                        // Register FCM token for existing authenticated user
                        android.util.Log.d("AuthViewModel", "Registering FCM token for existing authenticated user...")
                        registerFCMToken(token)
                    }.onFailure { e ->
                        android.util.Log.e("AuthViewModel", "Token is invalid: ${e.message}")
                        // Token is invalid, clear it
                        tokenManager.clearToken()
                        _uiState.update { AuthUiState(isLoading = false) }
                    }
                } else {
                    android.util.Log.d("AuthViewModel", "No existing token found")
                    _uiState.update { AuthUiState(isLoading = false) }
                }
            }
        }
    }

    fun login(email: String, password: String) {
        _uiState.update { it.copy(isLoading = true, error = null, showLoginSuccess = false) }
        viewModelScope.launch {
            val result = repository.login(LoginRequest(email, password))
            result.onSuccess { loginData ->
                // Save token and user info
                tokenManager?.let { manager ->
                    android.util.Log.d("AuthViewModel", "Saving token")
                    manager.saveToken(loginData.token)
                    manager.saveUserInfo(loginData.user.id, loginData.user.email)
                    android.util.Log.d("AuthViewModel", "Token saved successfully")
                }
                
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        user = loginData.user,
                        showLoginSuccess = true
                    )
                }
                
                // Register FCM token after successful login
                registerFCMToken(loginData.token)
            }.onFailure { e ->
                android.util.Log.e("AuthViewModel", "Login failed: ${e.message}")
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Login failed",
                        isAuthenticated = false
                    )
                }
            }
        }
    }

    fun register(firstName: String, lastName: String, email: String, password: String) {
        _uiState.update { it.copy(isLoading = true, error = null, showRegisterSuccess = false) }
        viewModelScope.launch {
            val result = repository.register(RegisterRequest(firstName, lastName, email, password))
            result.onSuccess { user ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        user = user,
                        showRegisterSuccess = true
                    )
                }
            }.onFailure { e ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Registration failed"
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            tokenManager?.clearToken()
        }
        _uiState.update { AuthUiState() } // Reset state on logout
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun loginSuccessHandled() {
        _uiState.update { it.copy(showLoginSuccess = false) }
    }

    fun registerSuccessHandled() {
        _uiState.update { it.copy(showRegisterSuccess = false) }
    }
    
    fun getUserProfile() {
        // Prevent multiple simultaneous calls
        if (_uiState.value.isLoading) {
            android.util.Log.d("AuthViewModel", "Profile fetch already in progress, skipping...")
            return
        }
        
        // Check cooldown
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastProfileFetchTime < profileFetchCooldown) {
            android.util.Log.d("AuthViewModel", "Profile fetch on cooldown, skipping...")
            return
        }
        
        lastProfileFetchTime = currentTime
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val token = tokenManager?.getToken()?.first() as? String
                if (token != null) {
                    android.util.Log.d("AuthViewModel", "Fetching user profile")
                    val result = repository.getUserProfile(token)
                    result.onSuccess { user ->
                        android.util.Log.d("AuthViewModel", "User profile loaded successfully: ${user.email}")
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                user = user,
                                error = null
                            ) 
                        }
                    }.onFailure { e ->
                        android.util.Log.e("AuthViewModel", "Failed to get user profile: ${e.message}")
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                error = "Failed to load profile: ${e.message}"
                            ) 
                        }
                    }
                } else {
                    android.util.Log.e("AuthViewModel", "No token available for profile fetch")
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            error = "No authentication token found"
                        ) 
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("AuthViewModel", "Error getting token: ${e.message}")
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = "Error getting authentication token: ${e.message}"
                    ) 
                }
            }
        }
    }

    fun updateProfile(firstName: String, lastName: String, phone: String?, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val token = tokenManager?.getToken()?.first() as? String
                if (token != null) {
                    android.util.Log.d("AuthViewModel", "Updating profile: $firstName $lastName, phone: $phone")
                    val result = repository.updateUserProfile(token, firstName, lastName, phone)
                    result.onSuccess { user ->
                        android.util.Log.d("AuthViewModel", "Profile updated successfully: ${user.email}, name: ${user.fullName}")
                        _uiState.update { it.copy(isLoading = false, user = user) }
                        onResult(true, null)
                    }.onFailure { e ->
                        android.util.Log.e("AuthViewModel", "Profile update failed: ${e.message}")
                        _uiState.update { it.copy(isLoading = false, error = e.message) }
                        onResult(false, e.message)
                    }
                } else {
                    android.util.Log.e("AuthViewModel", "No token available for profile update")
                    _uiState.update { it.copy(isLoading = false, error = "No authentication token found") }
                    onResult(false, "No authentication token found")
                }
            } catch (e: Exception) {
                android.util.Log.e("AuthViewModel", "Profile update exception: ${e.message}")
                _uiState.update { it.copy(isLoading = false, error = e.message) }
                onResult(false, e.message)
            }
        }
    }

    fun changePassword(currentPassword: String, newPassword: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val token = tokenManager?.getToken()?.first() as? String
                if (token != null) {
                    val result = repository.changePassword(token, currentPassword, newPassword)
                    result.onSuccess {
                        _uiState.update { it.copy(isLoading = false) }
                        onResult(true, null)
                    }.onFailure { e ->
                        _uiState.update { it.copy(isLoading = false, error = e.message) }
                        onResult(false, e.message)
                    }
                } else {
                    _uiState.update { it.copy(isLoading = false, error = "No authentication token found") }
                    onResult(false, "No authentication token found")
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
                onResult(false, e.message)
            }
        }
    }
    
    /**
     * Register FCM token with backend
     * Can be called after login or when app resumes
     */
    fun registerFCMToken(authToken: String? = null) {
        if (authToken != null) {
            registerFCMTokenInternal(authToken)
        } else {
            // Get token from TokenManager (Flow<String?>)
            viewModelScope.launch {
                val token = tokenManager?.getToken()?.first()
                if (token != null) {
                    registerFCMTokenInternal(token)
                } else {
                    android.util.Log.w("AuthViewModel", "⚠️ No auth token available, cannot register FCM token")
                }
            }
        }
    }
    
    private fun registerFCMTokenInternal(authToken: String) {
        viewModelScope.launch {
            try {
                android.util.Log.d("AuthViewModel", "🔄 Starting FCM token registration...")
                
                // Get FCM token - use application context from TokenManager
                val context = tokenManager?.appContext
                if (context == null) {
                    android.util.Log.e("AuthViewModel", "❌ Application context not available")
                    return@launch
                }
                
                val fcmManager = FirebaseNotificationManager(context)
                
                android.util.Log.d("AuthViewModel", "Requesting FCM token from Firebase...")
                val fcmToken = fcmManager.getFCMToken(maxRetries = 3)
                
                if (fcmToken != null && fcmToken.isNotBlank()) {
                    android.util.Log.d("AuthViewModel", "✅ FCM Token obtained: ${fcmToken.take(20)}...")
                    android.util.Log.d("AuthViewModel", "   Token length: ${fcmToken.length}")
                    android.util.Log.d("AuthViewModel", "📤 Registering FCM token with backend...")
                    
                    // Register FCM token with backend with retry logic
                    var registrationSuccess = false
                    var lastError: Exception? = null
                    
                    for (attempt in 1..3) {
                        val result = repository.updateFCMToken(authToken, fcmToken)
                        result.onSuccess {
                            android.util.Log.d("AuthViewModel", "✅ FCM token registered successfully with backend (Attempt $attempt)")
                            registrationSuccess = true
                            
                            // Subscribe to user-specific topics
                            val user = _uiState.value.user
                            if (user != null) {
                                android.util.Log.d("AuthViewModel", "📱 Subscribing to user topics for: ${user.id} (${user.role.name})")
                                try {
                                    fcmManager.subscribeToUserTopics(user.id, user.role.name)
                                    android.util.Log.d("AuthViewModel", "✅ FCM topic subscriptions completed")
                                } catch (e: Exception) {
                                    android.util.Log.e("AuthViewModel", "❌ Failed to subscribe to topics: ${e.message}")
                                }
                            } else {
                                android.util.Log.w("AuthViewModel", "⚠️ User info not available, skipping topic subscriptions")
                            }
                        }.onFailure { e ->
                            lastError = e as Exception?
                            android.util.Log.e("AuthViewModel", "❌ Failed to register FCM token (Attempt $attempt/3): ${e.message}")
                            
                            if (attempt < 3) {
                                val delayMs = attempt * 1000L
                                android.util.Log.d("AuthViewModel", "⏳ Retrying in ${delayMs}ms...")
                                kotlinx.coroutines.delay(delayMs)
                            }
                        }
                        
                        if (registrationSuccess) break
                    }
                    
                    if (!registrationSuccess) {
                        if (lastError != null) {
                            android.util.Log.e("AuthViewModel", "❌ All FCM token registration attempts failed", lastError)
                        } else {
                            android.util.Log.e("AuthViewModel", "❌ All FCM token registration attempts failed")
                        }
                    }
                } else {
                    android.util.Log.e("AuthViewModel", "❌ Failed to get FCM token - Firebase may not be initialized or token is empty")
                }
            } catch (e: Exception) {
                android.util.Log.e("AuthViewModel", "❌ Error registering FCM token: ${e.message}", e)
                e.printStackTrace()
            }
        }
    }
}
