import { useQuery } from '@tanstack/react-query';
import { DashboardStats, Complaint, ComplaintAnalytics } from '@margwatch/shared-types';
import apiClient from '@/lib/api';

// Query keys for consistent caching
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  recentComplaints: () => [...dashboardKeys.all, 'recentComplaints'] as const,
  analytics: (period: number) => [...dashboardKeys.all, 'analytics', period] as const,
};

// Hook for dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async (): Promise<DashboardStats> => {
      const response = await apiClient.getDashboardStats();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }
      return response.data.stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for recent complaints
export function useRecentComplaints() {
  return useQuery({
    queryKey: dashboardKeys.recentComplaints(),
    queryFn: async (): Promise<Complaint[]> => {
      const response = await apiClient.getAllComplaints({
        limit: 5,
        page: 1,
        sortOrder: 'desc',
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch recent complaints');
      }
      return response.data.complaints;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for complaint analytics
export function useComplaintAnalytics(period: number = 30) {
  return useQuery({
    queryKey: dashboardKeys.analytics(period),
    queryFn: async (): Promise<ComplaintAnalytics> => {
      const response = await apiClient.getComplaintAnalytics(period);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch analytics');
      }
      return response.data.analytics;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Combined hook for all dashboard data
export function useDashboardData() {
  const statsQuery = useDashboardStats();
  const complaintsQuery = useRecentComplaints();
  const analyticsQuery = useComplaintAnalytics(30);

  return {
    stats: statsQuery.data,
    recentComplaints: complaintsQuery.data || [],
    analytics: analyticsQuery.data,
    isLoading: statsQuery.isLoading || complaintsQuery.isLoading || analyticsQuery.isLoading,
    isError: statsQuery.isError || complaintsQuery.isError || analyticsQuery.isError,
    error: statsQuery.error || complaintsQuery.error || analyticsQuery.error,
    refetch: () => {
      statsQuery.refetch();
      complaintsQuery.refetch();
      analyticsQuery.refetch();
    },
    isRefetching: statsQuery.isRefetching || complaintsQuery.isRefetching || analyticsQuery.isRefetching,
  };
}
