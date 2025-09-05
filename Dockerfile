FROM node:20-alpine

WORKDIR /app

# Install build dependencies and create user early
RUN apk add --no-cache python3 make g++ && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
# Keep as root for faster installation
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Build JavaScript files for production
RUN npm run build:js

# Create directory for database and set ownership only on writable directories
RUN mkdir -p /app/data && \
    chown nodejs:nodejs /app/data /app/dist && \
    touch /app/cache.json && \
    chown nodejs:nodejs /app/cache.json

# Set environment variables
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Expose port for the preview server (optional)
EXPOSE 3000

# Default command - this can be overridden by docker-compose
CMD ["node", "scheduler.js"]
