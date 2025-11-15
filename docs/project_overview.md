# MargWatch Project Overview

## Executive Summary

MargWatch is a comprehensive, full-stack road issue reporting and management system that leverages AI-powered image classification, real-time notifications, and administrative oversight to improve road maintenance efficiency.

---

## System Components

### 1. Mobile Application (`apps/mobile/`)
- **Technology**: Android (Kotlin), Jetpack Compose
- **Purpose**: Native mobile app for citizens to report road issues
- **Key Features**:
  - GPS location capture
  - Image capture with async compression
  - Offline support with state persistence
  - Real-time notifications via Firebase Cloud Messaging
  - Material Design 3 UI

### 2. Admin Portal (`apps/admin-portal/`)
- **Technology**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Purpose**: Web-based administrative dashboard
- **Key Features**:
  - Real-time dashboard with WebSocket updates
  - Complaint management and approval workflow
  - Work order assignment and tracking
  - User management with RBAC
  - Analytics and reporting

### 3. Backend API (`apps/api/`)
- **Technology**: Node.js, Express.js, TypeScript, Prisma ORM
- **Purpose**: RESTful API server handling business logic
- **Key Features**:
  - JWT authentication with role-based access control
  - State machine validation for business logic
  - WebSocket notifications
  - Cloudinary integration for image storage
  - PostgreSQL database (NeonDB cloud)

### 4. ML Service (`services/ml-service/`)
- **Technology**: FastAPI, PyTorch, ResNet18
- **Purpose**: AI-powered image classification
- **Key Features**:
  - Real-time image classification
  - 5 road issue categories
  - Batch processing support
  - Docker containerization
  - Health checks and monitoring

### 5. Shared Types (`packages/shared-types/`)
- **Technology**: TypeScript
- **Purpose**: Centralized type definitions
- **Key Features**:
  - Enums (UserRole, ComplaintStatus, WorkOrderStatus, IssueCategory)
  - Interfaces (User, Complaint, WorkOrder, Notification)
  - Used across API, Admin Portal, and Mobile App

---

## Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Mobile App  │    │ Admin Portal│    │  ML Service │
│  (Android)  │    │  (Next.js)  │    │  (FastAPI)  │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                   │
       └──────────────────┼───────────────────┘
                          │
                 ┌────────┴────────┐
                 │   Backend API   │
                 │  (Node.js/TS)   │
                 └────────┬────────┘
                          │
                 ┌────────┴────────┐
                 │   NeonDB        │
                 │  (PostgreSQL)   │
                 └─────────────────┘
```

---

## Data Flow

### Complaint Submission Flow

1. **Mobile App**: User captures image and location
2. **Backend API**: Receives complaint, uploads image to Cloudinary
3. **ML Service**: Classifies image category
4. **Backend API**: Stores complaint with ML prediction
5. **Admin Portal**: Receives real-time notification via WebSocket
6. **Admin**: Reviews and approves complaint
7. **Work Order**: Created and assigned to worker
8. **Notifications**: Sent to relevant users via FCM/WebSocket

---

## Technology Stack Summary

### Frontend & Mobile
- Next.js 14, React 18, TypeScript
- Android (Kotlin), Jetpack Compose
- Tailwind CSS, shadcn/ui
- TanStack Query, React Context

### Backend
- Node.js, Express.js, TypeScript
- Prisma ORM, PostgreSQL (NeonDB)
- JWT authentication, bcrypt
- WebSocket, Firebase Cloud Messaging

### Machine Learning
- FastAPI, PyTorch 2.1.0
- ResNet18 model
- Pillow (PIL) for image processing

### Infrastructure
- Docker, Docker Compose
- Nginx (reverse proxy)
- Cloudinary (image storage)

---

## Key Features

### Security
- JWT token-based authentication
- Role-based access control (Admin, Worker, User)
- Input validation and sanitization
- Geographic bounds checking
- Secure file handling

### Business Logic
- State machine validation for status transitions
- Duplicate complaint detection
- Automatic complaint categorization via ML
- Work order assignment and tracking
- Audit logging

### Real-time Capabilities
- WebSocket notifications
- Firebase Cloud Messaging
- Live dashboard updates
- Real-time status changes

### Scalability
- Microservices architecture
- Docker containerization
- Cloud database (NeonDB)
- Stateless API design

---

## Development Workflow

### Local Development
```bash
# Start all services
cd infrastructure/docker
docker-compose up -d --build

# Run database migrations
cd ../../apps/api
npx prisma migrate dev
npx prisma db seed
```

### Service URLs
- Admin Portal: http://localhost:3000
- Backend API: http://localhost:5000
- ML Service: http://localhost:8000

---

## Project Structure

```
MargWatch/
├── apps/
│   ├── admin-portal/     # Next.js admin dashboard
│   ├── api/              # Node.js backend API
│   └── mobile/           # Android mobile app
├── services/
│   └── ml-service/       # FastAPI ML service
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── infrastructure/
│   └── docker/           # Docker configurations
└── docs/                 # Documentation
```

---

## Testing Credentials

### Admin Account
- Email: admin@roadportal.com
- Password: admin123
- Role: Full system access

### Worker Account
- Email: worker2@roadportal.com
- Password: worker123
- Role: Work order management

### User Account
- Email: user@roadportal.com
- Password: user123
- Role: Complaint submission

---

## Documentation

- **ML Service**: See `docs/ML_SERVICE_DETAILED.md` for complete ML service documentation
- **API Documentation**: See `docs/old/API_DOCUMENTATION.md`
- **Architecture**: See `docs/architecture.mermaid`
- **Database Schema**: See `docs/database_schema.md`

---

## Future Roadmap

- Enhanced ML model training on custom dataset
- Mobile app for iOS
- Advanced analytics and reporting
- Multi-language support
- Integration with external road maintenance systems
- Mobile app offline-first improvements
- Real-time map visualization
- Automated work order scheduling

