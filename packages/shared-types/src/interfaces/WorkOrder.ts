import { ComplaintStatus, WorkOrderApprovalStatus } from '../enums';
import { User } from './User';
import { Complaint } from './Complaint';

/**
 * Work Order interface
 * Represents a work order in the MargWatch system
 */
export interface WorkOrder {
  id: string;
  complaintId: string;
  complaint: {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    address?: string;
    category: string;
    imageUrl?: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  workerId: string;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: ComplaintStatus;
  priority: number; // 1 = Low, 2 = Medium, 3 = High
  assignedAt: Date | string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  workDescription?: string;
  materialsUsed?: string;
  cost?: number;
  // Admin approval fields
  adminApprovalStatus?: WorkOrderApprovalStatus;
  adminApprovedBy?: string;
  adminApprovedAt?: Date | string;
  adminRejectionReason?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  updates?: WorkOrderUpdate[];
}

/**
 * Work Order creation request interface
 */
export interface CreateWorkOrderRequest {
  complaintId: string;
  workerId: string;
  priority?: number;
}

/**
 * Work Order update request interface
 */
export interface UpdateWorkOrderRequest {
  status?: ComplaintStatus;
  workDescription?: string;
  materialsUsed?: string;
  cost?: number;
}

/**
 * Work Order approval request interface
 */
export interface WorkOrderApprovalRequest {
  workOrderId: string;
  approvalStatus: WorkOrderApprovalStatus;
  rejectionReason?: string;
}

/**
 * Work Order filters interface
 */
export interface WorkOrderFilters {
  page?: number;
  limit?: number;
  status?: ComplaintStatus | string;
  workerId?: string;
  search?: string;
}

/**
 * Work Order update interface
 */
export interface WorkOrderUpdate {
  id: string;
  workOrderId: string;
  status: ComplaintStatus | string;
  description?: string;
  imageUrl?: string;
  progress?: number;
  createdAt: Date | string;
}
