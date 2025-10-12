package com.margwatch.utils

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.margwatch.MainActivity
import com.margwatch.R

object NotificationManager {
    
    private const val CHANNEL_ID = "margwatch_local_notifications"
    private const val CHANNEL_NAME = "MargWatch Local Notifications"
    private const val CHANNEL_DESCRIPTION = "Local notifications for app events"
    
    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = CHANNEL_DESCRIPTION
            }
            
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    fun showLocalNotification(
        context: Context,
        title: String,
        body: String,
        complaintId: String? = null
    ) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            complaintId?.let { putExtra("complaintId", it) }
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
    
    fun showComplaintStatusNotification(
        context: Context,
        status: String,
        complaintId: String
    ) {
        val (title, body) = when (status.lowercase()) {
            "submitted" -> "Complaint Submitted" to "Your complaint has been successfully submitted and is under review."
            "under_review" -> "Complaint Under Review" to "Your complaint is being reviewed by our team."
            "resolved" -> "Complaint Resolved" to "Great news! Your complaint has been resolved."
            "rejected" -> "Complaint Update" to "Your complaint needs additional information."
            else -> "Complaint Update" to "Your complaint status has been updated."
        }
        
        showLocalNotification(context, title, body, complaintId)
    }
    
    fun showSyncNotification(
        context: Context,
        success: Boolean,
        count: Int = 0
    ) {
        val (title, body) = if (success) {
            "Sync Complete" to "Successfully synced $count offline complaints."
        } else {
            "Sync Failed" to "Failed to sync offline complaints. Please try again."
        }
        
        showLocalNotification(context, title, body)
    }
}

