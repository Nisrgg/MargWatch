package com.margwatch.services

import android.content.Context
import com.margwatch.data.local.TokenManager
import kotlinx.coroutines.flow.first

class GlobalNotificationService private constructor() {
    private var wsService: WebSocketNotificationService? = null
    private var isInitialized = false

    companion object {
        @Volatile
        private var INSTANCE: GlobalNotificationService? = null

        fun getInstance(): GlobalNotificationService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: GlobalNotificationService().also { INSTANCE = it }
            }
        }
    }

    suspend fun initialize(context: Context, tokenManager: TokenManager) {
        android.util.Log.d("GlobalWS", "Initialize called, isInitialized: $isInitialized")
        if (isInitialized) {
            android.util.Log.d("GlobalWS", "Already initialized, skipping")
            return
        }

        try {
            android.util.Log.d("GlobalWS", "Getting token from tokenManager...")
            val token = tokenManager.getToken().first() as? String
            android.util.Log.d("GlobalWS", "Token obtained: ${token?.take(20)}...")
            
            if (token != null) {
                android.util.Log.d("GlobalWS", "Creating WebSocketNotificationService...")
                wsService = WebSocketNotificationService(
                    context = context,
                    token = token,
                    onNotificationReceived = { title, message, type ->
                        android.util.Log.d("GlobalWS", "Global notification received: $title")
                        // Show notification immediately
                        wsService?.showNotification(title, message)
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
