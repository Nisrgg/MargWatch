# MargWatch: AI-Powered Road Issue Reporting System

> A comprehensive, full-stack solution for intelligent road issue reporting and management, featuring real-time AI classification, mobile reporting, and administrative oversight.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

## 🚀 Core Features

- **📱 End-to-End Mobile Reporting:** Native Android app with Jetpack Compose for seamless complaint submission with GPS location and async image compression
- **🧠 AI-Powered Classification:** PyTorch ResNet18 model automatically classifies road issues from user-submitted images with high accuracy
- **⚙️ Robust Backend API:** Secure, scalable backend built with Node.js, Express, and TypeScript, handling complex business logic and state machine validation
- **📊 Real-Time Admin Dashboard:** Comprehensive admin portal built with Next.js and React that updates live using WebSockets for instant data synchronization
- **🔒 Secure & Scalable Architecture:** Fully containerized with Docker, featuring role-based access control, state machine validation, and professional monorepo structure
- **🌐 Multi-Service Integration:** Seamless integration between mobile app, admin portal, ML service, and database with real-time notifications
- **📈 Advanced Analytics:** Dashboard with statistics, charts, and real-time monitoring of complaint processing workflows
- **🛡️ Production-Ready Security:** JWT authentication, input validation, geographic bounds checking, and comprehensive error handling

## 🛠️ Tech Stack

### Frontend & Mobile
- **Admin Portal:** Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Mobile App:** Android (Kotlin), Jetpack Compose, Material Design 3
- **State Management:** TanStack Query, React Context, StateFlow
- **Real-time:** WebSockets, Firebase Cloud Messaging
- **UI Components:** Reusable component system with Snackbar error handling

### Backend & API
- **API Server:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL with Prisma ORM (NeonDB cloud)
- **Authentication:** JWT tokens, bcrypt password hashing, role-based access control
- **File Storage:** Cloudinary for image management
- **Validation:** express-validator, comprehensive input sanitization, state machine validation
- **Real-time:** WebSocket for notifications

### Machine Learning
- **ML Framework:** PyTorch 2.1.0, TorchVision 0.16.0
- **Model:** Pre-trained ResNet18 (customized for 5 road issue categories)
- **API:** Flask with CORS support
- **Image Processing:** Pillow (PIL), OpenCV-compatible preprocessing
- **Batch Processing:** Efficient handling of multiple images

### Infrastructure & DevOps
- **Containerization:** Docker, Docker Compose
- **Database:** NeonDB (PostgreSQL cloud) with connection pooling
- **Monitoring:** Health checks, comprehensive logging
- **Development:** Hot reload, TypeScript compilation, Prisma migrations

## 🚀 Quick Start

Get the entire MargWatch system running in minutes:

```bash
# 1. Clone the repository
git clone <repository-url>
cd MargWatch

# 2. Set up environment variables
cp infrastructure/docker/env.template infrastructure/docker/.env
# Edit the .env file with your configuration

# 3. Start all services with Docker Compose
cd infrastructure/docker
docker-compose up -d --build

# 4. Set up the database
cd ../../apps/api
npx prisma migrate deploy
npx prisma db seed

# 5. Access the applications
# Admin Portal: http://localhost:3000
# Backend API: http://localhost:5000
# ML Service: http://localhost:8000
```

That's it! The entire system is now running. 🎉

## 🌐 Access Points

Once the system is running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Admin Portal** | http://localhost:3000 | Web-based admin dashboard |
| **Backend API** | http://localhost:5000 | REST API endpoints |
| **ML Service** | http://localhost:8000 | AI image classification service |
| **API Docs** | http://localhost:5000/api-docs | Interactive API documentation |

## 👥 Test Credentials

### Admin Account
- **Email:** admin@margwatch.com
- **Password:** admin123
- **Role:** Full system access, complaint approval, work order management

### Worker Account
- **Email:** worker@margwatch.com
- **Password:** worker123
- **Role:** Work order completion, status updates

### Regular User Account
- **Email:** user@margwatch.com
- **Password:** user123
- **Role:** Complaint submission, status tracking

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │  Admin Portal   │    │   ML Service    │
│   (Android)     │    │   (Next.js)     │    │   (Flask)       │
│                 │    │                 │    │                 │
│ • Jetpack       │    │ • React 18      │    │ • PyTorch       │
│   Compose       │    │ • TypeScript    │    │ • ResNet18      │
│ • GPS Location  │    │ • Real-time     │    │ • Image         │
│ • Async Image   │    │   Updates       │    │   Classification│
│   Compression   │    │ • Component     │    │ • Batch         │
│ • State         │    │   Reusability   │    │   Processing    │
│   Validation    │    │ • Snackbar      │    │                 │
│                 │    │   Error Handling│    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Backend API           │
                    │     (Node.js/Express)     │
                    │                           │
                    │ • JWT Authentication      │
                    │ • Role-Based Access       │
                    │ • State Machine           │
                    │   Validation              │
                    │ • WebSocket Notifications │
                    │ • File Upload Handling    │
                    │ • Shared Types System     │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │     NeonDB                │
                    │     (PostgreSQL Cloud)     │
                    │                           │
                    │ • User Management         │
                    │ • Complaint Tracking      │
                    │ • Work Order System       │
                    │ • Audit Logs              │
                    │ • Decimal Precision       │
                    └───────────────────────────┘
```

## 📱 Mobile App Features

- **📸 Smart Image Capture:** High-quality image capture with async compression
- **📍 GPS Integration:** Automatic location detection with address reverse geocoding
- **🔄 Offline Support:** State persistence across app restarts and configuration changes
- **📱 Modern UI:** Material Design 3 with Jetpack Compose
- **🔔 Real-time Notifications:** Firebase Cloud Messaging for status updates
- **👤 User Management:** Profile management and complaint history
- **🛡️ Client-Side Validation:** State machine validation for business logic
- **🎨 Reusable Components:** Comprehensive component system with consistent styling

## 🖥️ Admin Portal Features

- **📊 Real-time Dashboard:** Live statistics and charts with WebSocket updates
- **📋 Complaint Management:** Comprehensive complaint review and approval workflow
- **👷 Work Order System:** Assignment, tracking, and completion management
- **📈 Analytics:** Detailed reporting and trend analysis
- **👥 User Management:** Role-based access control and user administration
- **🔔 Notification Center:** Real-time alerts and system notifications
- **🎨 Component System:** Reusable UI components with consistent design

## 🤖 AI/ML Capabilities

- **🧠 Intelligent Classification:** Automatic categorization of road issues
- **📊 Confidence Scoring:** ML confidence levels for prediction reliability
- **🔄 Batch Processing:** Efficient handling of multiple images
- **⚡ Real-time Inference:** Fast prediction with ~150ms processing time
- **🛡️ Fallback Handling:** Graceful degradation when ML service is unavailable
- **📈 Model Versioning:** Track model versions and performance metrics

## 🔒 Security Features

- **🔐 JWT Authentication:** Secure token-based authentication
- **👥 Role-Based Access Control:** Admin, Worker, and User role separation
- **🛡️ Input Validation:** Comprehensive validation and sanitization
- **🌍 Geographic Validation:** Service area bounds checking
- **📝 Audit Logging:** Complete audit trail for all actions
- **🔒 Secure File Handling:** Safe image upload and processing
- **🔄 State Machine Validation:** Enforced business logic transitions

## 📊 Database Schema

The system uses a well-designed PostgreSQL schema with:

- **Users:** Authentication, roles, and profile management
- **Complaints:** Issue tracking with status state machine
- **Work Orders:** Task assignment and completion tracking
- **Notifications:** Real-time communication system
- **Audit Logs:** Complete system activity tracking
- **Decimal Precision:** Accurate financial and geographic data

## 🚀 Deployment

### Development
```bash
# Start all services
docker-compose up -d --build

# Run database migrations
npx prisma migrate dev

# Seed initial data
npx prisma db seed
```

### Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml up -d --build

# Run production migrations
npx prisma migrate deploy
```

## 🧪 Testing

The project includes comprehensive testing:

- **Backend API:** Unit tests for all controllers and services
- **ML Service:** Test suite for image classification endpoints
- **Mobile App:** UI tests and integration tests
- **End-to-End:** Complete workflow testing

Run tests:
```bash
# Backend tests
cd apps/api && npm test

# ML service tests
cd services/ml-service && python test_ml_service.py

# Mobile tests
cd apps/mobile && ./gradlew test
```

## 📈 Performance Metrics

- **API Response Time:** <200ms average
- **ML Inference:** ~150ms per image
- **Database Queries:** Optimized with proper indexing
- **Real-time Updates:** <100ms WebSocket latency
- **Image Processing:** Async compression and optimization

## 🔄 Shared Types System

The project uses a centralized shared types system:

- **Package:** `@margwatch/shared-types`
- **Enums:** UserRole, ComplaintStatus, WorkOrderStatus, IssueCategory
- **Interfaces:** User, Complaint, WorkOrder, Notification
- **Usage:** Imported by API, Admin Portal, and Mobile App
- **Validation:** Consistent data validation across all services

## 🛡️ State Machine Validation

Business logic is enforced through state machine validation:

- **Backend:** `StateMachineValidator` utility
- **Mobile:** Client-side validation in `StateMachineValidator.kt`
- **Business Logic:** Enforced state transitions for complaints and work orders
- **Role-Based:** Different transitions allowed based on user roles

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PyTorch Team** for the excellent ML framework
- **Next.js Team** for the amazing React framework
- **Prisma Team** for the fantastic database toolkit
- **Android Team** for Jetpack Compose
- **Flask Team** for the high-performance Python framework

## 📞 Support

For support and questions:

- 📧 Email: support@margwatch.com
- 📱 Mobile: +1 (555) 123-4567
- 🌐 Website: https://margwatch.com
- 📖 Documentation: [docs.margwatch.com](https://docs.margwatch.com)

---

<div align="center">

**Built with ❤️ for better roads and safer communities**

[⭐ Star this repo](https://github.com/your-username/MargWatch) • [🐛 Report Bug](https://github.com/your-username/MargWatch/issues) • [💡 Request Feature](https://github.com/your-username/MargWatch/issues)

</div>