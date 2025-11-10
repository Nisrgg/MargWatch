# MargWatch GitHub Repository Structure - Complete Guide

## 🏗️ **REPOSITORY OVERVIEW**

The MargWatch repository is organized as a **monorepo** with **selective cloning** capabilities, allowing each team member to download only the components they need for their work.

## 📁 **ROOT DIRECTORY STRUCTURE**

```
MargWatch/                           # Root repository
├── 📱 apps/                         # Applications directory
│   ├── mobile/                      # Android mobile application
│   ├── api/                         # Express.js backend API
│   └── admin-portal/                # Next.js admin dashboard
├── 🤖 services/                     # Microservices directory
│   └── ml-service/                 # Machine Learning service
├── 📦 packages/                     # Shared packages
│   ├── shared-types/               # Shared TypeScript types
│   ├── shared-config/              # Shared configuration
│   └── shared-utils/               # Shared utility functions
├── 🐳 infrastructure/               # Shared infrastructure
├── 📚 docs/                         # Shared documentation
├── 📄 README.md                     # Main project overview
├── 📄 .gitignore                    # Git ignore rules
└── 📄 TEAM_SETUP_COMPLETE.md       # Team collaboration guide
```

---

## 📱 **MOBILE APP DIRECTORY** (`apps/mobile/`)

### **Purpose**: Android mobile application for road issue reporting

### **Structure**:
```
apps/mobile/
├── app/
│   ├── src/main/java/com/margwatch/
│   │   ├── data/                    # Data layer (API, local storage)
│   │   │   ├── local/               # Local data management (TokenManager)
│   │   │   ├── repository/          # Data repository (MargWatchRepository)
│   │   │   └── api/                 # API client and services
│   │   ├── ui/                      # User interface
│   │   │   ├── components/          # Reusable UI components
│   │   │   │   ├── StatusComponents.kt      # Status chips and badges
│   │   │   │   ├── CardComponents.kt       # Card layouts
│   │   │   │   ├── InputComponents.kt      # Form inputs
│   │   │   │   ├── ButtonComponents.kt     # Button variants
│   │   │   │   ├── ErrorHandling.kt         # Snackbar error system
│   │   │   │   ├── MargWatchComponents.kt   # Legacy components
│   │   │   │   └── ImageSelectionDialog.kt  # Image picker
│   │   │   ├── screens/             # App screens
│   │   │   │   ├── ComplaintSubmissionScreen.kt
│   │   │   │   ├── WorkerDashboardScreen.kt
│   │   │   │   ├── ComplaintDetailScreen.kt
│   │   │   │   ├── ComplaintsListScreen.kt
│   │   │   │   ├── LoginScreen.kt
│   │   │   │   ├── RegistrationScreen.kt
│   │   │   │   ├── ProfileScreen.kt
│   │   │   │   ├── SettingsScreen.kt
│   │   │   │   ├── NotificationsScreen.kt
│   │   │   │   ├── MapScreen.kt
│   │   │   │   ├── HeatMapScreen.kt
│   │   │   │   └── CameraScreen.kt
│   │   │   ├── theme/               # App theming
│   │   │   └── navigation/          # Navigation components
│   │   └── utils/                   # Utility classes
│   │       ├── ImageUtils.kt        # Async image compression
│   │       └── StateMachineValidator.kt # Client-side validation
│   ├── src/main/res/                # Android resources
│   │   ├── drawable/                # Images and icons
│   │   ├── mipmap/                  # App icons
│   │   ├── values/                  # Strings, colors, themes
│   │   └── xml/                     # XML configurations
│   └── google-services.json         # Firebase configuration
├── build.gradle.kts                 # Build configuration
├── gradle.properties               # Gradle properties
├── settings.gradle.kts             # Project settings
└── README.md                       # Mobile app documentation
```

### **Key Files**:
- **`MargWatchRepository.kt`**: Main data repository with API integration
- **`ComplaintViewModel.kt`**: Complaint state management with async image compression
- **`WorkOrderViewModel.kt`**: Work order management with state validation
- **`StateMachineValidator.kt`**: Client-side state machine validation
- **`ImageUtils.kt`**: Async image compression utilities
- **`ErrorHandling.kt`**: Centralized Snackbar error system

### **Technology Stack**:
- **Language**: Kotlin
- **UI**: Jetpack Compose with Material Design 3
- **Architecture**: MVVM + Clean Architecture
- **Networking**: Retrofit + OkHttp
- **State Management**: StateFlow, MutableStateFlow
- **Image Processing**: Async compression with coroutines
- **Validation**: Client-side state machine validation
- **Notifications**: Firebase FCM

---

## 🖥️ **BACKEND DIRECTORY** (`apps/api/`)

### **Purpose**: Express.js backend API with TypeScript

### **Structure**:
```
apps/api/
├── src/
│   ├── controllers/                 # Request handlers
│   │   ├── authController.ts        # Authentication
│   │   ├── complaintController.ts   # Complaint management
│   │   ├── workOrderController.ts   # Work order management
│   │   ├── adminController.ts       # Admin operations
│   │   ├── adminApprovalController.ts # Admin approval workflow
│   │   ├── notificationController.ts # Notification management
│   │   └── fcmController.ts         # Firebase Cloud Messaging
│   ├── services/                    # Business logic
│   │   ├── firebaseNotificationService.ts
│   │   ├── mlService.ts            # ML integration
│   │   ├── websocketService.ts     # Real-time communication
│   │   ├── geolocationService.ts   # Location services
│   │   ├── cloudinaryService.ts    # Image upload service
│   │   └── emailService.ts         # Email notifications
│   ├── routes/                      # API routes
│   │   ├── auth.ts                 # Authentication routes
│   │   ├── complaints.ts           # Complaint routes
│   │   ├── workOrders.ts           # Work order routes
│   │   ├── admin.ts                # Admin routes
│   │   ├── adminApproval.ts        # Admin approval routes
│   │   ├── notifications.ts        # Notification routes
│   │   └── ml.ts                   # ML service routes
│   ├── middleware/                  # Express middleware
│   │   ├── auth.ts                 # JWT authentication with role-based access
│   │   ├── errorHandler.ts         # Error handling
│   │   └── upload.ts               # File upload handling
│   ├── utils/                       # Utility functions
│   │   ├── auth.ts                 # Authentication utilities
│   │   ├── controllerUtils.ts      # Controller helpers
│   │   └── stateMachineValidator.ts # State machine validation
│   ├── config/                      # Configuration
│   │   ├── database.ts             # Database configuration
│   │   └── index.ts                # Main config
│   └── types/                       # TypeScript type definitions
├── prisma/
│   ├── schema.prisma               # Database schema with Decimal types
│   ├── migrations/                 # Database migrations
│   └── seed.ts                     # Database seeding
├── uploads/                         # File upload directory
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
└── README.md                       # Backend documentation
```

### **Key Files**:
- **`app.ts`**: Main Express application
- **`index.ts`**: Server entry point
- **`schema.prisma`**: Database schema with WorkOrderStatus enum and Decimal types
- **`stateMachineValidator.ts`**: Business logic validation for state transitions
- **`auth.ts`**: Role-based authentication middleware

### **Technology Stack**:
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with role-based access control
- **File Storage**: Cloudinary for image management
- **Validation**: express-validator with state machine validation

---

## 🎛️ **ADMIN PORTAL DIRECTORY** (`apps/admin-portal/`)

### **Purpose**: Next.js admin dashboard

### **Structure**:
```
apps/admin-portal/
├── src/
│   ├── app/                         # Next.js 14 app directory
│   │   ├── dashboard/               # Dashboard pages
│   │   ├── complaints/              # Complaint management
│   │   ├── work-orders/             # Work order management
│   │   ├── users/                   # User management
│   │   ├── analytics/               # Analytics pages
│   │   ├── approvals/               # Approval workflow
│   │   ├── settings/                # Settings pages
│   │   ├── login/                   # Authentication pages
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Home page
│   │   └── globals.css              # Global styles
│   ├── components/                  # React components
│   │   ├── ui/                      # Reusable UI components (shadcn/ui)
│   │   ├── Layout.tsx               # Main layout component
│   │   ├── Modal.tsx                # Modal components
│   │   ├── NotificationBell.tsx     # Notification component
│   │   ├── Dropdown.tsx             # Dropdown component
│   │   └── LoadingSpinner.tsx       # Loading component
│   ├── lib/                         # Utility libraries
│   │   ├── api.ts                   # API client
│   │   └── utils.ts                 # Utility functions
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.tsx              # Authentication hook
│   │   ├── useDashboardData.ts      # Dashboard data hook
│   │   ├── useDashboardQueries.ts   # Dashboard queries hook
│   │   ├── useWebSocket.ts          # WebSocket hook
│   │   ├── useNotificationService.ts # Notification hook
│   │   └── use-toast.ts             # Toast hook
│   ├── contexts/                    # React contexts
│   │   └── NotificationContext.tsx   # Notification context
│   ├── providers/                   # Context providers
│   │   └── QueryProvider.tsx        # TanStack Query provider
│   ├── services/                    # Service layer
│   ├── types/                       # TypeScript types
│   └── utils/                       # Utility functions
│       ├── auth.ts                  # Authentication utilities
│       └── format.ts                # Formatting utilities
├── public/                          # Static assets
├── next.config.js                   # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── package.json                     # Dependencies
└── README.md                        # Admin portal documentation
```

### **Technology Stack**:
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query for server state
- **Data Fetching**: React Query with caching
- **Forms**: React Hook Form with validation
- **Real-time**: WebSocket integration
- **Authentication**: JWT with role-based access

---

## 🤖 **ML SERVICE DIRECTORY** (`services/ml-service/`)

### **Purpose**: Machine Learning service for road issue classification

### **Structure**:
```
services/ml-service/
├── src/
│   ├── app.py                       # Main Flask application
│   ├── config/                      # Configuration
│   │   └── settings.py              # Service settings
│   ├── routes/                      # API routes
│   │   └── ml_routes.py             # ML API endpoints
│   ├── services/                    # ML service implementations
│   │   ├── ml_model_service.py      # Main ML service
│   │   └── image_processor.py       # Image processing
│   ├── utils/                       # ML utilities
│   │   ├── model_loader.py          # Model loading utilities
│   │   └── preprocessor.py          # Data preprocessing
│   └── __init__.py                  # Package initialization
├── models/                          # ML model files
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # ML service container
├── docker-compose.yml               # ML service containerization
├── test_ml_service.py               # Test suite
└── README.md                        # ML service documentation
```

### **Key Files**:
- **`app.py`**: Flask API for ML predictions
- **`ml_routes.py`**: ML API endpoints with batch processing
- **`ml_model_service.py`**: PyTorch ResNet18 model service
- **`requirements.txt`**: Python package dependencies

### **Technology Stack**:
- **Language**: Python 3.9+
- **Framework**: Flask with CORS support
- **ML**: PyTorch 2.1.0, TorchVision 0.16.0
- **Model**: Pre-trained ResNet18 (customized for 5 road issue categories)
- **Image Processing**: Pillow (PIL), OpenCV-compatible preprocessing
- **API**: RESTful endpoints with batch processing

### **API Endpoints**:
```
GET    /health                       # Health check
POST   /api/ml/predict               # Single image prediction
POST   /api/ml/predict/batch         # Batch image prediction
GET    /api/ml/model/info           # Model information
```

---

## 📦 **SHARED PACKAGES DIRECTORY** (`packages/`)

### **Purpose**: Shared code and types across all applications

### **Structure**:
```
packages/
├── shared-types/                    # Shared TypeScript types
│   ├── src/
│   │   ├── enums/                   # Shared enums
│   │   │   ├── UserRole.ts          # User roles enum
│   │   │   ├── ComplaintStatus.ts   # Complaint status enum
│   │   │   ├── WorkOrderStatus.ts   # Work order status enum
│   │   │   ├── IssueCategory.ts     # Issue category enum
│   │   │   ├── WorkOrderApprovalStatus.ts # Approval status enum
│   │   │   └── NotificationType.ts  # Notification type enum
│   │   ├── interfaces/              # Shared interfaces
│   │   │   ├── User.ts              # User interface
│   │   │   ├── Complaint.ts         # Complaint interface
│   │   │   ├── WorkOrder.ts         # Work order interface
│   │   │   ├── WorkOrderRequest.ts  # Work order request interface
│   │   │   ├── Notification.ts     # Notification interface
│   │   │   ├── Auth.ts              # Authentication interface
│   │   │   └── Common.ts            # Common interfaces
│   │   └── index.ts                 # Main export file
│   ├── dist/                        # Compiled JavaScript
│   ├── package.json                 # Package configuration
│   └── tsconfig.json                # TypeScript configuration
├── shared-config/                   # Shared configuration
└── shared-utils/                    # Shared utility functions
```

### **Key Features**:
- **Single Source of Truth**: All shared types and enums
- **Type Safety**: Consistent data models across all services
- **State Machine**: Enforced state transitions for complaints and work orders
- **Role-Based**: Different permissions based on user roles

---

## 🐳 **INFRASTRUCTURE DIRECTORY** (`infrastructure/`)

### **Purpose**: Shared infrastructure and deployment configurations

### **Structure**:
```
infrastructure/
├── docker/
│   ├── docker-compose.yml           # Development environment
│   ├── nginx.conf                   # Nginx reverse proxy configuration
│   └── env.template                 # Environment template
├── k8s/                            # Kubernetes manifests
├── monitoring/                      # Monitoring configurations
├── scripts/                        # Deployment scripts
├── ssl/                            # SSL certificates
└── terraform/                       # Infrastructure provisioning
```

### **Key Files**:
- **`docker-compose.yml`**: Local development environment with NeonDB
- **`nginx.conf`**: Reverse proxy configuration
- **`env.template`**: Environment variable template

### **Database Strategy**:
- **Primary**: NeonDB (PostgreSQL cloud)
- **Local Development**: PostgreSQL container (commented out)
- **Migrations**: Prisma migrate deploy for production

---

## 📚 **DOCUMENTATION DIRECTORY** (`docs/`)

### **Purpose**: Comprehensive project documentation

### **Structure**:
```
docs/
├── API_DOCUMENTATION.md             # Complete API reference
├── PROJECT_STRUCTURE.md             # Technical architecture
├── GITHUB_REPOSITORY_STRUCTURE.md   # Repository structure (this file)
├── BACKEND_DEVELOPER_GUIDE.md       # Backend development guide
├── ML_DEVELOPER_GUIDE.md            # ML development guide
├── CONTAINER_GUIDE.md               # Container deployment guide
├── SECURITY_CHECKLIST.md            # Security guidelines
├── TEAM_COLLABORATION_STRATEGY.md   # Collaboration strategy
├── TEAM_TODO_LIST.md                # Team task management
└── README.md                        # Documentation overview
```

### **Key Documents**:
- **`API_DOCUMENTATION.md`**: Complete API reference with all endpoints
- **`PROJECT_STRUCTURE.md`**: Technical architecture and development standards
- **`SECURITY_CHECKLIST.md`**: Security best practices and guidelines

---

## 🔧 **CONFIGURATION FILES**

### **Root Level**:
- **`.gitignore`**: Comprehensive Git ignore rules
- **`README.md`**: Project overview and setup instructions
- **`TEAM_SETUP_COMPLETE.md`**: Team collaboration completion guide

### **Component Level**:
- **`apps/mobile/README.md`**: Android development guide
- **`apps/api/README.md`**: Backend development guide
- **`apps/admin-portal/README.md`**: Admin portal development guide
- **`services/ml-service/README.md`**: ML development guide

---

## 👥 **TEAM COLLABORATION STRATEGY**

### **Selective Cloning Commands**:

#### **🤖 ML Developer (Team Member 2)**
```bash
git clone --filter=blob:none --sparse-checkout <repo-url> margwatch-ml
cd margwatch-ml
git sparse-checkout init --cone
git sparse-checkout set services/ml-service/ apps/api/src/services/mlService.ts apps/api/src/controllers/complaintController.ts packages/shared-types/ docs/
```
**Downloads**: ~5MB (only ML-related files)

#### **🖥️ Backend Developer (Team Member 1)**
```bash
git clone --filter=blob:none --sparse-checkout <repo-url> margwatch-backend
cd margwatch-backend
git sparse-checkout init --cone
git sparse-checkout set apps/api/ apps/admin-portal/ packages/shared-types/ docs/ infrastructure/
```
**Downloads**: ~15MB (backend + admin portal + docs + infrastructure)

#### **📱 Android Developer (You)**
```bash
git clone <repo-url> margwatch-full
cd margwatch-full
```
**Downloads**: ~50MB (everything)

---

## 🚀 **DEVELOPMENT WORKFLOW**

### **Branch Strategy**:
```
main                           # Production-ready code
├── feature/admin-portal-ml-enhancement  # Current development branch
├── feature/mobile-improvements           # Mobile app features
├── feature/backend-api-enhancements      # Backend features
└── feature/ml-model-updates             # ML model features
```

### **Commit Convention**:
```
type(scope): description

feat(mobile): add async image compression
fix(api): resolve state machine validation
docs(ml): update model documentation
refactor(admin): improve component reusability
```

### **Code Review Process**:
1. Create feature branch
2. Develop feature
3. Create pull request
4. Code review by team members
5. Merge to main branch

---

## 📊 **REPOSITORY STATISTICS**

### **File Count by Component**:
- **Mobile App**: ~120 files (Kotlin, XML, Gradle)
- **Backend API**: ~35 files (TypeScript, JSON, Prisma)
- **Admin Portal**: ~45 files (TypeScript, React, Next.js)
- **ML Service**: ~8 files (Python, Docker)
- **Shared Types**: ~15 files (TypeScript)
- **Documentation**: ~12 files (Markdown)
- **Infrastructure**: ~5 files (Docker, YAML)

### **Total Repository Size**:
- **Full Clone**: ~75MB
- **ML Developer Clone**: ~8MB
- **Backend Developer Clone**: ~25MB
- **Android Developer Clone**: ~75MB

---

## 🔒 **SECURITY FEATURES**

### **Protected Files**:
- **`.env` files**: Environment variables (not tracked)
- **`firebase-service-account.json`**: Firebase credentials (not tracked)
- **`google-services.json`**: Android Firebase config (not tracked)
- **API keys**: Stored in environment variables

### **Security Measures**:
- Comprehensive `.gitignore` rules
- Pre-commit hooks (disabled during reorganization)
- Security checklist documentation
- Environment variable templates
- JWT authentication with role-based access control
- State machine validation for business logic

---

## 📈 **SCALABILITY FEATURES**

### **Monorepo Benefits**:
- ✅ Single source of truth
- ✅ Shared documentation
- ✅ Coordinated releases
- ✅ Cross-component refactoring
- ✅ Shared types system

### **Selective Cloning Benefits**:
- ✅ Faster downloads
- ✅ Cleaner workspaces
- ✅ Focused development
- ✅ Reduced confusion

### **Architecture Benefits**:
- ✅ Microservices architecture
- ✅ Shared types system
- ✅ State machine validation
- ✅ Role-based access control
- ✅ Async image processing
- ✅ Real-time notifications

---

## 🎯 **NEXT STEPS**

### **For Team Members**:
1. **Clone repository** using appropriate command
2. **Read component-specific README**
3. **Follow development TODO lists**
4. **Set up development environment**
5. **Start development work**

### **For Project Lead**:
1. **Push to GitHub**
2. **Share repository URL**
3. **Provide clone commands**
4. **Monitor team progress**
5. **Coordinate integration**

---

## 📞 **SUPPORT & RESOURCES**

### **Documentation**:
- **Component READMEs**: Start here for each component
- **TODO Lists**: Comprehensive development plans
- **Security Guide**: Best practices and guidelines
- **Team Guide**: Collaboration strategies

### **Communication**:
- **GitHub Issues**: Bug tracking and feature requests
- **Pull Requests**: Code review and discussion
- **Team Meetings**: Regular coordination
- **Documentation**: Keep updated with decisions

---

*This repository structure is designed for efficient team collaboration while maintaining a single source of truth for the entire MargWatch project with shared types, state machine validation, and comprehensive security.*