/**
 * Notification type enumeration
 * Defines the different types of notifications in the system
 */
export enum NotificationType {
  COMPLAINT_STATUS = 'complaint_status',
  WORK_UPDATE = 'work_update',
  GENERAL = 'general',
  TEST = 'test'
}

export type NotificationTypeType = keyof typeof NotificationType;
