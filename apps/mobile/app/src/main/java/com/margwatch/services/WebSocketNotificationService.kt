package com.margwatch.services

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.margwatch.R
import com.margwatch.config.NetworkConfig
import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class WebSocketNotificationService(
    private val context: Context,
    private val token: String,
    private val onNotificationReceived: (String, String, String) -> Unit
) {
    private var webSocket: WebSocket? = null
    private var client: OkHttpClient? = null
    private var isConnected = false
    private var reconnectJob: Job? = null

    companion object {
        private const val CHANNEL_ID = "margwatch_notifications"
        private const val NOTIFICATION_ID = 1
        private const val WS_URL = NetworkConfig.WS_BASE_URL
    }

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "MargWatch Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Real-time notifications from MargWatch"
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun connect() {
        if (isConnected) {
            android.util.Log.w("WebSocket", "Already connected, skipping")
            return
        }

        android.util.Log.d("WebSocket", "Connecting to WebSocket...")
        android.util.Log.d("WebSocket", "URL: $WS_URL")
        android.util.Log.d("WebSocket", "Token obtained successfully")

        client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        val request = Request.Builder()
            .url("$WS_URL?token=$token")
            .build()

        webSocket = client!!.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                android.util.Log.d("WebSocket", "✅ WebSocket connected successfully")
                isConnected = true
                reconnectJob?.cancel()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                android.util.Log.d("WebSocket", "📨 Received message: $text")
                try {
                    val json = JSONObject(text)
                    val type = json.getString("type")
                    
                    android.util.Log.d("WebSocket", "Message type: $type")
                    
                    when (type) {
                        "connected" -> {
                            android.util.Log.d("WebSocket", "🔌 Connection confirmed")
                        }
                        "notification" -> {
                            val data = json.getJSONObject("data")
                            val title = data.optString("title", "MargWatch Notification")
                            val message = data.optString("message", "")
                            val notificationType = data.optString("type", "general")
                            
                            android.util.Log.d("WebSocket", "📱 Processing notification: $title")
                            onNotificationReceived(title, message, notificationType)
                        }
                        "broadcast" -> {
                            // Handle broadcast messages for real-time UI updates
                            // Note: We don't show local notifications for broadcasts because:
                            // 1. FCM already handles push notifications
                            // 2. WebSocket is primarily for real-time UI updates (refreshing lists, etc.)
                            // 3. Showing both would create duplicate notifications
                            android.util.Log.d("WebSocket", "📡 Processing broadcast message (UI update only, no notification)")
                            val dataObj = json.optJSONObject("data")
                            if (dataObj != null) {
                                val dataType = dataObj.optString("type", "")
                                val innerData = dataObj.optJSONObject("data")
                                
                                android.util.Log.d("WebSocket", "Broadcast data type: $dataType")
                                
                                // Log the broadcast for debugging, but don't trigger notifications
                                // The UI should listen to these broadcasts to refresh data
                                when (dataType) {
                                    "complaint_created" -> {
                                        if (innerData != null) {
                                            val complaintId = innerData.optString("complaintId", "")
                                            val title = innerData.optString("title", "New Complaint")
                                            android.util.Log.d("WebSocket", "📋 Complaint created: $complaintId - $title (UI update only)")
                                            // No notification - FCM handles this
                                        }
                                    }
                                    "complaint_update" -> {
                                        if (innerData != null) {
                                            val complaintId = innerData.optString("complaintId", "")
                                            val status = innerData.optString("status", "")
                                            android.util.Log.d("WebSocket", "📋 Complaint updated: $complaintId - Status: $status (UI update only)")
                                            // No notification - FCM handles this
                                        }
                                    }
                                    "work_order_update" -> {
                                        if (innerData != null) {
                                            val workOrderId = innerData.optString("workOrderId", "")
                                            val status = innerData.optString("status", "")
                                            android.util.Log.d("WebSocket", "🔧 Work order updated: $workOrderId - Status: $status (UI update only)")
                                            // No notification - FCM handles this
                                        }
                                    }
                                    else -> {
                                        android.util.Log.d("WebSocket", "📨 Unknown broadcast data type: $dataType")
                                    }
                                }
                            } else {
                                android.util.Log.w("WebSocket", "⚠️ Broadcast message missing data object")
                            }
                        }
                        else -> {
                            android.util.Log.d("WebSocket", "📨 Unknown message type: $type")
                        }
                    }
                } catch (e: Exception) {
                    android.util.Log.e("WebSocket", "❌ Failed to parse message: $text", e)
                    e.printStackTrace()
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                android.util.Log.d("WebSocket", "🔌 WebSocket closing: $code - $reason")
                isConnected = false
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                android.util.Log.d("WebSocket", "🔌 WebSocket closed: $code - $reason")
                isConnected = false
                scheduleReconnect()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                android.util.Log.e("WebSocket", "❌ WebSocket failed: ${t.message}", t)
                android.util.Log.e("WebSocket", "Response: ${response?.code} - ${response?.message}")
                isConnected = false
                scheduleReconnect()
            }
        })
    }

    private fun scheduleReconnect() {
        reconnectJob?.cancel()
        reconnectJob = CoroutineScope(Dispatchers.IO).launch {
            delay(5000) // Wait 5 seconds before reconnecting
            android.util.Log.d("WebSocket", "🔄 Attempting to reconnect...")
            connect()
        }
    }

    fun disconnect() {
        android.util.Log.d("WebSocket", "Disconnecting WebSocket...")
        reconnectJob?.cancel()
        webSocket?.close(1000, "Client disconnect")
        client?.dispatcher?.executorService?.shutdown()
        isConnected = false
    }

    fun isConnected(): Boolean = isConnected

    // Local notification methods removed - FCM handles all notifications
}
