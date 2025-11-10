import { ComplaintStatus, WorkOrderStatus, UserRole } from '@margwatch/shared-types';

/**
 * State Machine Validator for MargWatch System
 * Ensures all state transitions follow the defined business logic
 */
export class StateMachineValidator {
  /**
   * Validates complaint status transitions based on business rules
   * @param fromStatus Current complaint status
   * @param toStatus Desired complaint status
   * @param userRole Role of the user making the transition
   * @returns true if transition is valid, false otherwise
   */
  static validateComplaintTransition(
    fromStatus: ComplaintStatus,
    toStatus: ComplaintStatus,
    userRole: UserRole
  ): boolean {
    // Define valid transitions for each status
    const validTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
      [ComplaintStatus.REGISTERED]: [ComplaintStatus.APPROVED, ComplaintStatus.REJECTED],
      [ComplaintStatus.APPROVED]: [ComplaintStatus.PROCESSING],
      [ComplaintStatus.PROCESSING]: [ComplaintStatus.PENDING_REVIEW],
      [ComplaintStatus.PENDING_REVIEW]: [ComplaintStatus.COMPLETED, ComplaintStatus.PROCESSING],
      [ComplaintStatus.COMPLETED]: [], // Terminal state
      [ComplaintStatus.REJECTED]: [], // Terminal state
    };

    // Check if transition is in the valid list
    const isValidTransition = validTransitions[fromStatus]?.includes(toStatus) || false;

    // Additional role-based validation
    if (isValidTransition) {
      return this.validateRoleBasedTransition(fromStatus, toStatus, userRole);
    }

    return false;
  }

  /**
   * Validates work order status transitions
   * @param fromStatus Current work order status
   * @param toStatus Desired work order status
   * @param userRole Role of the user making the transition
   * @returns true if transition is valid, false otherwise
   */
  static validateWorkOrderTransition(
    fromStatus: WorkOrderStatus,
    toStatus: WorkOrderStatus,
    userRole: UserRole
  ): boolean {
    // Define valid transitions for each status
    const validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      [WorkOrderStatus.ASSIGNED]: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.REJECTED],
      [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.PENDING_REVIEW, WorkOrderStatus.REJECTED],
      [WorkOrderStatus.PENDING_REVIEW]: [WorkOrderStatus.COMPLETED, WorkOrderStatus.IN_PROGRESS],
      [WorkOrderStatus.COMPLETED]: [], // Terminal state
      [WorkOrderStatus.REJECTED]: [], // Terminal state
    };

    // Check if transition is in the valid list
    const isValidTransition = validTransitions[fromStatus]?.includes(toStatus) || false;

    // Additional role-based validation
    if (isValidTransition) {
      return this.validateWorkOrderRoleTransition(fromStatus, toStatus, userRole);
    }

    return false;
  }

  /**
   * Validates role-based transitions for complaints
   * @param fromStatus Current status
   * @param toStatus Desired status
   * @param userRole User role
   * @returns true if role can make this transition
   */
  private static validateRoleBasedTransition(
    fromStatus: ComplaintStatus,
    toStatus: ComplaintStatus,
    userRole: UserRole
  ): boolean {
    // Admin can make any valid transition
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Worker transitions
    if (userRole === UserRole.WORKER) {
      // Workers can only transition complaints from APPROVED to PROCESSING
      if (fromStatus === ComplaintStatus.APPROVED && toStatus === ComplaintStatus.PROCESSING) {
        return true;
      }
      // Workers can transition from PROCESSING to PENDING_REVIEW
      if (fromStatus === ComplaintStatus.PROCESSING && toStatus === ComplaintStatus.PENDING_REVIEW) {
        return true;
      }
    }

    // Regular users cannot change complaint status
    if (userRole === UserRole.USER) {
      return false;
    }

    return false;
  }

  /**
   * Validates role-based transitions for work orders
   * @param fromStatus Current status
   * @param toStatus Desired status
   * @param userRole User role
   * @returns true if role can make this transition
   */
  private static validateWorkOrderRoleTransition(
    fromStatus: WorkOrderStatus,
    toStatus: WorkOrderStatus,
    userRole: UserRole
  ): boolean {
    // Admin can make any valid transition
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Worker transitions
    if (userRole === UserRole.WORKER) {
      // Workers can start work (ASSIGNED -> IN_PROGRESS)
      if (fromStatus === WorkOrderStatus.ASSIGNED && toStatus === WorkOrderStatus.IN_PROGRESS) {
        return true;
      }
      // Workers can submit for review (IN_PROGRESS -> PENDING_REVIEW)
      if (fromStatus === WorkOrderStatus.IN_PROGRESS && toStatus === WorkOrderStatus.PENDING_REVIEW) {
        return true;
      }
      // Workers can go back to work after rejection (PENDING_REVIEW -> IN_PROGRESS)
      if (fromStatus === WorkOrderStatus.PENDING_REVIEW && toStatus === WorkOrderStatus.IN_PROGRESS) {
        return true;
      }
    }

    // Regular users cannot change work order status
    if (userRole === UserRole.USER) {
      return false;
    }

    return false;
  }

  /**
   * Gets the next valid states for a given current state
   * @param currentStatus Current status
   * @param userRole User role
   * @returns Array of valid next states
   */
  static getValidNextStates(
    currentStatus: ComplaintStatus | WorkOrderStatus,
    userRole: UserRole
  ): (ComplaintStatus | WorkOrderStatus)[] {
    if (Object.values(ComplaintStatus).includes(currentStatus as ComplaintStatus)) {
      const complaintStatus = currentStatus as ComplaintStatus;
      const validTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
        [ComplaintStatus.REGISTERED]: [ComplaintStatus.APPROVED, ComplaintStatus.REJECTED],
        [ComplaintStatus.APPROVED]: [ComplaintStatus.PROCESSING],
        [ComplaintStatus.PROCESSING]: [ComplaintStatus.PENDING_REVIEW],
        [ComplaintStatus.PENDING_REVIEW]: [ComplaintStatus.COMPLETED, ComplaintStatus.PROCESSING],
        [ComplaintStatus.COMPLETED]: [],
        [ComplaintStatus.REJECTED]: [],
      };

      return validTransitions[complaintStatus].filter(nextStatus =>
        this.validateComplaintTransition(complaintStatus, nextStatus, userRole)
      );
    }

    if (Object.values(WorkOrderStatus).includes(currentStatus as WorkOrderStatus)) {
      const workOrderStatus = currentStatus as WorkOrderStatus;
      const validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
        [WorkOrderStatus.ASSIGNED]: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.REJECTED],
        [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.PENDING_REVIEW, WorkOrderStatus.REJECTED],
        [WorkOrderStatus.PENDING_REVIEW]: [WorkOrderStatus.COMPLETED, WorkOrderStatus.IN_PROGRESS],
        [WorkOrderStatus.COMPLETED]: [],
        [WorkOrderStatus.REJECTED]: [],
      };

      return validTransitions[workOrderStatus].filter(nextStatus =>
        this.validateWorkOrderTransition(workOrderStatus, nextStatus, userRole)
      );
    }

    return [];
  }

  /**
   * Checks if a status is terminal (no further transitions allowed)
   * @param status Status to check
   * @returns true if status is terminal
   */
  static isTerminalStatus(status: ComplaintStatus | WorkOrderStatus): boolean {
    const terminalStates = [
      ComplaintStatus.COMPLETED,
      ComplaintStatus.REJECTED,
      WorkOrderStatus.COMPLETED,
      WorkOrderStatus.REJECTED,
    ];

    return terminalStates.includes(status as any);
  }
}
