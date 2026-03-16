# MargWatch Android Mobile App Architecture

## 1. Architecture Pattern

- **UI**: Jetpack Compose (Composable screens).
- **State**: ViewModels expose `StateFlow<UiState>`; UI collects with `collectAsState()`.
- **Data**: Repository pattern – `MargWatchRepository` wraps `MargWatchApiService` (Retrofit); `BaseRepository.safeApiCall` for error handling.
- **Auth**: Token stored in `TokenManager` (likely SharedPreferences); `AuthViewModel` drives login/register and exposes `authUiState`.
- **Navigation**: Single `NavHost` in `MainActivity` / `MargWatchApp` with composable routes (e.g. `login`, `register`, `main`, `complaint_submission`, `complaints_list`, `heatmap`, `profile`, `work_orders`, `notifications`).

This aligns with **MVVM** plus **Repository** layer; no formal Clean Architecture modules, but clear separation: UI → ViewModel → Repository → API.

---

## 2. Key Modules

| Layer | Location | Purpose |
|-------|----------|---------|
| **UI** | `ui/screens/*.kt`, `ui/components/*.kt`, `ui/theme/*.kt` | Screens and reusable components (buttons, cards, inputs, status, error/success snackbars). |
| **ViewModels** | `ui/screens/*ViewModel.kt` | Auth, Complaint, WorkOrder, Notification, HeatMap. Hold state (StateFlow), call repository, handle validation. |
| **Repositories** | `data/repository/MargWatchRepository.kt` | Single repository; methods map to API (auth, complaints, work orders, notifications, FCM token). |
| **Network** | `data/network/ApiClient.kt`, `MargWatchApiService.kt` | Retrofit + OkHttp; Gson with custom deserializers for enums; base URL from `NetworkConfig.BASE_URL`. |
| **Data models** | `data/model/*.kt`, `shared/types/SharedTypes.kt` | Kotlin data classes and enums mirroring API (User, Complaint, WorkOrder, Notification, request/response DTOs). |
| **Local** | `data/local/TokenManager.kt`, `OfflineComplaintManager.kt` | Token persistence; offline complaint queue (save, mark uploaded, retry). |
| **Services** | `services/FirebaseNotificationManager.kt`, `WebSocketNotificationService.kt`, `NotificationIntegrationService.kt`, `GlobalNotificationService.kt` | FCM token, topics; WebSocket/SSE for real-time; app-level notification wiring. |
| **Utils** | `utils/ImageUtils.kt`, `GeocoderUtils.kt`, `StateMachineValidator.kt`, `FormatUtils.kt`, `CameraUtils.kt` | Image compression, reverse geocoding, state transition validation, formatting, camera. |
| **Config** | `config/NetworkConfig.kt` | Base URL, WebSocket/SSE URLs, allowed domains (hardcoded IPs for dev). |

---

## 3. Screen Inventory

| Screen | File | ViewModel | API Used | Features |
|--------|------|-----------|----------|----------|
| Login | `LoginScreen.kt` | `AuthViewModel` | POST login, (FCM register) | Email/password, navigate to register/main |
| Register | `RegistrationScreen.kt` | `AuthViewModel` | POST register | Registration form |
| Main (home) | `MainScreen.kt` | `AuthViewModel` | - | Nav to complaint submission, complaints list, map, profile, work orders, notifications; logout |
| Complaint submission | `ComplaintSubmissionScreen.kt` | `ComplaintViewModel` | POST complaints/submit (multipart) | Camera/gallery, image compression, location, submit; validation (coords, images) |
| Complaints list | `ComplaintsListScreen.kt` | `ComplaintViewModel` | GET my-complaints | List user complaints |
| Complaint detail | `ComplaintDetailScreen.kt` | (state from list or nav arg) | GET complaints/:id | Single complaint with work orders |
| Heat map | `HeatMapScreen.kt` | `HeatMapViewModel` | GET complaints/heatmap | Map with heatmap data |
| Profile | `ProfileScreen.kt` | `AuthViewModel` | GET/PUT profile, change-password | Profile edit, nav to submission/list/map/work orders |
| Work orders (worker) | `WorkerDashboardScreen.kt` | `WorkOrderViewModel` | GET my-orders, GET :id/details, PUT :id/status, PUT :id/complete | List orders, update status, complete with photos/description/cost |
| Notifications | `NotificationsScreen.kt` | `NotificationViewModel` | GET notifications, count, mark read | List, mark read |
| Settings | `SettingsScreen.kt` | - | - | App settings |
| Map (simple) | `SimpleMapScreen.kt` | - | - | Map view |

Additional routes: `work_status`, `work_completion` redirect to `WorkerDashboardScreen`.

---

## 4. Navigation Graph

- **Start**: `login` if not authenticated, else `main`.
- **Auth**: `login` ↔ `register`; on success → `main` (clear back stack).
- **Main**: `main` → `complaint_submission` | `complaints_list` | `heatmap` | `profile` | `work_orders` | `notifications`; `profile` can navigate to submission, list, heatmap, work orders.
- **Work**: `work_orders` (same as `work_status`, `work_completion`) → `WorkerDashboardScreen`.
- **Back**: All secondary screens pop to `main` or previous.

---

## 5. StateFlow Usage

- ViewModels hold `MutableStateFlow<XxxUiState>` and expose `StateFlow` via `asStateFlow()`.
- UI uses `collectAsState()` on the ViewModel’s state and reacts to loading/success/error.
- Examples: `AuthViewModel.uiState`, `ComplaintViewModel.uiState`, `WorkOrderViewModel`, `NotificationViewModel`, `HeatMapViewModel`.

---

## 6. Offline Persistence

- **OfflineComplaintManager**: Persists `OfflineComplaint` list to file (`offline_complaints.dat`); `Flow<List<OfflineComplaint>>`; methods to save, mark uploaded, increment retry, remove. Used when submission fails or when offline (logic in ViewModel/Repository as applicable).
- **TokenManager**: Persists auth token for session restore; `AuthViewModel` checks on launch and can auto-login.

---

## 7. Image Handling

- **ImageUtils**: `compressImage(context, uri, quality, maxWidth, maxHeight)` – decode from URI, scale to fit max dimensions, JPEG compress to cache file. Used before upload.
- **Validation**: `isValidImageSize(file, maxSizeBytes)`, `getFileSizeString(bytes)`.
- **Camera**: `CameraUtils` (and possibly system picker / `ImageSelectionDialog`) for capture or gallery; result URI passed to compression then to repository as `List<File>`.

---

## 8. Location

- **GeocoderUtils**: Reverse geocoding (coordinates → address). Used to show or send address with complaint.
- **Complaint submission**: ViewModel validates coordinates (bounds, non-zero); optional India bounds check (documented as “Pan India” – validation may be relaxed). Location obtained from system (FusedLocationProvider or similar) in screen/ViewModel.

---

## 9. FCM Implementation

- **FirebaseNotificationManager**: `getFCMToken()`, `subscribeToTopic` / `unsubscribeFromTopic`, `subscribeToUserTopics(userId, userRole)`.
- **GlobalNotificationService**: Initialized when user is authenticated; registers FCM token with API (`POST /api/fcm/token`); sets up notification handling.
- **NotificationIntegrationService**: Coordinates between FCM and app (e.g. foreground/background handling).
- **NotificationViewModel**: Fetches in-app notifications from API; may react to FCM data for badge/refresh.

---

## 10. Data Flow (Complaint Submit)

1. **User** selects/captures images and location in **ComplaintSubmissionScreen**.
2. **ComplaintViewModel** validates coordinates and image files (size, existence).
3. Images compressed via **ImageUtils.compressImage** (coroutine/IO).
4. ViewModel calls **MargWatchRepository.submitComplaint(token, imageFiles, lat, lon, address)**.
5. **Repository** builds multipart (images + latitude, longitude, address), calls **MargWatchApiService.submitComplaint** with Bearer token.
6. **API** (multer → Cloudinary → ML → Prisma) returns complaint; Repository maps to `Result<Complaint>`.
7. ViewModel updates **StateFlow** (success/error); UI shows result and optionally navigates or clears form.

---

## 11. Shared Types (Kotlin)

- **SharedTypes.kt**: Enums (UserRole, ComplaintStatus, IssueCategory, WorkOrderStatus, WorkOrderApprovalStatus, NotificationType) and data classes (User, Complaint, WorkOrder, Notification, request/response DTOs). Must stay in sync with backend and `@margwatch/shared-types`.
- **JsonAdapters.kt**: Gson type adapters for enums (e.g. `UserRoleDeserializer`, `ComplaintStatusDeserializer`) so API JSON parses correctly. Used by **ApiClient** Gson configuration.
