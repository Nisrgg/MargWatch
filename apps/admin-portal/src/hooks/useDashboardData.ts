import { useState, useEffect, useCallback } from 'react';
import { DashboardStats, Complaint, ComplaintAnalytics } from '@/types';
import apiClient from '@/lib/api';

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

      const [statsResponse, complaintsResponse, analyticsResponse] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getAllComplaints({ limit: 5, page: 1 }),
        apiClient.getComplaintAnalytics(30),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data.stats);
      }

      if (complaintsResponse.success && complaintsResponse.data) {
        setRecentComplaints(complaintsResponse.data.complaints);
      }

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data.analytics);
      }
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
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
