/**
 * Work order approval status enumeration
 * Defines the approval states for work orders
 */
export enum WorkOrderApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export type WorkOrderApprovalStatusType = keyof typeof WorkOrderApprovalStatus;
