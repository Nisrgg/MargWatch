'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient, { ConfigTexts } from '@/lib/api';

const configKeys = { config: ['config'] as const };

function getDefaultCategoryLabel(id: string): string {
  const m: Record<string, string> = {
    POTHOLE: 'Pothole',
    ROAD_INSTABILITY: 'Road Instability',
    STREETLIGHT_DAMAGE: 'Streetlight Damage',
    TREE_DAMAGE: 'Tree Damage',
    OTHER: 'Other',
  };
  return m[id] ?? id;
}

function getDefaultCategoryColor(_id: string): string {
  return 'bg-gray-100 text-gray-800';
}

function getDefaultStatusLabel(id: string): string {
  const m: Record<string, string> = {
    REGISTERED: 'Registered',
    APPROVED: 'Approved',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
  };
  return m[id] ?? id;
}

function getDefaultStatusColor(_id: string): string {
  return 'bg-gray-100 text-gray-800';
}

export function useConfig() {
  const { data: res, isLoading } = useQuery({
    queryKey: configKeys.config,
    queryFn: () => apiClient.getConfig(),
    staleTime: 5 * 60 * 1000,
  });

  const config: ConfigTexts | undefined = res?.success ? res.data : undefined;

  const formatCategory = (categoryId: string): string => {
    if (config?.categories) {
      const c = config.categories.find((x) => x.id === categoryId);
      if (c) return c.label;
    }
    return getDefaultCategoryLabel(categoryId);
  };

  const getCategoryColor = (categoryId: string): string => {
    if (config?.categories) {
      const c = config.categories.find((x) => x.id === categoryId);
      if (c) return c.colorClass;
    }
    return getDefaultCategoryColor(categoryId);
  };

  const formatComplaintStatus = (statusId: string): string => {
    if (config?.complaintStatuses) {
      const s = config.complaintStatuses.find((x) => x.id === statusId);
      if (s) return s.label;
    }
    return getDefaultStatusLabel(statusId);
  };

  const getStatusColor = (statusId: string): string => {
    if (config?.complaintStatuses) {
      const s = config.complaintStatuses.find((x) => x.id === statusId);
      if (s) return s.colorClass;
    }
    return getDefaultStatusColor(statusId);
  };

  const defaultCategories = [
    { id: 'POTHOLE', label: 'Pothole', colorClass: 'bg-red-100 text-red-800' },
    { id: 'ROAD_INSTABILITY', label: 'Road Instability', colorClass: 'bg-orange-100 text-orange-800' },
    { id: 'STREETLIGHT_DAMAGE', label: 'Streetlight Damage', colorClass: 'bg-yellow-100 text-yellow-800' },
    { id: 'TREE_DAMAGE', label: 'Tree Damage', colorClass: 'bg-green-100 text-green-800' },
    { id: 'OTHER', label: 'Other', colorClass: 'bg-gray-100 text-gray-800' },
  ];

  return {
    config,
    isLoading: isLoading,
    formatCategory,
    getCategoryColor,
    formatComplaintStatus,
    getStatusColor,
    categories: config?.categories?.length ? config.categories : defaultCategories,
    complaintStatuses: config?.complaintStatuses ?? [],
  };
}
