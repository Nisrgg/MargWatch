package com.margwatch.data.model

enum class UserRole {
    USER, WORKER, ADMIN
}

data class User(
    val id: String = "",
    val email: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val phone: String? = null,
    val role: UserRole = UserRole.USER,
    val isActive: Boolean = true,
    val createdAt: String = "",
    val updatedAt: String = ""
) {
    val fullName: String get() = "$firstName $lastName"
    val isWorker: Boolean get() = role == UserRole.WORKER
    val isUser: Boolean get() = role == UserRole.USER
    val isAdmin: Boolean get() = role == UserRole.ADMIN
}
