package com.margwatch.data.model

import java.io.File

data class OfflineComplaint(
    val id: String = "", // Local ID for offline complaints
    val title: String = "",
    val description: String = "",
    val category: String = "",
    val latitude: Float,
    val longitude: Float,
    val address: String?,
    val imageFiles: List<File> = emptyList(),
    val imageUris: List<String> = emptyList(), // Store image URIs for display
    val userId: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val isUploaded: Boolean = false,
    val uploadAttempts: Int = 0,
    val lastUploadAttempt: Long = 0
) {
    val isPendingUpload: Boolean get() = !isUploaded
    val canRetryUpload: Boolean get() = uploadAttempts < 3 && (System.currentTimeMillis() - lastUploadAttempt) > 30000 // 30 seconds cooldown
}


