package com.margwatch.shared.types

import com.google.gson.*
import java.lang.reflect.Type

/**
 * Custom JSON deserializers for shared types
 * Handles conversion between JSON strings and Kotlin enums
 */

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

class UserRoleSerializer : JsonSerializer<UserRole> {
    override fun serialize(src: UserRole?, typeOfSrc: Type?, context: JsonSerializationContext?): JsonElement {
        return JsonPrimitive(src?.name ?: "USER")
    }
}

class ComplaintStatusDeserializer : JsonDeserializer<ComplaintStatus> {
    override fun deserialize(json: JsonElement?, typeOfT: Type?, context: JsonDeserializationContext?): ComplaintStatus {
        return when (json?.asString?.uppercase()) {
            "REGISTERED" -> ComplaintStatus.REGISTERED
            "APPROVED" -> ComplaintStatus.APPROVED
            "PROCESSING" -> ComplaintStatus.PROCESSING
            "PENDING_REVIEW" -> ComplaintStatus.PENDING_REVIEW
            "COMPLETED" -> ComplaintStatus.COMPLETED
            "REJECTED" -> ComplaintStatus.REJECTED
            else -> ComplaintStatus.REGISTERED
        }
    }
}

class ComplaintStatusSerializer : JsonSerializer<ComplaintStatus> {
    override fun serialize(src: ComplaintStatus?, typeOfSrc: Type?, context: JsonSerializationContext?): JsonElement {
        return JsonPrimitive(src?.name ?: "REGISTERED")
    }
}

class IssueCategoryDeserializer : JsonDeserializer<IssueCategory> {
    override fun deserialize(json: JsonElement?, typeOfT: Type?, context: JsonDeserializationContext?): IssueCategory {
        return when (json?.asString?.uppercase()) {
            "POTHOLE" -> IssueCategory.POTHOLE
            "CRACK" -> IssueCategory.CRACK
            "DAMAGE" -> IssueCategory.DAMAGE
            "OBSTRUCTION" -> IssueCategory.OBSTRUCTION
            "OTHER" -> IssueCategory.OTHER
            else -> IssueCategory.OTHER
        }
    }
}

class IssueCategorySerializer : JsonSerializer<IssueCategory> {
    override fun serialize(src: IssueCategory?, typeOfSrc: Type?, context: JsonSerializationContext?): JsonElement {
        return JsonPrimitive(src?.name ?: "OTHER")
    }
}

class WorkOrderStatusDeserializer : JsonDeserializer<WorkOrderStatus> {
    override fun deserialize(json: JsonElement?, typeOfT: Type?, context: JsonDeserializationContext?): WorkOrderStatus {
        return when (json?.asString?.uppercase()) {
            "ASSIGNED" -> WorkOrderStatus.ASSIGNED
            "IN_PROGRESS" -> WorkOrderStatus.IN_PROGRESS
            "PENDING_REVIEW" -> WorkOrderStatus.PENDING_REVIEW
            "COMPLETED" -> WorkOrderStatus.COMPLETED
            "REJECTED" -> WorkOrderStatus.REJECTED
            else -> WorkOrderStatus.ASSIGNED
        }
    }
}

class WorkOrderStatusSerializer : JsonSerializer<WorkOrderStatus> {
    override fun serialize(src: WorkOrderStatus?, typeOfSrc: Type?, context: JsonSerializationContext?): JsonElement {
        return JsonPrimitive(src?.name ?: "ASSIGNED")
    }
}
