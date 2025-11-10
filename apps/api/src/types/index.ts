import { Request } from 'express';
import { 
  UserRole, 
  ComplaintStatus, 
  IssueCategory,
  WorkOrderApprovalStatus,
  User,
  Complaint,
  WorkOrder,
  ApiResponse,
  PaginationParams,
  FilterParams,
  MLPredictionResponse,
  HeatMapData,
  LoginRequest,
  RegisterRequest,
  CreateComplaintRequest,
  CreateWorkOrderRequest,
  WorkOrderRequest,
  WorkOrderApprovalRequest,
  UpdateComplaintRequest
} from '@margwatch/shared-types';

/**
 * Authenticated request interface extending Express Request
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Re-export commonly used types for convenience
export type {
  UserRole,
  ComplaintStatus,
  IssueCategory,
  WorkOrderApprovalStatus,
  User,
  Complaint,
  WorkOrder,
  ApiResponse,
  PaginationParams,
  FilterParams,
  MLPredictionResponse,
  HeatMapData,
  LoginRequest,
  RegisterRequest,
  CreateComplaintRequest,
  CreateWorkOrderRequest,
  WorkOrderRequest,
  WorkOrderApprovalRequest,
  UpdateComplaintRequest
} from '@margwatch/shared-types';