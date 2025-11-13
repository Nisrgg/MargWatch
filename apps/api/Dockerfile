# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Configure npm for better network reliability
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    npm config set maxsockets 1

# --- FIX START ---
# Copy the shared-types package into a local packages directory
# This makes it available to npm install
COPY ../../packages/shared-types ./packages/shared-types

# Build the shared-types package first
WORKDIR /app/packages/shared-types
RUN npm install || (sleep 10 && npm install) || (sleep 20 && npm install)
RUN npm run build
WORKDIR /app
# --- FIX END ---

# Copy package files
COPY apps/api/package*.json ./

# Install ALL dependencies (including dev dependencies for build)
# Now it can find the local shared-types package
# Retry logic for network issues
RUN npm install || (sleep 10 && npm install) || (sleep 20 && npm install)

# Copy Prisma schema
COPY apps/api/prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the source code
COPY apps/api/ .

# Copy shared-types package to runtime
COPY ../../packages/shared-types ./packages/shared-types

# Reinstall dependencies to ensure shared-types is properly linked
# Retry logic for network issues
RUN npm install || (sleep 10 && npm install) || (sleep 20 && npm install)

# Build TypeScript
RUN npm run build

# Copy healthcheck script to dist
COPY apps/api/healthcheck.js dist/

# Expose port
EXPOSE 5000

# Create non-root user for security
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