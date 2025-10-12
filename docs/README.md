# MargWatch - Road Issue Reporting Portal

A comprehensive road issue reporting system with mobile app, backend API, ML-powered issue detection, and admin portal.

## 🏗️ Architecture

- **Backend**: Express.js + TypeScript + Prisma + PostgreSQL + Redis
- **Mobile App**: Android (Kotlin) + Firebase FCM
- **ML Service**: Python Flask + Computer Vision Model
- **Admin Portal**: React/Next.js (In Development)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Android Studio (for mobile development)
- Python 3.8+ (for ML service)

### Setup
```bash
# Clone repository
git clone <repository-url>
cd MargWatch

# Copy environment file
cp margwatch_project/.env.example margwatch_project/.env

# Start all services
cd margwatch_project
docker-compose up -d

# Run database migrations
cd backend
npx prisma migrate dev
npx prisma db seed

# Build and install mobile app
cd ../MargWatch
./gradlew assembleDebug installDebug
```

### Access Points
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **ML Service**: http://localhost:5001
- **Admin Portal**: http://localhost:3000 (Coming Soon)

## 📱 Mobile App

The Android app allows users to:
- Report road issues with photos and location
- View complaint status and updates
- Receive real-time notifications
- Track complaint history

### Test Accounts
- **User**: user@roadportal.com / user123
- **Worker**: worker1@roadportal.com / worker123
- **Admin**: admin@roadportal.com / [Set via ADMIN_PASSWORD env var]

## 🔧 Development

### Backend Development
```bash
cd margwatch_project/backend
npm run dev          # Start with hot reload
npm run build        # Build TypeScript
npm test            # Run tests
```

### ML Service Development
```bash
cd margwatch_project/ml-service
python app.py       # Start Flask server
pip install -r requirements.txt
```

### Mobile App Development
```bash
cd MargWatch
./gradlew assembleDebug    # Build APK
./gradlew installDebug    # Install on device
```

## 🧪 Testing

### API Testing
```bash
# Test complaint submission
curl -X POST http://localhost:5000/api/complaints/submit \
  -H "Authorization: Bearer <token>" \
  -F "images=@test-image.jpg" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"

# Test ML prediction
curl -X POST http://localhost:5001/predict \
  -F "image=@test-image.jpg"
```

### Mobile Testing
- Connect Android device via USB
- Enable USB debugging
- Run `./gradlew installDebug`

## 📊 Database Schema

### Key Tables
- **users**: User accounts and authentication
- **complaints**: Road issue reports
- **work_orders**: Maintenance tasks
- **notifications**: System notifications
- **admin_approvals**: Administrative actions

### Relationships
- Users can have multiple complaints
- Complaints can have multiple work orders
- Work orders can have multiple notifications

## 🔐 Security

- JWT-based authentication
- Role-based access control (USER, WORKER, ADMIN)
- Input validation and sanitization
- CORS configuration
- Rate limiting

## 📈 Performance

- Redis caching for session management
- Database connection pooling
- Image compression and optimization
- API response compression
- ML model inference optimization

## 🚀 Deployment

### Production Setup
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `FIREBASE_SERVICE_ACCOUNT`: Firebase credentials
- `CLOUDINARY_URL`: Image storage credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- TypeScript for backend
- Kotlin for mobile app
- Python for ML service
- Follow existing patterns and conventions

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the [Team TODO List](TEAM_TODO_LIST.md)
2. Review existing GitHub issues
3. Create a new issue with detailed description
4. Contact team members for specific components

## 🎯 Roadmap

- [ ] Admin portal development
- [ ] Real ML model implementation
- [ ] Performance optimization
- [ ] Production deployment
- [ ] Mobile app store release

---

*For detailed development guidelines, see [TEAM_TODO_LIST.md](TEAM_TODO_LIST.md)*
