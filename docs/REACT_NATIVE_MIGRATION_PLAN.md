# React Native Migration Plan (Android → RN)

This document supports rewriting the MargWatch Android app in React Native while keeping the backend, ML service, and admin portal unchanged.

---

## 1. Shared Types System (for RN)

### Current state

- **Backend & Admin**: Use npm package `@margwatch/shared-types` (TypeScript enums and interfaces).
- **Android**: Kotlin copy in `shared/types/SharedTypes.kt` and `JsonAdapters.kt`; no npm dependency.

### For React Native

- **Use `@margwatch/shared-types` in the RN app** so one source of truth (enums, DTOs) is shared with API and admin. Add the package to the RN monorepo or workspace (e.g. `"@margwatch/shared-types": "file:../../packages/shared-types"`).
- **API responses**: Type all responses with shared interfaces (Complaint, WorkOrder, User, Notification, etc.) and enums (ComplaintStatus, WorkOrderStatus, IssueCategory, UserRole). This avoids drift and gives consistent validation/UI logic.
- **Sync**: Keep Prisma enums and `@margwatch/shared-types` in sync; document any RN-only extensions (e.g. extra fields for UI) in a separate types file.

---

## 2. External Integrations (Summary)

| Integration | How It’s Used | RN Consideration |
|-------------|----------------|------------------|
| **Cloudinary** | Backend only (API uploads after multer). Mobile only sends multipart to API. | No change; RN sends same multipart to API. |
| **Firebase Cloud Messaging** | Backend: Firebase Admin SDK; stores fcmToken in DB; sends push. Mobile: FCM SDK, get token, POST /api/fcm/token. | Use `@react-native-firebase/messaging` for token and foreground/background handling. |
| **NeonDB (PostgreSQL)** | Backend only (Prisma). | No change. |
| **Docker** | Runs API, ML, admin-portal, nginx, redis. | No change; RN app points to same API URL. |
| **WebSockets** | Backend: `/ws/notifications` (JWT in query). Admin: useWebSocket. Mobile: optional (WebSocketNotificationService). | RN: optional; use same URL and token. e.g. `ws://host/ws/notifications?token=<JWT>`. |
| **Google Maps / Geocoding** | Backend: reverse geocode (e.g. Google Maps API) for address. Mobile: GeocoderUtils (Android Geocoder or similar). | RN: use `react-native-maps` + geocoding (e.g. `@react-native-community/geolocation` + Google Geocoding API or a library that wraps it). |

---

## 3. Migration Risk Analysis

| Risk | Description | Mitigation |
|------|--------------|------------|
| **Camera APIs** | Android uses CameraX / system picker; RN needs a cross-platform camera lib. | Use `react-native-vision-camera` or `react-native-image-picker` for capture and gallery; align with backend’s multipart and size limits. |
| **Background tasks** | Android may use WorkManager for offline queue. RN has different background models. | Use a queue (e.g. in-memory + AsyncStorage or a library like redux-offline) for offline complaints; sync when online; avoid assuming Android-style background execution. |
| **Image compression** | Android uses Bitmap + FileOutputStream. | Use `react-native-image-resizer` or similar to compress before upload; match backend limits (e.g. 10MB, 5 images). |
| **FCM integration** | Android uses Firebase Messaging SDK and native channel. | Use `@react-native-firebase/messaging`; request permission; get token and POST to /api/fcm/token; handle foreground/background and notification tap. |
| **Location APIs** | Android uses FusedLocationProvider / Geocoder. | Use `react-native-geolocation` or `expo-location`; reverse geocode via API or a JS library (or keep backend-only geocoding). |
| **Offline persistence** | Android uses OfflineComplaintManager (file) and TokenManager. | Use AsyncStorage or MMKV for token and offline queue; design sync and conflict handling. |
| **State machine logic duplication** | Backend and Android both validate transitions. | Keep a single source of truth (backend); RN can reuse rules from `@margwatch/shared-types` and optionally a small TS helper that mirrors StateMachineValidator for UI (e.g. which buttons to show). |
| **Network configuration** | Android has NetworkConfig with hardcoded IPs. | RN: use env or config (e.g. .env) for API base URL and WebSocket URL; same CORS/security as today. |
| **Real-time (WebSocket)** | Optional on Android. | RN: same optional use; reconnect and token refresh logic similar to admin portal’s useWebSocket. |

---

## 4. What Must Be Rewritten

- **All Android UI**: Screens and components → React Native components (and/or a UI kit like React Native Paper / NativeBase).
- **Navigation**: Jetpack Compose NavHost → React Navigation (stack, tabs as needed).
- **State**: ViewModels + StateFlow → React state + hooks; consider React Query for server state (complaints, work orders, notifications) and Context or Zustand for auth/client state.
- **API layer**: Retrofit + OkHttp → fetch or axios; wrap in hooks or services that use `@margwatch/shared-types`.
- **Auth**: TokenManager → secure store (e.g. react-native-sensitive-info or Expo SecureStore) and auth context/hook.
- **FCM**: Replace Android FCM with `@react-native-firebase/messaging`; keep same API contract (POST /api/fcm/token).
- **Offline queue**: Redesign with AsyncStorage/MMKV and a sync strategy; no direct port of file-based OfflineComplaintManager.
- **Image capture and resize**: New implementation with chosen camera and resizer libs.
- **Location and geocoding**: New implementation with chosen geolocation and geocoding approach.
- **Shared types**: Stop maintaining Kotlin copy; consume `@margwatch/shared-types` in RN.

Backend, admin portal, ML service, and Prisma schema remain unchanged except for any intentional API evolution.

---

## 5. React Native Architecture (Equivalent Mapping)

| Android | React Native Equivalent |
|---------|--------------------------|
| ViewModel | Custom hooks (e.g. useComplaintSubmit, useAuth, useWorkOrders) that hold state and call API. |
| StateFlow / MutableStateFlow | useState / useReducer; for server data use React Query (useQuery, useMutation). |
| Jetpack Compose UI | React Native components (View, Text, Image, ScrollView, etc.) + UI library. |
| Navigation (NavHost, composable) | React Navigation (createNativeStackNavigator or stack + tabs). |
| MargWatchRepository | API service module (e.g. api/complaints, api/auth, api/workOrders) + React Query. |
| Data classes (Complaint, User, …) | TypeScript interfaces/enums from `@margwatch/shared-types`. |
| TokenManager | Secure storage + auth context (e.g. AuthProvider with token state and login/logout). |
| OkHttp/Retrofit | fetch or axios; base URL from config; interceptors for Bearer token. |
| Gson + JsonAdapters | JSON.parse + shared types; optional runtime validation (zod) if needed. |
| StateMachineValidator (Kotlin) | TS helper using shared enums (optional; backend remains authority). |
| ImageUtils.compressImage | react-native-image-resizer (or similar) in a utility. |
| GeocoderUtils | Geocoding API client or library (e.g. Google Geocoding or RN geocoding lib). |
| FCM (Firebase Messaging) | @react-native-firebase/messaging. |
| WebSocketNotificationService | useWebSocket-style hook (same URL and token as admin). |

---

## 6. Suggested RN Libraries

| Need | Library | Notes |
|------|---------|--------|
| **Navigation** | @react-navigation/native, @react-navigation/native-stack | Stack and optional bottom tabs. |
| **Server state** | @tanstack/react-query | Cache, refetch, mutations for complaints, work orders, notifications. |
| **Client state** | React Context or Zustand | Auth, offline queue flags. |
| **Camera / gallery** | react-native-vision-camera or react-native-image-picker | Capture and pick images. |
| **Image compression** | react-native-image-resizer | Resize/compress before upload. |
| **Location** | react-native-geolocation-service or expo-location | Coordinates for complaint. |
| **Geocoding** | Backend only, or Google Geocoding API / react-native-geocoding | Address from lat/lon. |
| **Push notifications** | @react-native-firebase/messaging | Token, permissions, handlers. |
| **Secure storage** | @react-native-async-storage/async-storage (token) or react-native-sensitive-info | JWT storage. |
| **HTTP** | axios or fetch | With interceptors for Authorization. |
| **Maps** | react-native-maps | Heat map and location picker. |
| **Forms / validation** | react-hook-form + zod (optional) | Align with shared types. |
| **UI** | React Native Paper or NativeBase or custom | Match existing UX. |

---

## 7. High-Level RN App Structure

```
apps/mobile-rn/
  src/
    api/           # axios/fetch + endpoints (auth, complaints, work-orders, notifications, fcm)
    components/    # reusable UI
    screens/      # one per screen (Login, Register, Main, ComplaintSubmit, ComplaintsList, …)
    hooks/         # useAuth, useComplaints, useWorkOrders, useNotifications, useWebSocket (optional)
    navigation/    # stack/tab config
    store/         # auth context or Zustand (optional)
    utils/         # compressImage, geocode, stateMachine (optional)
    types/         # re-export @margwatch/shared-types + RN-specific
  App.tsx
  package.json     # dependency on @margwatch/shared-types
```

Use the same API base URL and WebSocket URL as the current Android app (from env/config). Keep FCM token registration and notification handling aligned with the existing backend contract.

---

## 8. Checklist Before Migration

- [ ] Mount `/api/ml` in backend if admin or RN need to call ML via API (optional).
- [ ] Resolve ML service contract: either add file-upload `/predict` or switch backend to base64.
- [ ] Ensure Docker/entrypoint for ML service starts the Flask app (not only bash).
- [ ] Document API base URL and env vars for RN (dev/staging/prod).
- [ ] Confirm FCM project and config (google-services.json / GoogleService-Info.plist equivalent for RN).
- [ ] Add RN app to monorepo or link `@margwatch/shared-types` and pin version.

This plan, together with SYSTEM_ARCHITECTURE.md, MOBILE_ARCHITECTURE.md, API_REFERENCE.md, DATABASE_SCHEMA.md, and ML_SERVICE.md, gives a full basis for the React Native rewrite.
