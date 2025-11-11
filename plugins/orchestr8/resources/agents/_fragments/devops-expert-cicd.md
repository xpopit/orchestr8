---
id: devops-expert-cicd
category: agent
tags: [devops, cicd, automation, jenkins, github-actions, gitlab-ci, continuous-deployment]
capabilities:
  - CI/CD pipeline design and optimization
  - Automated testing and deployment strategies
  - Infrastructure automation and GitOps
  - Build and release management
  - Progressive delivery and feature flags
useWhen:
  - Designing CI/CD pipelines with GitHub Actions, GitLab CI, or Jenkins including automated testing stages, Docker image building, and multi-environment deployment strategies
  - Implementing GitOps workflows using ArgoCD or FluxCD for declarative infrastructure management with Git as single source of truth and automatic sync
  - Setting up progressive delivery patterns including blue-green deployments, canary releases with gradual traffic shifting, and feature flags for controlled rollouts
  - Automating build and release management with semantic versioning, changelog generation, artifact publishing to registries, and rollback procedures
  - Optimizing CI/CD performance through caching strategies, parallel job execution, matrix builds, and incremental testing for faster feedback loops
  - Integrating automated security scanning (SAST/DAST), dependency checks, and compliance gates into deployment pipelines with fail-fast mechanisms
estimatedTokens: 700
---

# DevOps Expert - CI/CD & Automation

Expert in continuous integration, continuous deployment, and DevOps automation practices for modern software delivery.

## Core CI/CD Principles

### Continuous Integration
- **Frequent commits**: Teams commit code multiple times daily
- **Automated builds**: Every commit triggers automated build
- **Fast feedback**: Developers know within minutes if build breaks
- **Automated testing**: Unit, integration, and security tests run automatically

### Continuous Deployment
- **Automated releases**: Code automatically deploys to production after passing tests
- **Progressive delivery**: Feature flags decouple deployment from release
- **Rollback capability**: Quick rollback mechanisms for failed deployments
- **Zero-downtime**: Blue-green or canary deployments

## Pipeline Design Patterns

### GitHub Actions
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linters
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker tag myapp:${{ github.sha }} myapp:latest
      
      - name: Push to registry
        run: |
          echo "${{ secrets.REGISTRY_PASSWORD }}" | \
            docker login -u "${{ secrets.REGISTRY_USERNAME }}" --password-stdin
          docker push myapp:${{ github.sha }}
          docker push myapp:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/myapp \
            myapp=myapp:${{ github.sha }}
          kubectl rollout status deployment/myapp
```

### GitLab CI/CD
```yaml
stages:
  - lint
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

lint:
  stage: lint
  image: node:18
  script:
    - npm ci
    - npm run lint
  cache:
    paths:
      - node_modules/

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test -- --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $IMAGE_TAG .
    - docker push $IMAGE_TAG

deploy_production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context production
    - kubectl set image deployment/myapp myapp=$IMAGE_TAG
    - kubectl rollout status deployment/myapp
  only:
    - main
  environment:
    name: production
    url: https://myapp.example.com
```

## Best Practices 2025

### 1. Shift-Left Security
```yaml
# Integrate security scanning early
- name: Security scan
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
    
- name: SAST scan
  run: |
    semgrep --config=auto .
```

### 2. Infrastructure as Code Validation
```yaml
- name: Validate Terraform
  run: |
    terraform init
    terraform validate
    terraform plan -out=tfplan
    
- name: Policy check
  run: |
    tfsec .
    checkov -d .
```

### 3. Progressive Delivery
```yaml
# Canary deployment
- name: Deploy canary (10%)
  run: |
    kubectl apply -f k8s/canary-10.yaml
    
- name: Run smoke tests
  run: npm run test:smoke
  
- name: Promote to 50%
  if: success()
  run: kubectl apply -f k8s/canary-50.yaml
  
- name: Full rollout
  if: success()
  run: kubectl apply -f k8s/production-100.yaml
```

### 4. Feature Flags Integration
```javascript
// Decouple deployment from release
if (featureFlags.isEnabled('new-checkout')) {
    return <NewCheckout />
} else {
    return <LegacyCheckout />
}

// Gradual rollout
if (featureFlags.isEnabled('optimization', { userId })) {
    // New optimized code for 10% of users
}
```

## Pipeline Optimization

### Caching Strategies
```yaml
# Cache dependencies
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}

# Docker layer caching
- name: Build with cache
  uses: docker/build-push-action@v4
  with:
    context: .
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Parallel Execution
```yaml
test:
  strategy:
    matrix:
      node: [16, 18, 20]
      os: [ubuntu-latest, windows-latest, macos-latest]
  runs-on: ${{ matrix.os }}
  steps:
    - run: npm test
```

### Fail Fast
```yaml
- name: Quick checks first
  run: |
    npm run lint        # Fast
    npm run type-check  # Fast
    npm run test:unit   # Medium
    npm run test:integration  # Slow (only if fast checks pass)
```

## Monitoring & Observability

### Deployment Tracking
```yaml
- name: Notify deployment
  run: |
    curl -X POST $DATADOG_API/events \
      -H "DD-API-KEY: ${{ secrets.DD_API_KEY }}" \
      -d '{
        "title": "Deployment to production",
        "text": "Commit: ${{ github.sha }}",
        "tags": ["env:production", "service:myapp"]
      }'
```

### Build Metrics
- Track build duration trends
- Monitor test execution time
- Alert on flaky tests
- Deployment frequency metrics
- Mean time to recovery (MTTR)

## Tools Ecosystem

### CI/CD Platforms
- **GitHub Actions**: Native GitHub integration, generous free tier
- **GitLab CI/CD**: Built into GitLab, excellent Kubernetes integration
- **Jenkins**: Self-hosted, extensive plugins, enterprise-grade
- **CircleCI**: Fast builds, powerful caching
- **Travis CI**: Open source friendly

### GitOps Tools
- **ArgoCD**: Declarative GitOps for Kubernetes
- **Flux**: CNCF GitOps operator
- **Spinnaker**: Multi-cloud continuous delivery

### Release Management
- **Helm**: Kubernetes package manager
- **Kustomize**: Template-free Kubernetes config
- **LaunchDarkly**: Feature flag management
- **Split.io**: Feature delivery platform

## Success Metrics

- **Deployment frequency**: Multiple times per day
- **Lead time**: < 1 hour from commit to production
- **Change failure rate**: < 15%
- **MTTR**: < 1 hour
- **Test coverage**: > 80%
- **Build time**: < 10 minutes

## When to Implement
- Automating manual deployment processes
- Reducing deployment risk and downtime
- Improving development velocity
- Ensuring consistent quality gates
- Enabling rapid feature delivery
