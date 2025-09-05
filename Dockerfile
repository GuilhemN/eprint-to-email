FROM node:20-alpine

WORKDIR /app

# Install build dependencies and create user early
RUN apk add --no-cache python3 make g++ && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown nodejs:nodejs /app

# Copy package files first for better layer caching
COPY --chown=nodejs:nodejs package*.json ./

# Switch to nodejs user for all operations
USER nodejs

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code with correct ownership
COPY --chown=nodejs:nodejs . .

# Create directories that the build process will write to
RUN mkdir -p /app/data /app/dist && \
    touch /app/cache.json

# Build the application (as nodejs user)
RUN npm run build

# Build JavaScript files for production
RUN npm run build:js

# Set environment variables
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Expose port for the preview server (optional)
EXPOSE 3000

# Default command - this can be overridden by docker-compose
CMD ["node", "scheduler.js"]
