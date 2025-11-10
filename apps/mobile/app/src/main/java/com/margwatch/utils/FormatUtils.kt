package com.margwatch.utils

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector
import com.margwatch.shared.types.IssueCategory
import com.margwatch.ui.components.StatusType

/**
 * Utility functions for formatting data in the MargWatch app
 */

fun getCategoryIcon(category: String): ImageVector {
    return when (category) {
        IssueCategory.POTHOLE.name -> Icons.Default.Warning
        IssueCategory.CRACK.name -> Icons.Default.List
        IssueCategory.DAMAGE.name -> Icons.Default.Build
        IssueCategory.OBSTRUCTION.name -> Icons.Default.Warning
        IssueCategory.OTHER.name -> Icons.Default.Info
        else -> Icons.Default.Info
    }
}

fun formatCategoryName(category: String) = when (category.uppercase()) {
    "POTHOLE" -> "Pothole"
    "ROAD_INSTABILITY" -> "Road Instability"
    "STREETLIGHT_DAMAGE" -> "Streetlight Damage"
    "TREE_DAMAGE" -> "Tree Damage"
    "OTHER" -> "Other"
    else -> category.replace("_", " ").lowercase().replaceFirstChar { it.uppercase() }
}

fun getStatusType(status: String): StatusType {
    return when (status.uppercase()) {
        "REGISTERED" -> StatusType.INFO
        "APPROVED" -> StatusType.SUCCESS
        "PROCESSING" -> StatusType.WARNING
        "COMPLETED" -> StatusType.SUCCESS
        "REJECTED" -> StatusType.ERROR
        "PENDING" -> StatusType.WARNING
        "CANCELLED" -> StatusType.ERROR
        "IN_PROGRESS" -> StatusType.INFO
        else -> StatusType.INFO
    }
}
