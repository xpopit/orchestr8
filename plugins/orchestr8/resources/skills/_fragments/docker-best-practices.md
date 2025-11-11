---
id: docker-best-practices
category: skill
tags: [docker, containers, multi-stage-builds, security, optimization, dockerfile]
capabilities:
  - Multi-stage Docker builds for smaller images
  - Docker layer optimization and caching
  - Container security hardening
  - Image size reduction techniques
useWhen:
  - Implementing Docker best practices with multi-stage builds reducing image size by 70% and improving security
  - Building production-ready Docker images with non-root users, minimal base images, and security scanning
  - Designing Docker layer optimization strategy ordering Dockerfile commands to maximize cache hits
  - Creating Docker Compose setup for local development with volume mounts and environment-specific overrides
  - Implementing Docker health checks for container orchestration enabling automatic restart of unhealthy containers
estimatedTokens: 600
---

# Docker Best Practices

## Multi-Stage Builds

**Node.js Example:**
```dockerfile
# Stage 1: Dependencies and Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./
RUN npm ci --only=production && \
    cp -R node_modules /tmp/node_modules && \
    npm ci

# Build application
COPY . .
RUN npm run build && \
    npm run test

# Stage 2: Production Image
FROM node:18-alpine AS production
WORKDIR /app

# Copy only production dependencies
COPY --from=builder /tmp/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Benefits:** 200MB dev image → 60MB production image

## Layer Optimization

**Inefficient (slow rebuilds):**
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install  # Re-installs on every code change
RUN npm run build
```

**Optimized (fast rebuilds):**
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Layer 1: System dependencies (rarely changes)
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Layer 2: Package dependencies (changes occasionally)
COPY package*.json ./
RUN npm ci --production

# Layer 3: Source code (changes frequently)
COPY . .

# Layer 4: Build (only if source changed)
RUN npm run build
```

**Layer Caching Rules:**
- Most stable layers first
- Combine related commands with `&&`
- Each RUN creates a new layer
- COPY triggers rebuild if files changed

## Security Hardening

**Use Distroless Base Images:**
```dockerfile
# Build stage
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o main .

# Production: Distroless (no shell, no package manager)
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /main
USER nonroot:nonroot
ENTRYPOINT ["/main"]
```

**Security Checklist:**
```dockerfile
FROM node:18-alpine

# 1. Run as non-root user
RUN addgroup -g 1001 appgroup && \
    adduser -D -u 1001 -G appgroup appuser

WORKDIR /app

# 2. Copy with correct ownership
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --production

COPY --chown=appuser:appgroup . .

# 3. Drop privileges
USER appuser

# 4. Use specific port (>1024)
EXPOSE 8080

# 5. Read-only filesystem where possible
VOLUME ["/app/data"]

# 6. Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node healthcheck.js || exit 1

CMD ["node", "index.js"]
```

**Scan for Vulnerabilities:**
```bash
# Trivy scanner
docker run aquasec/trivy image myapp:latest

# Snyk
snyk container test myapp:latest

# Docker Scout
docker scout cves myapp:latest
```

## Image Size Reduction

**Alpine Linux Base:**
```dockerfile
# Standard: 900MB
FROM node:18
# Alpine: 180MB
FROM node:18-alpine
# Slim: 250MB
FROM node:18-slim
```

**Remove Unnecessary Files:**
```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --production && \
    npm cache clean --force && \
    rm -rf /tmp/* /root/.npm

COPY . .

# Remove dev files
RUN rm -rf \
    tests/ \
    *.test.js \
    .eslintrc.js \
    .prettierrc \
    tsconfig.json
```

**.dockerignore File:**
```
# Ignore during build (faster, smaller context)
node_modules/
npm-debug.log
dist/
.git/
.github/
*.md
tests/
*.test.js
.env
.env.*
coverage/
.vscode/
.idea/
```

## BuildKit Features

**Cache Mounts (faster builds):**
```dockerfile
# syntax=docker/dockerfile:1

FROM node:18-alpine

# Cache npm packages between builds
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm

WORKDIR /app
COPY package*.json ./

# Cache node_modules
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build
```

**Build Secrets (no secrets in layers):**
```dockerfile
# syntax=docker/dockerfile:1

FROM alpine

# Pass secret at build time (not stored in layer)
RUN --mount=type=secret,id=npmtoken \
    echo "//registry.npmjs.org/:_authToken=$(cat /run/secrets/npmtoken)" > ~/.npmrc && \
    npm install private-package && \
    rm ~/.npmrc
```

```bash
# Build with secret
docker build --secret id=npmtoken,src=.npmtoken -t myapp .
```

## Efficient Multi-Architecture

**BuildX for ARM64 + AMD64:**
```bash
# Create builder
docker buildx create --name multiarch --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag myapp:latest \
  --push \
  .
```

**Dockerfile for Multi-Arch:**
```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.21 AS builder
ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -o main .

FROM alpine
COPY --from=builder /app/main /main
CMD ["/main"]
```

## Docker Compose for Development

```yaml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
      cache_from:
        - myapp:latest
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules  # Prevent overwrite
    environment:
      - NODE_ENV=development
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: dev
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

## Best Practices Summary

✅ **Multi-stage builds** - Separate build and runtime dependencies
✅ **Layer optimization** - Stable layers first, combine commands
✅ **Alpine/Distroless** - Smaller base images
✅ **Non-root user** - Never run as root in production
✅ **Security scanning** - Trivy, Snyk, Docker Scout
✅ **.dockerignore** - Faster builds, smaller context
✅ **BuildKit features** - Cache mounts, build secrets
✅ **Health checks** - Monitor container health
✅ **Resource limits** - Set CPU/memory constraints
