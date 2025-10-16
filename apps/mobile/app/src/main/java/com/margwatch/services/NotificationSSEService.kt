package com.margwatch.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.margwatch.R
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import com.margwatch.config.NetworkConfig
import java.util.concurrent.TimeUnit

class NotificationSSEService(
    private val context: Context,
    private val token: String,
    private val onNotificationReceived: (String, String, String) -> Unit
) {
    private var client: OkHttpClient? = null
    private var request: Request? = null
    private var job: Job? = null
    private var isConnected = false

    companion object {
        private const val CHANNEL_ID = "margwatch_notifications"
        private const val NOTIFICATION_ID = 1
        private const val BASE_URL = NetworkConfig.SSE_BASE_URL // Backend URL
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

    fun startListening() {
        if (isConnected) {
            android.util.Log.w("SSE", "SSE already connected, skipping")
            return
        }

        android.util.Log.d("SSE", "Starting SSE connection...")
        android.util.Log.d("SSE", "BASE_URL: $BASE_URL")
        android.util.Log.d("SSE", "Token: ${token.take(20)}...")
        job = CoroutineScope(Dispatchers.IO).launch {
            try {
                client = OkHttpClient.Builder()
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(0, TimeUnit.SECONDS) // No timeout for SSE
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .build()

                request = Request.Builder()
                    .url("${BASE_URL}notifications/stream")
                    .addHeader("Authorization", "Bearer $token")
                    .addHeader("Accept", "text/event-stream")
                    .addHeader("Cache-Control", "no-cache")
                    .build()

                val response = client!!.newCall(request!!).execute()
                
                android.util.Log.d("SSE", "SSE Response Code: ${response.code}")
                android.util.Log.d("SSE", "SSE Response Headers: ${response.headers}")
                
                if (response.isSuccessful) {
                    isConnected = true
                    android.util.Log.d("SSE", "SSE connection established successfully")
                    response.body?.let { body ->
                        val source = body.source()
                        source.timeout().timeout(0, TimeUnit.SECONDS)

                        while (isActive && isConnected) {
                            val line = source.readUtf8Line()
                            android.util.Log.d("SSE", "Received line: $line")
                            if (line != null) {
                                android.util.Log.d("SSE", "Processing line: $line")
                                if (line.startsWith("data: ")) {
                                    val data = line.substring(6)
                                    android.util.Log.d("SSE", "Parsing data: $data")
                                    if (data.isNotEmpty()) {
                                        try {
                                            // Parse SSE data
                                            val notificationData = parseSSEData(data)
                                            if (notificationData != null) {
                                                withContext(Dispatchers.Main) {
                                                    onNotificationReceived(
                                                        notificationData.title,
                                                        notificationData.message,
                                                        notificationData.type
                                                    )
                                                    // Local notification removed - FCM handles notifications
                                                }
                                            }
                                        } catch (e: Exception) {
                                            android.util.Log.e("SSE", "Error parsing notification data: ${e.message}")
                                        }
                                    }
                                } else {
                                    android.util.Log.d("SSE", "Ignoring line: $line")
                                }
                            } else if (line == null) {
                                android.util.Log.w("SSE", "SSE stream ended (null line)")
                                break
                            }
                        }
                    }
                } else {
                    android.util.Log.e("SSE", "Failed to connect: ${response.code}")
                }
            } catch (e: Exception) {
                android.util.Log.e("SSE", "SSE connection error: ${e.message}")
            } finally {
                isConnected = false
            }
        }
    }

    fun stopListening() {
        isConnected = false
        job?.cancel()
        client?.dispatcher?.executorService?.shutdown()
    }

    fun pauseListening() {
        // Don't close connection, just pause processing
        android.util.Log.d("SSE", "Pausing SSE processing")
    }

    fun resumeListening() {
        // Resume processing if connection is still active
        android.util.Log.d("SSE", "Resuming SSE processing")
    }

    private fun parseSSEData(data: String): NotificationData? {
        return try {
            // Parse SSE data structure: {"type": "notification", "data": {...}}
            val json = data.trim()
            if (json.startsWith("{") && json.endsWith("}")) {
                val notificationType = extractJsonField(json, "type")
                
                if (notificationType == "notification") {
                    // Extract the nested data object
                    val dataStart = json.indexOf("\"data\":")
                    if (dataStart != -1) {
                        val dataJson = json.substring(dataStart + 7).trim()
                        if (dataJson.startsWith("{")) {
                            val title = extractJsonField(dataJson, "title") ?: "New Notification"
                            val message = extractJsonField(dataJson, "message") ?: "You have a new notification"
                            val type = extractJsonField(dataJson, "type") ?: "SYSTEM"
                            
                            return NotificationData(title, message, type)
                        }
                    }
                } else if (notificationType == "connected" || notificationType == "heartbeat") {
                    // Ignore connection/heartbeat messages
                    return null
                }
                
                // Fallback: try to parse as direct notification
                val title = extractJsonField(json, "title") ?: "New Notification"
                val message = extractJsonField(json, "message") ?: "You have a new notification"
                val type = extractJsonField(json, "type") ?: "SYSTEM"
                
                NotificationData(title, message, type)
            } else {
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("SSE", "Error parsing JSON: ${e.message}")
            null
        }
    }

    private fun extractJsonField(json: String, field: String): String? {
        val pattern = "\"$field\"\\s*:\\s*\"([^\"]+)\"".toRegex()
        return pattern.find(json)?.groupValues?.get(1)
    }

    fun isConnected(): Boolean = isConnected

    // Local notification methods removed - FCM handles all notifications
}

data class NotificationData(
    val title: String,
    val message: String,
    val type: String
)
