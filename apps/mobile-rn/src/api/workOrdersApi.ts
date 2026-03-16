import apiClient from './apiClient';
import type {
  ApiResponse,
  WorkOrder,
  WorkOrderFilters,
} from '@margwatch/shared-types';

export interface WorkOrderListResponseData {
  workOrders: WorkOrder[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export const workOrdersApi = {
  getMyOrders: (params?: WorkOrderFilters) =>
    apiClient.get<ApiResponse<WorkOrderListResponseData>>('/work-orders/my-orders', {
      params,
    }),

  getDetails: (id: string) =>
    apiClient.get<ApiResponse<WorkOrder>>(`/work-orders/${id}/details`),

  /** Update status - optional FormData for images; body: status, description?, progress? */
  updateStatus: (id: string, formData: FormData) =>
    apiClient.put<ApiResponse<WorkOrder>>(`/work-orders/${id}/status`, formData, {
      headers: formData.get ? undefined : { 'Content-Type': 'application/json' },
    }),

  /** Complete work order - optional FormData for images; body: description?, cost? */
  complete: (id: string, formData: FormData) =>
    apiClient.put<ApiResponse<WorkOrder>>(`/work-orders/${id}/complete`, formData, {
      headers: formData.get ? undefined : { 'Content-Type': 'application/json' },
    }),
};
