import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'active':
      return 'bg-success-100 text-success-800';
    case 'pending':
    case 'registered':
    case 'approved':
      return 'bg-warning-100 text-warning-800';
    case 'rejected':
    case 'inactive':
      return 'bg-danger-100 text-danger-800';
    case 'processing':
      return 'bg-primary-100 text-primary-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'pothole':
      return 'bg-orange-100 text-orange-800';
    case 'road_instability':
      return 'bg-red-100 text-red-800';
    case 'streetlight_damage':
      return 'bg-yellow-100 text-yellow-800';
    case 'tree_damage':
      return 'bg-green-100 text-green-800';
    case 'other':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1:
      return 'bg-green-100 text-green-800';
    case 2:
      return 'bg-yellow-100 text-yellow-800';
    case 3:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function formatComplaintStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
}

export function formatWorkOrderStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
}

export function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase().replace('_', ' ');
}

export function formatPriority(priority: number): string {
  switch (priority) {
    case 1:
      return 'Low';
    case 2:
      return 'Medium';
    case 3:
      return 'High';
    default:
      return 'Unknown';
  }
}

export function formatUserRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

