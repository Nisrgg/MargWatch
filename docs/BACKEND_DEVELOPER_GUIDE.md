# Backend Developer Guide

## 🖥️ **FOR BACKEND DEVELOPER ONLY**

### **Your Responsibilities**
You are responsible for developing the backend API and admin portal for managing users, complaints, and work orders with state machine validation and shared types integration.

### **What You Need to Work With**

#### **✅ Backend API Directory**
```
apps/api/
├── src/
│   ├── controllers/             # API controllers
│   │   ├── authController.ts    # Authentication
│   │   ├── complaintController.ts # Complaint management
│   │   ├── workOrderController.ts # Work order management
│   │   ├── adminController.ts   # Admin operations
│   │   ├── adminApprovalController.ts # Admin approval workflow
│   │   ├── notificationController.ts # Notification management
│   │   └── fcmController.ts     # Firebase Cloud Messaging
│   ├── services/               # Business logic
│   │   ├── firebaseNotificationService.ts
│   │   ├── mlService.ts        # ML integration
│   │   ├── websocketService.ts # Real-time communication
│   │   ├── geolocationService.ts # Location services
│   │   ├── cloudinaryService.ts # Image upload service
│   │   └── emailService.ts     # Email notifications
│   ├── routes/                 # API routes
│   │   ├── auth.ts            # Authentication routes
│   │   ├── complaints.ts      # Complaint routes
│   │   ├── workOrders.ts      # Work order routes
│   │   ├── admin.ts           # Admin routes
│   │   ├── adminApproval.ts   # Admin approval routes
│   │   ├── notifications.ts   # Notification routes
│   │   └── ml.ts              # ML service routes
│   ├── middleware/             # Express middleware
│   │   ├── auth.ts            # JWT authentication with role-based access
│   │   ├── errorHandler.ts    # Error handling
│   │   └── upload.ts          # File upload handling
│   ├── utils/                  # Utility functions
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── controllerUtils.ts # Controller helpers
│   │   └── stateMachineValidator.ts # State machine validation
│   ├── config/                 # Configuration
│   │   ├── database.ts        # Database configuration
│   │   └── index.ts           # Main config
│   └── types/                  # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema with Decimal types
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Database seeding
├── uploads/                    # File upload directory
├── tests/                      # Test files
├── Dockerfile                  # Backend container
└── package.json                # Dependencies and scripts
```

#### **✅ Admin Portal Directory**
```
apps/admin-portal/
├── src/
│   ├── app/                   # Next.js 14 app directory
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── complaints/        # Complaint management
│   │   ├── work-orders/       # Work order management
│   │   ├── users/             # User management
│   │   ├── analytics/         # Analytics pages
│   │   ├── approvals/         # Approval workflow
│   │   ├── settings/          # Settings pages
│   │   ├── login/             # Authentication pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/             # React components
│   │   ├── ui/                # Reusable UI components (shadcn/ui)
│   │   ├── Layout.tsx         # Main layout component
│   │   ├── Modal.tsx          # Modal components
│   │   ├── NotificationBell.tsx # Notification component
│   │   ├── Dropdown.tsx       # Dropdown component
│   │   └── LoadingSpinner.tsx # Loading component
│   ├── lib/                   # Utility libraries
│   │   ├── api.ts             # API client
│   │   └── utils.ts           # Utility functions
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.tsx        # Authentication hook
│   │   ├── useDashboardData.ts # Dashboard data hook
│   │   ├── useDashboardQueries.ts # Dashboard queries hook
│   │   ├── useWebSocket.ts    # WebSocket hook
│   │   ├── useNotificationService.ts # Notification hook
│   │   └── use-toast.ts       # Toast hook
│   ├── contexts/              # React contexts
│   │   └── NotificationContext.tsx # Notification context
│   ├── providers/              # Context providers
│   │   └── QueryProvider.tsx  # TanStack Query provider
│   ├── services/               # Service layer
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utility functions
│       ├── auth.ts            # Authentication utilities
│       └── format.ts          # Formatting utilities
├── public/                     # Static assets
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── package.json                # Dependencies
└── README.md                   # Admin portal documentation
```

#### **✅ Shared Types Package**
```
packages/shared-types/
├── src/
│   ├── enums/                  # Shared enums
│   │   ├── UserRole.ts         # User roles enum
│   │   ├── ComplaintStatus.ts  # Complaint status enum
│   │   ├── WorkOrderStatus.ts  # Work order status enum
│   │   ├── IssueCategory.ts    # Issue category enum
│   │   ├── WorkOrderApprovalStatus.ts # Approval status enum
│   │   └── NotificationType.ts # Notification type enum
│   ├── interfaces/             # Shared interfaces
│   │   ├── User.ts             # User interface
│   │   ├── Complaint.ts        # Complaint interface
│   │   ├── WorkOrder.ts         # Work order interface
│   │   ├── WorkOrderRequest.ts  # Work order request interface
│   │   ├── Notification.ts     # Notification interface
│   │   ├── Auth.ts             # Authentication interface
│   │   └── Common.ts           # Common interfaces
│   └── index.ts                # Main export file
├── dist/                       # Compiled JavaScript
├── package.json                # Package configuration
└── tsconfig.json               # TypeScript configuration
```

### **What You DON'T Need**
- ❌ Mobile app code (`apps/mobile/`)
- ❌ ML service implementation (`services/ml-service/`)
- ❌ Android-specific files

### **Key Technologies**
- **Backend:** Node.js, Express.js, TypeScript, Prisma ORM
- **Database:** PostgreSQL with NeonDB (cloud)
- **Admin Portal:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Authentication:** JWT with role-based access control
- **File Storage:** Cloudinary
- **Real-time:** WebSocket for notifications
- **Validation:** express-validator with state machine validation

### **Development Setup**

#### **1. Clone Repository (Selective)**
```bash
git clone --filter=blob:none --sparse-checkout <repo-url> margwatch-backend
cd margwatch-backend
git sparse-checkout init --cone
git sparse-checkout set apps/api/ apps/admin-portal/ packages/shared-types/ docs/ infrastructure/
```

#### **2. Install Dependencies**
```bash
# Backend API
cd apps/api
npm install

# Admin Portal
cd ../admin-portal
npm install

# Shared Types
cd ../../packages/shared-types
npm install
```

#### **3. Environment Setup**
```bash
# Copy environment template
cp infrastructure/docker/env.template infrastructure/docker/.env

# Edit environment variables
# - DATABASE_URL (NeonDB connection string)
# - JWT_SECRET
# - CLOUDINARY credentials
# - ML_SERVICE_URL
```

#### **4. Database Setup**
```bash
cd apps/api
npx prisma migrate deploy
npx prisma db seed
```

#### **5. Start Development**
```bash
# Start all services
cd infrastructure/docker
docker-compose up -d --build

# Or start individually
cd apps/api && npm run dev
cd apps/admin-portal && npm run dev
```

### **Key Features to Implement**

#### **Backend API Features**
- ✅ **Authentication System:** JWT-based auth with role-based access control
- ✅ **Complaint Management:** CRUD operations with state machine validation
- ✅ **Work Order System:** Assignment, tracking, and completion workflow
- ✅ **Admin Approval:** Two-stage approval process for complaints and work orders
- ✅ **File Upload:** Image upload to Cloudinary with validation
- ✅ **ML Integration:** Automatic image classification
- ✅ **Real-time Notifications:** WebSocket and Firebase FCM
- ✅ **State Machine Validation:** Business logic enforcement

#### **Admin Portal Features**
- ✅ **Dashboard:** Real-time statistics and charts
- ✅ **Complaint Management:** Review, approve, reject complaints
- ✅ **Work Order Management:** Assign, track, and monitor work orders
- ✅ **User Management:** Role assignment and user administration
- ✅ **Analytics:** Detailed reporting and trend analysis
- ✅ **Real-time Updates:** WebSocket integration for live data
- ✅ **Component System:** Reusable UI components

### **Database Schema**

#### **Key Models**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  phone     String?
  role      UserRole @default(USER)
  isActive  Boolean  @default(true)
  fcmToken  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Complaint {
  id            String         @id @default(cuid())
  title         String
  description   String
  category      IssueCategory
  status        ComplaintStatus @default(REGISTERED)
  latitude      Decimal         @db.Decimal(10, 8)
  longitude     Decimal         @db.Decimal(11, 8)
  address       String?
  imageUrl      String?
  imageCount    Int?           @default(1)
  mlCategory    IssueCategory?
  mlConfidence  Float?
  mlModelVersion String?
  mlProcessingTime Float?
  rejectionReason String?
  severity        String       @default("MEDIUM")
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  approvedBy  String?
  approvedAt  DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model WorkOrder {
  id          String         @id @default(cuid())
  complaintId String
  complaint   Complaint      @relation(fields: [complaintId], references: [id], onDelete: Cascade)
  workerId    String
  worker      User           @relation(fields: [workerId], references: [id])
  status      WorkOrderStatus @default(ASSIGNED)
  priority    Int            @default(1)
  assignedAt  DateTime       @default(now())
  startedAt   DateTime?
  completedAt DateTime?
  workDescription String?
  materialsUsed   String?
  cost            Decimal?    @db.Decimal(10, 2)
  estimatedDuration Int?
  actualDuration    Int?
  qualityScore      Int?      @db.SmallInt
  reworkCount        Int      @default(0)
  adminApprovalStatus String?
  adminApprovedBy     String?
  adminApprovedAt     DateTime?
  adminRejectionReason String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

### **State Machine Validation**

#### **Complaint Status Transitions**
```typescript
// Valid transitions based on user role
const validTransitions = {
  REGISTERED: ['APPROVED', 'REJECTED'], // Admin only
  APPROVED: ['PROCESSING'], // Admin only
  PROCESSING: ['PENDING_REVIEW'], // Worker only
  PENDING_REVIEW: ['COMPLETED', 'PROCESSING'], // Admin review
  COMPLETED: [], // Terminal state
  REJECTED: [] // Terminal state
};
```

#### **Work Order Status Transitions**
```typescript
const validTransitions = {
  ASSIGNED: ['IN_PROGRESS', 'REJECTED'], // Worker only
  IN_PROGRESS: ['PENDING_REVIEW', 'REJECTED'], // Worker only
  PENDING_REVIEW: ['COMPLETED', 'IN_PROGRESS'], // Admin review
  COMPLETED: [], // Terminal state
  REJECTED: [] // Terminal state
};
```

### **API Endpoints**

#### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

#### **Complaints**
- `GET /api/complaints` - Get all complaints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints/:id` - Get specific complaint
- `PUT /api/complaints/:id` - Update complaint status

#### **Work Orders**
- `GET /api/work-orders/all` - Get all work orders (Admin)
- `GET /api/work-orders/my-orders` - Get worker's orders
- `POST /api/work-orders` - Create work order (Admin)
- `GET /api/work-orders/:id/details` - Get work order details
- `PUT /api/work-orders/:id/status` - Update work order status (Worker)
- `PUT /api/work-orders/:id/complete` - Complete work order (Worker)

#### **Admin Approval**
- `GET /api/admin-approval/pending-complaints` - Get pending complaints
- `GET /api/admin-approval/available-workers` - Get available workers
- `PUT /api/admin-approval/complaints/:id/approve-reject` - Approve/reject complaint
- `PUT /api/admin-approval/work-orders/:workOrderId/final-approve` - Final approve work order

### **Testing**

#### **Backend API Tests**
```bash
cd apps/api
npm test
```

#### **Admin Portal Tests**
```bash
cd apps/admin-portal
npm test
```

### **Deployment**

#### **Development**
```bash
docker-compose up -d --build
```

#### **Production**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
npx prisma migrate deploy
```

### **Best Practices**

#### **Code Organization**
- Use shared types from `@margwatch/shared-types`
- Implement state machine validation for business logic
- Use role-based access control for all protected endpoints
- Validate all inputs with express-validator
- Handle errors gracefully with proper HTTP status codes

#### **Security**
- Never expose sensitive data in API responses
- Use `filterUserForResponse` utility for user data
- Validate file uploads and image processing
- Implement rate limiting for API endpoints
- Use HTTPS in production

#### **Performance**
- Use database indexes for frequently queried fields
- Implement caching for expensive operations
- Use connection pooling for database connections
- Optimize image processing and compression
- Monitor API response times

### **Troubleshooting**

#### **Common Issues**
1. **Database Connection:** Check NeonDB connection string
2. **Authentication:** Verify JWT secret and token expiration
3. **File Upload:** Check Cloudinary credentials and file size limits
4. **ML Service:** Ensure ML service is running and accessible
5. **WebSocket:** Check WebSocket connection and event handling

#### **Debugging**
- Use `console.log` for debugging (remove in production)
- Check application logs for errors
- Use Prisma Studio for database inspection
- Monitor network requests in browser dev tools

### **Resources**
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

*This guide provides everything you need to develop the backend API and admin portal for MargWatch with state machine validation and shared types integration.*