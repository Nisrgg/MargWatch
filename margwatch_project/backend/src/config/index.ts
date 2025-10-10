import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database - Default to Docker PostgreSQL setup
  databaseUrl: process.env.DATABASE_URL || 'postgresql://margwatch:margwatch123@localhost:5432/margwatch?schema=public',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'margwatch-super-secret-jwt-key-change-this-in-production-2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  
  // Cloudinary
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
  },
  
  // ML Model
  mlModelUrl: process.env.ML_MODEL_URL || 'http://localhost:8000/predict',
  
  // Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  
  // Frontend URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  mobileUrl: process.env.MOBILE_URL || 'http://localhost:3001',
  
  // CORS
  corsOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.MOBILE_URL || 'http://localhost:3001',
  ],
};
