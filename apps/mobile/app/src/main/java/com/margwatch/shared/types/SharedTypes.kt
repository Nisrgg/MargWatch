package com.margwatch.shared.types

/**
 * Shared data models and enums for MargWatch project
 * This is the Kotlin equivalent of @margwatch/shared-types
 * 
 * IMPORTANT: These definitions must be kept in sync with the TypeScript shared types
 * Any changes to the TypeScript definitions must be reflected here
 */

// ===== ENUMS =====

/**
 * User role enumeration
 * Defines the different types of users in the MargWatch system
 */
enum class UserRole {
    USER,
    ADMIN,
    WORKER
}

/**
 * Complaint status enumeration
 * Defines the lifecycle states of complaints in the MargWatch system
 */
enum class ComplaintStatus {
    REGISTERED,
    APPROVED,
    PROCESSING,
    PENDING_REVIEW,
    COMPLETED,
    REJECTED
}

/**
 * Issue category enumeration
 * Defines the types of road infrastructure issues
 */
enum class IssueCategory {
    POTHOLE,
    CRACK,
    DAMAGE,
    OBSTRUCTION,
    OTHER
}

/**
 * Work order status enumeration
 * Defines the lifecycle states of work orders in the MargWatch system
 */
enum class WorkOrderStatus {
    ASSIGNED,
    IN_PROGRESS,
    PENDING_REVIEW,
    COMPLETED,
    REJECTED
}

/**
 * Work order approval status enumeration
 */
enum class WorkOrderApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}

/**
 * Notification type enumeration
 */
enum class NotificationType {
    COMPLAINT_CREATED,
    COMPLAINT_APPROVED,
    COMPLAINT_REJECTED,
    WORK_ORDER_ASSIGNED,
    WORK_ORDER_COMPLETED,
    SYSTEM_UPDATE
}

// ===== INTERFACES/DATA CLASSES =====

/**
 * User interface
 * Represents a user in the MargWatch system
 */
data class User(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phone: String? = null,
    val role: UserRole,
    val isActive: Boolean = true,
    val fcmToken: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val _count: UserCount? = null
) {
    val fullName: String get() = "$firstName $lastName"
    val isWorker: Boolean get() = role == UserRole.WORKER
    val isUser: Boolean get() = role == UserRole.USER
    val isAdmin: Boolean get() = role == UserRole.ADMIN
}

data class UserCount(
    val complaints: Int,
    val workOrders: Int
)

/**
 * Complaint interface
 * Represents a complaint in the MargWatch system
 */
data class Complaint(
    val id: String,
    val title: String,
    val description: String,
    val category: IssueCategory,
    val status: ComplaintStatus,
    val latitude: Float,
    val longitude: Float,
    val address: String? = null,
    val imageUrl: String? = null, // JSON string of image URLs
    val imageUrls: List<String> = emptyList(), // Parsed image URLs
    val imageCount: Int? = null,
    val mlCategory: IssueCategory? = null,
    val mlConfidence: Float? = null,
    val mlModelVersion: String? = null,
    val mlProcessingTime: Float? = null,
    val userId: String,
    val user: ComplaintUser? = null,
    val approvedBy: String? = null,
    val approvedAt: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val workOrders: List<WorkOrder>? = null,
    val updates: List<ComplaintUpdate>? = null
)

data class ComplaintUser(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String
)

data class ComplaintUpdate(
    val id: String,
    val complaintId: String,
    val status: ComplaintStatus,
    val description: String? = null,
    val imageUrl: String? = null,
    val createdAt: String
)

/**
 * Work Order interface
 */
data class WorkOrder(
    val id: String,
    val complaintId: String,
    val workerId: String,
    val status: WorkOrderStatus,
    val assignedAt: String,
    val completedAt: String? = null,
    val cost: Double? = null,
    val description: String? = null,
    val images: List<String> = emptyList(),
    val complaint: Complaint? = null
)

/**
 * Notification interface
 */
data class Notification(
    val id: String,
    val userId: String,
    val title: String,
    val message: String,
    val type: NotificationType,
    val data: String? = null,
    val isRead: Boolean = false,
    val createdAt: String
)

// ===== REQUEST/RESPONSE MODELS =====

/**
 * Auth Models
 */
data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val message: String,
    val data: LoginData?
)

data class LoginData(
    val token: String,
    val user: User
)

data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val phone: String? = null
)

data class RegisterResponse(
    val success: Boolean,
    val message: String,
    val data: RegisterData?
)

data class RegisterData(
    val user: User
)

/**
 * Profile Models
 */
data class UpdateProfileRequest(
    val firstName: String,
    val lastName: String,
    val phone: String?
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

/**
 * Complaint Models
 */
data class CreateComplaintRequest(
    val title: String,
    val description: String,
    val latitude: Float,
    val longitude: Float,
    val address: String? = null,
    val category: IssueCategory? = null
)

data class UpdateComplaintRequest(
    val status: ComplaintStatus? = null,
    val description: String? = null,
    val title: String? = null
)

/**
 * Work Order Models
 */
data class UpdateWorkStatusRequest(
    val status: WorkOrderStatus,
    val description: String? = null,
    val cost: Double? = null
)

data class CompleteWorkRequest(
    val description: String? = null,
    val cost: Double? = null
)

/**
 * Notification Models
 */
data class FCMTokenRequest(
    val fcmToken: String
)

/**
 * Common Models
 */
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
    val heatMapData: List<HeatMapData>
)

data class NotificationResponse(
    val notifications: List<Notification>,
    val pagination: Pagination
)

data class NotificationCountResponse(
    val unreadCount: Int
)

data class WorkOrderResponse(
    val workOrders: List<WorkOrder>,
    val pagination: Pagination
)

data class ComplaintSubmissionResponse(
    val success: Boolean,
    val message: String,
    val data: ComplaintData?
)

data class ComplaintData(
    val complaint: Complaint
)

data class HeatMapData(
    val latitude: Float,
    val longitude: Float,
    val count: Int,
    val category: IssueCategory
)

/**
 * Generic API Response wrapper
 * Standard wrapper for all API responses
 */
data class GenericApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T? = null,
    val errors: List<ApiError>? = null
)

/**
 * API Error model
 * Represents validation or other API errors
 */
data class ApiError(
    val field: String?,
    val message: String
)