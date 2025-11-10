package com.margwatch.utils

import com.margwatch.shared.types.ComplaintStatus
import com.margwatch.shared.types.WorkOrderStatus
import com.margwatch.shared.types.UserRole

/**
 * State Machine Validator for MargWatch Mobile App
 * Ensures all state transitions follow the defined business logic
 * 
 * This mirrors the backend's StateMachineValidator to provide client-side validation
 * and prevent invalid API calls that would be rejected by the server.
 */
object StateMachineValidator {
    
    /**
     * Validates complaint status transitions based on business rules
     * @param fromStatus Current complaint status
     * @param toStatus Desired complaint status
     * @param userRole Role of the user making the transition
     * @returns true if transition is valid, false otherwise
     */
    fun validateComplaintTransition(
        fromStatus: String,
        toStatus: String,
        userRole: UserRole
    ): Boolean {
        // Define valid transitions for each status
        val validTransitions = mapOf(
            ComplaintStatus.REGISTERED.name to listOf(
                ComplaintStatus.APPROVED.name, 
                ComplaintStatus.REJECTED.name
            ),
            ComplaintStatus.APPROVED.name to listOf(
                ComplaintStatus.PROCESSING.name
            ),
            ComplaintStatus.PROCESSING.name to listOf(
                ComplaintStatus.PENDING_REVIEW.name
            ),
            ComplaintStatus.PENDING_REVIEW.name to listOf(
                ComplaintStatus.COMPLETED.name, 
                ComplaintStatus.PROCESSING.name
            ),
            ComplaintStatus.COMPLETED.name to emptyList(), // Terminal state
            ComplaintStatus.REJECTED.name to emptyList() // Terminal state
        )

        // Check if transition is in the valid list
        val isValidTransition = validTransitions[fromStatus]?.contains(toStatus) ?: false

        // Additional role-based validation
        return if (isValidTransition) {
            validateRoleBasedTransition(fromStatus, toStatus, userRole)
        } else {
            false
        }
    }

    /**
     * Validates work order status transitions
     * @param fromStatus Current work order status
     * @param toStatus Desired work order status
     * @param userRole Role of the user making the transition
     * @returns true if transition is valid, false otherwise
     */
    fun validateWorkOrderTransition(
        fromStatus: String,
        toStatus: String,
        userRole: UserRole
    ): Boolean {
        // Define valid transitions for each status
        val validTransitions = mapOf(
            WorkOrderStatus.ASSIGNED.name to listOf(
                WorkOrderStatus.IN_PROGRESS.name, 
                WorkOrderStatus.REJECTED.name
            ),
            WorkOrderStatus.IN_PROGRESS.name to listOf(
                WorkOrderStatus.PENDING_REVIEW.name, 
                WorkOrderStatus.REJECTED.name
            ),
            WorkOrderStatus.PENDING_REVIEW.name to listOf(
                WorkOrderStatus.COMPLETED.name, 
                WorkOrderStatus.IN_PROGRESS.name
            ),
            WorkOrderStatus.COMPLETED.name to emptyList(), // Terminal state
            WorkOrderStatus.REJECTED.name to emptyList() // Terminal state
        )

        // Check if transition is in the valid list
        val isValidTransition = validTransitions[fromStatus]?.contains(toStatus) ?: false

        // Additional role-based validation
        return if (isValidTransition) {
            validateWorkOrderRoleTransition(fromStatus, toStatus, userRole)
        } else {
            false
        }
    }

    /**
     * Validates role-based transitions for complaints
     * @param fromStatus Current status
     * @param toStatus Desired status
     * @param userRole User role
     * @returns true if role can make this transition
     */
    private fun validateRoleBasedTransition(
        fromStatus: String,
        toStatus: String,
        userRole: UserRole
    ): Boolean {
        // Admin can make any valid transition
        if (userRole == UserRole.ADMIN) {
            return true
        }

        // Worker transitions
        if (userRole == UserRole.WORKER) {
            // Workers can only transition complaints from APPROVED to PROCESSING
            if (fromStatus == ComplaintStatus.APPROVED.name && toStatus == ComplaintStatus.PROCESSING.name) {
                return true
            }
            // Workers can transition from PROCESSING to PENDING_REVIEW
            if (fromStatus == ComplaintStatus.PROCESSING.name && toStatus == ComplaintStatus.PENDING_REVIEW.name) {
                return true
            }
        }

        // Regular users cannot change complaint status
        if (userRole == UserRole.USER) {
            return false
        }

        return false
    }

    /**
     * Validates role-based transitions for work orders
     * @param fromStatus Current status
     * @param toStatus Desired status
     * @param userRole User role
     * @returns true if role can make this transition
     */
    private fun validateWorkOrderRoleTransition(
        fromStatus: String,
        toStatus: String,
        userRole: UserRole
    ): Boolean {
        // Admin can make any valid transition
        if (userRole == UserRole.ADMIN) {
            return true
        }

        // Worker transitions
        if (userRole == UserRole.WORKER) {
            // Workers can start work (ASSIGNED -> IN_PROGRESS)
            if (fromStatus == WorkOrderStatus.ASSIGNED.name && toStatus == WorkOrderStatus.IN_PROGRESS.name) {
                return true
            }
            // Workers can submit for review (IN_PROGRESS -> PENDING_REVIEW)
            if (fromStatus == WorkOrderStatus.IN_PROGRESS.name && toStatus == WorkOrderStatus.PENDING_REVIEW.name) {
                return true
            }
            // Workers can go back to work after rejection (PENDING_REVIEW -> IN_PROGRESS)
            if (fromStatus == WorkOrderStatus.PENDING_REVIEW.name && toStatus == WorkOrderStatus.IN_PROGRESS.name) {
                return true
            }
        }

        // Regular users cannot change work order status
        if (userRole == UserRole.USER) {
            return false
        }

        return false
    }

    /**
     * Gets the next valid states for a given current state
     * @param currentStatus Current status
     * @param userRole User role
     * @returns List of valid next states
     */
    fun getValidNextStates(
        currentStatus: String,
        userRole: UserRole
    ): List<String> {
        // Check if it's a complaint status
        val complaintStatuses = ComplaintStatus.values().map { it.name }
        val workOrderStatuses = WorkOrderStatus.values().map { it.name }

        return when {
            complaintStatuses.contains(currentStatus) -> {
                val validTransitions = mapOf(
                    ComplaintStatus.REGISTERED.name to listOf(
                        ComplaintStatus.APPROVED.name, 
                        ComplaintStatus.REJECTED.name
                    ),
                    ComplaintStatus.APPROVED.name to listOf(
                        ComplaintStatus.PROCESSING.name
                    ),
                    ComplaintStatus.PROCESSING.name to listOf(
                        ComplaintStatus.PENDING_REVIEW.name
                    ),
                    ComplaintStatus.PENDING_REVIEW.name to listOf(
                        ComplaintStatus.COMPLETED.name, 
                        ComplaintStatus.PROCESSING.name
                    ),
                    ComplaintStatus.COMPLETED.name to emptyList(),
                    ComplaintStatus.REJECTED.name to emptyList()
                )

                validTransitions[currentStatus]?.filter { nextStatus ->
                    validateComplaintTransition(currentStatus, nextStatus, userRole)
                } ?: emptyList()
            }
            
            workOrderStatuses.contains(currentStatus) -> {
                val validTransitions = mapOf(
                    WorkOrderStatus.ASSIGNED.name to listOf(
                        WorkOrderStatus.IN_PROGRESS.name, 
                        WorkOrderStatus.REJECTED.name
                    ),
                    WorkOrderStatus.IN_PROGRESS.name to listOf(
                        WorkOrderStatus.PENDING_REVIEW.name, 
                        WorkOrderStatus.REJECTED.name
                    ),
                    WorkOrderStatus.PENDING_REVIEW.name to listOf(
                        WorkOrderStatus.COMPLETED.name, 
                        WorkOrderStatus.IN_PROGRESS.name
                    ),
                    WorkOrderStatus.COMPLETED.name to emptyList(),
                    WorkOrderStatus.REJECTED.name to emptyList()
                )

                validTransitions[currentStatus]?.filter { nextStatus ->
                    validateWorkOrderTransition(currentStatus, nextStatus, userRole)
                } ?: emptyList()
            }
            
            else -> emptyList()
        }
    }

    /**
     * Checks if a status is terminal (no further transitions allowed)
     * @param status Status to check
     * @returns true if status is terminal
     */
    fun isTerminalStatus(status: String): Boolean {
        val terminalStates = listOf(
            ComplaintStatus.COMPLETED.name,
            ComplaintStatus.REJECTED.name,
            WorkOrderStatus.COMPLETED.name,
            WorkOrderStatus.REJECTED.name
        )

        return terminalStates.contains(status)
    }

    /**
     * Gets a user-friendly error message for invalid transitions
     * @param fromStatus Current status
     * @param toStatus Desired status
     * @param userRole User role
     * @returns Error message explaining why the transition is invalid
     */
    fun getTransitionErrorMessage(
        fromStatus: String,
        toStatus: String,
        userRole: UserRole
    ): String {
        return when {
            isTerminalStatus(fromStatus) -> 
                "Cannot change status from $fromStatus as it is a final state"
            
            userRole == UserRole.USER -> 
                "Regular users cannot change complaint or work order status"
            
            userRole == UserRole.WORKER -> {
                when {
                    fromStatus == ComplaintStatus.REGISTERED.name -> 
                        "Workers cannot approve or reject complaints. Only admins can do this."
                    fromStatus == ComplaintStatus.PENDING_REVIEW.name && toStatus == ComplaintStatus.COMPLETED.name -> 
                        "Workers cannot complete complaints. Only admins can do this."
                    else -> "Invalid status transition from $fromStatus to $toStatus for workers"
                }
            }
            
            else -> "Invalid status transition from $fromStatus to $toStatus"
        }
    }
}
