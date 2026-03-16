import apiClient from './apiClient';
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '@margwatch/shared-types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  getProfile: () => apiClient.get<ApiResponse<User>>('/auth/profile'),

  updateProfile: (data: { firstName: string; lastName: string; phone?: string }) =>
    apiClient.put<ApiResponse<User>>('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put<ApiResponse<unknown>>('/auth/change-password', data),

  logout: () => apiClient.post<ApiResponse<unknown>>('/auth/logout'),
};
