import apiClient from './apiClient';
import type { ApiResponse } from '@margwatch/shared-types';

export const fcmApi = {
  /** Register FCM token with backend. Call after login with Bearer token. */
  registerToken: (fcmToken: string) =>
    apiClient.post<ApiResponse<unknown>>('/fcm/token', { fcmToken }),
};
