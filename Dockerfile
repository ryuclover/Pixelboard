# Backend Dockerfile for Render.com
FROM node:18-alpine

WORKDIR /app

# Copy package definitions
COPY backend/package.json backend/package-lock.json ./

# Install dependencies (including dev dependencies for Prisma CLI)
RUN npm ci

# Copy backend source code
COPY backend ./

# Generate Prisma client
RUN npx prisma generate

# Run migrations and start server
CMD ["sh", "-c", "npx prisma db push && node index.js"]
