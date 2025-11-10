import { ComplaintStatus, IssueCategory } from '../enums';
import { User } from './User';
import { WorkOrder } from './WorkOrder';

/**
 * Complaint interface
 * Represents a complaint in the MargWatch system
 */
export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: ComplaintStatus;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string; // JSON string of image URLs
  imageCount?: number;
  mlCategory?: IssueCategory;
  mlConfidence?: number;
  mlModelVersion?: string;
  mlProcessingTime?: number;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: string;
  approvedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  workOrders?: WorkOrder[];
  updates?: ComplaintUpdate[];
}

/**
 * Complaint creation request interface
 */
export interface CreateComplaintRequest {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  category?: IssueCategory;
}

/**
 * Complaint update request interface
 */
export interface UpdateComplaintRequest {
  status?: ComplaintStatus;
  description?: string;
  title?: string;
}

/**
 * Complaint filters interface
 */
export interface ComplaintFilters {
  page?: number;
  limit?: number;
  status?: ComplaintStatus | string;
  category?: IssueCategory | string;
  userId?: string;
  workerId?: string;
  search?: string;
}

/**
 * Complaint update interface
 */
export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  status: ComplaintStatus | string;
  description?: string;
  imageUrl?: string;
  createdAt: Date | string;
}

/**
 * Heat map data interface
 */
export interface HeatMapData {
  latitude: number;
  longitude: number;
  count: number;
  category: IssueCategory;
}
