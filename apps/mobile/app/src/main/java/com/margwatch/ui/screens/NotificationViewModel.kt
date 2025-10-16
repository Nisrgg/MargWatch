package com.margwatch.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.margwatch.data.local.TokenManager
import com.margwatch.data.model.Notification
import com.margwatch.data.model.NotificationResponse
import com.margwatch.data.repository.MargWatchRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotificationUiState(
    val isLoading: Boolean = false,
    val notifications: List<Notification> = emptyList(),
    val unreadCount: Int = 0,
    val error: String? = null,
    val isConnected: Boolean = false
)

class NotificationViewModel(
    private val repository: MargWatchRepository = MargWatchRepository(),
    private val tokenManager: TokenManager? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationUiState())
    val uiState: StateFlow<NotificationUiState> = _uiState.asStateFlow()

    fun loadNotifications(tokenManager: TokenManager, page: Int = 1, limit: Int = 20, unreadOnly: Boolean = false) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val token = tokenManager.getToken().first() as? String
                if (token != null) {
                    val result = repository.getNotifications(token, page, limit, unreadOnly)
                    result.onSuccess { response ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                notifications = response.notifications,
                                error = null
                            ) 
                        }
                    }.onFailure { e ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                error = "Failed to load notifications: ${e.message}"
                            ) 
                        }
                    }
                } else {
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            error = "No authentication token found"
                        ) 
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = "Error loading notifications: ${e.message}"
                    ) 
                }
            }
        }
    }

    fun loadNotificationCount(tokenManager: TokenManager) {
        viewModelScope.launch {
            try {
                val token = tokenManager.getToken().first() as? String
                if (token != null) {
                    val result = repository.getNotificationCount(token)
                    result.onSuccess { response ->
                        _uiState.update { 
                            it.copy(unreadCount = response.unreadCount) 
                        }
                    }.onFailure { e ->
                        android.util.Log.e("NotificationViewModel", "Failed to get notification count: ${e.message}")
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("NotificationViewModel", "Error getting notification count: ${e.message}")
            }
        }
    }

    fun markAsRead(tokenManager: TokenManager, notificationId: String, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            try {
                val token = tokenManager.getToken().first() as? String
                if (token != null) {
                    val result = repository.markNotificationAsRead(token, notificationId)
                    result.onSuccess {
                        // Update local state
                        _uiState.update { state ->
                            state.copy(
                                notifications = state.notifications.map { notification ->
                                    if (notification.id == notificationId) {
                                        notification.copy(isRead = true)
                                    } else {
                                        notification
                                    }
                                },
                                unreadCount = maxOf(0, state.unreadCount - 1)
                            )
                        }
                        onResult(true, null)
                    }.onFailure { e ->
                        onResult(false, e.message)
                    }
                } else {
                    onResult(false, "No authentication token found")
                }
            } catch (e: Exception) {
                onResult(false, e.message)
            }
        }
    }

    fun markAllAsRead(tokenManager: TokenManager, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            try {
                val token = tokenManager.getToken().first() as? String
                if (token != null) {
                    val result = repository.markAllNotificationsAsRead(token)
                    result.onSuccess {
                        // Update local state
                        _uiState.update { state ->
                            state.copy(
                                notifications = state.notifications.map { it.copy(isRead = true) },
                                unreadCount = 0
                            )
                        }
                        onResult(true, null)
                    }.onFailure { e ->
                        onResult(false, e.message)
                    }
                } else {
                    onResult(false, "No authentication token found")
                }
            } catch (e: Exception) {
                onResult(false, e.message)
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun setConnectionStatus(connected: Boolean) {
        _uiState.update { it.copy(isConnected = connected) }
    }
}

