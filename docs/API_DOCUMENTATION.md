# MargWatch API Documentation
## Complete API Reference Guide

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "token": "jwt_token_here"
  }
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "token": "jwt_token_here"
  }
}
```

### Logout User
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": "USER",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Update User Profile
```http
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### Test Notification (Public)
```http
POST /api/auth/test-notification
Content-Type: application/json

{
  "email": "user@example.com",
  "title": "Test Notification",
  "message": "This is a test notification"
}
```

---

## 📝 Complaint Endpoints

### Get All Complaints
```http
GET /api/complaints
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status
- `category` (optional): Filter by category

**Response:**
```json
{
  "success": true,
  "data": {
    "complaints": [
      {
        "id": "complaint_id",
        "title": "Pothole on Main Street",
        "description": "Large pothole causing vehicle damage",
        "category": "POTHOLE",
        "status": "REGISTERED",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "address": "123 Main St, New York, NY",
        "imageUrl": "https://cloudinary.com/image.jpg",
        "imageCount": 3,
        "mlCategory": "POTHOLE",
        "mlConfidence": 0.95,
        "mlModelVersion": "v1.0",
        "mlProcessingTime": 0.234,
        "severity": "MEDIUM",
        "rejectionReason": null,
        "createdAt": "2024-01-01T00:00:00Z",
        "user": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Create Complaint
```http
POST /api/complaints
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  "title": "Pothole on Main Street",
  "description": "Large pothole causing vehicle damage",
  "category": "POTHOLE",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "123 Main St, New York, NY",
  "images": [file1, file2, file3]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "complaint": {
      "id": "complaint_id",
      "title": "Pothole on Main Street",
      "description": "Large pothole causing vehicle damage",
      "category": "POTHOLE",
      "status": "REGISTERED",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, New York, NY",
      "imageUrl": "https://cloudinary.com/image.jpg",
      "imageCount": 3,
      "mlCategory": "POTHOLE",
      "mlConfidence": 0.95,
      "mlModelVersion": "v1.0",
      "mlProcessingTime": 0.234,
      "severity": "MEDIUM",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Get Specific Complaint
```http
GET /api/complaints/:id
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "complaint": {
      "id": "complaint_id",
      "title": "Pothole on Main Street",
      "description": "Large pothole causing vehicle damage",
      "category": "POTHOLE",
      "status": "REGISTERED",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, New York, NY",
      "imageUrl": "https://cloudinary.com/image.jpg",
      "imageCount": 3,
      "mlCategory": "POTHOLE",
      "mlConfidence": 0.95,
      "mlModelVersion": "v1.0",
      "mlProcessingTime": 0.234,
      "severity": "MEDIUM",
      "rejectionReason": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "workOrders": [
        {
          "id": "work_order_id",
          "status": "ASSIGNED",
          "priority": 2,
          "assignedAt": "2024-01-01T00:00:00Z",
          "worker": {
            "firstName": "Jane",
            "lastName": "Smith"
          }
        }
      ],
      "updates": [
        {
          "id": "update_id",
          "status": "PROCESSING",
          "description": "Work started on complaint",
          "createdAt": "2024-01-01T00:00:00Z"
        }
      ]
    }
  }
}
```

### Update Complaint Status
```http
PUT /api/complaints/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "PROCESSING",
  "description": "Work has started on this complaint"
}
```

---

## 👷 Work Order Endpoints

### Get All Work Orders (Admin)
```http
GET /api/work-orders/all
Authorization: Bearer <admin_jwt_token>
```

### Get Worker's Work Orders
```http
GET /api/work-orders/my-orders
Authorization: Bearer <worker_jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority

### Create Work Order (Admin)
```http
POST /api/work-orders
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "complaintId": "complaint_id",
  "workerId": "worker_id",
  "priority": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Work order created successfully",
  "data": {
    "workOrder": {
      "id": "work_order_id",
      "complaintId": "complaint_id",
      "workerId": "worker_id",
      "status": "ASSIGNED",
      "priority": 2,
      "assignedAt": "2024-01-01T00:00:00Z",
      "estimatedDuration": null,
      "actualDuration": null,
      "qualityScore": null,
      "reworkCount": 0,
      "adminApprovalStatus": null,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Get Work Order Details
```http
GET /api/work-orders/:id/details
Authorization: Bearer <jwt_token>
```

### Update Work Order Status (Worker)
```http
PUT /api/work-orders/:id/status
Authorization: Bearer <worker_jwt_token>
Content-Type: multipart/form-data

{
  "status": "IN_PROGRESS",
  "description": "Started work on the pothole",
  "image": [file]
}
```

### Complete Work Order (Worker)
```http
PUT /api/work-orders/:id/complete
Authorization: Bearer <worker_jwt_token>
Content-Type: multipart/form-data

{
  "workDescription": "Pothole filled successfully",
  "materialsUsed": "Asphalt, gravel",
  "cost": 150.00,
  "images": [file1, file2]
}
```

### Get Pending Approvals (Admin)
```http
GET /api/work-orders/pending-approvals
Authorization: Bearer <admin_jwt_token>
```

### Approve Work Order (Admin)
```http
POST /api/work-orders/approve
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "workOrderId": "work_order_id",
  "approvalStatus": "APPROVED"
}
```

---

## 📊 Admin Approval Endpoints

### Get Pending Complaints
```http
GET /api/admin-approval/pending-complaints
Authorization: Bearer <admin_jwt_token>
```

### Get Available Workers
```http
GET /api/admin-approval/available-workers
Authorization: Bearer <admin_jwt_token>
```

### Approve/Reject Complaint
```http
PUT /api/admin-approval/complaints/:id/approve-reject
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "action": "approve",
  "priority": 2,
  "notes": "Approved for immediate action"
}
```

**Reject Complaint:**
```json
{
  "action": "reject",
  "reason": "Duplicate complaint"
}
```

### Final Approve Work Order
```http
PUT /api/admin-approval/work-orders/:workOrderId/final-approve
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "approvalStatus": "APPROVED",
  "notes": "Work completed satisfactorily"
}
```

---

## 🔔 Notification Endpoints

### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `unread` (optional): Filter unread notifications
- `type` (optional): Filter by notification type

### Mark Notification as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <jwt_token>
```

### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <jwt_token>
```

---

## 🤖 ML Service Endpoints

### Predict Issue Category
```http
POST /api/ml/predict
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "image": "base64_encoded_image_data"
}
```

**Response:**
```json
{
  "success": true,
  "category": "POTHOLE",
  "confidence": 0.95,
  "model_version": "mock_v1.0",
  "processing_time": 0.234,
  "image_size": [1920, 1080],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Batch Prediction
```http
POST /api/ml/predict/batch
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "images": ["base64_image1", "base64_image2"]
}
```

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "category": "POTHOLE",
      "confidence": 0.95,
      "image_index": 0
    },
    {
      "category": "ROAD_INSTABILITY",
      "confidence": 0.87,
      "image_index": 1
    }
  ],
  "total_images": 2,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### ML Service Health Check
```http
GET /api/ml/health
```

**Response:**
```json
{
  "status": "healthy",
  "message": "ML Service is running",
  "model_status": "loaded",
  "model_version": "mock_v1.0",
  "categories": ["POTHOLE", "ROAD_INSTABILITY", "STREETLIGHT_DAMAGE", "TREE_DAMAGE", "OTHER"],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Get Model Information
```http
GET /api/ml/model/info
```

---

## 🔥 Firebase Cloud Messaging Endpoints

### Register FCM Token
```http
POST /api/fcm/register
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fcmToken": "firebase_cloud_messaging_token"
}
```

### Send Test Notification
```http
POST /api/fcm/send-test
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Test Notification",
  "message": "This is a test notification"
}
```

---

## 👨‍💼 Admin Endpoints

### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <admin_jwt_token>
```

### Update User Role
```http
PUT /api/admin/users/:id/role
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "role": "ADMIN"
}
```

### Get System Statistics
```http
GET /api/admin/stats
Authorization: Bearer <admin_jwt_token>
```

---

## 🔍 Health Check Endpoints

### Backend Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "cloudinary": "healthy",
    "mlService": "healthy"
  }
}
```

### ML Service Health Check
```http
GET http://localhost:8000/health
```

---

## 📋 Data Models

### User Model
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'WORKER';
  isActive: boolean;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Complaint Model
```typescript
interface Complaint {
  id: string;
  title: string;
  description: string;
  category: 'POTHOLE' | 'ROAD_INSTABILITY' | 'STREETLIGHT_DAMAGE' | 'TREE_DAMAGE' | 'OTHER';
  status: 'REGISTERED' | 'APPROVED' | 'PROCESSING' | 'PENDING_REVIEW' | 'COMPLETED' | 'REJECTED';
  latitude: number; // Decimal precision
  longitude: number; // Decimal precision
  address?: string;
  imageUrl?: string; // JSON string of image URLs
  imageCount?: number;
  mlCategory?: string;
  mlConfidence?: number;
  mlModelVersion?: string;
  mlProcessingTime?: number;
  rejectionReason?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Work Order Model
```typescript
interface WorkOrder {
  id: string;
  complaintId: string;
  workerId: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'REJECTED';
  priority: number; // 1 = Low, 2 = Medium, 3 = High
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  workDescription?: string;
  materialsUsed?: string;
  cost?: number; // Decimal precision
  estimatedDuration?: number; // In minutes
  actualDuration?: number; // In minutes
  qualityScore?: number; // 1-5 rating
  reworkCount: number;
  adminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminApprovedBy?: string;
  adminApprovedAt?: Date;
  adminRejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Notification Model
```typescript
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'complaint_status' | 'work_update' | 'general';
  isRead: boolean;
  createdAt: Date;
}
```

---

## ⚠️ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Resource already exists
- `FILE_UPLOAD_ERROR`: File upload failed
- `ML_SERVICE_ERROR`: ML service unavailable
- `DATABASE_ERROR`: Database operation failed
- `STATE_TRANSITION_ERROR`: Invalid state machine transition

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Validation Error
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## 🔧 Rate Limiting

### Default Limits
- **General API**: 100 requests per minute per IP
- **Authentication**: 10 requests per minute per IP
- **File Upload**: 20 requests per minute per IP
- **ML Service**: 50 requests per minute per IP

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 📱 Mobile App Integration

### Android API Client Example
```kotlin
class ApiClient {
    private val baseUrl = "http://YOUR_IP:5000/api/"
    
    suspend fun createComplaint(complaint: Complaint): Response<ComplaintResponse> {
        return apiService.createComplaint(complaint)
    }
    
    suspend fun uploadImage(imageFile: File): Response<ImageUploadResponse> {
        return apiService.uploadImage(imageFile)
    }
}
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:5000/ws/notifications');

ws.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    // Handle real-time notification
};
```

---

## 🧪 Testing

### Postman Collection
Import the MargWatch API collection for easy testing:
```json
{
  "info": {
    "name": "MargWatch API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    // API endpoints here
  ]
}
```

### cURL Examples
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Create complaint
curl -X POST http://localhost:5000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Complaint","description":"Test description","category":"POTHOLE","latitude":40.7128,"longitude":-74.0060}'
```

---

**MargWatch API Documentation Complete! 🚀**

For more information, refer to the Setup Guide and Project Analysis Report.