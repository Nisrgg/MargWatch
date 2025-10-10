import { Request } from 'express';
import { UserRole, ComplaintStatus, IssueCategory } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ComplaintRequest {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface WorkOrderRequest {
  complaintId: string;
  workerId: string;
  priority?: number;
}

export interface UpdateComplaintStatusRequest {
  status: ComplaintStatus;
  description?: string;
}

export interface MLPredictionResponse {
  category: IssueCategory;
  confidence: number;
  modelVersion?: string;
  processingTime?: number;
  imageSize?: [number, number] | null;
  error?: string;
}

export interface HeatMapData {
  latitude: number;
  longitude: number;
  count: number;
  category: IssueCategory;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: ComplaintStatus;
  category?: IssueCategory;
  userId?: string;
  workerId?: string;
  dateFrom?: string;
  dateTo?: string;
}
