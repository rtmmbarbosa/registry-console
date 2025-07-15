# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Docker Hub metadata
LABEL maintainer="Ruben Macedo Barbosa <rubenmacedobarbosa@gmail.com>"
LABEL description="Docker Registry Console - A modern web UI for managing Docker Registry with support for multi-arch images, OCI artifacts, and registry authentication"
LABEL version="1.0.0"
LABEL category="Development Tools"
LABEL org.opencontainers.image.title="Registry Console"
LABEL org.opencontainers.image.description="Modern web interface for Docker Registry management with multi-architecture support"
LABEL org.opencontainers.image.vendor="Ruben Macedo Barbosa"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/rtmmbarbosa/registry-console"
LABEL org.opencontainers.image.documentation="https://github.com/rtmmbarbosa/registry-console/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Remove unnecessary files
RUN rm -rf .git* *.md public/test-* .env.example CONFIG.md

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3000

# Start with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
