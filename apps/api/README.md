# MargWatch Backend API

## 🖥️ **FOR BACKEND DEVELOPER ONLY**

This directory contains the Express.js backend API and admin portal.

### **Quick Start**
```bash
cd backend
npm install
npm run dev
```

### **Development**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis

### **Key Files**
- `src/controllers/` - API controllers
- `src/services/` - Business logic
- `src/routes/` - API routes
- `prisma/` - Database schema
- `package.json` - Dependencies

### **API Endpoints**
```
GET    /api/admin/dashboard/stats
GET    /api/admin/users
POST   /api/complaints/submit
GET    /api/work-orders
POST   /api/notifications/send
```

### **Integration Points**
- ML service for image predictions
- Mobile app API endpoints
- Admin portal backend
- Database management

### **Documentation**
- See `docs/backend/` for detailed documentation
- See `docs/BACKEND_ADMIN_PORTAL_TODO.md` for development plan

---

**Note**: This is your primary development area. Other team members don't need these files.
