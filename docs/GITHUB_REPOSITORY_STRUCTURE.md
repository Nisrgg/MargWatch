# MargWatch GitHub Repository Structure - Complete Guide

## 🏗️ **REPOSITORY OVERVIEW**

The MargWatch repository is organized as a **monorepo** with **selective cloning** capabilities, allowing each team member to download only the components they need for their work.

## 📁 **ROOT DIRECTORY STRUCTURE**

```
MargWatch/                           # Root repository
├── 📱 mobile-app/                   # Android mobile application
├── 🖥️ backend/                      # Express.js backend API
├── 🤖 ml-service/                   # Machine Learning service
├── 🎛️ admin-portal/                 # Admin portal (to be created)
├── 📚 docs/                         # Shared documentation
├── 🐳 infrastructure/                # Shared infrastructure
├── 📄 README.md                     # Main project overview
├── 📄 .gitignore                    # Git ignore rules
└── 📄 TEAM_SETUP_COMPLETE.md       # Team collaboration guide
```

---

## 📱 **MOBILE APP DIRECTORY** (`mobile-app/`)

### **Purpose**: Android mobile application for road issue reporting

### **Structure**:
```
mobile-app/
├── app/
│   ├── src/main/java/com/margwatch/
│   │   ├── config/                  # Network configuration
│   │   ├── data/                    # Data layer (API, local storage)
│   │   │   ├── local/               # Local data management
│   │   │   ├── model/               # Data models
│   │   │   ├── network/             # API client and services
│   │   │   └── repository/          # Data repository
│   │   ├── services/                # Background services
│   │   ├── ui/                      # User interface
│   │   │   ├── components/          # Reusable UI components
│   │   │   ├── screens/             # App screens
│   │   │   └── theme/               # App theming
│   │   └── utils/                   # Utility classes
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
- **`NetworkConfig.kt`**: IP address configuration for API calls
- **`MainActivity.kt`**: Main app entry point
- **`MargWatchApiService.kt`**: API service interface
- **`FirebaseNotificationService.kt`**: FCM notification handling

### **Technology Stack**:
- **Language**: Kotlin
- **UI**: Jetpack Compose
- **Architecture**: MVVM + Clean Architecture
- **Networking**: Retrofit + OkHttp
- **Notifications**: Firebase FCM

---

## 🖥️ **BACKEND DIRECTORY** (`backend/`)

### **Purpose**: Express.js backend API with TypeScript

### **Structure**:
```
backend/
├── src/
│   ├── controllers/                 # Request handlers
│   │   ├── authController.ts        # Authentication
│   │   ├── complaintController.ts   # Complaint management
│   │   ├── workOrderController.ts   # Work order management
│   │   └── adminController.ts       # Admin operations
│   ├── services/                    # Business logic
│   │   ├── firebaseNotificationService.ts
│   │   ├── mlService.ts            # ML integration
│   │   └── websocketService.ts     # Real-time communication
│   ├── routes/                      # API routes
│   ├── middleware/                  # Express middleware
│   ├── config/                      # Configuration
│   ├── types/                       # TypeScript types
│   └── utils/                       # Utility functions
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Database seeding
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
└── README.md                       # Backend documentation
```

### **Key Files**:
- **`app.ts`**: Main Express application
- **`index.ts`**: Server entry point
- **`schema.prisma`**: Database schema definition
- **`mlService.ts`**: ML service integration

### **Technology Stack**:
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT

---

## 🤖 **ML SERVICE DIRECTORY** (`ml-service/`)

### **Purpose**: Machine Learning service for road issue classification

### **Structure**:
```
ml-service/
├── app.py                          # Main Flask application
├── requirements.txt               # Python dependencies
├── docker-compose.yml             # ML service containerization
├── Dockerfile                     # ML service Docker config
└── README.md                      # ML service documentation
```

### **Key Files**:
- **`app.py`**: Flask API for ML predictions
- **`requirements.txt`**: Python package dependencies

### **Technology Stack**:
- **Language**: Python 3.9+
- **Framework**: Flask/FastAPI
- **ML**: PyTorch/TensorFlow
- **API**: RESTful endpoints

### **API Endpoints**:
```
POST   /predict              # Single image prediction
POST   /batch-predict        # Batch image prediction
GET    /model-info           # Model information
GET    /health               # Health check
```

---

## 📚 **DOCUMENTATION DIRECTORY** (`docs/`)

### **Purpose**: Comprehensive project documentation

### **Structure**:
```
docs/
├── README.md                           # Documentation overview
├── TEAM_TODO_LIST.md                   # Team collaboration guide
├── BACKEND_ADMIN_PORTAL_TODO.md        # Backend development plan
├── ML_MODEL_ENHANCEMENT_TODO.md        # ML development plan
├── PROJECT_STRUCTURE.md                # Technical architecture
├── SECURITY_CHECKLIST.md               # Security guidelines
├── TEAM_COLLABORATION_STRATEGY.md      # Collaboration strategy
├── API_DOCUMENTATION.md                # API reference
├── BACKEND_DEVELOPER_GUIDE.md          # Backend developer guide
└── ML_DEVELOPER_GUIDE.md               # ML developer guide
```

### **Key Documents**:
- **`TEAM_TODO_LIST.md`**: Complete team responsibilities and tasks
- **`BACKEND_ADMIN_PORTAL_TODO.md`**: 16-week backend development plan
- **`ML_MODEL_ENHANCEMENT_TODO.md`**: 16-week ML development plan
- **`SECURITY_CHECKLIST.md`**: Security best practices and guidelines

---

## 🐳 **INFRASTRUCTURE DIRECTORY** (`infrastructure/`)

### **Purpose**: Shared infrastructure and deployment configurations

### **Structure**:
```
infrastructure/
├── docker-compose.yml                 # Local development setup
├── docker-compose.prod.yml           # Production deployment
└── scripts/                          # Deployment scripts
```

### **Key Files**:
- **`docker-compose.yml`**: Local development environment
- **`docker-compose.prod.yml`**: Production deployment configuration

---

## 🎛️ **ADMIN PORTAL DIRECTORY** (`admin-portal/`)

### **Purpose**: Next.js admin dashboard (to be created by Team Member 1)

### **Structure** (Planned):
```
admin-portal/
├── src/
│   ├── app/                          # Next.js 14 app directory
│   ├── components/                   # React components
│   ├── lib/                          # Utility libraries
│   ├── hooks/                        # Custom React hooks
│   └── types/                        # TypeScript types
├── public/                           # Static assets
├── next.config.js                    # Next.js configuration
└── package.json                      # Dependencies
```

---

## 🔧 **CONFIGURATION FILES**

### **Root Level**:
- **`.gitignore`**: Comprehensive Git ignore rules
- **`README.md`**: Project overview and setup instructions
- **`TEAM_SETUP_COMPLETE.md`**: Team collaboration completion guide

### **Component Level**:
- **`mobile-app/README.md`**: Android development guide
- **`backend/README.md`**: Backend development guide
- **`ml-service/README.md`**: ML development guide

---

## 👥 **TEAM COLLABORATION STRATEGY**

### **Selective Cloning Commands**:

#### **🤖 ML Developer (Team Member 2)**
```bash
git clone --filter=blob:none --sparse-checkout <repo-url> margwatch-ml
cd margwatch-ml
git sparse-checkout init --cone
git sparse-checkout set ml-service/ backend/src/services/mlService.ts backend/src/controllers/complaintController.ts docs/
```
**Downloads**: ~5MB (only ML-related files)

#### **🖥️ Backend Developer (Team Member 1)**
```bash
git clone --filter=blob:none --sparse-checkout <repo-url> margwatch-backend
cd margwatch-backend
git sparse-checkout init --cone
git sparse-checkout set backend/ admin-portal/ docs/ infrastructure/
```
**Downloads**: ~15MB (backend + docs + infrastructure)

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

feat(mobile): add complaint submission
fix(backend): resolve authentication issue
docs(ml): update model documentation
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
- **Mobile App**: ~80 files (Kotlin, XML, Gradle)
- **Backend**: ~25 files (TypeScript, JSON, Prisma)
- **ML Service**: ~5 files (Python, Docker)
- **Documentation**: ~10 files (Markdown)
- **Infrastructure**: ~3 files (Docker, YAML)

### **Total Repository Size**:
- **Full Clone**: ~50MB
- **ML Developer Clone**: ~5MB
- **Backend Developer Clone**: ~15MB
- **Android Developer Clone**: ~50MB

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

---

## 📈 **SCALABILITY FEATURES**

### **Monorepo Benefits**:
- ✅ Single source of truth
- ✅ Shared documentation
- ✅ Coordinated releases
- ✅ Cross-component refactoring

### **Selective Cloning Benefits**:
- ✅ Faster downloads
- ✅ Cleaner workspaces
- ✅ Focused development
- ✅ Reduced confusion

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

*This repository structure is designed for efficient team collaboration while maintaining a single source of truth for the entire MargWatch project.*
