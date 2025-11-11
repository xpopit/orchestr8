---
id: docker-multistage-nodejs
category: example
tags: [docker, nodejs, typescript, containers, optimization]
capabilities:
  - Multi-stage Docker build
  - Optimized Node.js image
  - Security best practices
useWhen:
  - Production Node.js applications requiring non-root user execution and proper signal handling for graceful shutdowns
  - TypeScript Node.js services needing optimized multi-stage builds that separate build-time and runtime dependencies
  - Containerized Express or NestJS APIs deployed to orchestration platforms requiring health checks and security hardening
  - Node.js microservices where image size optimization is critical for faster deployments and reduced registry costs
  - Production-ready Node.js apps requiring dumb-init for proper zombie process handling and SIGTERM propagation
  - Node.js services needing layer caching optimization to speed up CI/CD build times by separating dependencies from code
estimatedTokens: 350
---

# Docker Multi-stage Build - Node.js

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

# Security: Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Security: Create non-root user
RUN addgroup -g 1001 appuser && \
    adduser -D -u 1001 -G appuser appuser

WORKDIR /app

# Copy only production artifacts
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/dist ./dist
COPY --from=builder --chown=appuser:appuser /app/package*.json ./

USER appuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node healthcheck.js

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

**Key Benefits:**
- Small image size (removes dev dependencies)
- Non-root user for security
- Proper signal handling with dumb-init
- Health checks for orchestration
- Layer caching optimization
