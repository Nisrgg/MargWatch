import apiClient from './apiClient';
import type { ApiResponse, Notification } from '@margwatch/shared-types';

export interface NotificationsResponseData {
  notifications: Notification[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export interface NotificationCountResponseData {
  count: number;
}

export const notificationsApi = {
  getList: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiClient.get<ApiResponse<NotificationsResponseData>>('/notifications', {
      params,
    }),

  getCount: () =>
    apiClient.get<ApiResponse<NotificationCountResponseData>>('/notifications/count'),

  markAsRead: (notificationId: string) =>
    apiClient.put<ApiResponse<Notification>>(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    apiClient.put<ApiResponse<unknown>>('/notifications/mark-all-read'),
};
