import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { workOrdersApi } from '../api/workOrdersApi';
import type { WorkOrderFilters } from '@margwatch/shared-types';

export const workOrdersKeys = {
  all: ['workOrders'] as const,
  myList: (filters?: WorkOrderFilters) => [...workOrdersKeys.all, 'my', filters] as const,
  detail: (id: string) => [...workOrdersKeys.all, 'detail', id] as const,
};

export function useWorkOrdersList(filters?: WorkOrderFilters) {
  const { token } = useAuth();
  return useQuery({
    queryKey: workOrdersKeys.myList(filters),
    queryFn: async () => {
      const { data } = await workOrdersApi.getMyOrders(filters);
      if (!data.success || !data.data) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token,
  });
}

export function useWorkOrderDetail(id: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: workOrdersKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('No id');
      const { data } = await workOrdersApi.getDetails(id);
      if (!data.success || !data.data) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token && !!id,
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      workOrdersApi.updateStatus(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrdersKeys.all });
    },
  });
}

export function useCompleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      workOrdersApi.complete(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrdersKeys.all });
    },
  });
}
