import apiClient from './apiClient';
import type {
  ApiResponse,
  Complaint,
  ComplaintFilters,
  HeatMapData,
  Pagination,
} from '@margwatch/shared-types';

export interface ComplaintsResponseData {
  complaints: Complaint[];
  pagination: Pagination;
}

export interface ComplaintSubmissionResponseData {
  complaint: Complaint;
}

export interface HeatMapResponseData {
  heatMapData: HeatMapData[];
}

export const complaintsApi = {
  /** Submit complaint - use FormData with images, latitude, longitude, optional address */
  submit: (formData: FormData) =>
    apiClient.post<ApiResponse<ComplaintSubmissionResponseData>>(
      '/complaints/submit',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    ),

  getMyComplaints: (params?: ComplaintFilters) =>
    apiClient.get<ApiResponse<ComplaintsResponseData>>('/complaints/my-complaints', {
      params,
    }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<{ complaint: Complaint }>>(`/complaints/${id}`),

  getHeatMapData: (params?: { category?: string; dateFrom?: string; dateTo?: string }) =>
    apiClient.get<ApiResponse<HeatMapResponseData>>('/complaints/heatmap', {
      params,
    }),
};
