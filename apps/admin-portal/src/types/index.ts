// Re-export all types from shared-types package
// This ensures consistency across the entire MargWatch project

export * from '@margwatch/shared-types';

// Additional admin-portal specific types that don't exist in shared-types
export interface CreateWorkerForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateUserStatusForm {
  isActive: boolean;
}

export interface UpdateComplaintStatusForm {
  status: string;
  description?: string;
}

export interface CreateWorkOrderForm {
  complaintId: string;
  workerId: string;
  priority?: number;
}

export interface WorkOrderApprovalForm {
  workOrderId: string;
  approvalStatus: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface UpdateWorkStatusForm {
  status: string;
  description?: string;
  progress?: number;
  imageUrl?: string;
}

export interface LoginForm {
  email: string;
  password: string;
}