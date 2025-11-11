---
id: docker-multistage-go
category: example
tags: [docker, go, golang, containers, optimization]
capabilities:
  - Multi-stage Go build
  - Minimal scratch image
  - Static binary compilation
useWhen:
  - Production Go microservices requiring minimal container images under 10MB with static binary compilation
  - Go REST APIs or gRPC services deployed to Kubernetes with strict security requirements and minimal attack surface
  - Building stateless Go applications using scratch base image for maximum security and minimal storage costs
  - Go CLI tools or batch processors requiring hermetic builds with no runtime dependencies
  - Containerized Go services where image size directly impacts deployment speed and cost in cloud environments
  - Go applications requiring CA certificates for external HTTPS calls but no other system dependencies
estimatedTokens: 300
---

# Docker Multi-stage Build - Go

```dockerfile
# Stage 1: Build
FROM golang:1.21-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build with optimizations
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o app \
    ./cmd/server

# Stage 2: Runtime (scratch = ~2MB final image)
FROM scratch

# Copy CA certificates for HTTPS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy binary
COPY --from=builder /build/app /app

EXPOSE 8080

ENTRYPOINT ["/app"]
```

**Key Benefits:**
- Extremely small image (~5-10MB)
- Static binary with no dependencies
- Maximum security (minimal attack surface)
- Fast deployment and startup
