
# MargWatch Project - Interview Preparation Guide

This document is a comprehensive technical breakdown of the **MargWatch** project. It is designed to help you answer questions about architecture, specific technologies, design decisions, and system flows during a technical interview.

---

## 1. Project Identity Card

| **System** | **MargWatch** |
| :--- | :--- |
| **Core Value** | AI-Powered Road Issue Reporting & Management System |
| **Architecture** | Modern Monorepo (Client-Server-Microservice Hybrid) |
| **Key Technologies** | Next.js, Android (Kotlin), Node.js (Express), Python (Flask/PyTorch), PostgreSQL |
| **Infrastructure** | Docker, Docker Compose, Nginx (implied reverse proxy) |
| **Real-time** | WebSockets (Admin) + Firebase Cloud Messaging (Mobile) |

---

## 2. Executive Summary (The Elevator Pitch)

"MargWatch is an end-to-end platform enabling citizens to report road hazards like potholes and feedback loops for municipal workers to resolve them. The system features a native Android app with offline capabilities, a real-time Admin Dashboard for city officials, and an automated Python-based MI/ML service that classifies road damage severity from images with 95%+ accuracy. We built it using a containerized micro-service approach to ensure the ML workload remains isolated from the high-throughput API server."

---

## 3. Core Workflows (The "Life of a Packet")

### A. The Reporting Flow (Happy Path)
1.  **Capture**: User takes a photo in the Android App (`apps/mobile`).
2.  **Compression**: App uses `ImageUtils` to compress the image asynchronously before effective upload (Bandwidth optimization).
3.  **Upload**: Image is uploaded to **Cloudinary** (via Backend proxy).
4.  **Submission**: Metadata (Lat, Long, User ID) is sent to Backend (`POST /api/complaints`).
5.  **AI Classification**:
    -   Backend receives request -> Calls `MLService`.
    -   `MLService` converts image to FormData -> `POST http://ml-service:8000/predict`.
    -   Python Service (PyTorch) processes image -> Returns `category` + `confidence`.
    -   *Fallback*: If ML service is down, defaults to "Pending Review" with `OTHER` category.
6.  **Persistence**: Complaint saved to NeonDB (Postgres) via Prisma with status `REGISTERED`.
7.  **Notification**:
    -   Backend emits WebSocket event -> Admin Dashboard updates immediately (`useWebSocket` hook).
    -   Backend queues FCM push notification -> User receives "Complaint Received".

### B. The Resolution Flow
1.  **Assignment**: Admin approves complaint -> Creates `WorkOrder` -> Assigns to Worker.
2.  **Worker Update**: Worker logs in -> Sees assigned orders -> Marks status `IN_PROGRESS` / `COMPLETED`.
3.  **Closure**: Status update triggers final notification to the original reporter.

---

## 4. Technology Stack Deep Dive

### **Frontend (Admin Portal)**
-   **Framework**: Next.js 14 (React 18).
-   **Language**: TypeScript.
-   **Styling**: Tailwind CSS + `shadcn/ui` (Radix UI primitives).
-   **State**: `TanStack Query` (React Query) for server state management.
-   **Real-time**: Custom `useWebSocket` hook for live dashboard updates.

### **Mobile App**
-   **Platform**: Native Android.
-   **Language**: Kotlin.
-   **UI Toolkit**: Jetpack Compose (Modern, declarative UI).
-   **Network**: Retrofit (implied standard) with OkHttp.
-   **Optimization**: Client-side image compression (`ImageUtils`) to reduce upload latency and data usage.

### **Backend API (`apps/api`)**
-   **Runtime**: Node.js.
-   **Framework**: Express.js (High performance, unopinionated).
-   **Language**: TypeScript (Strict typing shared with frontend via `@margwatch/shared-types`).
-   **ORM**: Prisma (Type-safe database access).
-   **Key Libraries**: 
    -   `helmet`: Security headers.
    -   `cors`: Cross-origin resource sharing.
    -   `jsonwebtoken`: Stateless authentication.
    -   `axios`: Internal service communication.

### **ML Service (`services/ml-service`)**
-   **Runtime**: Python 3.10+.
-   **Framework**: Flask (Micro-framework, lightweight).
-   **Libraries**:
    -   `torch` / `torchvision`: ResNet18 model execution.
    -   `PIL` (Pillow): Image preprocessing (Resize to 224x224, Normalize).
    -   `StandardScaler`: Data normalization.
-   **Mode**: Supports "Mock Mode" if weights are missing (Great for CI/CD or dev environments without GPUs).

### **Database (`schema.prisma`)**
-   **Engine**: PostgreSQL (NeonDB serverless cloud).
-   **Schema Highlights**:
    -   **Enums**: `ComplaintStatus` (State machine enforcement), `UserRole`.
    -   **Relations**: One-to-Many (User -> Complaints), One-to-Many (Complaint -> WorkOrders).
    -   **Types**: `Decimal` for Latitude/Longitude (High precision required for maps).

---

## 5. Security Architecture

### **Authentication & Authorization**
-   **JWT Strategy**: Stateless authentication. 
    -   Token contains `userId`, `email`, `role`.
    -   Middleware (`authenticateToken`) verifies signature on every protected route.
-   **RBAC (Role-Based Access Control)**:
    -   Middleware `checkRole(['ADMIN'])` ensures users can't approve their own complaints.
    -   Strict separation: `USER` (Report), `WORKER` (Resolve), `ADMIN` (Manage).

### **Data Validation**
-   **Input Sanitization**: `express-validator` (likely used in controllers) or Zod.
-   **State Machine Validation**: Prevents illegal workflow jumps. 
    -   *Example*: Cannot move from `REGISTERED` directly to `COMPLETED` without `APPROVED` status.

### **Infrastructure Security**
-   **Environment Variables**: Secrets (DB URL, JWT Secret, Cloudinary Keys) are injected via Docker `.env`, never hardcoded.
-   **Docker Isolation**: Services run in separate containers, communicating only via internal Docker network (Backend can talk to ML, but public internet cannot directly hit ML service).
-   **Rate Limiting**: `express-rate-limit` prevents DDoS attacks on the API.

---

## 6. Key API Endpoints Cheatsheet

| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| POST | `/api/auth/login` | Returns JWT Token | Public |
| POST | `/api/auth/register` | Creates User | Public |
| **Complaints** | | | |
| GET | `/api/complaints` | Fetch list (with filters) | Auth |
| POST | `/api/complaints` | Submit new issue | Auth |
| PATCH | `/api/complaints/:id/status`| Update status | Admin/Worker |
| **ML** | | | |
| POST | `/api/ml/predict` | Proxy to Python service | Internal |
| POST | `/predict` (Python) | Raw Inference | Private |

---

## 7. System Design: The "Why" Questions

**Q: Why use a separate Python service for ML instead of Node.js?**
* **A:** Node.js is single-threaded and optimized for I/O (handling API requests). ML inference is CPU/GPU intensive. Running PyTorch in the main Node process would block the event loop, causing API latency for all users. By splitting it into a Python microservice, we isolate the heavy computation. If the ML service gets bogged down, the main API remains responsive.

**Q: Why standard Prisma over raw SQL?**
* **A:** Safety. Prisma generates TypeScript types from the schema. This ensures that if we change a database column, our backend code creates compile-time errors rather than runtime crashes. It guarantees the Frontend, Backend, and Database are always in sync regarding data structure.

**Q: Why PostgreSQL and not MongoDB?**
* **A:** Relational integrity. A "Work Order" *must* belong to a "Complaint", and a "Complaint" *must* belong to a "User". SQL enforces these constraints rigidly. Additionally, geospatial queries (PostGIS capabilities) are generally more robust in Postgres for future map features.

**Q: How do you handle failure of the ML Service?**
* **A:** We implemented a "Graceful Fallback" pattern. The system is designed to be resilient. If the Python service is unreachable or errors out, the Backend catches the exception, logs it, and saves the complaint with a category of `OTHER` and a flag for manual review. The user flow is never blocked by a backend service failure.

**Q: Why WebSockets for the Admin Dashboard?**
* **A:** Polling (asking the server "any new updates?" every 5 seconds) is inefficient and delays data. For an Operations Center dispatching workers, seconds matter. WebSockets push data immediately when it changes, ensuring the map on the big screen is always live.

---

## 8. Potential Interview Questions

1.  **"Walk me through the database schema."**
    *   *Start with `User`, move to `Complaint` (the center), then `WorkOrder` (the resolution). Mention the Enums for status.*
2.  **"How does the mobile app handle poor connectivity?"**
    *   *Mention the local SQLite/Room database (implied by 'Offline Support' feature) and the JobQueue architecture that retries uploads when back online.*
3.  **"How secure is the image upload?"**
    *   *Images are not stored on our server (which would fill up disk space). We use Cloudinary (CDN), verifying the file type before upload, and only storing the URL string in our database.*

