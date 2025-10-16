# MargWatch Container Guide

## Overview

This document provides a comprehensive guide to understanding Docker and Docker Compose in the MargWatch project, including how services are containerized, orchestrated, and connected.

## Introduction to Docker and Docker Compose

### Docker
Docker is a containerization platform that allows you to package applications and their dependencies into lightweight, portable containers. Each container runs in isolation and includes everything needed to run the application.

### Docker Compose
Docker Compose is a tool for defining and running multi-container Docker applications. It uses YAML files to configure the application's services, networks, and volumes, making it easy to manage complex applications with multiple components.

## MargWatch Docker Architecture

The MargWatch project uses Docker Compose to orchestrate the following services:

- **Backend API** (`api`): Node.js/Express server handling business logic
- **ML Service** (`ml-service`): Python service for machine learning predictions
- **Admin Portal** (`admin-portal`): Next.js frontend application
- **Redis** (`redis`): In-memory data store for caching and sessions
- **Nginx** (`nginx`): Reverse proxy and load balancer (optional)

## Docker Compose Configuration Analysis

### Main Configuration File: `docker-compose.yml`

The main configuration file defines all services, networks, and volumes:

```yaml
version: '3.8'

services:
  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: margwatch-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - margwatch-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API Service
  api:
    build:
      context: ../../apps/api
      dockerfile: Dockerfile
    container_name: margwatch-api
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 24h
      CORS_ORIGIN: http://localhost:3000,http://localhost:8080
    ports:
      - "5000:5000"
    volumes:
      - ../../apps/api/uploads:/app/uploads
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - margwatch-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "dist/healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ML Service
  ml-service:
    build:
      context: ../../services/ml-service
      dockerfile: Dockerfile
    container_name: margwatch-ml-service
    environment:
      PYTHONUNBUFFERED: 1
      MODEL_PATH: /app/models
      ML_SERVICE_PORT: 8000
      ML_SERVICE_HOST: 0.0.0.0
      LOG_LEVEL: INFO
    ports:
      - "8000:8000"
    volumes:
      - ../../services/ml-service/models:/app/models
    networks:
      - margwatch-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Admin Portal (Next.js)
  admin-portal:
    build:
      context: ../../apps/admin-portal
      dockerfile: Dockerfile
    container_name: margwatch-admin-portal
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: http://localhost:5000
      NEXT_PUBLIC_ML_SERVICE_URL: http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - api
      - ml-service
    networks:
      - margwatch-network
    restart: unless-stopped

volumes:
  redis_data:
    driver: local

networks:
  margwatch-network:
    driver: bridge
```

### Key Configuration Elements

1. **Services**: Each service represents a containerized application component
2. **Networks**: All services communicate through the `margwatch-network` bridge network
3. **Volumes**: Persistent data storage for Redis and file uploads
4. **Health Checks**: Monitor service health and enable dependency management
5. **Environment Variables**: Configuration passed to containers at runtime

## Service Build Process: From Dockerfile to Running Container

### Backend API Service Example

Let's trace how the backend API service goes from source code to a running container:

#### 1. Dockerfile Analysis (`apps/api/Dockerfile`)

```dockerfile
# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Copy healthcheck script to dist
COPY healthcheck.js dist/

# Expose port
EXPOSE 5000

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js || exit 1

# Start the application directly
CMD ["npm", "start"]
```

#### 2. Build Process Steps

1. **Base Image**: Starts with `node:18-alpine` (lightweight Linux with Node.js)
2. **Dependencies**: Installs OpenSSL for Prisma database operations
3. **Package Installation**: Copies `package.json` and installs dependencies
4. **Prisma Setup**: Generates Prisma client for database operations
5. **Source Code**: Copies application source code
6. **Build**: Compiles TypeScript to JavaScript
7. **Security**: Creates non-root user for security
8. **Health Check**: Sets up health monitoring
9. **Start Command**: Defines how to start the application

#### 3. Container Runtime

When the container starts:
1. Runs `npm start` which executes `node dist/index.js`
2. Starts the Express server on port 5000
3. Connects to Redis and external database
4. Health check monitors the `/health` endpoint
5. Other services can connect via the Docker network

### Admin Portal Service Example

#### 1. Multi-Stage Dockerfile (`apps/admin-portal/Dockerfile`)

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### 2. Multi-Stage Build Benefits

1. **Dependencies Stage**: Installs only production dependencies
2. **Builder Stage**: Compiles the Next.js application
3. **Runner Stage**: Creates minimal runtime image with only necessary files

This approach results in smaller, more secure production images.

## Service Interconnection Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Portal  │    │   Backend API   │    │   ML Service    │
│   (Next.js)     │    │   (Node.js)     │    │   (Python)      │
│   Port: 3000    │◄──►│   Port: 5000    │◄──►│   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │      Redis      │              │
         └──────────────►│   Port: 6379    │◄─────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │     Database    │
                        │   (External)    │
                        │  (Neon Cloud)   │
                        └─────────────────┘
```

### Service Communication Flow

1. **Admin Portal → Backend API**: 
   - Frontend makes HTTP requests to `/api/*` endpoints
   - Authentication via JWT tokens
   - Real-time updates via WebSocket connections

2. **Backend API → ML Service**:
   - Image classification requests
   - Category prediction for complaints
   - Health check monitoring

3. **Backend API → Redis**:
   - Session storage
   - Caching frequently accessed data
   - Rate limiting

4. **Backend API → Database**:
   - Persistent data storage
   - User management
   - Complaint and work order tracking

## Environment Variables

### Required Environment Variables

Create a `.env` file in the `infrastructure/docker/` directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Optional: PostgreSQL (if using local database)
POSTGRES_PASSWORD=margwatch_password
```

### Service-Specific Environment Variables

Each service has its own environment configuration:

- **API**: Database connection, JWT secrets, CORS origins
- **ML Service**: Model paths, logging levels
- **Admin Portal**: API URLs for frontend consumption

## Health Checks and Monitoring

### Health Check Implementation

Each service includes health check endpoints:

- **API**: `GET /health` - Returns service status and uptime
- **ML Service**: `GET /health` - Returns model status and available categories
- **Redis**: `redis-cli ping` - Tests Redis connectivity

### Health Check Benefits

1. **Dependency Management**: Services wait for dependencies to be healthy
2. **Automatic Recovery**: Unhealthy containers are restarted
3. **Load Balancer Integration**: Nginx can route traffic only to healthy instances

## Volume Management

### Persistent Data

- **Redis Data**: Stored in `redis_data` volume for persistence across restarts
- **File Uploads**: Backend uploads directory mounted for file storage
- **ML Models**: ML service models directory mounted for model updates

### Volume Benefits

1. **Data Persistence**: Data survives container restarts
2. **Development**: Easy access to logs and uploaded files
3. **Model Updates**: ML models can be updated without rebuilding containers

## Network Architecture

### Docker Network Configuration

All services communicate through the `margwatch-network` bridge network:

```yaml
networks:
  margwatch-network:
    driver: bridge
```

### Network Benefits

1. **Service Discovery**: Services can reach each other by name
2. **Isolation**: Network traffic is isolated from host system
3. **Security**: Internal communication doesn't expose ports to host

## Deployment Commands

### Starting the Application

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d api

# Rebuild and start
docker-compose up -d --build
```

### Monitoring Services

```bash
# View service status
docker-compose ps

# View logs
docker-compose logs -f api

# View logs for all services
docker-compose logs -f
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3000, 5000, 6379, and 8000 are available
2. **Health Check Failures**: Check service logs for startup errors
3. **Database Connection**: Verify DATABASE_URL environment variable
4. **Build Failures**: Ensure all source code is present and dependencies are installed

### Debugging Commands

```bash
# Check container logs
docker-compose logs service-name

# Execute commands in running container
docker-compose exec service-name sh

# Check service health
curl http://localhost:5000/health
curl http://localhost:8000/health
```

## Security Considerations

### Container Security

1. **Non-Root Users**: All services run as non-root users
2. **Minimal Base Images**: Using Alpine Linux for smaller attack surface
3. **Network Isolation**: Services communicate through private Docker network
4. **Health Checks**: Monitor service health and restart if needed

### Environment Security

1. **Environment Variables**: Sensitive data passed via environment variables
2. **JWT Secrets**: Strong, unique secrets for token signing
3. **Database Credentials**: Secure database connection strings
4. **CORS Configuration**: Restrictive CORS policies for API access

## Performance Optimization

### Container Optimization

1. **Multi-Stage Builds**: Reduce final image size
2. **Layer Caching**: Optimize Docker layer caching for faster builds
3. **Health Checks**: Proper health check intervals and timeouts
4. **Resource Limits**: Set appropriate CPU and memory limits

### Service Optimization

1. **Redis Caching**: Cache frequently accessed data
2. **Database Connection Pooling**: Efficient database connections
3. **Static File Serving**: Optimized static asset delivery
4. **Load Balancing**: Nginx reverse proxy for traffic distribution

## Conclusion

The MargWatch Docker setup provides a robust, scalable, and maintainable containerized environment. The multi-service architecture with proper networking, health checks, and volume management ensures reliable operation and easy development workflows.

For questions or issues, refer to the service-specific documentation or check the troubleshooting section above.
