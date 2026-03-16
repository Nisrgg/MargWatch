# MargWatch System Architecture

## 1. Repository Structure

```
MargWatch/
├── apps/
│   ├── admin-portal/          # Next.js 14 admin dashboard (React 18, TypeScript, Tailwind, shadcn/ui)
│   ├── api/                   # Node.js + Express + TypeScript backend server
│   └── mobile/                # Android Kotlin application (Jetpack Compose)
├── services/
│   ├── ml-service/            # Flask + PyTorch/ResNet18 classification service (Python)
│   └── notification-service/ # (present in tree; usage TBD)
├── packages/
│   ├── shared-types/          # @margwatch/shared-types – shared enums and interfaces (TypeScript)
│   ├── shared-config/         # Shared configuration
│   └── shared-utils/          # Shared utilities
├── infrastructure/
│   ├── docker/                # Docker Compose setup (api, ml-service, admin-portal, nginx, redis)
│   ├── k8s/                   # Kubernetes configs
│   ├── monitoring/            # Monitoring configs
│   ├── scripts/              # Deployment/utility scripts
│   ├── ssl/                   # SSL certificates
│   └── terraform/             # IaC
├── docs/                      # Documentation
└── smoke_dataset/             # ML dataset (train/valid/test)
```

### Purpose of Each Service

| Component | Purpose |
|-----------|---------|
| **apps/mobile** | Native Android app for citizens and workers: submit complaints (photo + GPS), view complaints, work orders, heat map, notifications. Uses Jetpack Compose, Retrofit, FCM, WebSocket/SSE. |
| **apps/admin-portal** | Web dashboard for admins: dashboard stats, complaint approval, work order assignment, analytics, user management. Real-time updates via WebSocket. |
| **apps/api** | Central backend: JWT auth, complaints CRUD, work orders, notifications, FCM token storage. Calls ML service for classification; uploads images to Cloudinary; broadcasts via WebSocket. |
| **services/ml-service** | Image classification: predicts road issue category (e.g. pothole, road_instability) from image. Flask app; currently mock or placeholder model; backend calls it via HTTP. |
| **packages/shared-types** | Single source of truth for enums (UserRole, ComplaintStatus, WorkOrderStatus, IssueCategory, etc.) and interfaces (User, Complaint, WorkOrder, Notification). Used by API and admin-portal; Android keeps a Kotlin copy. |

### How the Pieces Interact

- **Mobile** → **API**: REST over HTTPS (auth, complaints, work orders, notifications, FCM token). Base URL from `NetworkConfig.BASE_URL` (e.g. `http://<IP>:5000/api/`).
- **Admin portal** → **API**: REST + WebSocket (same API base; WebSocket at `ws://<host>:5000/ws/notifications?token=<JWT>`).
- **API** → **ML service**: HTTP (e.g. `ML_MODEL_URL` = `http://ml-service:8000/predict`). API downloads image from Cloudinary and sends to ML (or file upload depending on ML implementation).
- **API** → **Cloudinary**: Image upload (complaint images, work order update images). API stores returned URLs in DB (e.g. `Complaint.imageUrl` as JSON array).
- **API** → **PostgreSQL (NeonDB)**: All persistence via Prisma (users, complaints, work orders, notifications, etc.).
- **API** → **Firebase**: FCM for push notifications to mobile (and optionally to topics).
- **API** → **WebSocket**: Server-side `WebSocketService` broadcasts events (e.g. complaint_created) to connected clients (admin portal, and mobile if it connects).
- **Mobile** uses **FCM** for push; optionally **WebSocket/SSE** for real-time (see `WebSocketNotificationService`, `NotificationSSEService`).

---

## 2. Runtime Architecture (Text Diagram)

```
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                        EXTERNAL SERVICES                          │
                    │  Cloudinary (images) │ NeonDB (PostgreSQL) │ Firebase (FCM)       │
                    └─────────────────────────────────────────────────────────────────┘
                                              ▲
                                              │
    ┌──────────────┐     HTTPS/REST          │          HTTP (predict)
    │  Mobile App  │ ────────────────────────┼──────────────────────────┐
    │  (Android)   │     ws://.../ws/notif   │                          │
    └──────────────┘     (optional)          │                          ▼
            │                                 │               ┌─────────────────────┐
            │ FCM push                        │               │    ML Service       │
            │ (token stored in API)           │               │    (Flask :8000)    │
            ▼                                 │               │  /health, /predict  │
    ┌──────────────┐     HTTPS/REST + WS     │               └─────────────────────┘
    │ Admin Portal │ ────────────────────────┘
    │  (Next.js)   │
    └──────────────┘
            │
            └──────────────────────────────────────────────────────────────────────────►
                                    │
                                    ▼
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                     BACKEND API (Node/Express :5000)             │
                    │  • JWT auth (auth middleware, requireAdmin/requireWorker/…)      │
                    │  • Complaints: submit (multer → Cloudinary → ML → Prisma)         │
                    │  • Work orders: create, status, complete (state machine)          │
                    │  • Notifications: list, mark read; FCM send                      │
                    │  • WebSocket server: /ws/notifications (JWT in query)            │
                    └─────────────────────────────────────────────────────────────────┘
```

---

## 3. Communication Flows

### Mobile ↔ Backend

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`. Token stored in `TokenManager` (Android) and sent as `Authorization: Bearer <token>`.
- **Complaints**: `POST /api/complaints/submit` (multipart: images + latitude, longitude); `GET /api/complaints/my-complaints`, `GET /api/complaints/:id`; heatmap `GET /api/complaints/heatmap` (public).
- **Work orders**: `GET /api/work-orders/my-orders`, `GET /api/work-orders/:id/details`, `PUT /api/work-orders/:id/status`, `PUT /api/work-orders/:id/complete` (worker).
- **Notifications**: `GET /api/notifications`, `GET /api/notifications/count`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/mark-all-read`.
- **FCM**: `POST /api/fcm/token` (body: `{ fcmToken }`) to register device token; also `GET /check-fcm/:email` (no auth) for debugging.

### Backend ↔ ML Service

- **Health**: `GET http://ml-service:8000/health` (from `mlService.healthCheck()`).
- **Prediction**: Backend downloads image from Cloudinary URL, then `POST` to `ML_MODEL_URL` (e.g. `http://ml-service:8000/predict`) with body (FormData file or base64 depending on ML implementation). Response: category, confidence, model_version, processing_time. Used in `complaintController.submitComplaint` after upload; fallback to `IssueCategory.OTHER` if ML fails.

### Cloudinary

- **Upload**: Via `CloudinaryService.uploadImage` / `uploadMultipleImages` (multer memory buffer → upload_stream). Folder `road-issues`; transformations (e.g. 800x600 limit, quality auto). URLs stored in `Complaint.imageUrl` (JSON array string) and in work order update images.

### WebSockets

- **Server**: `WebSocketService` (singleton) attached to HTTP server on path `/ws/notifications`. Client sends JWT in query `?token=`. Server verifies JWT, stores connection by `decoded.id`, broadcasts on complaint_created / status changes.
- **Admin**: `useWebSocket` / `useDashboardWebSocket` connect with token, listen for `complaint_created`, `complaint_update`, `work_order_update`, `user_update` and invalidate TanStack Query cache.
- **Mobile**: Can connect to same WebSocket URL (see `WebSocketNotificationService`); FCM is primary for push.

### Firebase Cloud Messaging

- **Backend**: `FirebaseNotificationService` (singleton). Uses Firebase Admin SDK (service account file or env vars). `createAndSendNotification(userId, title, message, type, data)` loads user’s `fcmToken` from DB and sends. Also `sendToMultipleUsersByIds`, `sendToTopic` (e.g. `complaint_created` for workers).
- **Mobile**: `FirebaseNotificationManager` gets FCM token; `GlobalNotificationService` initializes and registers token with API after login. Notifications received via Firebase SDK; optional topic subscription.

### Authentication

- **Where**: API middleware `authenticateToken` (in `apps/api/src/middleware/auth.ts`). Reads `Authorization: Bearer <token>`, verifies JWT with `JWT_SECRET`, loads user from Prisma, sets `req.user = { id, email, role }`. Role helpers: `requireAdmin`, `requireWorker`, `requireUser`, `requireWorkerOrAdmin`.
- **State machine**: Backend uses `StateMachineValidator` (complaint and work order transitions by role). Used in `adminApprovalController` (approve/reject complaint) and `workOrderController` (update status, complete). Mobile has Kotlin copy `StateMachineValidator` for client-side validation.

### Shared Types Usage

- **Backend**: Imports from `@margwatch/shared-types` (enums and interfaces) in controllers, middleware, utils.
- **Admin**: Imports via `src/types/index.ts` (re-exports `@margwatch/shared-types`).
- **Mobile**: Does not use the npm package; uses Kotlin types in `shared/types/SharedTypes.kt` and Gson adapters in `JsonAdapters.kt` to stay in sync with API payloads.

---

## 4. Deployment (Docker)

- **docker-compose.yml** (under `infrastructure/docker`): defines services `api`, `ml-service`, `admin-portal`, `nginx`, `redis`. Database is external (e.g. NeonDB; `DATABASE_URL` in env). API depends on Redis; admin-portal depends on api and ml-service. Nginx reverse-proxies. WebSocket and FCM/Cloudinary/ML URLs are configured via environment variables.
