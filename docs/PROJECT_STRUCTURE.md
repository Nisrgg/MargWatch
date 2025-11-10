# MargWatch - Industry Standard Project Structure

## 🏗️ **PROJECT ARCHITECTURE**

```
MargWatch/
├── 📱 apps/                           # Applications directory
│   ├── mobile/                        # Android mobile application
│   │   ├── app/
│   │   │   ├── src/main/java/com/margwatch/
│   │   │   │   ├── data/              # Data layer (API, local storage)
│   │   │   │   │   ├── local/         # Local storage (Room, SharedPreferences)
│   │   │   │   │   ├── repository/    # Repository pattern implementation
│   │   │   │   │   └── api/          # API service interfaces
│   │   │   │   ├── domain/           # Business logic
│   │   │   │   │   ├── models/       # Domain models
│   │   │   │   │   └── usecases/    # Use case implementations
│   │   │   │   ├── ui/               # UI layer (Jetpack Compose)
│   │   │   │   │   ├── screens/      # Screen composables
│   │   │   │   │   ├── components/   # Reusable UI components
│   │   │   │   │   ├── theme/        # Material Design theme
│   │   │   │   │   └── navigation/  # Navigation components
│   │   │   │   └── utils/            # Utility classes
│   │   │   │       ├── ImageUtils.kt # Image processing utilities
│   │   │   │       └── StateMachineValidator.kt # Client-side validation
│   │   │   ├── src/main/res/         # Resources (layouts, strings, etc.)
│   │   │   └── build.gradle.kts     # Build configuration
│   │   ├── gradle/                  # Gradle wrapper
│   │   └── build.gradle.kts         # Project build configuration
│   │
│   ├── api/                         # Express.js backend API
│   │   ├── src/
│   │   │   ├── controllers/         # Request handlers
│   │   │   │   ├── authController.ts
│   │   │   │   ├── complaintController.ts
│   │   │   │   ├── workOrderController.ts
│   │   │   │   ├── adminController.ts
│   │   │   │   ├── adminApprovalController.ts
│   │   │   │   ├── notificationController.ts
│   │   │   │   └── fcmController.ts
│   │   │   ├── services/           # Business logic
│   │   │   │   ├── geolocationService.ts
│   │   │   │   ├── mlService.ts
│   │   │   │   ├── websocketService.ts
│   │   │   │   ├── firebaseNotificationService.ts
│   │   │   │   ├── cloudinaryService.ts
│   │   │   │   └── emailService.ts
│   │   │   ├── routes/             # API routes
│   │   │   │   ├── auth.ts
│   │   │   │   ├── complaints.ts
│   │   │   │   ├── workOrders.ts
│   │   │   │   ├── admin.ts
│   │   │   │   ├── adminApproval.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   └── ml.ts
│   │   │   ├── middleware/         # Express middleware
│   │   │   │   ├── auth.ts         # JWT authentication
│   │   │   │   ├── errorHandler.ts # Error handling
│   │   │   │   └── upload.ts       # File upload handling
│   │   │   ├── utils/              # Utility functions
│   │   │   │   ├── auth.ts         # Authentication utilities
│   │   │   │   ├── controllerUtils.ts # Controller helpers
│   │   │   │   └── stateMachineValidator.ts # State machine validation
│   │   │   ├── config/             # Configuration
│   │   │   │   ├── database.ts     # Database configuration
│   │   │   │   └── index.ts        # Main config
│   │   │   └── types/              # TypeScript type definitions
│   │   ├── prisma/                 # Database schema and migrations
│   │   │   ├── schema.prisma       # Database schema
│   │   │   ├── migrations/         # Database migrations
│   │   │   └── seed.ts             # Database seeding
│   │   ├── uploads/                # File upload directory
│   │   ├── tests/                  # Test files
│   │   ├── Dockerfile              # Backend container
│   │   └── package.json            # Dependencies and scripts
│   │
│   └── admin-portal/               # Next.js admin dashboard
│       ├── src/
│       │   ├── app/                # Next.js 14 app directory
│       │   │   ├── dashboard/     # Dashboard pages
│       │   │   ├── complaints/    # Complaint management
│       │   │   ├── work-orders/   # Work order management
│       │   │   ├── users/         # User management
│       │   │   ├── analytics/     # Analytics pages
│       │   │   ├── settings/      # Settings pages
│       │   │   └── login/         # Authentication pages
│       │   ├── components/        # React components
│       │   │   ├── ui/            # Reusable UI components
│       │   │   ├── Layout.tsx     # Main layout component
│       │   │   ├── Modal.tsx      # Modal components
│       │   │   └── NotificationBell.tsx # Notification component
│       │   ├── lib/               # Utility libraries
│       │   │   ├── api.ts         # API client
│       │   │   └── utils.ts       # Utility functions
│       │   ├── hooks/             # Custom React hooks
│       │   │   ├── useAuth.tsx    # Authentication hook
│       │   │   ├── useDashboardData.ts # Dashboard data hook
│       │   │   ├── useWebSocket.ts # WebSocket hook
│       │   │   └── useNotificationService.ts # Notification hook
│       │   ├── contexts/          # React contexts
│       │   │   └── NotificationContext.tsx # Notification context
│       │   ├── providers/         # Context providers
│       │   │   └── QueryProvider.tsx # TanStack Query provider
│       │   ├── types/             # TypeScript types
│       │   └── utils/             # Utility functions
│       │       ├── auth.ts        # Authentication utilities
│       │       └── format.ts      # Formatting utilities
│       ├── public/                # Static assets
│       ├── tests/                 # Test files
│       ├── next.config.js         # Next.js configuration
│       └── package.json           # Dependencies and scripts
│
├── 🤖 services/                    # Microservices directory
│   └── ml-service/                # Machine Learning service
│       ├── src/
│       │   ├── models/             # ML model implementations
│       │   ├── services/           # ML service implementations
│       │   │   ├── ml_model_service.py # Main ML service
│       │   │   └── image_processor.py # Image processing
│       │   ├── routes/            # API routes
│       │   │   └── ml_routes.py   # ML API endpoints
│       │   ├── config/            # Configuration
│       │   │   └── settings.py    # Service settings
│       │   ├── utils/             # ML utilities
│       │   │   ├── model_loader.py # Model loading utilities
│       │   │   └── preprocessor.py # Data preprocessing
│       │   └── app.py             # Main Flask application
│       ├── models/                # ML model files
│       ├── requirements.txt       # Python dependencies
│       ├── Dockerfile             # ML service container
│       └── test_ml_service.py     # Test suite
│
├── 📦 packages/                    # Shared packages
│   ├── shared-types/              # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── enums/             # Shared enums
│   │   │   │   ├── UserRole.ts
│   │   │   │   ├── ComplaintStatus.ts
│   │   │   │   ├── WorkOrderStatus.ts
│   │   │   │   ├── IssueCategory.ts
│   │   │   │   ├── WorkOrderApprovalStatus.ts
│   │   │   │   └── NotificationType.ts
│   │   │   ├── interfaces/        # Shared interfaces
│   │   │   │   ├── User.ts
│   │   │   │   ├── Complaint.ts
│   │   │   │   ├── WorkOrder.ts
│   │   │   │   ├── WorkOrderRequest.ts
│   │   │   │   ├── Notification.ts
│   │   │   │   ├── Auth.ts
│   │   │   │   └── Common.ts
│   │   │   └── index.ts           # Main export file
│   │   ├── dist/                  # Compiled JavaScript
│   │   ├── package.json           # Package configuration
│   │   └── tsconfig.json          # TypeScript configuration
│   │
│   ├── shared-config/             # Shared configuration
│   └── shared-utils/              # Shared utility functions
│
├── 🐳 infrastructure/              # Infrastructure as Code
│   ├── docker/                    # Docker configurations
│   │   ├── docker-compose.yml     # Development environment
│   │   ├── nginx.conf             # Nginx configuration
│   │   └── env.template           # Environment template
│   ├── k8s/                      # Kubernetes manifests
│   ├── monitoring/               # Monitoring configurations
│   ├── scripts/                  # Deployment scripts
│   ├── ssl/                      # SSL certificates
│   └── terraform/               # Infrastructure provisioning
│
├── 📚 docs/                       # Documentation
│   ├── API_DOCUMENTATION.md       # Complete API reference
│   ├── PROJECT_STRUCTURE.md      # This file
│   ├── GITHUB_REPOSITORY_STRUCTURE.md # Repository structure
│   ├── BACKEND_DEVELOPER_GUIDE.md # Backend development guide
│   ├── ML_DEVELOPER_GUIDE.md     # ML development guide
│   ├── CONTAINER_GUIDE.md        # Container deployment guide
│   ├── SECURITY_CHECKLIST.md     # Security guidelines
│   ├── TEAM_COLLABORATION_STRATEGY.md # Team collaboration
│   └── TEAM_TODO_LIST.md         # Team task management
│
├── 🧪 tests/                      # Integration tests
│   ├── e2e/                       # End-to-end tests
│   ├── integration/               # Integration tests
│   └── performance/               # Performance tests
│
├── 🔧 tools/                      # Development tools
│   ├── scripts/                   # Utility scripts
│   ├── generators/                # Code generators
│   └── configs/                  # Tool configurations
│
├── 📋 .github/                    # GitHub workflows
│   ├── workflows/                 # CI/CD pipelines
│   └── ISSUE_TEMPLATE/            # Issue templates
│
├── 🐳 docker-compose.yml          # Local development
├── 🐳 docker-compose.prod.yml     # Production deployment
├── 📄 .gitignore                  # Git ignore rules
├── 📄 .env.example                # Environment template
├── 📄 README.md                   # Project overview
├── 📄 SECURITY_CHECKLIST.md       # Security guidelines
├── 📄 BACKEND_ADMIN_PORTAL_TODO.md # Backend development plan
├── 📄 ML_MODEL_ENHANCEMENT_TODO.md # ML development plan
├── 📄 TEAM_TODO_LIST.md           # Team collaboration guide
├── 📄 TEAM_COLLABORATION_STRATEGY.md # Team strategy
├── 📄 TEAM_SECRET_MANAGEMENT.md   # Secret management
└── 📄 TEAM_SETUP_COMPLETE.md      # Setup completion status
```

## 🎯 **DEVELOPMENT WORKFLOW**

### **Branch Naming Convention**
```
feature/component-description     # New features
bugfix/issue-description         # Bug fixes
hotfix/critical-issue           # Critical fixes
release/version-number           # Release preparation
chore/maintenance-task           # Maintenance tasks
```

### **Commit Message Convention**
```
type(scope): description

feat(admin): add user management dashboard
fix(api): resolve authentication issue
docs(readme): update installation guide
test(ml): add model validation tests
refactor(backend): optimize database queries
```

### **Code Review Process**
1. **Create Pull Request** with descriptive title
2. **Add Labels** (feature, bugfix, documentation, etc.)
3. **Assign Reviewers** (at least 2 team members)
4. **Run CI/CD Pipeline** (automated tests)
5. **Address Review Comments** and update PR
6. **Merge to Main Branch** after approval

---

## 🛠️ **TECHNOLOGY STACK**

### **Mobile App (Android)**
- **Language**: Kotlin
- **Architecture**: MVVM + Clean Architecture
- **UI**: Jetpack Compose with Material Design 3
- **Networking**: Retrofit + OkHttp
- **Database**: Room (local storage)
- **Dependency Injection**: Hilt
- **State Management**: StateFlow, MutableStateFlow
- **Image Processing**: Custom ImageUtils with async compression
- **Validation**: Client-side StateMachineValidator
- **Testing**: JUnit, Espresso, Mockito

### **Backend API**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT tokens with role-based access control
- **File Storage**: Cloudinary for image management
- **Validation**: express-validator with comprehensive input sanitization
- **State Management**: StateMachineValidator for business logic
- **Real-time**: WebSocket for notifications
- **Testing**: Jest, Supertest

### **ML Service**
- **Language**: Python 3.9+
- **Framework**: PyTorch 2.1.0, TorchVision 0.16.0
- **API**: Flask with CORS support
- **Model**: Pre-trained ResNet18 (customized for 5 road issue categories)
- **Image Processing**: Pillow (PIL), OpenCV-compatible preprocessing
- **MLOps**: Model versioning and health checks
- **Testing**: Pytest, MLflow

### **Admin Portal**
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query for server state
- **Data Fetching**: React Query with caching
- **Forms**: React Hook Form with validation
- **Real-time**: WebSocket integration
- **Testing**: Jest, React Testing Library

### **Infrastructure**
- **Containerization**: Docker, Docker Compose
- **Database**: PostgreSQL with NeonDB (cloud) or local PostgreSQL
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Monitoring**: Health checks, comprehensive logging
- **Security**: OWASP guidelines, JWT authentication

---

## 📊 **DEVELOPMENT METRICS**

### **Code Quality Targets**
- **Test Coverage**: >80%
- **Code Duplication**: <5%
- **Cyclomatic Complexity**: <10
- **Technical Debt Ratio**: <5%
- **Security Vulnerabilities**: 0 critical

### **Performance Targets**
- **API Response Time**: <200ms P95
- **Mobile App Launch**: <3 seconds
- **ML Inference**: <150ms per image
- **Admin Portal Load**: <2 seconds
- **Database Query Time**: <50ms

### **Reliability Targets**
- **System Uptime**: 99.9%
- **Error Rate**: <0.1%
- **MTTR**: <30 minutes
- **MTBF**: >720 hours
- **Data Loss**: 0%

---

## 🔒 **SECURITY STANDARDS**

### **Authentication & Authorization**
- **JWT Tokens**: RS256 algorithm
- **Password Policy**: 8+ chars, mixed case, numbers, symbols
- **Session Timeout**: 30 minutes inactivity
- **Rate Limiting**: 100 requests/minute per IP
- **Role-Based Access**: USER, WORKER, ADMIN roles

### **Data Protection**
- **Encryption**: AES-256 for data at rest
- **Transport**: TLS 1.3 for data in transit
- **PII Handling**: GDPR compliant
- **Data Retention**: 7 years for audit logs
- **Backup**: Daily encrypted backups

### **API Security**
- **Input Validation**: All inputs validated with express-validator
- **SQL Injection**: Parameterized queries with Prisma ORM
- **XSS Protection**: Content Security Policy
- **CORS**: Restricted to known origins
- **Headers**: Security headers implemented
- **State Machine**: Business logic validation

---

## 🚀 **DEPLOYMENT STRATEGY**

### **Environment Strategy**
- **Development**: Local Docker Compose with NeonDB
- **Staging**: Cloud deployment with test data
- **Production**: High availability cluster
- **Feature Flags**: Gradual rollout capability

### **Release Process**
1. **Feature Development** in feature branches
2. **Code Review** and testing
3. **Merge to Main** after approval
4. **Automated Testing** in CI/CD pipeline
5. **Deploy to Staging** for validation
6. **Production Deployment** with monitoring
7. **Post-deployment** verification

### **Database Strategy**
- **Primary Database**: NeonDB (PostgreSQL cloud)
- **Local Development**: PostgreSQL container (commented out)
- **Migrations**: Prisma migrate deploy for production
- **Seeding**: Automated seed data for development

---

## 📈 **MONITORING & OBSERVABILITY**

### **Application Monitoring**
- **Performance**: Response times, throughput
- **Errors**: Exception tracking, error rates
- **Business Metrics**: User actions, conversions
- **Infrastructure**: CPU, memory, disk usage

### **Alerting Strategy**
- **Critical**: Immediate notification (PagerDuty)
- **Warning**: Email notification
- **Info**: Dashboard notification
- **Escalation**: Auto-escalation after 15 minutes

### **Logging Standards**
- **Structured Logging**: JSON format
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Correlation IDs**: Request tracing
- **Sensitive Data**: Never log passwords/tokens

---

## 🧪 **TESTING STRATEGY**

### **Test Pyramid**
- **Unit Tests**: 70% (individual components)
- **Integration Tests**: 20% (component interactions)
- **E2E Tests**: 10% (full user workflows)

### **Test Types**
- **Unit Tests**: Jest, Pytest, JUnit
- **Integration Tests**: Supertest, FastAPI TestClient
- **E2E Tests**: Cypress, Detox
- **Performance Tests**: K6, JMeter
- **Security Tests**: OWASP ZAP, Snyk

### **Test Data Management**
- **Test Databases**: Isolated test instances
- **Mock Data**: Generated test data
- **Fixtures**: Reusable test data
- **Cleanup**: Automatic test data cleanup

---

## 📚 **DOCUMENTATION STANDARDS**

### **Code Documentation**
- **API Documentation**: OpenAPI/Swagger
- **Code Comments**: JSDoc, Python docstrings
- **README Files**: Per component
- **Architecture Decision Records**: ADRs

### **User Documentation**
- **API Guides**: Complete API reference
- **User Manuals**: Step-by-step guides
- **Video Tutorials**: Screen recordings
- **FAQ**: Common questions and answers

### **Developer Documentation**
- **Setup Guides**: Local development setup
- **Contributing Guidelines**: How to contribute
- **Code Style Guides**: Coding standards
- **Deployment Guides**: Production deployment

---

## 🔄 **SHARED TYPES SYSTEM**

### **Single Source of Truth**
- **Package**: `@margwatch/shared-types`
- **Enums**: UserRole, ComplaintStatus, WorkOrderStatus, IssueCategory
- **Interfaces**: User, Complaint, WorkOrder, Notification
- **Usage**: Imported by API, Admin Portal, and Mobile App
- **Validation**: Consistent data validation across all services

### **State Machine Validation**
- **Backend**: `StateMachineValidator` utility
- **Mobile**: Client-side validation in `StateMachineValidator.kt`
- **Business Logic**: Enforced state transitions for complaints and work orders
- **Role-Based**: Different transitions allowed based on user roles

---

*This project structure follows industry best practices for scalability, maintainability, and team collaboration with a focus on shared types, state machine validation, and comprehensive security.*