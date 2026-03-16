import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseURL, apiConfig } from '../config/apiConfig';
import type { ApiResponse } from '@margwatch/shared-types';

const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Token getter - set by AuthContext */
let tokenGetter: (() => string | null) | null = null;

export const setApiTokenGetter = (getter: () => string | null) => {
  tokenGetter = getter;
};

/** Attach JWT to every request when available */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenGetter?.() ?? null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Global error handling: normalize API errors and 401 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Request failed';
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid - consumer (AuthContext) can listen and logout
      const enhancedError = Object.assign(error, { isUnauthorized: true });
      return Promise.reject(enhancedError);
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
