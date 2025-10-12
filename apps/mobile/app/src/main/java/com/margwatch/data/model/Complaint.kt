package com.margwatch.data.model

data class Complaint(
    val id: String,
    val title: String,
    val description: String,
    val category: String, // IssueCategory enum from backend
    val status: String, // ComplaintStatus enum from backend
    val latitude: Float,
    val longitude: Float,
    val address: String?,
    val imageUrl: String?, // JSON array of image URLs from Cloudinary
    val imageUrls: List<String> = emptyList(), // Parsed image URLs for easier use
    val imageCount: Int = 1,
    // ML Prediction Fields
    val mlCategory: String?, // ML predicted category
    val mlConfidence: Float?, // ML confidence score (0-1)
    val mlModelVersion: String?, // ML model version used
    val mlProcessingTime: Float?, // ML processing time in seconds
    val userId: String,
    val user: User? = null, // Include user details if needed
    val approvedBy: String? = null,
    val approvedAt: String? = null,
    val createdAt: String,
    val updatedAt: String
)
