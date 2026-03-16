# MargWatch Database Schema (Prisma)

## Overview

- **ORM**: Prisma.
- **Provider**: PostgreSQL (e.g. NeonDB via `DATABASE_URL`).
- **Schema file**: `apps/api/prisma/schema.prisma`.

---

## Enums

| Enum | Values |
|------|--------|
| UserRole | USER, ADMIN, WORKER |
| ComplaintStatus | REGISTERED, APPROVED, PROCESSING, PENDING_REVIEW, COMPLETED, REJECTED |
| WorkOrderStatus | ASSIGNED, IN_PROGRESS, PENDING_REVIEW, COMPLETED, REJECTED |
| IssueCategory | POTHOLE, ROAD_INSTABILITY, STREETLIGHT_DAMAGE, TREE_DAMAGE, OTHER |

---

## Tables

### users

| Column | Type | Notes |
|--------|------|--------|
| id | String (cuid) | PK |
| email | String | Unique |
| password | String | Hashed |
| firstName | String | |
| lastName | String | |
| phone | String? | |
| role | UserRole | Default USER |
| isActive | Boolean | Default true |
| fcmToken | String? | FCM device token |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations**: complaints (1:n), workOrders (1:n).

---

### complaints

| Column | Type | Notes |
|--------|------|--------|
| id | String (cuid) | PK |
| title | String | |
| description | String | |
| category | IssueCategory | |
| status | ComplaintStatus | Default REGISTERED |
| latitude | Decimal(10,8) | |
| longitude | Decimal(11,8) | |
| address | String? | |
| imageUrl | String? | JSON array of Cloudinary URLs |
| imageCount | Int? | Default 1 |
| mlCategory | IssueCategory? | ML prediction |
| mlConfidence | Float? | |
| mlModelVersion | String? | |
| mlProcessingTime | Float? | |
| rejectionReason | String? | |
| severity | String | Default "MEDIUM" (LOW, MEDIUM, HIGH, CRITICAL) |
| userId | String | FK → users (reporting user) |
| approvedBy | String? | Admin user id |
| approvedAt | DateTime? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations**: user (n:1), workOrders (1:n), updates (1:n ComplaintUpdate).

---

### work_orders

| Column | Type | Notes |
|--------|------|--------|
| id | String (cuid) | PK |
| complaintId | String | FK → complaints |
| workerId | String | FK → users |
| status | WorkOrderStatus | Default ASSIGNED |
| priority | Int | Default 1 (1=Low, 2=Medium, 3=High) |
| assignedAt | DateTime | |
| startedAt | DateTime? | |
| completedAt | DateTime? | |
| workDescription | String? | |
| materialsUsed | String? | |
| cost | Decimal(10,2)? | |
| estimatedDuration | Int? | Minutes |
| actualDuration | Int? | Minutes |
| qualityScore | SmallInt? | 1–5 |
| reworkCount | Int | Default 0 |
| adminApprovalStatus | String? | PENDING, APPROVED, REJECTED |
| adminApprovedBy | String? | |
| adminApprovedAt | DateTime? | |
| adminRejectionReason | String? | |
| workerCompleted | Boolean | Default false |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations**: complaint (n:1), worker (n:1), updates (1:n WorkOrderUpdate).

---

### complaint_updates

| Column | Type | Notes |
|--------|------|--------|
| id | String (cuid) | PK |
| complaintId | String | FK → complaints |
| status | ComplaintStatus | |
| description | String? | |
| imageUrl | String? | |
| createdAt | DateTime | |

---

### work_order_updates

| Column | Type | Notes |
|--------|------|--------|
| id | String (cuid) | PK |
| workOrderId | String | FK → work_orders |
| status | WorkOrderStatus | |
| description | String? | |
| imageUrl | String? | |
| progress | Int? | 0–100 |
| createdAt | DateTime | |

---

### notifications

| Column | Type | Notes |
|--------|------|--------|
| id | String (cuid) | PK |
| userId | String | |
| title | String | |
| message | String | |
| type | String | e.g. complaint_status, work_update, general |
| isRead | Boolean | Default false |
| createdAt | DateTime | |

(No FK to users in schema; application associates by userId.)

---

### system_settings

| Column | Type | Notes |
|--------|------|--------|
| id | String (cuid) | PK |
| key | String | Unique |
| value | String | |

---

## Indexes

- Primary keys and unique constraints as defined (id, email, system_settings.key).
- No additional custom indexes are defined in the provided schema; consider indexes on complaints(userId, status, createdAt), work_orders(workerId, status), notifications(userId, isRead) for query performance.

---

## State Transitions

### Complaint lifecycle

- **REGISTERED** → APPROVED | REJECTED (Admin).
- **APPROVED** → PROCESSING (Admin/Worker when work starts).
- **PROCESSING** → PENDING_REVIEW (Worker).
- **PENDING_REVIEW** → COMPLETED | PROCESSING (Admin final approve or send back).
- **COMPLETED**, **REJECTED**: terminal.

Role rules: Admin can perform allowed transitions; Worker only APPROVED→PROCESSING, PROCESSING→PENDING_REVIEW; User cannot change status.

### Work order lifecycle

- **ASSIGNED** → IN_PROGRESS | REJECTED (Worker starts or rejects).
- **IN_PROGRESS** → PENDING_REVIEW | REJECTED (Worker submits for review).
- **PENDING_REVIEW** → COMPLETED | IN_PROGRESS (Admin approves or sends back).
- **COMPLETED**, **REJECTED**: terminal.

Worker sets workerCompleted when marking work complete; admin approval fields track final approval.

### Notification lifecycle

- Created by backend when sending in-app notifications (e.g. complaint status, work order updates).
- Read state updated via `PUT /api/notifications/:id/read` and `mark-all-read`. FCM payloads are not stored in this table; they are push-only.
