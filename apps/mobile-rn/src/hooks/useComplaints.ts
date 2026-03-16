import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { complaintsApi } from '../api/complaintsApi';
import type { ComplaintFilters } from '@margwatch/shared-types';

export const complaintsKeys = {
  all: ['complaints'] as const,
  myList: (filters?: ComplaintFilters) => [...complaintsKeys.all, 'my', filters] as const,
  detail: (id: string) => [...complaintsKeys.all, 'detail', id] as const,
  heatmap: (params?: { category?: string; dateFrom?: string; dateTo?: string }) =>
    [...complaintsKeys.all, 'heatmap', params] as const,
};

export function useComplaintsList(filters?: ComplaintFilters) {
  const { token } = useAuth();
  return useQuery({
    queryKey: complaintsKeys.myList(filters),
    queryFn: async () => {
      const { data } = await complaintsApi.getMyComplaints(filters);
      if (!data.success || !data.data) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token,
  });
}

export function useComplaintDetail(id: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: complaintsKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('No id');
      const { data } = await complaintsApi.getById(id);
      if (!data.success || !data.data?.complaint) throw new Error(data.message);
      return data.data.complaint;
    },
    enabled: !!token && !!id,
  });
}

export function useHeatMapData(params?: { category?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: complaintsKeys.heatmap(params),
    queryFn: async () => {
      const { data } = await complaintsApi.getHeatMapData(params);
      if (!data.success || !data.data) throw new Error(data.message);
      return data.data;
    },
  });
}
