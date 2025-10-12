// Shared TypeScript types for MargWatch project

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'ADMIN' | 'WORKER' | 'USER';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: Priority;
  status: ComplaintStatus;
  location?: Location;
  images: string[];
  attachments: string[];
  userId: string;
  user: User;
  assignedWorkerId?: string;
  assignedWorker?: User;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export type ComplaintCategory = 
  | 'INFRASTRUCTURE'
  | 'SANITATION'
  | 'SECURITY'
  | 'TRANSPORT'
  | 'UTILITIES'
  | 'ENVIRONMENT'
  | 'OTHER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus = 
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  message: string;
  status: ComplaintStatus;
  images: string[];
  updatedById: string;
  updatedBy: User;
  createdAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  userId?: string;
  user?: User;
  complaintId?: string;
  complaint?: Complaint;
  createdAt: Date;
}

export type NotificationType = 
  | 'COMPLAINT_CREATED'
  | 'COMPLAINT_ASSIGNED'
  | 'COMPLAINT_UPDATED'
  | 'COMPLAINT_RESOLVED'
  | 'SYSTEM_ANNOUNCEMENT';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ML Service types
export interface MLPrediction {
  category: string;
  confidence: number;
  model_version: string;
  processing_time: number;
  success: boolean;
  error?: string;
}

export interface MLBatchPrediction {
  success: boolean;
  predictions: MLPrediction[];
  total_images: number;
  timestamp: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  totalWorkers: number;
}

export interface DashboardData {
  overview: DashboardStats;
  recentComplaints: Complaint[];
  complaintsByCategory: Array<{
    category: ComplaintCategory;
    count: number;
  }>;
  complaintsByPriority: Array<{
    priority: Priority;
    count: number;
  }>;
}
