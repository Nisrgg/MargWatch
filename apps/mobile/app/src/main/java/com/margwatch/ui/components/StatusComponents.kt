package com.margwatch.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.margwatch.shared.types.ComplaintStatus
import com.margwatch.shared.types.WorkOrderStatus

/**
 * Reusable status chip component that can display complaint or work order statuses
 */
@Composable
fun StatusChip(
    status: String,
    modifier: Modifier = Modifier,
    type: StatusType = StatusType.COMPLAINT
) {
    val (backgroundColor, textColor) = getStatusColors(status, type)
    
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        shape = RoundedCornerShape(16.dp)
    ) {
        Text(
            text = status.replace("_", " ").uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

/**
 * Enhanced status chip with icon support
 */
@Composable
fun EnhancedStatusChip(
    status: String,
    modifier: Modifier = Modifier,
    type: StatusType = StatusType.COMPLAINT,
    showIcon: Boolean = true
) {
    val (backgroundColor, textColor, icon) = getStatusColorsWithIcon(status, type)
    
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            if (showIcon && icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = textColor
                )
            }
            Text(
                text = status.replace("_", " ").uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = textColor,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

/**
 * Status type enum for different status categories
 */
enum class StatusType {
    COMPLAINT, WORK_ORDER, NOTIFICATION, GENERAL,
    SUCCESS, WARNING, ERROR, INFO, NEUTRAL
}

/**
 * Get colors for a given status
 */
@Composable
private fun getStatusColors(status: String, type: StatusType): Pair<Color, Color> {
    return when (type) {
        StatusType.COMPLAINT -> getComplaintStatusColors(status)
        StatusType.WORK_ORDER -> getWorkOrderStatusColors(status)
        StatusType.NOTIFICATION -> getNotificationStatusColors(status)
        StatusType.GENERAL -> getGeneralStatusColors(status)
        StatusType.SUCCESS -> getGeneralStatusColors(status)
        StatusType.WARNING -> getGeneralStatusColors(status)
        StatusType.ERROR -> getGeneralStatusColors(status)
        StatusType.INFO -> getGeneralStatusColors(status)
        StatusType.NEUTRAL -> getGeneralStatusColors(status)
    }
}

/**
 * Get colors and icon for a given status
 */
@Composable
private fun getStatusColorsWithIcon(status: String, type: StatusType): Triple<Color, Color, androidx.compose.ui.graphics.vector.ImageVector?> {
    val (backgroundColor, textColor) = getStatusColors(status, type)
    val icon = getStatusIcon(status, type)
    return Triple(backgroundColor, textColor, icon)
}

/**
 * Get colors for complaint statuses
 */
@Composable
private fun getComplaintStatusColors(status: String): Pair<Color, Color> {
    return when (status.uppercase()) {
        ComplaintStatus.REGISTERED.name -> MaterialTheme.colorScheme.primaryContainer to MaterialTheme.colorScheme.onPrimaryContainer
        ComplaintStatus.APPROVED.name -> MaterialTheme.colorScheme.secondaryContainer to MaterialTheme.colorScheme.onSecondaryContainer
        ComplaintStatus.PROCESSING.name -> MaterialTheme.colorScheme.tertiaryContainer to MaterialTheme.colorScheme.onTertiaryContainer
        ComplaintStatus.PENDING_REVIEW.name -> MaterialTheme.colorScheme.outline to MaterialTheme.colorScheme.onSurface
        ComplaintStatus.COMPLETED.name -> MaterialTheme.colorScheme.primary to Color.White
        ComplaintStatus.REJECTED.name -> MaterialTheme.colorScheme.error to Color.White
        else -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    }
}

/**
 * Get colors for work order statuses
 */
@Composable
private fun getWorkOrderStatusColors(status: String): Pair<Color, Color> {
    return when (status.uppercase()) {
        WorkOrderStatus.ASSIGNED.name -> MaterialTheme.colorScheme.primaryContainer to MaterialTheme.colorScheme.onPrimaryContainer
        WorkOrderStatus.IN_PROGRESS.name -> MaterialTheme.colorScheme.secondaryContainer to MaterialTheme.colorScheme.onSecondaryContainer
        WorkOrderStatus.PENDING_REVIEW.name -> MaterialTheme.colorScheme.outline to MaterialTheme.colorScheme.onSurface
        WorkOrderStatus.COMPLETED.name -> MaterialTheme.colorScheme.primary to Color.White
        WorkOrderStatus.REJECTED.name -> MaterialTheme.colorScheme.error to Color.White
        else -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    }
}

/**
 * Get colors for notification statuses
 */
@Composable
private fun getNotificationStatusColors(status: String): Pair<Color, Color> {
    return when (status.uppercase()) {
        "UNREAD" -> MaterialTheme.colorScheme.primary to Color.White
        "READ" -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
        "IMPORTANT" -> MaterialTheme.colorScheme.error to Color.White
        else -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    }
}

/**
 * Get colors for general statuses
 */
@Composable
private fun getGeneralStatusColors(status: String): Pair<Color, Color> {
    return when (status.uppercase()) {
        "ACTIVE" -> MaterialTheme.colorScheme.primary to Color.White
        "INACTIVE" -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
        "PENDING" -> MaterialTheme.colorScheme.outline to MaterialTheme.colorScheme.onSurface
        "SUCCESS" -> MaterialTheme.colorScheme.primary to Color.White
        "ERROR" -> MaterialTheme.colorScheme.error to Color.White
        "WARNING" -> MaterialTheme.colorScheme.outline to MaterialTheme.colorScheme.onSurface
        else -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    }
}

/**
 * Get icon for a given status
 */
private fun getStatusIcon(status: String, type: StatusType): androidx.compose.ui.graphics.vector.ImageVector? {
    return when (type) {
        StatusType.COMPLAINT -> getComplaintStatusIcon(status)
        StatusType.WORK_ORDER -> getWorkOrderStatusIcon(status)
        StatusType.NOTIFICATION -> getNotificationStatusIcon(status)
        StatusType.GENERAL -> getGeneralStatusIcon(status)
        StatusType.SUCCESS -> getGeneralStatusIcon(status)
        StatusType.WARNING -> getGeneralStatusIcon(status)
        StatusType.ERROR -> getGeneralStatusIcon(status)
        StatusType.INFO -> getGeneralStatusIcon(status)
        StatusType.NEUTRAL -> getGeneralStatusIcon(status)
    }
}

/**
 * Get icons for complaint statuses
 */
private fun getComplaintStatusIcon(status: String): androidx.compose.ui.graphics.vector.ImageVector? {
    return when (status.uppercase()) {
        ComplaintStatus.REGISTERED.name -> androidx.compose.material.icons.Icons.Default.Add
        ComplaintStatus.APPROVED.name -> androidx.compose.material.icons.Icons.Default.CheckCircle
        ComplaintStatus.PROCESSING.name -> androidx.compose.material.icons.Icons.Default.Build
        ComplaintStatus.PENDING_REVIEW.name -> androidx.compose.material.icons.Icons.Default.Info
        ComplaintStatus.COMPLETED.name -> androidx.compose.material.icons.Icons.Default.Done
        ComplaintStatus.REJECTED.name -> androidx.compose.material.icons.Icons.Default.Close
        else -> null
    }
}

/**
 * Get icons for work order statuses
 */
private fun getWorkOrderStatusIcon(status: String): androidx.compose.ui.graphics.vector.ImageVector? {
    return when (status.uppercase()) {
        WorkOrderStatus.ASSIGNED.name -> androidx.compose.material.icons.Icons.Default.Person
        WorkOrderStatus.IN_PROGRESS.name -> androidx.compose.material.icons.Icons.Default.Build
        WorkOrderStatus.PENDING_REVIEW.name -> androidx.compose.material.icons.Icons.Default.Info
        WorkOrderStatus.COMPLETED.name -> androidx.compose.material.icons.Icons.Default.Done
        WorkOrderStatus.REJECTED.name -> androidx.compose.material.icons.Icons.Default.Close
        else -> null
    }
}

/**
 * Get icons for notification statuses
 */
private fun getNotificationStatusIcon(status: String): androidx.compose.ui.graphics.vector.ImageVector? {
    return when (status.uppercase()) {
        "UNREAD" -> androidx.compose.material.icons.Icons.Default.Info
        "READ" -> androidx.compose.material.icons.Icons.Default.CheckCircle
        "IMPORTANT" -> androidx.compose.material.icons.Icons.Default.Star
        else -> null
    }
}

/**
 * Get icons for general statuses
 */
private fun getGeneralStatusIcon(status: String): androidx.compose.ui.graphics.vector.ImageVector? {
    return when (status.uppercase()) {
        "ACTIVE" -> androidx.compose.material.icons.Icons.Default.CheckCircle
        "INACTIVE" -> androidx.compose.material.icons.Icons.Default.Close
        "PENDING" -> androidx.compose.material.icons.Icons.Default.Info
        "SUCCESS" -> androidx.compose.material.icons.Icons.Default.CheckCircle
        "ERROR" -> androidx.compose.material.icons.Icons.Default.Warning
        "WARNING" -> androidx.compose.material.icons.Icons.Default.Warning
        else -> null
    }
}
