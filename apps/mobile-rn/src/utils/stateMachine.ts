/**
 * Client-side state machine validation (mirrors backend StateMachineValidator).
 * Used to determine valid next states for complaints and work orders in the UI.
 */
import {
  ComplaintStatus,
  WorkOrderStatus,
  UserRole,
} from '@margwatch/shared-types';

const complaintTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
  [ComplaintStatus.REGISTERED]: [ComplaintStatus.APPROVED, ComplaintStatus.REJECTED],
  [ComplaintStatus.APPROVED]: [ComplaintStatus.PROCESSING],
  [ComplaintStatus.PROCESSING]: [ComplaintStatus.PENDING_REVIEW],
  [ComplaintStatus.PENDING_REVIEW]: [ComplaintStatus.COMPLETED, ComplaintStatus.PROCESSING],
  [ComplaintStatus.COMPLETED]: [],
  [ComplaintStatus.REJECTED]: [],
};

const workOrderTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.ASSIGNED]: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.REJECTED],
  [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.PENDING_REVIEW, WorkOrderStatus.REJECTED],
  [WorkOrderStatus.PENDING_REVIEW]: [WorkOrderStatus.COMPLETED, WorkOrderStatus.IN_PROGRESS],
  [WorkOrderStatus.COMPLETED]: [],
  [WorkOrderStatus.REJECTED]: [],
};

function canTransitionComplaint(
  from: ComplaintStatus,
  to: ComplaintStatus,
  role: UserRole
): boolean {
  const allowed = complaintTransitions[from]?.includes(to) ?? false;
  if (!allowed) return false;
  if (role === UserRole.ADMIN) return true;
  if (role === UserRole.WORKER) {
    if (from === ComplaintStatus.APPROVED && to === ComplaintStatus.PROCESSING) return true;
    if (from === ComplaintStatus.PROCESSING && to === ComplaintStatus.PENDING_REVIEW) return true;
  }
  return false;
}

function canTransitionWorkOrder(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
  role: UserRole
): boolean {
  const allowed = workOrderTransitions[from]?.includes(to) ?? false;
  if (!allowed) return false;
  if (role === UserRole.ADMIN) return true;
  if (role === UserRole.WORKER) {
    if (from === WorkOrderStatus.ASSIGNED && to === WorkOrderStatus.IN_PROGRESS) return true;
    if (from === WorkOrderStatus.IN_PROGRESS && to === WorkOrderStatus.PENDING_REVIEW) return true;
    if (from === WorkOrderStatus.PENDING_REVIEW && to === WorkOrderStatus.IN_PROGRESS) return true;
  }
  return false;
}

export const stateMachine = {
  validateComplaintTransition: canTransitionComplaint,
  validateWorkOrderTransition: canTransitionWorkOrder,
  getValidNextComplaintStates: (current: ComplaintStatus, role: UserRole): ComplaintStatus[] =>
    (complaintTransitions[current] ?? []).filter((next) =>
      canTransitionComplaint(current, next, role)
    ),
  getValidNextWorkOrderStates: (current: WorkOrderStatus, role: UserRole): WorkOrderStatus[] =>
    (workOrderTransitions[current] ?? []).filter((next) =>
      canTransitionWorkOrder(current, next, role)
    ),
  isTerminalComplaintStatus: (status: ComplaintStatus) =>
    status === ComplaintStatus.COMPLETED || status === ComplaintStatus.REJECTED,
  isTerminalWorkOrderStatus: (status: WorkOrderStatus) =>
    status === WorkOrderStatus.COMPLETED || status === WorkOrderStatus.REJECTED,
};
