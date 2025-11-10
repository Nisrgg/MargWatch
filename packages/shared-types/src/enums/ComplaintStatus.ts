/**
 * Complaint status enumeration
 * Defines the lifecycle states of complaints in the MargWatch system
 */
export enum ComplaintStatus {
  REGISTERED = 'REGISTERED',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  PENDING_REVIEW = 'PENDING_REVIEW',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export type ComplaintStatusType = keyof typeof ComplaintStatus;
