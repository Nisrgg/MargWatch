/**
 * FCM (Firebase Cloud Messaging) service.
 * Obtains FCM token and registers it with the backend via POST /api/fcm/token.
 * Call registerFcmTokenIfNeeded() after login and on app start when user is authenticated.
 */
import messaging from '@react-native-firebase/messaging';

export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token || null;
  } catch (e) {
    console.warn('FCM getToken failed:', e);
    return null;
  }
}

/**
 * Call after login: request permission (if needed), get token, then call onToken with the token
 * so the caller can POST it to the backend.
 */
export async function registerFcmTokenIfNeeded(
  onToken: (token: string) => Promise<void>
): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;
  const token = await getFCMToken();
  if (token) await onToken(token);
}
