package com.margwatch.data.model

import com.google.gson.annotations.SerializedName
import com.google.gson.*
import java.lang.reflect.Type

// Custom deserializer for UserRole
class UserRoleDeserializer : JsonDeserializer<UserRole> {
    override fun deserialize(json: JsonElement?, typeOfT: Type?, context: JsonDeserializationContext?): UserRole {
        return when (json?.asString?.uppercase()) {
            "USER" -> UserRole.USER
            "WORKER" -> UserRole.WORKER
            "ADMIN" -> UserRole.ADMIN
            else -> UserRole.USER
        }
    }
}

// Custom serializer for UserRole
class UserRoleSerializer : JsonSerializer<UserRole> {
    override fun serialize(src: UserRole?, typeOfSrc: Type?, context: JsonSerializationContext?): JsonElement {
        return JsonPrimitive(src?.name ?: "USER")
    }
}

// --- Auth Models ---
data class LoginRequest(val email: String, val password: String)
data class LoginResponse(val success: Boolean, val message: String, val data: LoginData?)
data class LoginData(val token: String, val user: User)

data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val phone: String? = null
)
data class RegisterResponse(val success: Boolean, val message: String, val data: RegisterData?)
data class RegisterData(val user: User)

// --- Profile Models ---
data class UpdateProfileRequest(
    val firstName: String,
    val lastName: String,
    val phone: String?
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

// --- Complaint Models ---
data class ComplaintSubmissionRequest(
    val latitude: Float,
    val longitude: Float,
    val address: String? = null,
    // For multipart, images are sent separately, not in this data class
)

data class ComplaintSubmissionResponse(val success: Boolean, val message: String, val data: ComplaintData?)
data class ComplaintData(val complaint: Complaint)

// --- Generic API Response ---
data class GenericApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T? = null,
    val error: String? = null
)

// --- Pagination Models ---
data class Pagination(
    val page: Int,
    val limit: Int,
    val total: Int,
    val pages: Int
)

data class ComplaintsResponseData(
    val complaints: List<Complaint>,
    val pagination: Pagination
)

data class HeatMapDataResponse(
    val heatMapData: List<HeatMapPoint>
)

data class HeatMapPoint(
    val latitude: Double,
    val longitude: Double,
    val category: String
)

// --- Work Order Models ---
data class WorkOrder(
    val id: String = "",
    val complaintId: String = "",
    val workerId: String = "",
    val status: String = "",
    val assignedAt: String = "",
    val completedAt: String? = null,
    val cost: Double? = null,
    val description: String? = null,
    val images: List<String> = emptyList(),
    val complaint: Complaint? = null
)

data class WorkOrderResponse(
    val workOrders: List<WorkOrder>,
    val pagination: Pagination
)

data class UpdateWorkStatusRequest(
    val status: String,
    val description: String? = null,
    val cost: Double? = null
)

data class CompleteWorkRequest(
    val description: String? = null,
    val cost: Double? = null
)

// --- Notification Models ---
data class Notification(
    val id: String = "",
    val userId: String = "",
    val title: String = "",
    val message: String = "",
    val type: String = "",
    val data: String? = null,
    val isRead: Boolean = false,
    val createdAt: String = ""
)

data class NotificationResponse(
    val notifications: List<Notification>,
    val pagination: Pagination
)

data class NotificationCountResponse(
    val unreadCount: Int
)

// --- FCM Token Models ---
data class FCMTokenRequest(
    val fcmToken: String
)

