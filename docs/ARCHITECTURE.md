# MargWatch System Architecture

## High-Level Architecture

MargWatch follows a microservices architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────┬───────────────────┬───────────────────┤
│   Mobile App        │   Admin Portal    │   External APIs   │
│   (Android)         │   (Next.js)       │   (Future)        │
└──────────┬──────────┴──────────┬────────┴──────────┬────────┘
           │                     │                    │
           └─────────────────────┼────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   API Gateway Layer     │
                    │   (Nginx Reverse Proxy) │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────┴────────┐    ┌──────────┴──────────┐   ┌────────┴────────┐
│  Backend API   │    │    ML Service       │   │ Notification    │
│  (Node.js/TS)  │    │    (FastAPI)        │   │ Service         │
│                │    │                     │   │ (Future)        │
│ • REST API     │    │ • Image Classify    │   │                 │
│ • WebSocket    │    │ • Batch Process     │   │                 │
│ • Auth         │    │ • Health Check      │   │                 │
└───────┬────────┘    └─────────────────────┘   └─────────────────┘
        │
        │
┌───────┴───────────────────────────────────────────────┐
│              Data & Storage Layer                      │
├──────────────┬──────────────┬──────────────┬──────────┤
│  PostgreSQL  │  Cloudinary  │  Firebase    │  Redis   │
│  (NeonDB)    │  (Images)    │  (FCM)       │ (Future) │
└──────────────┴──────────────┴──────────────┴──────────┘
```

---

## Component Architecture

### 1. Mobile Application

**Architecture Pattern**: MVVM (Model-View-ViewModel)

```
┌─────────────────────────────────────┐
│         UI Layer (Compose)          │
│  • Screens                          │
│  • Components                       │
│  • Navigation                       │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      ViewModel Layer                │
│  • State Management                 │
│  • Business Logic                   │
│  • State Validation                 │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Data Layer                     │
│  • Repository Pattern               │
│  • API Client                       │
│  • Local Storage                    │
│  • Shared Types                     │
└─────────────────────────────────────┘
```

**Key Technologies**:
- Jetpack Compose for UI
- StateFlow for state management
- Retrofit for API calls
- Room (future) for local database
- Firebase Cloud Messaging for notifications

---

### 2. Admin Portal

**Architecture Pattern**: Component-Based with Server Components

```
┌─────────────────────────────────────┐
│      Next.js App Router             │
│  • Server Components                │
│  • Client Components                │
│  • API Routes                       │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      React Components               │
│  • Pages                            │
│  • Reusable Components              │
│  • UI Components (shadcn/ui)        │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      State Management               │
│  • TanStack Query                   │
│  • React Context                    │
│  • WebSocket Hooks                  │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      API Layer                      │
│  • API Client                       │
│  • Shared Types                     │
│  • Error Handling                   │
└─────────────────────────────────────┘
```

**Key Technologies**:
- Next.js 14 App Router
- React 18 Server Components
- TanStack Query for data fetching
- WebSocket for real-time updates
- Tailwind CSS + shadcn/ui

---

### 3. Backend API

**Architecture Pattern**: Layered Architecture

```
┌─────────────────────────────────────┐
│      Route Layer                    │
│  • Express Routes                   │
│  • Request Validation               │
│  • Response Formatting              │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Controller Layer               │
│  • Request Handling                 │
│  • Business Logic Orchestration     │
│  • Response Generation              │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Service Layer                  │
│  • Business Logic                   │
│  • External Service Integration     │
│  • Data Transformation              │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Data Access Layer              │
│  • Prisma ORM                       │
│  • Database Queries                 │
│  • Transaction Management           │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Database (PostgreSQL)          │
│  • Tables                           │
│  • Relationships                    │
│  • Migrations                       │
└─────────────────────────────────────┘
```

**Key Technologies**:
- Express.js for HTTP server
- Prisma ORM for database access
- JWT for authentication
- WebSocket for real-time communication
- express-validator for input validation

---

### 4. ML Service

**Architecture Pattern**: Service-Oriented

```
┌─────────────────────────────────────┐
│      API Layer (FastAPI)            │
│  • Endpoints                        │
│  • Request Validation               │
│  • Response Formatting              │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Service Layer                  │
│  • MLModelService                   │
│  • Image Preprocessing              │
│  • Prediction Logic                 │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Model Layer                    │
│  • PyTorch ResNet18                 │
│  • Model Loading                    │
│  • Inference                        │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Utility Layer                  │
│  • Image Validation                 │
│  • Response Formatting              │
│  • Performance Monitoring           │
└─────────────────────────────────────┘
```

**Key Technologies**:
- FastAPI for REST API
- PyTorch for ML inference
- ResNet18 pre-trained model
- Pillow for image processing

---

## Data Flow Architecture

### Complaint Submission Flow

```
1. Mobile App
   └─> Capture Image + Location
       └─> Compress Image (async)
           └─> POST /api/complaints
               │
2. Backend API
   ├─> Validate Request
   ├─> Upload Image to Cloudinary
   ├─> Download Image from Cloudinary
   ├─> POST /predict (ML Service)
   │   │
   │   3. ML Service
   │   ├─> Preprocess Image
   │   ├─> Run ResNet18 Inference
   │   └─> Return Category + Confidence
   │
   ├─> Generate Title/Description
   ├─> Check for Duplicates
   ├─> Create Complaint in Database
   ├─> Emit WebSocket Notification
   └─> Send FCM Notification
       │
4. Admin Portal
   └─> Receive Real-time Update
       └─> Display in Dashboard
```

### Work Order Flow

```
1. Admin Portal
   └─> Approve Complaint
       └─> Create Work Order
           │
2. Backend API
   ├─> Update Complaint Status
   ├─> Create Work Order
   ├─> Assign to Worker
   ├─> Emit WebSocket Notification
   └─> Send FCM Notification
       │
3. Mobile App (Worker)
   └─> Receive Notification
       └─> View Work Order
           └─> Update Status
               │
4. Backend API
   ├─> Validate State Transition
   ├─> Update Work Order
   ├─> Update Complaint Status
   └─> Send Notifications
```

---

## Security Architecture

### Authentication Flow

```
1. User Login
   └─> POST /api/auth/login
       │
2. Backend API
   ├─> Validate Credentials
   ├─> Generate JWT Token
   └─> Return Token + User Info
       │
3. Client
   └─> Store Token (LocalStorage/Cookie)
       └─> Include in Authorization Header
           │
4. Backend API (Protected Routes)
   ├─> Verify JWT Token
   ├─> Check User Role
   └─> Process Request
```

### Authorization Model

**Role-Based Access Control (RBAC)**:

- **Admin**: Full system access
  - Manage users
  - Approve/reject complaints
  - Create work orders
  - View analytics

- **Worker**: Work order management
  - View assigned work orders
  - Update work order status
  - Complete work orders

- **User**: Complaint submission
  - Submit complaints
  - View own complaints
  - Track complaint status

---

## State Management

### State Machine Validation

**Complaint Status Transitions**:

```
PENDING → APPROVED (Admin only)
PENDING → REJECTED (Admin only)
APPROVED → IN_PROGRESS (Auto on work order creation)
IN_PROGRESS → COMPLETED (Worker)
COMPLETED → CLOSED (Auto after review)
```

**Work Order Status Transitions**:

```
PENDING → ASSIGNED (Admin)
ASSIGNED → IN_PROGRESS (Worker)
IN_PROGRESS → COMPLETED (Worker)
COMPLETED → APPROVED (Admin)
COMPLETED → REJECTED (Admin)
```

State transitions are validated using `stateMachineValidator.ts` utility.

---

## Integration Points

### ML Service Integration

**Backend API → ML Service**:
- HTTP POST requests
- FormData file uploads
- 30-second timeout
- Fallback to default category on failure

**Response Mapping**:
- ML categories → Shared Type enums
- Confidence scores preserved
- Processing time tracked

### Cloudinary Integration

**Image Storage**:
- Upload on complaint submission
- Automatic optimization
- CDN delivery
- URL storage in database

### Firebase Cloud Messaging

**Push Notifications**:
- Status change notifications
- Work order assignments
- Admin alerts
- Cross-platform support

### WebSocket Integration

**Real-time Updates**:
- Complaint status changes
- Work order updates
- Admin dashboard refresh
- Notification delivery

---

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: All services are stateless, allowing horizontal scaling
- **Database**: NeonDB supports connection pooling
- **ML Service**: Can scale independently based on load
- **Load Balancing**: Nginx can distribute traffic

### Caching Strategy

- **Future**: Redis for session storage
- **Future**: Response caching for frequently accessed data
- **Future**: ML prediction caching for duplicate images

### Database Optimization

- Indexed columns for common queries
- Connection pooling
- Query optimization with Prisma
- Migration strategy for schema changes

---

## Monitoring & Observability

### Health Checks

- **Backend API**: `/health` endpoint
- **ML Service**: `/health` endpoint with model status
- **Docker**: Health check configurations

### Logging

- Structured logging across services
- Error tracking and reporting
- Performance metrics logging
- Request/response logging

### Future Enhancements

- Prometheus metrics
- Grafana dashboards
- Distributed tracing (Jaeger)
- Error tracking (Sentry)

---

## Deployment Architecture

### Development Environment

```
Docker Compose
├── Backend API (Node.js)
├── Admin Portal (Next.js)
├── ML Service (FastAPI)
└── PostgreSQL (NeonDB - External)
```

### Production Environment (Future)

```
Kubernetes Cluster
├── API Deployment (Replicas: 3)
├── Admin Portal Deployment (Replicas: 2)
├── ML Service Deployment (Replicas: 2)
├── Nginx Ingress
├── PostgreSQL (Managed Service)
└── Monitoring Stack
```

---

## Technology Decisions

### Why FastAPI for ML Service?
- High performance async support
- Automatic API documentation
- Type validation with Pydantic
- Easy integration with PyTorch

### Why Next.js for Admin Portal?
- Server-side rendering for SEO
- API routes for backend integration
- Excellent developer experience
- Strong TypeScript support

### Why Prisma ORM?
- Type-safe database queries
- Migration management
- Excellent TypeScript support
- Database-agnostic design

### Why NeonDB?
- Serverless PostgreSQL
- Automatic scaling
- Connection pooling
- Cost-effective for development

---

## Future Architecture Enhancements

1. **Message Queue**: RabbitMQ/Kafka for async processing
2. **Caching Layer**: Redis for session and data caching
3. **Search**: Elasticsearch for complaint search
4. **File Storage**: S3-compatible storage for images
5. **API Gateway**: Kong/AWS API Gateway for routing
6. **Service Mesh**: Istio for service-to-service communication
7. **Monitoring**: Full observability stack
8. **CI/CD**: Automated deployment pipeline

