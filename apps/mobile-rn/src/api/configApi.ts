import apiClient from './apiClient';

export interface CategoryDisplay {
  id: string;
  label: string;
  colorClass: string;
}

export interface ConfigTexts {
  categories: CategoryDisplay[];
  complaintStatuses: { id: string; label: string; colorClass: string }[];
  workOrderStatuses: { id: string; label: string; colorClass: string }[];
  userRoles: Record<string, string>;
  priorities: Record<number, string>;
}

export interface ConfigResponse {
  success: boolean;
  message?: string;
  data?: ConfigTexts;
}

export async function getConfig(): Promise<ConfigResponse> {
  try {
    const res = await apiClient.get<ConfigResponse>('/config');
    return res.data;
  } catch {
    return { success: false, message: 'Failed to load config' };
  }
}
