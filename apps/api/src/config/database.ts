import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

declare global {
  var __prisma: PrismaClient | undefined;
  var __redis: ReturnType<typeof createClient> | undefined;
}

// Database connection with retry logic
async function connectToDatabase(retries = 3): Promise<PrismaClient> {
  for (let i = 0; i < retries; i++) {
    try {
      const prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
      
      // Test the connection
      await prisma.$connect();
      console.log('✅ Database connection established');
      return prisma;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
      
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed. Exiting...');
        throw error;
      }
      
      console.log(`⏳ Retrying database connection in 5 seconds... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error('Failed to connect to database after all retries');
}

// Initialize database connection
let prismaInstance: PrismaClient;

// Prisma Client with retry logic
export const prisma = globalThis.__prisma || (() => {
  // Initialize synchronously for now, connection will be tested on first use
  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  return prismaInstance;
})();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Test database connection on startup
connectToDatabase().catch((error) => {
  console.error('❌ Database connection failed:', error);
  process.exit(1);
});

// Redis Client
export const redis = globalThis.__redis || createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__redis = redis;
}

// Connect to Redis with error handling
redis.connect().catch((err) => {
  console.warn('Redis connection failed - continuing without Redis:', err.message);
});

redis.on('error', (err) => {
  // console.warn('Redis Client Error (non-critical):', err.message);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

export default { prisma, redis };
