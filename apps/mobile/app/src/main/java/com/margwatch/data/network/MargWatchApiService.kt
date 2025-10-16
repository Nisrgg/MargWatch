package com.margwatch.data.network

import com.margwatch.data.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface MargWatchApiService {

    // --- Authentication ---
    @POST("auth/register")
    suspend fun registerUser(@Body request: RegisterRequest): Response<RegisterResponse>

    @POST("auth/login")
    suspend fun loginUser(@Body request: LoginRequest): Response<LoginResponse>

    @GET("auth/profile")
    suspend fun getUserProfile(@Header("Authorization") authorization: String): Response<GenericApiResponse<User>>

    @PUT("auth/profile")
    suspend fun updateUserProfile(
        @Header("Authorization") authorization: String,
        @Body request: UpdateProfileRequest
    ): Response<GenericApiResponse<User>>

    @POST("auth/change-password")
    suspend fun changePassword(
        @Header("Authorization") authorization: String,
        @Body request: ChangePasswordRequest
    ): Response<GenericApiResponse<Unit>>

    // --- Complaints ---
    @Multipart
    @POST("complaints/submit")
    suspend fun submitComplaint(
        @Header("Authorization") authorization: String,
        @Part images: List<MultipartBody.Part>,
        @Part("latitude") latitude: RequestBody,
        @Part("longitude") longitude: RequestBody,
        @Part("address") address: RequestBody?
    ): Response<ComplaintSubmissionResponse>

        @GET("complaints/my-complaints")
        suspend fun getUserComplaints(
            @Header("Authorization") authorization: String,
            @Query("page") page: Int? = null,
            @Query("limit") limit: Int? = null,
            @Query("status") status: String? = null,
            @Query("category") category: String? = null
        ): Response<GenericApiResponse<ComplaintsResponseData>>

    @GET("complaints/{id}")
    suspend fun getComplaintById(
        @Header("Authorization") authorization: String,
        @Path("id") complaintId: String
    ): Response<GenericApiResponse<ComplaintData>>

    @GET("complaints/heatmap")
    suspend fun getHeatMapData(
        @Query("category") category: String? = null,
        @Query("dateFrom") dateFrom: String? = null,
        @Query("dateTo") dateTo: String? = null
    ): Response<GenericApiResponse<HeatMapDataResponse>>

    // --- Work Order Endpoints ---
    @GET("work-orders/my-orders")
    suspend fun getWorkerOrders(
        @Header("Authorization") authorization: String,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null
    ): Response<GenericApiResponse<WorkOrderResponse>>

    @GET("work-orders/{id}/details")
    suspend fun getWorkOrderById(
        @Header("Authorization") authorization: String,
        @Path("id") workOrderId: String
    ): Response<GenericApiResponse<WorkOrder>>

    @Multipart
    @PUT("work-orders/{id}/status")
    suspend fun updateWorkOrderStatus(
        @Header("Authorization") authorization: String,
        @Path("id") workOrderId: String,
        @Part images: List<MultipartBody.Part>? = null,
        @Part("status") status: RequestBody,
        @Part("description") description: RequestBody? = null,
        @Part("cost") cost: RequestBody? = null
    ): Response<GenericApiResponse<WorkOrder>>

    @Multipart
    @PUT("work-orders/{id}/complete")
    suspend fun completeWorkOrder(
        @Header("Authorization") authorization: String,
        @Path("id") workOrderId: String,
        @Part images: List<MultipartBody.Part>? = null,
        @Part("description") description: RequestBody? = null,
        @Part("cost") cost: RequestBody? = null
    ): Response<GenericApiResponse<WorkOrder>>

    // --- Notification Endpoints ---
    @GET("notifications")
    suspend fun getNotifications(
        @Header("Authorization") authorization: String,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null,
        @Query("unreadOnly") unreadOnly: Boolean? = null
    ): Response<GenericApiResponse<NotificationResponse>>

    @GET("notifications/count")
    suspend fun getNotificationCount(
        @Header("Authorization") authorization: String
    ): Response<GenericApiResponse<NotificationCountResponse>>

    @PUT("notifications/{id}/read")
    suspend fun markNotificationAsRead(
        @Header("Authorization") authorization: String,
        @Path("id") notificationId: String
    ): Response<GenericApiResponse<Notification>>

    @PUT("notifications/mark-all-read")
    suspend fun markAllNotificationsAsRead(
        @Header("Authorization") authorization: String
    ): Response<GenericApiResponse<Any>>

    @GET("notifications/stream")
    suspend fun getNotificationStream(
        @Header("Authorization") authorization: String
    ): Response<okhttp3.ResponseBody>

    // --- FCM Token Management ---
    @POST("fcm/token")
    suspend fun updateFCMToken(
        @Header("Authorization") authorization: String,
        @Body request: FCMTokenRequest
    ): Response<GenericApiResponse<Any>>
}
