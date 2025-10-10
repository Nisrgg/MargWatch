package com.margwatch.services

import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import android.util.Log

class NotificationIntegrationService(private val context: Context) {
    
    companion object {
        private const val TAG = "NotificationIntegration"
    }

    private val firebaseManager = FirebaseNotificationManager(context)

    /**
     * Initialize FCM and register token with backend
     */
    fun initializeNotifications(userId: String, userRole: String, authToken: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Get FCM token
                val fcmToken = firebaseManager.getFCMToken()
                if (fcmToken != null) {
                    // Send token to backend
                    sendTokenToBackend(fcmToken, authToken)
                    
                    // Subscribe to relevant topics
                    firebaseManager.subscribeToUserTopics(userId, userRole)
                    
                    Log.d(TAG, "✅ FCM initialized successfully for user: $userId")
                } else {
                    Log.e(TAG, "❌ Failed to get FCM token")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to initialize FCM", e)
            }
        }
    }

    /**
     * Clean up FCM subscriptions and remove token
     */
    fun cleanupNotifications(userId: String, userRole: String, authToken: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Unsubscribe from topics
                firebaseManager.unsubscribeFromUserTopics(userId, userRole)
                
                // Remove token from backend
                removeTokenFromBackend(authToken)
                
                Log.d(TAG, "✅ FCM cleanup completed for user: $userId")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to cleanup FCM", e)
            }
        }
    }

    /**
     * Send FCM token to backend
     */
    private suspend fun sendTokenToBackend(fcmToken: String, authToken: String) {
        try {
            // TODO: Implement API call to update FCM token
            // Example:
            // val apiService = ApiService.getInstance()
            // apiService.updateFCMToken(fcmToken, authToken)
            
            Log.d(TAG, "📤 FCM token sent to backend: $fcmToken")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send FCM token to backend", e)
        }
    }

    /**
     * Remove FCM token from backend
     */
    private suspend fun removeTokenFromBackend(authToken: String) {
        try {
            // TODO: Implement API call to remove FCM token
            // Example:
            // val apiService = ApiService.getInstance()
            // apiService.removeFCMToken(authToken)
            
            Log.d(TAG, "📤 FCM token removed from backend")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to remove FCM token from backend", e)
        }
    }

    /**
     * Handle notification received callback
     */
    fun setupNotificationCallback(
        onNotificationReceived: (String, String, String, Map<String, String>) -> Unit
    ) {
        FirebaseNotificationService.onNotificationReceived = onNotificationReceived
    }
}



