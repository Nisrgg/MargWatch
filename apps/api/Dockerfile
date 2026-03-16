FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    npm config set maxsockets 1

# Copy shared-types from monorepo (build context is repo root)
COPY packages/shared-types ./packages/shared-types

WORKDIR /app/packages/shared-types
RUN npm install --legacy-peer-deps --include=dev || (sleep 10 && npm install --legacy-peer-deps --include=dev) || (sleep 20 && npm install --legacy-peer-deps --include=dev)
RUN npm run build

WORKDIR /app

# Copy API package.json from monorepo
COPY apps/api/package.json ./package.json

# Fix local file path for shared-types inside container
RUN sed -i 's|\"file:../../packages/shared-types\"|\"file:./packages/shared-types\"|g' package.json

# Install API dependencies (including dev) with legacy peer deps to resolve multer/cloudinary
RUN npm install --legacy-peer-deps --include=dev || (sleep 10 && npm install --legacy-peer-deps --include=dev) || (sleep 20 && npm install --legacy-peer-deps --include=dev)

# Copy Prisma schema
COPY apps/api/prisma ./prisma/
RUN npx prisma generate

# Copy the rest of API source code (relative to repo root)
COPY apps/api/ .

# Ensure shared-types path is still correct after COPY (package.json overwritten)
RUN sed -i 's|\"file:../../packages/shared-types\"|\"file:./packages/shared-types\"|g' package.json && rm -f package-lock.json

# Reinstall to make sure local package is linked with the corrected path
RUN npm install --legacy-peer-deps --include=dev || (sleep 10 && npm install --legacy-peer-deps --include=dev) || (sleep 20 && npm install --legacy-peer-deps --include=dev)

# Regenerate Prisma client after reinstall (reinstall overwrites generated client with vanilla one)
RUN npx prisma generate

RUN npm run build

COPY apps/api/healthcheck.js dist/

EXPOSE 5000

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js || exit 1

CMD ["npm", "start"]