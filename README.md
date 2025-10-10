# MargWatch - Road Issue Reporting Portal

A comprehensive road issue reporting system with mobile app, backend API, ML-powered issue detection, and admin portal.

## 🏗️ **Project Structure**

```
MargWatch/
├── 📱 mobile-app/              # Android app (Android Developer)
├── 🖥️ backend/                 # Express.js API (Backend Developer)
├── 🤖 ml-service/              # ML service (ML Developer)
├── 🎛️ admin-portal/             # Admin portal (Backend Developer)
├── 📚 docs/                    # Shared documentation
└── 🐳 infrastructure/          # Shared infrastructure
```

## 👥 **Team Collaboration**

### **Selective Cloning for Team Members**

Each team member can clone only what they need using Git sparse checkout:

#### **🤖 ML Developer (Team Member 2)**
```bash
git clone --filter=blob:none --sparse-checkout https://github.com/nisargg705/MargWatch.git margwatch-ml
cd margwatch-ml
git sparse-checkout init --cone
git sparse-checkout set ml-service/ backend/src/services/mlService.ts backend/src/controllers/complaintController.ts docs/
```

#### **🖥️ Backend Developer (Team Member 1)**
```bash
git clone --filter=blob:none --sparse-checkout https://github.com/nisargg705/MargWatch.git margwatch-backend
cd margwatch-backend
git sparse-checkout init --cone
git sparse-checkout set backend/ admin-portal/ docs/ infrastructure/
```

#### **📱 Android Developer (You)**
```bash
git clone https://github.com/nisargg705/MargWatch.git margwatch-full
cd margwatch-full
```

## 🚀 **Quick Start**

### **Full Development Setup**
```bash
# Clone repository
git clone https://github.com/nisargg705/MargWatch.git
cd MargWatch

# Start all services
cd infrastructure
docker-compose up -d

# Set up backend
cd ../backend
npm install
npx prisma migrate dev
npx prisma db seed

# Set up ML service
cd ../ml-service
pip install -r requirements.txt
python app.py

# Build mobile app
cd ../mobile-app
./gradlew assembleDebug
```

### **Component-Specific Setup**
- **Mobile App**: See `mobile-app/README.md`
- **Backend**: See `backend/README.md`
- **ML Service**: See `ml-service/README.md`

## 📊 **Architecture**

- **Mobile App**: Android (Kotlin) + Firebase FCM
- **Backend**: Express.js + TypeScript + Prisma + PostgreSQL + Redis
- **ML Service**: Python Flask + Computer Vision Model
- **Admin Portal**: Next.js (In Development)

## 🔧 **Development Workflow**

### **Branch Naming**
```
feature/component-description     # New features
bugfix/issue-description         # Bug fixes
hotfix/critical-issue           # Critical fixes
```

### **Commit Convention**
```
type(scope): description

feat(mobile): add complaint submission
fix(backend): resolve authentication issue
docs(ml): update model documentation
```

## 📚 **Documentation**

- **Team Collaboration**: `docs/TEAM_COLLABORATION_STRATEGY.md`
- **Backend Development**: `docs/BACKEND_ADMIN_PORTAL_TODO.md`
- **ML Development**: `docs/ML_MODEL_ENHANCEMENT_TODO.md`
- **Project Structure**: `docs/PROJECT_STRUCTURE.md`
- **Security**: `docs/SECURITY_CHECKLIST.md`

## 🛠️ **Technology Stack**

- **Mobile**: Kotlin, Jetpack Compose, Retrofit
- **Backend**: Node.js, Express.js, TypeScript, Prisma
- **ML**: Python, PyTorch/TensorFlow, FastAPI
- **Database**: PostgreSQL, Redis
- **Infrastructure**: Docker, Docker Compose

## 🎯 **Team Responsibilities**

- **Android Developer**: Mobile app development and testing
- **Backend Developer**: API development and admin portal
- **ML Developer**: Machine learning model development
- **All**: Documentation, testing, and code reviews

## 📞 **Support**

For issues and questions:
1. Check component-specific README files
2. Review documentation in `docs/`
3. Create GitHub issues with appropriate labels
4. Contact team members for specific components

---

*This project uses selective cloning to allow team members to work with only the components they need.*