---
id: cicd-pipeline-optimization
category: skill
tags: [cicd, pipeline, optimization, caching, parallelization, github-actions, gitlab-ci]
capabilities:
  - Pipeline speed optimization techniques
  - Caching strategies for dependencies and builds
  - Parallel job execution patterns
  - Artifact management and sharing
useWhen:
  - Optimizing CI/CD pipeline speed with parallel test execution and Docker layer caching reducing build time by 50%
  - Building modular CI/CD pipeline with reusable workflows and shared actions for consistency across projects
  - Implementing CI/CD performance monitoring tracking pipeline duration and identifying bottleneck stages
  - Designing artifact caching strategy with npm cache and build artifact reuse speeding up subsequent builds
  - Creating CI/CD pipeline observability with logs, metrics, and alerts for failed builds and deployment issues
estimatedTokens: 600
---

# CI/CD Pipeline Optimization

## Caching Dependencies

**GitHub Actions:**
```yaml
jobs:
  build:
    steps:
      - uses: actions/checkout@v4

      - name: Cache Node Modules
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install Dependencies
        run: npm ci  # Faster than npm install

      # Cache build outputs
      - name: Cache Build
        uses: actions/cache@v4
        with:
          path: dist/
          key: build-${{ github.sha }}
```

**GitLab CI:**
```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/
    - dist/

before_script:
  - npm ci --cache .npm --prefer-offline
```

**Docker Layer Caching:**
```dockerfile
# Optimize layer order (most stable → most volatile)
FROM node:18-alpine

# Install system dependencies (rarely changes)
RUN apk add --no-cache python3 make g++

# Copy package files first (changes less frequently)
COPY package*.json ./
RUN npm ci --production

# Copy source code last (changes frequently)
COPY . .
RUN npm run build
```

**BuildKit Cache Mounts:**
```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-alpine

# Cache npm dependencies between builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --production

# Cache build outputs
RUN --mount=type=cache,target=/app/node_modules/.cache \
    npm run build
```

## Parallel Execution

**GitHub Actions Matrix Strategy:**
```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [16, 18, 20]
        os: [ubuntu-latest, windows-latest, macos-latest]
      fail-fast: false  # Continue even if one fails
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

**Split Tests Across Jobs:**
```yaml
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]  # Split tests into 4 parallel jobs
    steps:
      - run: npm test -- --shard=${{ matrix.shard }}/4
```

**Parallel Stages (GitLab):**
```yaml
stages:
  - build
  - test
  - deploy

# These run in parallel during test stage
test:unit:
  stage: test
  script: npm run test:unit

test:integration:
  stage: test
  script: npm run test:integration

test:e2e:
  stage: test
  script: npm run test:e2e
```

## Conditional Execution

**Skip Unnecessary Jobs:**
```yaml
jobs:
  build:
    # Only run on PRs or main branch
    if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'

  deploy:
    # Only on main branch, not on PRs
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

  test-backend:
    # Only if backend code changed
    if: |
      contains(github.event.head_commit.modified, 'backend/') ||
      contains(github.event.head_commit.modified, 'package.json')
```

**Path Filters:**
```yaml
on:
  push:
    paths:
      - 'src/**'
      - 'tests/**'
      - 'package.json'
      # Don't run on docs changes
      - '!docs/**'
      - '!README.md'
```

## Artifact Management

**Share Build Artifacts:**
```yaml
jobs:
  build:
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7  # Auto-cleanup

  test:
    needs: build
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      - run: npm test

  deploy:
    needs: [build, test]
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      - run: ./deploy.sh
```

## Docker Build Optimization

**Multi-Stage Builds:**
```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage (smaller image)
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

**GitHub Actions Docker Buildx:**
```yaml
- name: Build Docker Image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: myapp:${{ github.sha }}
    cache-from: type=gha  # GitHub Actions cache
    cache-to: type=gha,mode=max
    platforms: linux/amd64,linux/arm64  # Multi-arch
```

## Incremental Builds

**Nx/Turborepo Monorepo:**
```yaml
- name: Install Nx
  run: npm install -g nx

- name: Build Affected Projects
  run: nx affected:build --base=origin/main --head=HEAD
  # Only builds projects changed since main

- name: Test Affected Projects
  run: nx affected:test --base=origin/main --head=HEAD
```

**Bazel Remote Cache:**
```yaml
- name: Build with Bazel
  run: |
    bazel build //... \
      --remote_cache=https://cache.example.com \
      --remote_upload_local_results=true
```

## Pipeline Monitoring

**Measure Pipeline Time:**
```yaml
- name: Start Timer
  id: start
  run: echo "start_time=$(date +%s)" >> $GITHUB_OUTPUT

- name: Run Tests
  run: npm test

- name: Report Duration
  run: |
    end_time=$(date +%s)
    duration=$((end_time - ${{ steps.start.outputs.start_time }}))
    echo "Test duration: ${duration}s"
    # Send to monitoring
    curl -X POST $METRICS_URL -d "pipeline.duration:${duration}|g"
```

## Optimization Checklist

✅ **Cache dependencies** - npm/pip/gem caches, Docker layers
✅ **Parallelize tests** - Split across multiple jobs/shards
✅ **Skip unchanged** - Path filters, conditional execution
✅ **Share artifacts** - Build once, use in multiple jobs
✅ **Incremental builds** - Monorepo tools (Nx, Turborepo)
✅ **Fast Docker builds** - Multi-stage, BuildKit cache mounts
✅ **Measure everything** - Track pipeline duration, identify bottlenecks

## Typical Optimizations

| Before | After | Optimization |
|--------|-------|--------------|
| 20 min | 5 min | Dependency caching |
| 15 min | 6 min | Parallel test execution |
| 10 min | 3 min | Docker layer caching |
| 8 min | 4 min | Conditional job execution |
| 12 min | 5 min | Incremental builds (monorepo) |
