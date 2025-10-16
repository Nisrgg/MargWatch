import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

declare global {
  var __prisma: PrismaClient | undefined;
  var __redis: ReturnType<typeof createClient> | undefined;
}

// Prisma Client
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

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
