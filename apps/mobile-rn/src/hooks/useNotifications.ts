import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { notificationsApi } from '../api/notificationsApi';

export const notificationsKeys = {
  all: ['notifications'] as const,
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    [...notificationsKeys.all, 'list', params] as const,
  count: () => [...notificationsKeys.all, 'count'] as const,
};

export function useNotificationsList(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: async () => {
      const { data } = await notificationsApi.getList(params);
      if (!data.success || !data.data) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token,
  });
}

export function useNotificationCount() {
  const { token } = useAuth();
  return useQuery({
    queryKey: notificationsKeys.count(),
    queryFn: async () => {
      const { data } = await notificationsApi.getCount();
      if (!data.success || !data.data) throw new Error(data.message);
      return data.data;
    },
    enabled: !!token,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}
