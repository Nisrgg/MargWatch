import { Complaint, WorkOrder, User } from '@/types';

export const formatUtils = {
  // Date formatting
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  formatRelativeTime(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return this.formatDate(date);
  },

  // Status formatting
  formatComplaintStatus(status: string): string {
    const statusMap: Record<string, string> = {
      REGISTERED: 'Registered',
      APPROVED: 'Approved',
      PROCESSING: 'Processing',
      COMPLETED: 'Completed',
      REJECTED: 'Rejected',
    };
    return statusMap[status] || status;
  },

  formatWorkOrderStatus(status: string): string {
    return this.formatComplaintStatus(status);
  },

  formatUserRole(role: string): string {
    const roleMap: Record<string, string> = {
      USER: 'User',
      ADMIN: 'Admin',
      WORKER: 'Worker',
    };
    return roleMap[role] || role;
  },

  // Category formatting
  formatCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      POTHOLE: 'Pothole',
      ROAD_INSTABILITY: 'Road Instability',
      STREETLIGHT_DAMAGE: 'Streetlight Damage',
      TREE_DAMAGE: 'Tree Damage',
      OTHER: 'Other',
    };
    return categoryMap[category] || category;
  },

  // Priority formatting
  formatPriority(priority: number): string {
    const priorityMap: Record<number, string> = {
      1: 'Low',
      2: 'Medium',
      3: 'High',
    };
    return priorityMap[priority] || 'Unknown';
  },

  // Status colors
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      REGISTERED: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  },

  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      POTHOLE: 'bg-red-100 text-red-800',
      ROAD_INSTABILITY: 'bg-orange-100 text-orange-800',
      STREETLIGHT_DAMAGE: 'bg-yellow-100 text-yellow-800',
      TREE_DAMAGE: 'bg-green-100 text-green-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  },

  getPriorityColor(priority: number): string {
    const colorMap: Record<number, string> = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-red-100 text-red-800',
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-800';
  },

  // Number formatting
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  },

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },

  // Text formatting
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Address formatting
  formatAddress(address?: string): string {
    if (!address) return 'No address provided';
    return address;
  },

  // Coordinates formatting
  formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  },

  // Progress formatting
  formatProgress(progress?: number): string {
    if (progress === undefined || progress === null) return 'N/A';
    return `${progress}%`;
  },

  // Duration formatting
  formatDuration(startDate: string | Date, endDate?: string | Date): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffInMs = end.getTime() - start.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Same day';
    if (diffInDays === 1) return '1 day';
    if (diffInDays < 7) return `${diffInDays} days`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks`;
    return `${Math.floor(diffInDays / 30)} months`;
  },
};

export default formatUtils;
