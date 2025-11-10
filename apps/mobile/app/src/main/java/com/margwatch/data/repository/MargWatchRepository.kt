package com.margwatch.data.repository

import com.margwatch.shared.types.*
import com.margwatch.data.network.ApiClient
import com.margwatch.data.network.MargWatchApiService
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class MargWatchRepository(private val apiService: MargWatchApiService = ApiClient.apiService) : BaseRepository() {

    suspend fun register(request: RegisterRequest): Result<User> {
        return safeApiCall { apiService.registerUser(request) }.map { it.data!!.user }
    }

    suspend fun login(request: LoginRequest): Result<LoginData> {
        return safeApiCall { apiService.loginUser(request) }.map { it.data!! }
    }

    suspend fun submitComplaint(
        token: String,
        imageFiles: List<File>,
        latitude: Float,
        longitude: Float,
        address: String?
    ): Result<Complaint> {
        val bearerToken = "Bearer $token"
        android.util.Log.d("MargWatchRepository", "Submitting complaint with ${imageFiles.size} images")
        
        return safeApiCall {
            val imageParts = imageFiles.map { file ->
                android.util.Log.d("MargWatchRepository", "Processing file: ${file.name}, exists: ${file.exists()}, size: ${file.length()}")
                val requestBody = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("images", file.name, requestBody)
            }

            val latPart = latitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val longPart = longitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val addressPart = address?.toRequestBody("text/plain".toMediaTypeOrNull())

            // Debug logging for complaint submission (excluding sensitive data)
            android.util.Log.d("SubmitComplaintDebug", "Submitting Complaint Data:")
            android.util.Log.d("SubmitComplaintDebug", "  Latitude: $latitude (Type: ${latitude::class.java.simpleName})")
            android.util.Log.d("SubmitComplaintDebug", "  Longitude: $longitude (Type: ${longitude::class.java.simpleName})")
            android.util.Log.d("SubmitComplaintDebug", "  Address: $address")
            // Log details about each image file being sent
            imageFiles.forEachIndexed { index, file ->
                android.util.Log.d("SubmitComplaintDebug", "  Image ${index + 1}: Name=${file.name}, Size=${file.length()} bytes, Exists=${file.exists()}")
            }



            apiService.submitComplaint(
                bearerToken,
                imageParts,
                latPart,
                longPart,
                addressPart
            )
        }.map { it.data!!.complaint }
    }

    suspend fun getUserProfile(token: String): Result<User> {
        val bearerToken = "Bearer $token"
        return safeApiCall { apiService.getUserProfile(bearerToken) }.map { it.data!! }
    }

    suspend fun updateUserProfile(
        token: String,
        firstName: String,
        lastName: String,
        phone: String?
    ): Result<User> {
        val bearerToken = "Bearer $token"
        val request = UpdateProfileRequest(firstName = firstName, lastName = lastName, phone = phone)
        return safeApiCall { apiService.updateUserProfile(bearerToken, request) }.map { it.data!! }
    }

    suspend fun changePassword(
        token: String,
        currentPassword: String,
        newPassword: String
    ): Result<Unit> {
        val bearerToken = "Bearer $token"
        val request = ChangePasswordRequest(currentPassword = currentPassword, newPassword = newPassword)
        return safeApiCall { apiService.changePassword(bearerToken, request) }.map { Unit }
    }

    suspend fun getUserComplaints(
        token: String,
        page: Int? = null,
        limit: Int? = null,
        status: String? = null,
        category: String? = null
    ): Result<ComplaintsResponseData> {
        android.util.Log.d("MargWatchRepository", "Getting user complaints...")
        val bearerToken = "Bearer $token"
        return safeApiCall { apiService.getUserComplaints(bearerToken, page, limit, status, category) }.map { it.data!! }
    }

    suspend fun getComplaintById(token: String, complaintId: String): Result<Complaint> {
        val bearerToken = "Bearer $token"
        return safeApiCall { apiService.getComplaintById(bearerToken, complaintId) }.map { it.data!!.complaint }
    }

    suspend fun getHeatMapData(
        category: String? = null,
        dateFrom: String? = null,
        dateTo: String? = null
    ): Result<HeatMapDataResponse> {
        return safeApiCall { apiService.getHeatMapData(category, dateFrom, dateTo) }.map { it.data!! }
    }

    // --- Work Order Methods ---
    suspend fun getWorkerOrders(
        token: String,
        page: Int? = null,
        limit: Int? = null
    ): Result<WorkOrderResponse> {
        val bearerToken = "Bearer $token"
        return safeApiCall { apiService.getWorkerOrders(bearerToken, page, limit) }.map { it.data!! }
    }

    suspend fun getWorkOrderById(token: String, workOrderId: String): Result<WorkOrder> {
        val bearerToken = "Bearer $token"
        return safeApiCall { apiService.getWorkOrderById(bearerToken, workOrderId) }.map { it.data!! }
    }

    suspend fun updateWorkOrderStatus(
        token: String,
        workOrderId: String,
        status: String,
        description: String? = null,
        cost: Double? = null,
        imageFiles: List<File>? = null
    ): Result<WorkOrder> {
        val bearerToken = "Bearer $token"
        return safeApiCall {
            val imageParts = imageFiles?.map { file ->
                val requestBody = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("images", file.name, requestBody)
            }

            val statusPart = status.toRequestBody("text/plain".toMediaTypeOrNull())
            val descriptionPart = description?.toRequestBody("text/plain".toMediaTypeOrNull())
            val costPart = cost?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())

            apiService.updateWorkOrderStatus(
                bearerToken,
                workOrderId,
                imageParts ?: emptyList(),
                statusPart,
                descriptionPart,
                costPart
            )
        }.map { it.data!! }
    }

    suspend fun completeWorkOrder(
        token: String,
        workOrderId: String,
        workDescription: String? = null,
        cost: Double? = null,
        imageFiles: List<File>? = null
    ): Result<WorkOrder> {
        val bearerToken = "Bearer $token"
        return safeApiCall {
            val imageParts = imageFiles?.map { file ->
                val requestBody = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("images", file.name, requestBody)
            }

            val descriptionPart = workDescription?.toRequestBody("text/plain".toMediaTypeOrNull())
            val costPart = cost?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())

            apiService.completeWorkOrder(
                bearerToken,
                workOrderId,
                imageParts ?: emptyList(),
                descriptionPart,
                costPart
            )
        }.map { it.data!! }
    }

    // --- Notification Methods ---
    suspend fun getNotifications(
        token: String,
        page: Int? = null,
        limit: Int? = null,
        unreadOnly: Boolean? = null
    ): Result<NotificationResponse> {
        val bearerToken = "Bearer $token"
        return safeApiCall { apiService.getNotifications(bearerToken, page, limit, unreadOnly) }.map { it.data!! }
    }

    suspend fun getNotificationCount(token: String): Result<NotificationCountResponse> {
        val bearerToken = "Bearer $token"
        return safeApiCall { apiService.getNotificationCount(bearerToken) }.map { it.data!! }
    }

    suspend fun markNotificationAsRead(token: String, notificationId: String): Result<Notification> {
        val bearerToken = "Bearer $token"
        return safeApiCall { apiService.markNotificationAsRead(bearerToken, notificationId) }.map { it.data!! }
    }

    suspend fun markAllNotificationsAsRead(token: String): Result<Unit> {
        val bearerToken = "Bearer $token"
        return safeApiCall { apiService.markAllNotificationsAsRead(bearerToken) }.map { Unit }
    }
    
    suspend fun updateFCMToken(token: String, fcmToken: String): Result<Unit> {
        val bearerToken = "Bearer $token"
        return safeApiCall { apiService.updateFCMToken(bearerToken, FCMTokenRequest(fcmToken)) }.map { Unit }
    }
}

// Base repository for common error handling
abstract class BaseRepository {
    protected suspend fun <T> safeApiCall(apiCall: suspend () -> retrofit2.Response<T>): Result<T> {
        return try {
            android.util.Log.d("BaseRepository", "Making API call...")
            val response = apiCall()
            android.util.Log.d("BaseRepository", "API response: ${response.code()} ${response.message()}")
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    android.util.Log.d("BaseRepository", "API call successful")
                    Result.success(body)
                } else {
                    android.util.Log.e("BaseRepository", "Response body is null")
                    Result.failure(Exception("Response body is null"))
                }
            } else {
                android.util.Log.e("BaseRepository", "API call failed: ${response.code()} ${response.message()}")
                Result.failure(Exception("API call failed: ${response.code()} ${response.message()}"))
            }
        } catch (e: Exception) {
            android.util.Log.e("BaseRepository", "API call exception: ${e.message}")
            Result.failure(e)
        }
    }
}
