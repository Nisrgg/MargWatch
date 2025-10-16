// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'WORKER';
  isActive: boolean;
  createdAt: string;
  _count?: {
    complaints: number;
    workOrders: number;
  };
}

// Complaint Types
export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: 'POTHOLE' | 'ROAD_INSTABILITY' | 'STREETLIGHT_DAMAGE' | 'TREE_DAMAGE' | 'OTHER';
  status: 'REGISTERED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  latitude: number;
  longitude: number;
  address?: string;
  imageUrls: string[];
  imageCount: number;
  mlCategory?: string;
  mlConfidence?: number;
  mlModelVersion?: string;
  mlProcessingTime?: number;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  workOrders?: WorkOrder[];
  updates?: ComplaintUpdate[];
}

// Work Order Types
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
  status: 'REGISTERED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  priority: number;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  workDescription?: string;
  materialsUsed?: string;
  cost?: number;
  // Admin approval fields
  adminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminApprovedBy?: string;
  adminApprovedAt?: string;
  adminRejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  updates?: WorkOrderUpdate[];
}

// Update Types
export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  status: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface WorkOrderUpdate {
  id: string;
  workOrderId: string;
  status: string;
  description?: string;
  imageUrl?: string;
  progress?: number;
  createdAt: string;
}

// Dashboard Types
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
  recentComplaints: Complaint[];
}

// Analytics Types
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

// Worker Performance Types
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

// Pagination Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Filter Types
export interface ComplaintFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  userId?: string;
  workerId?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export interface WorkOrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  workerId?: string;
}

// Form Types
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

// Auth Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN' | 'WORKER';
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    token: string;
  };
}
