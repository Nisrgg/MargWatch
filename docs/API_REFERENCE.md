# MargWatch API Reference

## Base URL and Auth

- **Base**: `http://<host>:5000` (e.g. Docker: api service on 5000; nginx may proxy).
- **API prefix**: `/api` for auth, complaints, work-orders, admin, admin-approval, notifications. FCM token: `POST /api/fcm/token`. Root: `GET /`, `GET /health`, `GET /check-fcm/:email`, `POST /test-fcm`.
- **Auth**: JWT in header: `Authorization: Bearer <token>`. Obtained via `POST /api/auth/login`.

**Note**: The app mounts routes for auth, complaints, work-orders, admin, admin-approval, notifications. The root endpoint list mentions `ml: '/api/ml'`, but **ML routes are not mounted** in `app.ts` (no `app.use('/api/ml', mlRoutes)`). ML proxy endpoints exist in `src/routes/ml.ts` (health, model info, test-prediction) and would need to be mounted if the admin or clients should call ML through the API. The backend itself calls the ML service directly by HTTP (see SYSTEM_ARCHITECTURE.md).

---

## API Endpoint Inventory

| Method | Route | Purpose | Auth | Used By |
|--------|--------|---------|------|---------|
| POST | /api/auth/register | Register user | No | Mobile (RegistrationScreen) |
| POST | /api/auth/login | Login | No | Mobile (LoginScreen), Admin (login) |
| POST | /api/auth/test-notification | Send test FCM (body: email, title, message) | No | Testing |
| GET | /api/auth/profile | Get current user profile | Yes | Mobile, Admin |
| PUT | /api/auth/profile | Update profile | Yes | Mobile, Admin |
| PUT | /api/auth/change-password | Change password | Yes | Mobile, Admin |
| POST | /api/auth/logout | Logout (client discards token) | Yes | Mobile, Admin |
| GET | /api/complaints/heatmap | Heat map data (query: category, dateFrom, dateTo) | No | Mobile (HeatMapScreen) |
| POST | /api/complaints/submit | Submit complaint (multipart: images, latitude, longitude; address optional) | Yes (User) | Mobile (ComplaintSubmissionScreen) |
| GET | /api/complaints/my-complaints | List current user's complaints (query: page, limit, status, category) | Yes (User) | Mobile (ComplaintsListScreen) |
| GET | /api/complaints/:id | Get complaint by ID (ownership enforced for non-admin) | Yes | Mobile (ComplaintDetail), Admin |
| GET | /api/complaints | List all complaints (query: page, limit, status, category, userId, workerId) | Yes (Admin) | Admin |
| PUT | /api/complaints/:id/status | Update complaint status (body: status, description) | Yes (Admin) | Admin |
| POST | /api/work-orders | Create work order (body: complaintId, workerId, priority) | Yes (Admin) | Admin |
| GET | /api/work-orders/all | List all work orders | Yes (Admin) | Admin |
| GET | /api/work-orders/pending-approvals | Pending admin approvals | Yes (Admin) | Admin |
| POST | /api/work-orders/approve | Approve work order (body) | Yes (Admin) | Admin |
| GET | /api/work-orders/my-orders | List work orders for current worker (query: page, limit, status) | Yes (Worker) | Mobile (WorkerDashboardScreen) |
| GET | /api/work-orders/:id/details | Work order details | Yes (Worker or Admin) | Mobile, Admin |
| PUT | /api/work-orders/:id/status | Update work order status (multipart optional: images; body: status, description, progress) | Yes (Worker) | Mobile (WorkerDashboardScreen) |
| PUT | /api/work-orders/:id/complete | Complete work order (multipart optional: images; body: description, cost) | Yes (Worker) | Mobile (WorkerDashboardScreen) |
| GET | /api/admin/dashboard | Dashboard stats | Yes (Admin) | Admin |
| GET | /api/admin/analytics | Complaint analytics | Yes (Admin) | Admin |
| GET | /api/admin/worker-performance | Worker performance | Yes (Admin) | Admin |
| GET | /api/admin/users | List users | Yes (Admin) | Admin |
| POST | /api/admin/workers | Create worker | Yes (Admin) | Admin |
| PUT | /api/admin/users/:id/status | Update user status | Yes (Admin) | Admin |
| GET | /api/admin-approval/pending-complaints | Pending complaints for approval | Yes (Admin) | Admin |
| GET | /api/admin-approval/available-workers | Available workers | Yes (Admin) | Admin |
| PUT | /api/admin-approval/complaints/:id/approve-reject | Approve/reject complaint | Yes (Admin) | Admin |
| PUT | /api/admin-approval/work-orders/:workOrderId/final-approve | Final approve work order | Yes (Admin) | Admin |
| GET | /api/notifications | User notifications (query: page, limit, unreadOnly) | Yes | Mobile (NotificationsScreen), Admin |
| GET | /api/notifications/count | Unread count | Yes | Mobile, Admin |
| PUT | /api/notifications/:notificationId/read | Mark as read | Yes | Mobile, Admin |
| PUT | /api/notifications/mark-all-read | Mark all read | Yes | Mobile, Admin |
| POST | /api/fcm/token | Register FCM token (body: fcmToken) | Yes | Mobile (after login) |
| GET | /check-fcm/:email | Check if user has FCM token (no auth) | No | Debug |
| POST | /test-fcm | Send test FCM (body: email, title?, message?) | No | Debug |
| GET | /health | Health check (DB, Cloudinary, ML) | No | DevOps, Admin |

---

## Complaints: Create Flow

1. Client: `POST /api/complaints/submit` with `multipart/form-data`: `images[]` (files), `latitude`, `longitude`, optional `address`.
2. API: `uploadMultipleImages` (multer, max 5, 10MB each) → `uploadToCloudinary` (CloudinaryService) → body gets `imageUrls[]`.
3. Coordinates validated (geolocationService); reverse geocode for address if not provided.
4. ML: `mlService.predictIssueCategory(imageUrls[0])` (backend downloads image from URL and POSTs to ML service); category/confidence stored; on failure uses `IssueCategory.OTHER`.
5. Title/description auto-generated (complaintGenerationService).
6. Duplicate check (same category, ~50m, 24h, different user); if duplicate → 409.
7. Prisma: create Complaint with imageUrl (JSON array), mlCategory, mlConfidence, etc.
8. Notifications: FCM to submitter and to all admins; FCM topic `complaint_created` for workers; WebSocket broadcast `complaint_created`.
9. Response: 201 with complaint (including parsed imageUrls).

---

## Image Upload Pipeline

- **Complaint submit**: Multer (memory) → CloudinaryService.uploadMultipleImages → URLs in req.body.imageUrls → stored in Complaint.imageUrl (JSON).
- **Work order status/complete**: Optional multipart via `conditionalUploadMultipleImages` + `uploadToCloudinary`; images stored as part of work order update or completion payload (see work order controller and Prisma schema for WorkOrderUpdate imageUrl).

---

## ML Classification Pipeline

- **Trigger**: Inside `complaintController.submitComplaint` after Cloudinary upload.
- **Flow**: Backend has `imageUrls` from Cloudinary. Calls `mlService.predictIssueCategory(imageUrls[0])`. mlService downloads image from URL, then POSTs to `config.mlModelUrl` (e.g. `http://ml-service:8000/predict`). Backend expects response with category, confidence, model_version, processing_time; maps category string to `IssueCategory` (e.g. pothole → POTHOLE). On any failure, uses fallback OTHER, 0.5.
- **Note**: Current ML service code (root `app.py` and `src/routes/ml_routes.py`) expects JSON with base64 `image`; backend sends FormData with file. This is an integration mismatch to resolve (either ML adds file upload or backend sends base64).

---

## Workers: Status and Completion

- **Update status**: `PUT /api/work-orders/:id/status` (Worker). Body/multipart: status, description?, progress?; optional images. Controller validates transition with `StateMachineValidator.validateWorkOrderTransition`, then updates WorkOrder and creates WorkOrderUpdate; FCM to complaint owner; WebSocket broadcast.
- **Complete**: `PUT /api/work-orders/:id/complete` (Worker). Body/multipart: description?, cost?; optional images. Validates transition to COMPLETED (or PENDING_REVIEW depending on flow); sets workerCompleted, completedAt; notifications and WebSocket.

---

## Notifications (Emitted Where)

- **Complaint submitted**: FCM to user and admins; FCM topic `complaint_created`; WebSocket broadcast `complaint_created`.
- **Work order created**: FCM to assigned worker and to complaint owner.
- **Work order status/complete**: FCM to complaint owner; WebSocket broadcast for dashboard refresh.
- **Admin approve/reject complaint**: FCM and/or in-app notification to user; WebSocket for admin dashboard.
- In-app notifications are stored in `Notification` table and returned by `GET /api/notifications`; FCM is push to device.

---

## Middleware and Validation

- **auth.ts**: `authenticateToken` (JWT, load user); `requireAdmin`, `requireWorker`, `requireUser`, `requireWorkerOrAdmin`.
- **upload.ts**: `uploadMultipleImages` (multer), `uploadToCloudinary`; `conditionalUploadMultipleImages` for optional multipart; `uploadSingleImage`, `uploadSingleToCloudinary` for single image.
- **errorHandler**: `handleValidationErrors`, `notFoundHandler`, `errorHandler`.
- **Validation**: express-validator in controllers (e.g. submitComplaintValidation, updateStatusValidation, createWorkOrderValidation, etc.). State machine: `StateMachineValidator` used in adminApprovalController and workOrderController.
