'use client';

import { useNotifications } from '@/contexts/NotificationContext';

export interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Hook for easy notification management
export function useNotificationService() {
  const { addNotification } = useNotifications();

  const notify = (data: NotificationData) => {
    addNotification(data);
  };

  const notifySuccess = (title: string, message: string, action?: NotificationData['action']) => {
    notify({
      type: 'success',
      title,
      message,
      action,
    });
  };

  const notifyError = (title: string, message: string, action?: NotificationData['action']) => {
    notify({
      type: 'error',
      title,
      message,
      persistent: true, // Errors should persist until manually dismissed
      action,
    });
  };

  const notifyWarning = (title: string, message: string, action?: NotificationData['action']) => {
    notify({
      type: 'warning',
      title,
      message,
      action,
    });
  };

  const notifyInfo = (title: string, message: string, action?: NotificationData['action']) => {
    notify({
      type: 'info',
      title,
      message,
      action,
    });
  };

  // Predefined notification templates
  const notifyComplaintCreated = (complaintId: string) => {
    notifySuccess(
      'Complaint Created',
      `New complaint #${complaintId} has been successfully created.`,
      {
        label: 'View Details',
        onClick: () => {
          // Navigate to complaint details
          window.location.href = `/complaints?id=${complaintId}`;
        },
      }
    );
  };

  const notifyWorkOrderAssigned = (workOrderId: string, workerName: string) => {
    notifyInfo(
      'Work Order Assigned',
      `Work order #${workOrderId} has been assigned to ${workerName}.`,
      {
        label: 'View Work Order',
        onClick: () => {
          window.location.href = `/work-orders?id=${workOrderId}`;
        },
      }
    );
  };

  const notifyWorkOrderCompleted = (workOrderId: string) => {
    notifySuccess(
      'Work Order Completed',
      `Work order #${workOrderId} has been completed successfully.`,
      {
        label: 'View Details',
        onClick: () => {
          window.location.href = `/work-orders?id=${workOrderId}`;
        },
      }
    );
  };

  const notifyUserStatusChanged = (userName: string, isActive: boolean) => {
    notifyInfo(
      'User Status Updated',
      `${userName} has been ${isActive ? 'activated' : 'deactivated'}.`,
    );
  };

  const notifySystemError = (error: string) => {
    notifyError(
      'System Error',
      `An error occurred: ${error}`,
      {
        label: 'Report Issue',
        onClick: () => {
          // Could open a support form or email
          window.open('mailto:support@margwatch.com?subject=System Error Report');
        },
      }
    );
  };

  const notifyDataExported = (type: string) => {
    notifySuccess(
      'Export Complete',
      `${type} data has been exported successfully.`,
    );
  };

  const notifySettingsSaved = () => {
    notifySuccess(
      'Settings Saved',
      'Your settings have been saved successfully.',
    );
  };

  return {
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyComplaintCreated,
    notifyWorkOrderAssigned,
    notifyWorkOrderCompleted,
    notifyUserStatusChanged,
    notifySystemError,
    notifyDataExported,
    notifySettingsSaved,
  };
}



