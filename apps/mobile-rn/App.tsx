import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import messaging from '@react-native-firebase/messaging';
import { AuthProvider, useAuth } from './src/store/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { registerFcmTokenIfNeeded } from './src/services/fcmService';
import { useWebSocket } from './src/hooks/useWebSocket';
import { complaintsKeys } from './src/hooks/useComplaints';
import { workOrdersKeys } from './src/hooks/useWorkOrders';
import { notificationsKeys } from './src/hooks/useNotifications';
import { SnackbarProvider } from './src/components/feedback/SnackbarProvider';
import { logger } from './src/utils/logger';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

function FcmRegistration() {
  const { isAuthenticated, registerFcmToken } = useAuth();
  useEffect(() => {
    if (isAuthenticated) {
      logger.debug('FCM registration starting for authenticated user');
      registerFcmTokenIfNeeded(registerFcmToken).catch(() => {});
    }
  }, [isAuthenticated, registerFcmToken]);
  return null;
}

/** Invalidate caches when WebSocket events arrive (complaint_created, complaint_update, work_order_update). */
function WebSocketInvalidation() {
  const { token, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  useWebSocket({
    token: isAuthenticated ? token : null,
    enabled: isAuthenticated,
    onMessage: () => {
      logger.debug('WebSocket message received, invalidating caches', {
        tokenPresent: !!token,
      });
      qc.invalidateQueries({ queryKey: complaintsKeys.all });
      qc.invalidateQueries({ queryKey: workOrdersKeys.all });
      qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
  return null;
}

/** FCM: foreground handler + background/tap via getInitialNotification and onNotificationOpenedApp. */
function FcmHandlers() {
  const qc = useQueryClient();
  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      // Refresh notifications (and optionally complaints/work orders) when a notification is received in foreground
      qc.invalidateQueries({ queryKey: notificationsKeys.all });
      qc.invalidateQueries({ queryKey: complaintsKeys.all });
      qc.invalidateQueries({ queryKey: workOrdersKeys.all });
    });
    return () => unsubscribeForeground();
  }, [qc]);

  useEffect(() => {
    messaging().onNotificationOpenedApp((remoteMessage) => {
      qc.invalidateQueries({ queryKey: notificationsKeys.all });
      qc.invalidateQueries({ queryKey: complaintsKeys.all });
      qc.invalidateQueries({ queryKey: workOrdersKeys.all });
    });
  }, [qc]);

  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          qc.invalidateQueries({ queryKey: notificationsKeys.all });
        }
      });
  }, [qc]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <SnackbarProvider>
            <WebSocketInvalidation />
            <FcmHandlers />
            <FcmRegistration />
            <RootNavigator />
          </SnackbarProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
