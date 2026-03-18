/**
 * Central UI text and display config for categories, statuses, etc.
 * Served via GET /api/config so admin and mobile can avoid hardcoding labels.
 */
import { IssueCategory } from '@margwatch/shared-types';

export interface CategoryDisplay {
  id: string;
  label: string;
  colorClass: string;
}

export interface StatusDisplay {
  id: string;
  label: string;
  colorClass: string;
}

export interface ConfigTexts {
  categories: CategoryDisplay[];
  complaintStatuses: StatusDisplay[];
  workOrderStatuses: StatusDisplay[];
  userRoles: Record<string, string>;
  priorities: Record<number, string>;
}

const categories: CategoryDisplay[] = [
  { id: IssueCategory.POTHOLE, label: 'Pothole', colorClass: 'bg-red-100 text-red-800' },
  { id: IssueCategory.ROAD_INSTABILITY, label: 'Road Instability', colorClass: 'bg-orange-100 text-orange-800' },
  { id: IssueCategory.STREETLIGHT_DAMAGE, label: 'Streetlight Damage', colorClass: 'bg-yellow-100 text-yellow-800' },
  { id: IssueCategory.TREE_DAMAGE, label: 'Tree Damage', colorClass: 'bg-green-100 text-green-800' },
  { id: IssueCategory.OTHER, label: 'Other', colorClass: 'bg-gray-100 text-gray-800' },
];

const complaintStatuses: StatusDisplay[] = [
  { id: 'REGISTERED', label: 'Registered', colorClass: 'bg-yellow-100 text-yellow-800' },
  { id: 'APPROVED', label: 'Approved', colorClass: 'bg-blue-100 text-blue-800' },
  { id: 'PROCESSING', label: 'Processing', colorClass: 'bg-orange-100 text-orange-800' },
  { id: 'COMPLETED', label: 'Completed', colorClass: 'bg-green-100 text-green-800' },
  { id: 'REJECTED', label: 'Rejected', colorClass: 'bg-red-100 text-red-800' },
];

const workOrderStatuses: StatusDisplay[] = [
  { id: 'PENDING', label: 'Pending', colorClass: 'bg-gray-100 text-gray-800' },
  { id: 'IN_PROGRESS', label: 'In Progress', colorClass: 'bg-blue-100 text-blue-800' },
  { id: 'COMPLETED', label: 'Completed', colorClass: 'bg-green-100 text-green-800' },
];

const userRoles: Record<string, string> = {
  USER: 'User',
  ADMIN: 'Admin',
  WORKER: 'Worker',
};

const priorities: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

export const configTexts: ConfigTexts = {
  categories,
  complaintStatuses,
  workOrderStatuses,
  userRoles,
  priorities,
};

export function getCategoryLabel(categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function getCategoryColorClass(categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.colorClass ?? 'bg-gray-100 text-gray-800';
}

export function getComplaintStatusLabel(statusId: string): string {
  return complaintStatuses.find((s) => s.id === statusId)?.label ?? statusId;
}

export function getComplaintStatusColorClass(statusId: string): string {
  return complaintStatuses.find((s) => s.id === statusId)?.colorClass ?? 'bg-gray-100 text-gray-800';
}
