package com.margwatch.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.margwatch.data.local.TokenManager
import kotlinx.coroutines.flow.first

class GlobalNotificationService private constructor() {
    private var wsService: WebSocketNotificationService? = null
    private var isInitialized = false
    private var context: Context? = null
    private var notificationIdCounter = 2000 // Start from 2000 to avoid conflicts with FCM

    companion object {
        @Volatile
        private var INSTANCE: GlobalNotificationService? = null
        private const val CHANNEL_ID = "margwatch_notifications"

        fun getInstance(): GlobalNotificationService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: GlobalNotificationService().also { INSTANCE = it }
            }
        }
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "MargWatch Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Real-time notifications from MargWatch"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
            android.util.Log.d("GlobalWS", "✅ Notification channel created")
        }
    }

    private fun showNotification(context: Context, title: String, message: String, type: String) {
        try {
            val notificationId = notificationIdCounter++
            android.util.Log.d("GlobalWS", "📱 Showing notification: $title (ID: $notificationId)")
            
            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))

            val notificationManager = NotificationManagerCompat.from(context)
            
            if (notificationManager.areNotificationsEnabled()) {
                notificationManager.notify(notificationId, builder.build())
                android.util.Log.d("GlobalWS", "✅ Notification shown successfully!")
            } else {
                android.util.Log.w("GlobalWS", "⚠️ Notifications are disabled by user")
            }
        } catch (e: Exception) {
            android.util.Log.e("GlobalWS", "❌ Failed to show notification", e)
        }
    }

    suspend fun initialize(context: Context, tokenManager: TokenManager) {
        android.util.Log.d("GlobalWS", "Initialize called, isInitialized: $isInitialized")
        if (isInitialized) {
            android.util.Log.d("GlobalWS", "Already initialized, skipping")
            return
        }

        this.context = context.applicationContext
        createNotificationChannel(context)

        try {
            android.util.Log.d("GlobalWS", "Getting token from tokenManager...")
            val token = tokenManager.getToken().first() as? String
            android.util.Log.d("GlobalWS", "Token obtained successfully")
            
            if (token != null) {
                android.util.Log.d("GlobalWS", "Creating WebSocketNotificationService...")
                wsService = WebSocketNotificationService(
                    context = context,
                    token = token,
                    onNotificationReceived = { title, message, type ->
                        android.util.Log.d("GlobalWS", "📨 Global notification received via WebSocket")
                        android.util.Log.d("GlobalWS", "  - Title: $title")
                        android.util.Log.d("GlobalWS", "  - Message: $message")
                        android.util.Log.d("GlobalWS", "  - Type: $type")
                        
                        // Show local notification for WebSocket messages
                        // FCM will handle push notifications when app is in background
                        val ctx = this.context ?: context
                        showNotification(ctx, title, message, type)
                    }
                )
                android.util.Log.d("GlobalWS", "Connecting WebSocket...")
                wsService?.connect()
                isInitialized = true
                android.util.Log.d("GlobalWS", "Global WebSocket service initialized successfully")
            } else {
                android.util.Log.e("GlobalWS", "No token available for global WebSocket")
            }
        } catch (e: Exception) {
            android.util.Log.e("GlobalWS", "Failed to initialize global WebSocket: ${e.message}", e)
        }
    }

    fun stop() {
        wsService?.disconnect()
        wsService = null
        isInitialized = false
        android.util.Log.d("GlobalWS", "Global WebSocket service stopped")
    }

    fun isConnected(): Boolean {
        return wsService?.isConnected() ?: false
    }
}
