import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { prisma, redis } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import complaintRoutes from './routes/complaints';
import workOrderRoutes from './routes/workOrders';
import adminRoutes from './routes/admin';
import adminApprovalRoutes from './routes/adminApproval';
import notificationRoutes from './routes/notifications';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import CloudinaryService from './services/cloudinaryService';
import mlService from './services/mlService';

const app = express();

// Connect to Redis (optional)
redis.connect().catch((err) => {
  console.warn('Redis connection failed - continuing without Redis:', err.message);
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - Emergency bypass for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10000, // Very high limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Check user FCM token status
app.get('/check-fcm/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fcmToken: true, role: true, email: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        hasFCMToken: !!user.fcmToken,
        fcmToken: user.fcmToken ? 'Present' : 'Not registered'
      }
    });
  } catch (error) {
    console.error('Check FCM error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check FCM token',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// FCM Token Management
app.post('/api/fcm/token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required'); })());
    
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    console.log(`📥 FCM Token registration request from user: ${decoded.id}`);
    console.log(`   Token length: ${fcmToken.length}, First 20 chars: ${fcmToken.substring(0, 20)}...`);

    // Update user's FCM token
    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: { fcmToken },
      select: { id: true, email: true, fcmToken: true, role: true }
    });

    console.log(`✅ FCM token registered successfully for user: ${user.email} (${user.role})`);

    return res.json({
      success: true,
      message: 'FCM token updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update FCM token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update FCM token',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Test FCM notification endpoint (public for testing)
app.post('/test-fcm', async (req, res) => {
  try {
    const { email, title, message } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Import Firebase service
    const { FirebaseNotificationService } = await import('./services/firebaseNotificationService');
    const fcmService = FirebaseNotificationService.getInstance();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fcmToken: true, role: true, email: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'User has no FCM token registered. Please open the mobile app to register FCM token.'
      });
    }

    // Send test notification
    await fcmService.createAndSendNotification(
      user.id,
      title || 'Test Notification',
      message || 'This is a test notification from MargWatch backend!',
      'test',
      { test: true, timestamp: new Date().toISOString() }
    );

    return res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: {
        userId: user.id,
        email: user.email,
        hasFCMToken: !!user.fcmToken
      }
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Cloudinary connection
    try {
      const cloudinaryStatus = await CloudinaryService.testConnection();
      console.log('Cloudinary status:', cloudinaryStatus ? '✅ Connected' : '❌ Failed');
    } catch (cloudinaryError) {
      console.warn('Cloudinary health check failed:', cloudinaryError);
    }
    
    // Check ML service connection
    let mlStatus = 'unknown';
    try {
      const mlHealth = await mlService.healthCheck();
      mlStatus = mlHealth.healthy ? 'healthy' : 'unhealthy';
      console.log(`ML service status: ${mlStatus}`);
      if (mlHealth.status) {
        console.log('ML service details:', JSON.stringify(mlHealth.status, null, 2));
      }
    } catch (mlError) {
      console.warn('ML service health check failed:', mlError instanceof Error ? mlError.message : String(mlError));
      mlStatus = 'unavailable';
    }
    
    res.json({
      success: true,
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'healthy',
        cloudinary: 'healthy',
        mlService: mlStatus,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service is unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-approval', adminApprovalRoutes);
app.use('/api/notifications', notificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Road Issue Reporting Portal API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      complaints: '/api/complaints',
      workOrders: '/api/work-orders',
      admin: '/api/admin',
      adminApproval: '/api/admin-approval',
      ml: '/api/ml',
      health: '/health',
    },
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

// Export app and WebSocket service for initialization
export { WebSocketService } from './services/websocketService';
export default app;
