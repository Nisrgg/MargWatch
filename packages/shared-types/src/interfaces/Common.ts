import { IssueCategory } from '../enums';

/**
 * API Response interface
 * Standard response format for all API endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Pagination interface
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter parameters interface
 */
export interface FilterParams {
  status?: string;
  category?: IssueCategory | string;
  userId?: string;
  workerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * ML Prediction response interface
 */
export interface MLPredictionResponse {
  category: IssueCategory;
  confidence: number;
  modelVersion?: string;
  processingTime?: number;
  imageSize?: [number, number] | null;
  error?: string;
}

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  complaints: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
  };
  users: {
    total: number;
    workers: number;
  };
  workOrders: {
    active: number;
  };
  recentComplaints: any[]; // Will be typed as Complaint[] when imported
}

/**
 * Analytics interface
 */
export interface ComplaintAnalytics {
  complaintsOverTime: Array<{
    date: string;
    count: number;
  }>;
  complaintsByCategory: Array<{
    category: string;
    count: number;
  }>;
  complaintsByStatus: Array<{
    status: string;
    count: number;
  }>;
  workerPerformance: Array<{
    id: string;
    name: string;
    email: string;
    totalOrders: number;
    completedOrders: number;
    completionRate: number;
    avgCompletionTime: number;
    totalCost: number;
  }>;
  heatMapData: Array<{
    lat: number;
    lng: number;
    category: string;
    status: string;
  }>;
  avgResolutionTime: number;
  period: number;
  totalComplaints: number;
  completedComplaints: number;
}

/**
 * Worker performance interface
 */
export interface WorkerPerformance {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  performance: {
    totalOrders: number;
    completedOrders: number;
    completionRate: number;
    totalCost: number;
    avgCompletionTime: number;
  };
}
