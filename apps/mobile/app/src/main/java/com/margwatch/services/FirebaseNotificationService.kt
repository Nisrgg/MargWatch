package com.margwatch.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.margwatch.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

class FirebaseNotificationService : FirebaseMessagingService() {
    
    companion object {
        private const val CHANNEL_ID = "margwatch_notifications"
        private var notificationIdCounter = 1000 // Start from 1000 to avoid conflicts
        
        // Callback for handling notification data
        var onNotificationReceived: ((String, String, String, Map<String, String>) -> Unit)? = null
    }

    override fun onCreate() {
        super.onCreate()
        android.util.Log.d("FCM", "🔧 FirebaseNotificationService onCreate()")
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "MargWatch Notifications",
                NotificationManager.IMPORTANCE_HIGH // Changed from DEFAULT to HIGH for better visibility
            ).apply {
                description = "Real-time notifications from MargWatch"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
            android.util.Log.d("FCM", "✅ Notification channel created: $CHANNEL_ID with HIGH importance")
        } else {
            android.util.Log.d("FCM", "⚠️ Android version < O, using default notification channel")
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        android.util.Log.d("FCM", "📨 ========== FCM MESSAGE RECEIVED ==========")
        android.util.Log.d("FCM", "📨 From: ${remoteMessage.from}")
        android.util.Log.d("FCM", "📨 Message ID: ${remoteMessage.messageId}")
        android.util.Log.d("FCM", "📨 Data payload size: ${remoteMessage.data.size}")
        android.util.Log.d("FCM", "📨 Has notification payload: ${remoteMessage.notification != null}")
        
        // Handle data payload
        if (remoteMessage.data.isNotEmpty()) {
            android.util.Log.d("FCM", "📊 Data payload: ${remoteMessage.data}")
            handleDataMessage(remoteMessage.data)
        }

        // Handle notification payload
        remoteMessage.notification?.let { notification ->
            android.util.Log.d("FCM", "📱 Notification payload received:")
            android.util.Log.d("FCM", "  - Title: ${notification.title}")
            android.util.Log.d("FCM", "  - Body: ${notification.body}")
            android.util.Log.d("FCM", "  - Icon: ${notification.icon}")
            android.util.Log.d("FCM", "  - Sound: ${notification.sound}")
            showNotification(
                title = notification.title ?: "MargWatch",
                message = notification.body ?: "",
                data = remoteMessage.data
            )
        } ?: run {
            android.util.Log.d("FCM", "⚠️ No notification payload, only data payload")
        }
    }

    private fun handleDataMessage(data: Map<String, String>) {
        try {
            val type = data["type"] ?: "general"
            val title = data["title"] ?: "MargWatch Notification"
            val message = data["message"] ?: ""
            val notificationType = data["notificationType"] ?: "general"
            
            // Notify the app about the received notification
            onNotificationReceived?.invoke(title, message, notificationType, data)
            
            // Show notification if no notification payload was sent
            if (data["showNotification"] != "false") {
                showNotification(title, message, data)
            }
            
        } catch (e: Exception) {
            android.util.Log.e("FCM", "Failed to handle data message", e)
        }
    }

    private fun showNotification(title: String, message: String, data: Map<String, String>) {
        android.util.Log.d("FCM", "🔔 showNotification() called")
        android.util.Log.d("FCM", "  - Title: $title")
        android.util.Log.d("FCM", "  - Message: $message")
        android.util.Log.d("FCM", "  - Data: $data")
        
        if (!areNotificationsEnabled()) {
            android.util.Log.w("FCM", "❌ Notifications not enabled by user")
            return
        }

        try {
            // Generate unique notification ID for each notification
            val notificationId = notificationIdCounter++
            android.util.Log.d("FCM", "  - Notification ID: $notificationId")
            
            val builder = NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH) // Changed from DEFAULT to HIGH
                .setAutoCancel(true)
                .setDefaults(NotificationCompat.DEFAULT_ALL) // Sound, vibration, lights
                .setStyle(NotificationCompat.BigTextStyle().bigText(message)) // Expandable notification

            // Add action buttons based on notification type
            val type = data["type"]
            when (type) {
                "complaint_status" -> {
                    builder.addAction(
                        android.R.drawable.ic_menu_view,
                        "View Details",
                        null // You can add PendingIntent here
                    )
                }
                "work_update" -> {
                    builder.addAction(
                        android.R.drawable.ic_menu_view,
                        "View Progress",
                        null
                    )
                }
            }

            val notification = builder.build()
            val notificationManager = NotificationManagerCompat.from(this)
            
            // Check if notification permission is granted
            val areEnabled = notificationManager.areNotificationsEnabled()
            android.util.Log.d("FCM", "  - Notifications enabled: $areEnabled")
            
            if (areEnabled) {
                notificationManager.notify(notificationId, notification)
                android.util.Log.d("FCM", "✅ Notification shown successfully!")
                android.util.Log.d("FCM", "  - ID: $notificationId")
                android.util.Log.d("FCM", "  - Channel: $CHANNEL_ID")
            } else {
                android.util.Log.w("FCM", "⚠️ Notifications are disabled by user")
            }
        } catch (e: Exception) {
            android.util.Log.e("FCM", "❌ Failed to show notification", e)
            android.util.Log.e("FCM", "Exception details: ${e.message}")
            e.printStackTrace()
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        android.util.Log.d("FCM", "🔄 New FCM token received")
        
        // Send token to your backend server
        CoroutineScope(Dispatchers.IO).launch {
            sendTokenToServer(token)
        }
    }

    private suspend fun sendTokenToServer(token: String) {
        try {
            android.util.Log.d("FCM", "📤 Sending token to server")
            
            // Get the API service instance
            val apiService = com.margwatch.data.network.ApiClient.apiService
            
            // Get the current user's auth token from SharedPreferences
            val sharedPrefs = getSharedPreferences("margwatch_prefs", Context.MODE_PRIVATE)
            val authToken = sharedPrefs.getString("auth_token", null)
            
            if (authToken != null) {
                val request = com.margwatch.shared.types.FCMTokenRequest(token)
                val response = apiService.updateFCMToken("Bearer $authToken", request)
                
                if (response.isSuccessful) {
                    android.util.Log.d("FCM", "✅ FCM token sent to server successfully")
                } else {
                    android.util.Log.e("FCM", "❌ Failed to send FCM token: ${response.code()} ${response.message()}")
                }
            } else {
                android.util.Log.w("FCM", "⚠️ No auth token found, cannot register FCM token")
            }
            
        } catch (e: Exception) {
            android.util.Log.e("FCM", "Failed to send token to server", e)
        }
    }

    private fun areNotificationsEnabled(): Boolean {
        val notificationManager = NotificationManagerCompat.from(this)
        return notificationManager.areNotificationsEnabled()
    }
}



