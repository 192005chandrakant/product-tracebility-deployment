# Multi-stage Dockerfile for complete MERN application
# Builds React frontend and Node.js backend

# Stage 1: Build React frontend
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci

# Copy client source
COPY client/ .

# Build the React application
RUN npm run build

# Stage 2: Build and runtime stage
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install server dependencies (production only)
RUN npm ci --only=production

# Copy server code
COPY server/ .

# Copy built frontend from client-builder stage
COPY --from=client-builder /app/client/build ../client/build

# Create necessary directories
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port 8080
EXPOSE 8080

# Use dumb-init to properly handle signals
ENTRYPOINT ["dumb-init", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Start the application
CMD ["node", "index.js"]
