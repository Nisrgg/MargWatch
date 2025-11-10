/**
 * Work order status enumeration
 * Defines the lifecycle states of work orders in the MargWatch system
 */
export enum WorkOrderStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_REVIEW = 'PENDING_REVIEW',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export type WorkOrderStatusType = keyof typeof WorkOrderStatus;
