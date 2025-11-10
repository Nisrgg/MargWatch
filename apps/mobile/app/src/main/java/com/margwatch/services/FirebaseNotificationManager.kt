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
     * Get the current FCM token
     */
    suspend fun getFCMToken(): String? {
        return try {
            val token = FirebaseMessaging.getInstance().token.await()
            Log.d(TAG, "FCM Token obtained")
            token
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get FCM token", e)
            null
        }
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
        // Subscribe to general notifications
        subscribeToTopic("all_users")
        
        // Subscribe to role-specific notifications
        when (userRole.lowercase()) {
            "admin" -> {
                subscribeToTopic("admin_notifications")
                subscribeToTopic("complaint_updates")
            }
            "worker" -> {
                subscribeToTopic("worker_notifications")
                subscribeToTopic("work_orders")
            }
            "citizen" -> {
                subscribeToTopic("citizen_notifications")
                subscribeToTopic("complaint_status")
            }
        }
        
        // Subscribe to user-specific notifications
        subscribeToTopic("user_$userId")
        
        Log.d(TAG, "📱 Subscribed to topics for user: $userId (role: $userRole)")
    }

    /**
     * Unsubscribe from all user topics
     */
    suspend fun unsubscribeFromUserTopics(userId: String, userRole: String) {
        unsubscribeFromTopic("all_users")
        
        when (userRole.lowercase()) {
            "admin" -> {
                unsubscribeFromTopic("admin_notifications")
                unsubscribeFromTopic("complaint_updates")
            }
            "worker" -> {
                unsubscribeFromTopic("worker_notifications")
                unsubscribeFromTopic("work_orders")
            }
            "citizen" -> {
                unsubscribeFromTopic("citizen_notifications")
                unsubscribeFromTopic("complaint_status")
            }
        }
        
        unsubscribeFromTopic("user_$userId")
        
        Log.d(TAG, "📱 Unsubscribed from topics for user: $userId")
    }
}



