# Backend Admin Portal Development Guide

## 🖥️ **FOR BACKEND DEVELOPER ONLY**

### **Your Responsibilities**
You are responsible for developing the backend API and admin portal for managing users, complaints, and work orders.

### **What You Need to Work With**

#### **✅ Backend API Directory**
```
backend/
├── src/
│   ├── controllers/             # API controllers
│   ├── services/               # Business logic
│   ├── routes/                 # API routes
│   ├── middleware/             # Express middleware
│   ├── models/                 # Database models
│   ├── utils/                  # Utility functions
│   ├── config/                 # Configuration
│   └── types/                  # TypeScript types
├── prisma/                      # Database schema and migrations
├── tests/                      # Test files
├── Dockerfile                  # Backend container
└── package.json                # Dependencies and scripts
```

#### **✅ Admin Portal Directory (To Create)**
```
admin-portal/
├── src/
│   ├── app/                   # Next.js 14 app directory
│   ├── components/             # React components
│   ├── lib/                   # Utility libraries
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   └── styles/                # CSS styles
├── public/                    # Static assets
├── tests/                     # Test files
├── next.config.js             # Next.js configuration
└── package.json               # Dependencies and scripts
```

#### **✅ ML Integration Files**
```
backend/src/services/mlService.ts          # ML service integration
backend/src/controllers/complaintController.ts  # ML API endpoints
```

### **What You DON'T Need**
- ❌ Android app files (`MargWatch/` directory)
- ❌ ML model training code (handled by Team Member 2)
- ❌ Mobile-specific configurations
- ❌ ML model implementation details

### **Your Development Workflow**

#### **1. Backend API Development**
```bash
cd backend
npm install
npm run dev
```

#### **2. Admin Portal Development**
```bash
cd admin-portal
npm install
npm run dev
```

#### **3. Database Management**
```bash
cd backend
npx prisma migrate dev
npx prisma studio
```

### **Key API Endpoints You Need to Implement**
```
# Admin Portal APIs
GET    /api/admin/dashboard/stats
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
GET    /api/admin/complaints
PUT    /api/admin/complaints/:id/status
POST   /api/admin/work-orders
GET    /api/admin/work-orders
PUT    /api/admin/work-orders/:id
GET    /api/admin/reports
POST   /api/admin/reports/generate
GET    /api/admin/analytics
POST   /api/admin/notifications/send
GET    /api/admin/settings
PUT    /api/admin/settings

# ML Integration APIs
POST   /api/complaints/submit    # Calls ML service
GET    /api/ml/performance       # ML performance metrics
```

### **Integration Points with ML Service**
- Send images to ML service for prediction
- Receive predictions and store in database
- Display ML performance metrics in admin portal
- Handle ML service errors gracefully

### **Integration Points with Mobile App**
- Provide REST APIs for mobile app
- Handle authentication and authorization
- Manage user sessions and tokens
- Process complaint submissions

### **Development Environment**
- **Backend**: Node.js 18+, Express.js, TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Admin Portal**: Next.js 14, TypeScript, Tailwind CSS
- **Authentication**: JWT
- **File Storage**: Cloudinary

### **Testing Your Backend**
```bash
# Test API endpoints
curl -X GET http://localhost:5000/api/admin/dashboard/stats
curl -X POST http://localhost:5000/api/complaints/submit \
  -F "images=@test-image.jpg" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"

# Test database connection
cd backend && npx prisma studio
```

### **Communication with Other Team Members**
- **ML Developer**: Coordinate on API integration and data flow
- **Android Developer**: Provide API documentation and support
- **Project Lead**: Report progress and blockers

### **Resources**
- **Comprehensive TODO**: `BACKEND_ADMIN_PORTAL_TODO.md`
- **Project Structure**: `PROJECT_STRUCTURE.md`
- **Team Collaboration**: `TEAM_TODO_LIST.md`
- **API Documentation**: `API_DOCUMENTATION.md`

---

## 🚀 **Quick Start for Backend Developer**

1. **Clone the repository**
2. **Set up backend**: `cd backend && npm install`
3. **Set up database**: `npx prisma migrate dev`
4. **Create admin portal**: Follow TODO list
5. **Integrate with ML service**: Use provided API specifications

**Focus on**: API development, admin portal, database management, and system integration.

**Don't worry about**: Mobile app development or ML model training.
