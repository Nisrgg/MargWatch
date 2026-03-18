import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  AuthResponse, 
  LoginForm, 
  User, 
  Complaint, 
  WorkOrder, 
  DashboardStats, 
  ComplaintAnalytics, 
  WorkerPerformance, 
  Pagination, 
  ComplaintFilters, 
  UserFilters, 
  WorkOrderFilters, 
  CreateWorkerForm, 
  UpdateUserStatusForm, 
  CreateWorkOrderForm, 
  UpdateWorkStatusForm, 
  WorkOrderApprovalForm 
} from '@/types';
import { mockComplaints } from '@/data/mockComplaints';

export interface CategoryDisplay {
  id: string;
  label: string;
  colorClass: string;
}
export interface StatusDisplay {
  id: string;
  label: string;
  colorClass: string;
}
export interface ConfigTexts {
  categories: CategoryDisplay[];
  complaintStatuses: StatusDisplay[];
  workOrderStatuses: StatusDisplay[];
  userRoles: Record<string, string>;
  priorities: Record<number, string>;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /** Fetch UI config (categories, statuses, labels) - no auth required */
  async getConfig(): Promise<ApiResponse<ConfigTexts>> {
    try {
      const res = await this.client.get<ApiResponse<ConfigTexts>>('/config');
      return res.data;
    } catch {
      return { success: false, message: 'Failed to load config', data: undefined as unknown as ConfigTexts };
    }
  }

  // Auth API - disabled in demo mode
  async login(credentials: LoginForm): Promise<AuthResponse> {
    throw new Error('API login is disabled in demo mode');
  }

  async logout(): Promise<void> {
    // No-op in demo mode; token cookies are not used
  }

  // Dashboard API
  async getDashboardStats(): Promise<ApiResponse<{ stats: DashboardStats }>> {
    const total = mockComplaints.length;
    const pending = mockComplaints.filter(c => c.status === 'Pending').length;
    const inProgress = mockComplaints.filter(c => c.status === 'In Progress').length;
    const resolved = mockComplaints.filter(c => c.status === 'Resolved').length;

    const stats: DashboardStats = {
      complaints: {
        total,
        pending,
        processing: inProgress,
        completed: resolved,
      } as any,
      users: {
        total: 16,
        workers: 4,
      } as any,
      workOrders: {
        active: inProgress,
      } as any,
    };

    return {
      success: true,
      message: 'Dashboard stats (demo mode)',
      data: { stats },
    };
  }

  async getComplaintAnalytics(period: number = 30): Promise<ApiResponse<{ analytics: ComplaintAnalytics }>> {
    const now = new Date();
    const days: { date: string; count: number }[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = mockComplaints.filter(c => c.createdAt.slice(0, 10) === key).length;
      days.push({ date: key, count });
    }

    const byCategoryMap = new Map<string, number>();
    const byStatusMap = new Map<string, number>();

    mockComplaints.forEach(c => {
      byCategoryMap.set(c.category, (byCategoryMap.get(c.category) ?? 0) + 1);
      byStatusMap.set(c.status, (byStatusMap.get(c.status) ?? 0) + 1);
    });

    const complaintsOverTime = days;
    const complaintsByCategory = Array.from(byCategoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / mockComplaints.length) * 100),
    })) as any;

    const complaintsByStatus = Array.from(byStatusMap.entries()).map(([status, count]) => ({
      status,
      count,
    })) as any;

    const analytics: ComplaintAnalytics = {
      complaintsOverTime,
      complaintsByCategory,
      complaintsByStatus,
      avgResolutionTime: 0,
      period,
      totalComplaints: mockComplaints.length,
      completedComplaints: mockComplaints.filter(c => c.status === 'Resolved').length,
      workerPerformance: [],
      heatMapData: [],
    } as any;

    return {
      success: true,
      message: 'Analytics (demo mode)',
      data: { analytics },
    };
  }

  async getWorkerPerformance(period: number = 30): Promise<ApiResponse<{ performance: WorkerPerformance[] }>> {
    const response: AxiosResponse<ApiResponse<{ performance: WorkerPerformance[] }>> = await this.client.get(`/admin/worker-performance?period=${period}`);
    return response.data;
  }

  // Users API
  async getAllUsers(filters: UserFilters = {}): Promise<ApiResponse<{ users: User[]; pagination: Pagination }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response: AxiosResponse<ApiResponse<{ users: User[]; pagination: Pagination }>> = await this.client.get(`/admin/users?${params.toString()}`);
    return response.data;
  }

  async createWorker(workerData: CreateWorkerForm): Promise<ApiResponse<{ worker: User }>> {
    const response: AxiosResponse<ApiResponse<{ worker: User }>> = await this.client.post('/admin/workers', workerData);
    return response.data;
  }

  async updateUserStatus(userId: string, statusData: UpdateUserStatusForm): Promise<ApiResponse<{ user: User }>> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.client.put(`/admin/users/${userId}/status`, statusData);
    return response.data;
  }

  // Complaints API
  async getAllComplaints(filters: ComplaintFilters = {}): Promise<ApiResponse<{ complaints: Complaint[]; pagination: Pagination }>> {
    let items = mockComplaints.slice();

    if (filters.status) {
      items = items.filter(c => c.status === filters.status);
    }
    if (filters.category) {
      items = items.filter(c => c.category === filters.category);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(c => c.title.toLowerCase().includes(q) || c.user.toLowerCase().includes(q));
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? items.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const slice = items.slice(start, end).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.title,
      category: c.category as any,
      status: c.status as any,
      latitude: c.latitude,
      longitude: c.longitude,
      address: '',
      imageUrl: c.image,
      imageCount: 1,
      mlCategory: null as any,
      mlConfidence: null as any,
      mlModelVersion: null as any,
      mlProcessingTime: null as any,
      severity: null as any,
      rejectionReason: null,
      user: {
        id: 'demo-user',
        firstName: c.user,
        lastName: '',
        email: 'user@roadportal.com',
      } as any,
      createdAt: c.createdAt,
      updatedAt: c.createdAt,
    })) as Complaint[];

    const pagination: Pagination = {
      page,
      limit,
      total: items.length,
      pages: Math.max(1, Math.ceil(items.length / limit)),
    };

    return {
      success: true,
      message: 'Complaints (demo mode)',
      data: { complaints: slice, pagination },
    };
  }

  async getComplaintById(id: string): Promise<ApiResponse<{ complaint: Complaint }>> {
    const response: AxiosResponse<ApiResponse<{ complaint: Complaint }>> = await this.client.get(`/complaints/${id}`);
    return response.data;
  }

  async updateComplaintStatus(id: string, statusData: UpdateComplaintStatusForm): Promise<ApiResponse<{ complaint: Complaint }>> {
    const response: AxiosResponse<ApiResponse<{ complaint: Complaint }>> = await this.client.put(`/complaints/${id}/status`, statusData);
    return response.data;
  }

  async getHeatMapData(filters: { category?: string; dateFrom?: string; dateTo?: string } = {}): Promise<ApiResponse<{ heatMapData: any }>> {
    let items = mockComplaints.slice();
    if (filters.category) {
      items = items.filter(c => c.category === filters.category);
    }

    const heatMapData = items.map(c => ({
      latitude: c.latitude,
      longitude: c.longitude,
      category: c.category,
      status: c.status,
    }));

    return {
      success: true,
      message: 'Heatmap (demo mode)',
      data: { heatMapData },
    };
  }

  // Work Orders API
  async getAllWorkOrders(filters: WorkOrderFilters = {}): Promise<ApiResponse<{ workOrders: WorkOrder[]; pagination: Pagination }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response: AxiosResponse<ApiResponse<{ workOrders: WorkOrder[]; pagination: Pagination }>> = await this.client.get(`/work-orders/all?${params.toString()}`);
    return response.data;
  }

  async createWorkOrder(workOrderData: CreateWorkOrderForm): Promise<ApiResponse<{ workOrder: WorkOrder }>> {
    const response: AxiosResponse<ApiResponse<{ workOrder: WorkOrder }>> = await this.client.post('/work-orders', workOrderData);
    return response.data;
  }

  async getWorkOrderDetails(id: string): Promise<ApiResponse<{ workOrder: WorkOrder }>> {
    const response: AxiosResponse<ApiResponse<{ workOrder: WorkOrder }>> = await this.client.get(`/work-orders/${id}/details`);
    return response.data;
  }

  async updateWorkStatus(id: string, statusData: UpdateWorkStatusForm): Promise<ApiResponse<{ workOrder: WorkOrder }>> {
    const response: AxiosResponse<ApiResponse<{ workOrder: WorkOrder }>> = await this.client.put(`/work-orders/${id}/status`, statusData);
    return response.data;
  }

  async completeWorkOrder(id: string, completionData: { description?: string; workProofImages?: string[] }): Promise<ApiResponse<{ workOrder: WorkOrder }>> {
    const response: AxiosResponse<ApiResponse<{ workOrder: WorkOrder }>> = await this.client.put(`/work-orders/${id}/complete`, completionData);
    return response.data;
  }

  // Work Order Approval Methods
  async getPendingApprovals(): Promise<ApiResponse<{ workOrders: WorkOrder[] }>> {
    const response: AxiosResponse<ApiResponse<{ workOrders: WorkOrder[] }>> = await this.client.get('/work-orders/pending-approvals');
    return response.data;
  }

  async approveWorkOrder(approvalData: WorkOrderApprovalForm): Promise<ApiResponse<{ workOrder: WorkOrder }>> {
    const response: AxiosResponse<ApiResponse<{ workOrder: WorkOrder }>> = await this.client.post('/work-orders/approve', {
      workOrderId: approvalData.workOrderId,
      approvalStatus: approvalData.approvalStatus,
      rejectionReason: approvalData.rejectionReason
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
