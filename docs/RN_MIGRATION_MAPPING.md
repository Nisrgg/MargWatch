# React Native Migration — Android → RN Mapping

This document maps the MargWatch Android (Kotlin) app to the React Native implementation.

**Scope**: Android-only React Native app at `apps/mobile-rn`. Backend API, database, and ML services are unchanged.

---

## Phase 1 — Component Mapping

| Android Component | React Native Equivalent | Location / Notes |
|-------------------|-------------------------|------------------|
| **Screens** | | |
| LoginScreen.kt | LoginScreen.tsx | src/screens/LoginScreen.tsx |
| RegistrationScreen.kt | RegisterScreen.tsx | src/screens/RegisterScreen.tsx |
| MainScreen.kt | MainScreen.tsx | src/screens/MainScreen.tsx |
| ComplaintSubmissionScreen.kt | ComplaintSubmissionScreen.tsx | src/screens/ComplaintSubmissionScreen.tsx |
| ComplaintsListScreen.kt | ComplaintsListScreen.tsx | src/screens/ComplaintsListScreen.tsx |
| ComplaintDetailScreen.kt | ComplaintDetailScreen.tsx | src/screens/ComplaintDetailScreen.tsx |
| HeatMapScreen.kt | HeatMapScreen.tsx | src/screens/HeatMapScreen.tsx |
| ProfileScreen.kt | ProfileScreen.tsx | src/screens/ProfileScreen.tsx |
| WorkerDashboardScreen.kt | WorkerDashboardScreen.tsx | src/screens/WorkerDashboardScreen.tsx |
| NotificationsScreen.kt | NotificationsScreen.tsx | src/screens/NotificationsScreen.tsx |
| **ViewModels** | | |
| AuthViewModel | useAuth (AuthContext) | src/store/AuthContext.tsx, src/hooks/useAuth.ts |
| ComplaintViewModel | useComplaints, useSubmitComplaint, useComplaintDetail | src/hooks/useComplaints.ts, useSubmitComplaint.ts |
| WorkOrderViewModel | useWorkOrders | src/hooks/useWorkOrders.ts |
| NotificationViewModel | useNotifications | src/hooks/useNotifications.ts |
| HeatMapViewModel | useHeatMapData (useComplaints) | src/hooks/useComplaints.ts |
| **Repositories** | | |
| MargWatchRepository | API modules | src/api/authApi.ts, complaintsApi.ts, workOrdersApi.ts, notificationsApi.ts, fcmApi.ts |
| **Network** | | |
| MargWatchApiService (Retrofit) | apiClient (Axios) + *Api.ts | src/api/apiClient.ts, src/api/*.ts |
| ApiClient.kt (OkHttp) | apiClient interceptors | src/api/apiClient.ts |
| **State** | | |
| StateFlow / collectAsState | React Query + useState | @tanstack/react-query, useState |
| **Navigation** | | |
| NavHost (Compose) | React Navigation | RootNavigator, AuthNavigator, MainNavigator |
| Routes (login, main, complaint_submission, …) | Stack.Screen names | Main, ComplaintSubmission, ComplaintsList, etc. |
| **Local storage** | | |
| TokenManager (SharedPreferences) | AsyncStorage in AuthContext | src/store/AuthContext.tsx |
| OfflineComplaintManager | (Optional) AsyncStorage queue | Can be added in useSubmitComplaint |
| **Image** | | |
| CameraUtils (CameraX) | react-native-image-picker (camera + gallery) | launchCamera / launchImageLibrary |
| ImageUtils.compressImage | @bam.tech/react-native-image-resizer | src/utils/compressImage.ts |
| **Location** | | |
| FusedLocationProvider / Geocoder | react-native-geolocation-service | src/utils/geolocation.ts |
| GeocoderUtils (reverse geocode) | Backend does reverse geocode; optional RN geocoder | Send lat/lon; backend returns address |
| **FCM** | | |
| FirebaseNotificationManager | @react-native-firebase/messaging | src/services/fcmService.ts |
| GlobalNotificationService | FcmRegistration + AuthContext.registerFcmToken | App.tsx, AuthContext |
| **WebSocket** | | |
| WebSocketNotificationService | useWebSocket | src/hooks/useWebSocket.ts |
| **Config** | | |
| NetworkConfig.kt | apiConfig.ts | src/config/apiConfig.ts |
| **Types** | | |
| SharedTypes.kt, JsonAdapters.kt | @margwatch/shared-types | packages/shared-types |

---

## API Endpoints (unchanged)

| Method | Path | Android | RN |
|--------|------|---------|-----|
| POST | /api/auth/register | MargWatchApiService.registerUser | authApi.register |
| POST | /api/auth/login | loginUser | authApi.login |
| GET | /api/auth/profile | getUserProfile | authApi.getProfile |
| PUT | /api/auth/profile | updateUserProfile | authApi.updateProfile |
| POST | /api/auth/change-password | changePassword | authApi.changePassword |
| POST | /api/complaints/submit | submitComplaint (Multipart) | complaintsApi.submit (FormData) |
| GET | /api/complaints/my-complaints | getUserComplaints | complaintsApi.getMyComplaints |
| GET | /api/complaints/:id | getComplaintById | complaintsApi.getById |
| GET | /api/complaints/heatmap | getHeatMapData | complaintsApi.getHeatMapData |
| GET | /api/work-orders/my-orders | getWorkerOrders | workOrdersApi.getMyOrders |
| GET | /api/work-orders/:id/details | getWorkOrderById | workOrdersApi.getDetails |
| PUT | /api/work-orders/:id/status | updateWorkOrderStatus | workOrdersApi.updateStatus |
| PUT | /api/work-orders/:id/complete | completeWorkOrder | workOrdersApi.complete |
| GET | /api/notifications | getNotifications | notificationsApi.getList |
| GET | /api/notifications/count | getNotificationCount | notificationsApi.getCount |
| PUT | /api/notifications/:id/read | markNotificationAsRead | notificationsApi.markAsRead |
| PUT | /api/notifications/mark-all-read | markAllNotificationsAsRead | notificationsApi.markAllAsRead |
| POST | /api/fcm/token | updateFCMToken | fcmApi.registerToken |

---

## Navigation Routes

| Android route | RN stack + screen |
|---------------|--------------------|
| login | AuthNavigator → Login |
| register | AuthNavigator → Register |
| main | MainNavigator → Main |
| complaint_submission | Main → ComplaintSubmission |
| complaints_list | Main → ComplaintsList |
| complaint_detail (id) | Main → ComplaintDetail (params: complaintId) |
| heatmap | Main → HeatMap |
| profile | Main → Profile |
| work_orders | Main → WorkerDashboard |
| notifications | Main → Notifications |

---

## Image Flow (Complaint Submit)

1. **Android**: CameraUtils.takePhoto / ImageSelectionDialog → ImageUtils.compressImage → Repository.submitComplaint (MultipartBody.Part).
2. **RN**: react-native-image-picker (launchCamera / launchImageLibrary) → compressImage (react-native-image-resizer) → FormData (images[] + latitude, longitude, address) → complaintsApi.submit.

---

## WebSocket

- **URL**: `ws://<API_HOST>/ws/notifications?token=<JWT>`
- **Events**: complaint_created, complaint_update, work_order_update.
- **RN**: useWebSocket in App or provider; onMessage → queryClient.invalidateQueries for complaints, workOrders, notifications.

---

## FCM

- **Android**: FirebaseNotificationManager.getFCMToken, GlobalNotificationService.initialize, POST /api/fcm/token.
- **RN**: getFCMToken(), registerFcmTokenIfNeeded → AuthContext.registerFcmToken → fcmApi.registerToken. Foreground/background/tap handled via @react-native-firebase/messaging in `App.tsx` (FcmHandlers: onMessage, onNotificationOpenedApp, getInitialNotification). Cache invalidation on notification events.

---

## Implemented Features (Post-Migration)

- **Auth**: Login, Register, JWT in AsyncStorage, token attached via apiClient interceptor.
- **Complaint submission**: Camera + gallery (react-native-image-picker), compress (react-native-image-resizer), location (react-native-geolocation-service + permission), FormData upload to POST /api/complaints/submit.
- **Complaints list & detail**: useComplaintsList, useComplaintDetail, ComplaintCard, ComplaintDetailScreen.
- **Heat map**: useHeatMapData, react-native-maps with markers from GET /api/complaints/heatmap.
- **Worker dashboard**: useWorkOrdersList, WorkOrderCard, WorkOrderDetailScreen with update status and complete (FormData).
- **Notifications**: useNotificationsList, mark read, mark all read.
- **Profile**: View/edit profile (authApi.updateProfile).
- **WebSocket**: useWebSocket in App; onMessage invalidates complaints, workOrders, notifications caches.
- **FCM**: Foreground handler + notification opened app + getInitialNotification; cache invalidation.
- **Theme**: Material-style colors, typography, spacing in `src/theme/`. Reusable ScreenHeader, ComplaintCard, WorkOrderCard, ImagePreview, Button, Input.
