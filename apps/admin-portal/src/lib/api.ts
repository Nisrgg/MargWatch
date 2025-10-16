import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { ApiResponse, AuthResponse, LoginForm, User, Complaint, WorkOrder, DashboardStats, ComplaintAnalytics, WorkerPerformance, Pagination, ComplaintFilters, UserFilters, WorkOrderFilters, CreateWorkerForm, UpdateUserStatusForm, UpdateComplaintStatusForm, CreateWorkOrderForm, UpdateWorkStatusForm, WorkOrderApprovalForm } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('admin_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          Cookies.remove('admin_token');
          window.location.href = '/login';
        }
        
        // Handle connection errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          console.error('Backend server is not running. Please start the backend server on port 5000.');
          // You can show a user-friendly message here
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth API
  async login(credentials: LoginForm): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/login', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    Cookies.remove('admin_token');
  }

  // Dashboard API
  async getDashboardStats(): Promise<ApiResponse<{ stats: DashboardStats }>> {
    const response: AxiosResponse<ApiResponse<{ stats: DashboardStats }>> = await this.client.get('/admin/dashboard');
    return response.data;
  }

  async getComplaintAnalytics(period: number = 30): Promise<ApiResponse<{ analytics: ComplaintAnalytics }>> {
    const response: AxiosResponse<ApiResponse<{ analytics: ComplaintAnalytics }>> = await this.client.get(`/admin/analytics?period=${period}`);
    return response.data;
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
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response: AxiosResponse<ApiResponse<{ complaints: Complaint[]; pagination: Pagination }>> = await this.client.get(`/complaints?${params.toString()}`);
    return response.data;
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
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response: AxiosResponse<ApiResponse<{ heatMapData: any }>> = await this.client.get(`/complaints/heatmap?${params.toString()}`);
    return response.data;
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
    const response: AxiosResponse<ApiResponse<{ workOrders: WorkOrder[] }>> = await this.client.get('/work-orders/all?status=COMPLETED&adminApprovalStatus=PENDING');
    return response.data;
  }

  async approveWorkOrder(approvalData: WorkOrderApprovalForm): Promise<ApiResponse<{ workOrder: WorkOrder }>> {
    const response: AxiosResponse<ApiResponse<{ workOrder: WorkOrder }>> = await this.client.put(`/admin-approval/work-orders/${approvalData.workOrderId}/final-approve`, {
      action: approvalData.approvalStatus === 'APPROVED' ? 'approve' : 'reject',
      adminNotes: approvalData.rejectionReason
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
