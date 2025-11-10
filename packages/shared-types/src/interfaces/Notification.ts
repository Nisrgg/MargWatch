import { NotificationType } from '../enums';
import { User } from './User';
import { Complaint } from './Complaint';

/**
 * Notification interface
 * Represents a notification in the MargWatch system
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date | string;
}

/**
 * Notification creation request interface
 */
export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}

/**
 * Notification filters interface
 */
export interface NotificationFilters {
  page?: number;
  limit?: number;
  unread?: boolean;
  type?: NotificationType;
}
