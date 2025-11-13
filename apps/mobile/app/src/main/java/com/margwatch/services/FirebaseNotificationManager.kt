package com.margwatch.services

import android.content.Context
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await
import android.util.Log

class FirebaseNotificationManager(private val context: Context) {
    
    companion object {
        private const val TAG = "FirebaseNotificationManager"
    }

    /**
     * Get the current FCM token with retry logic
     */
    suspend fun getFCMToken(maxRetries: Int = 3): String? {
        var lastException: Exception? = null
        
        for (attempt in 1..maxRetries) {
            try {
                android.util.Log.d(TAG, "🔄 Requesting FCM token from Firebase... (Attempt $attempt/$maxRetries)")
                val token = FirebaseMessaging.getInstance().token.await()
                
                if (token.isNotBlank()) {
                    android.util.Log.d(TAG, "✅ FCM Token obtained: ${token.take(20)}...")
                    android.util.Log.d(TAG, "   Full token length: ${token.length}")
                    android.util.Log.d(TAG, "   Token preview: ${token.take(50)}...")
                    return token
                } else {
                    android.util.Log.w(TAG, "⚠️ FCM token is blank, retrying...")
                }
            } catch (e: Exception) {
                lastException = e
                android.util.Log.e(TAG, "❌ Failed to get FCM token (Attempt $attempt/$maxRetries): ${e.message}")
                
                if (attempt < maxRetries) {
                    val delayMs = attempt * 1000L // Exponential backoff: 1s, 2s, 3s
                    android.util.Log.d(TAG, "⏳ Retrying in ${delayMs}ms...")
                    kotlinx.coroutines.delay(delayMs)
                } else {
                    android.util.Log.e(TAG, "❌ All retry attempts failed", e)
                    e.printStackTrace()
                }
            }
        }
        
        return null
    }

    /**
     * Subscribe to a topic for receiving notifications
     */
    suspend fun subscribeToTopic(topic: String) {
        try {
            FirebaseMessaging.getInstance().subscribeToTopic(topic).await()
            Log.d(TAG, "✅ Subscribed to topic: $topic")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to subscribe to topic: $topic", e)
        }
    }

    /**
     * Unsubscribe from a topic
     */
    suspend fun unsubscribeFromTopic(topic: String) {
        try {
            FirebaseMessaging.getInstance().unsubscribeFromTopic(topic).await()
            Log.d(TAG, "❌ Unsubscribed from topic: $topic")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to unsubscribe from topic: $topic", e)
        }
    }

    /**
     * Subscribe to user-specific topics
     */
    suspend fun subscribeToUserTopics(userId: String, userRole: String) {
        android.util.Log.d(TAG, "🔄 Starting topic subscriptions for user: $userId (role: $userRole)")
        
        // Subscribe to general notifications
        subscribeToTopic("all_users")
        android.util.Log.d(TAG, "✅ Subscribed to: all_users")
        
        // Subscribe to role-specific notifications
        when (userRole.lowercase()) {
            "admin", "ADMIN" -> {
                subscribeToTopic("admin_notifications")
                subscribeToTopic("complaint_updates")
                android.util.Log.d(TAG, "✅ Admin topics subscribed: admin_notifications, complaint_updates")
            }
            "worker", "WORKER" -> {
                subscribeToTopic("worker_notifications")
                subscribeToTopic("work_orders")
                subscribeToTopic("complaint_created") // Workers should receive new complaint notifications
                android.util.Log.d(TAG, "✅ Worker topics subscribed: worker_notifications, work_orders, complaint_created")
            }
            "user", "USER", "citizen", "CITIZEN" -> {
                subscribeToTopic("citizen_notifications")
                subscribeToTopic("complaint_status")
                android.util.Log.d(TAG, "✅ User/Citizen topics subscribed: citizen_notifications, complaint_status")
            }
        }
        
        // Subscribe to user-specific notifications
        subscribeToTopic("user_$userId")
        android.util.Log.d(TAG, "✅ Subscribed to: user_$userId")
        
        Log.d(TAG, "📱 All topic subscriptions completed for user: $userId (role: $userRole)")
    }

    /**
     * Unsubscribe from all user topics
     */
    suspend fun unsubscribeFromUserTopics(userId: String, userRole: String) {
        android.util.Log.d(TAG, "🔄 Starting topic unsubscriptions for user: $userId (role: $userRole)")
        
        unsubscribeFromTopic("all_users")
        
        when (userRole.lowercase()) {
            "admin", "ADMIN" -> {
                unsubscribeFromTopic("admin_notifications")
                unsubscribeFromTopic("complaint_updates")
            }
            "worker", "WORKER" -> {
                unsubscribeFromTopic("worker_notifications")
                unsubscribeFromTopic("work_orders")
                unsubscribeFromTopic("complaint_created")
            }
            "user", "USER", "citizen", "CITIZEN" -> {
                unsubscribeFromTopic("citizen_notifications")
                unsubscribeFromTopic("complaint_status")
            }
        }
        
        unsubscribeFromTopic("user_$userId")
        
        Log.d(TAG, "📱 Unsubscribed from all topics for user: $userId")
    }
}



