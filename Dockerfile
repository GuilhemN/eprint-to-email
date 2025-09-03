FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Build JavaScript files for production
RUN npm run build:js

# Remove dev dependencies after build
RUN npm prune --production

# Create directory for database and other data
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port for the preview server (optional)
EXPOSE 3000

# Default command - this can be overridden by docker-compose
CMD ["node", "scheduler.js"]
