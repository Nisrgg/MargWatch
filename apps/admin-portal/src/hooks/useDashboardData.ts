import { useState, useEffect, useCallback } from 'react';
import { DashboardStats, Complaint, ComplaintAnalytics } from '@/types';
import { mockComplaints } from '@/data/mockComplaints';

// Custom hook for dashboard data fetching (tanstack-query pattern)
export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<ComplaintAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const total = mockComplaints.length;
      const pending = mockComplaints.filter(c => c.status === 'Pending').length;
      const inProgress = mockComplaints.filter(c => c.status === 'In Progress').length;
      const resolved = mockComplaints.filter(c => c.status === 'Resolved').length;

      const statsLocal: DashboardStats = {
        complaints: {
          total,
          pending,
          processing: inProgress,
          completed: resolved,
        } as any,
        users: {
          total: 16,
          workers: 4,
        } as any,
        workOrders: {
          active: inProgress,
        } as any,
      };

      // Recent complaints: latest 5 by createdAt
      const recent = [...mockComplaints]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          title: c.title,
          description: c.title,
          category: c.category as any,
          status: c.status as any,
          latitude: c.latitude,
          longitude: c.longitude,
          address: '',
          imageUrl: c.image,
          imageCount: 1,
          mlCategory: null as any,
          mlConfidence: null as any,
          mlModelVersion: null as any,
          mlProcessingTime: null as any,
          severity: null as any,
          rejectionReason: null,
          user: {
            id: 'demo-user',
            firstName: c.user,
            lastName: '',
            email: 'user@roadportal.com',
          } as any,
          createdAt: c.createdAt,
          updatedAt: c.createdAt,
        })) as Complaint[];

      // Analytics: status distribution + heatmap points
      const byStatusMap = new Map<string, number>();
      mockComplaints.forEach((c) => {
        byStatusMap.set(c.status, (byStatusMap.get(c.status) ?? 0) + 1);
      });

      const complaintsByStatus = Array.from(byStatusMap.entries()).map(([status, count]) => ({
        status,
        count,
      })) as any;

      const heatMapData = mockComplaints.map((c) => ({
        latitude: c.latitude,
        longitude: c.longitude,
        category: c.category,
        status: c.status,
      }));

      const analyticsLocal: ComplaintAnalytics = {
        complaintsOverTime: [],
        complaintsByCategory: [],
        complaintsByStatus,
        avgResolutionTime: 0,
        period: 30,
        totalComplaints: total,
        completedComplaints: resolved,
        workerPerformance: [],
        heatMapData: heatMapData as any,
      } as any;

      setStats(statsLocal);
      setRecentComplaints(recent);
      setAnalytics(analyticsLocal);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to compute dashboard data');
      console.error('Dashboard data compute error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    recentComplaints,
    analytics,
    isLoading,
    isError,
    error,
    refetch: fetchData,
  };
}

// Individual hooks for specific data (tanstack-query pattern)
export function useDashboardStats() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await apiClient.getDashboardStats();
      if (response.success && response.data) {
        setData(response.data.stats);
      }
    } catch (error) {
      setIsError(true);
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, isLoading, isError, refetch: fetchStats };
}

export function useRecentComplaints() {
  const [data, setData] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await apiClient.getAllComplaints({ limit: 5, page: 1 });
      if (response.success && response.data) {
        setData(response.data.complaints);
      }
    } catch (error) {
      setIsError(true);
      console.error('Failed to fetch recent complaints:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return { data, isLoading, isError, refetch: fetchComplaints };
}

export function useComplaintAnalytics(period: number = 30) {
  const [data, setData] = useState<ComplaintAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await apiClient.getComplaintAnalytics(period);
      if (response.success && response.data) {
        setData(response.data.analytics);
      }
    } catch (error) {
      setIsError(true);
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, isLoading, isError, refetch: fetchAnalytics };
}
