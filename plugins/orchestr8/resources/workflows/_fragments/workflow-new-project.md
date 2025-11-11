---
id: workflow-new-project
category: pattern
tags: [workflow, project-creation, initialization, autonomous, parallel, greenfield, setup, architecture]
capabilities:
  - End-to-end project initialization from requirements to deployment
  - Tech stack selection and architecture design
  - Parallel track execution for backend/frontend/infrastructure
useWhen:
  - Greenfield project initialization requiring tech stack selection, architecture design, and parallel track execution for maximum velocity
  - Production-ready application development needing autonomous organization with backend, frontend, and infrastructure tracks
  - Full-stack project creation requiring structured approach from requirements analysis to deployment with CI/CD pipeline setup
  - Rapid application development scenarios needing parallel development across independent components with project manager coordination
estimatedTokens: 580
---

# New Project Creation Pattern

**Phases:** Requirements (0-20%) → Setup (20-30%) → Implementation (30-70%) → Testing (70-90%) → Deployment (90-100%)

## Phase 1: Requirements & Architecture (0-20%)
- Parse requirements (functional, non-functional, constraints)
- Select tech stack based on project needs
- Design architecture (components, APIs, data models)
- Document decisions (ADRs)
- **Checkpoint:** Architecture approved

## Phase 2: Project Setup (20-30%)
**Parallel:** Repository + Build tools + Environment config
- Init git, create structure, configure tools
- Package manager, compiler, linter, formatter
- Config management, env templates, secrets
- **Checkpoint:** `npm install && npm run build` works

## Phase 3: Core Implementation (30-70%)
**Parallel tracks:**
- **Backend:** Schema/migrations, business logic (SOLID), API endpoints, auth
- **Frontend:** Routing, components, state, API integration, UX
- **Infrastructure:** Docker, configs, secrets management
- **Checkpoint:** Features work end-to-end

## Phase 4: Testing & Quality (70-90%)
**Parallel tracks:**
- **Testing:** Unit (80%+), integration, E2E, CI automation
- **Quality:** Code review, security scan, performance check
- **Checkpoint:** Tests pass, no critical vulnerabilities

## Phase 5: Deployment (90-100%)
**Parallel tracks:**
- **CI/CD:** Pipeline, staging/production configs
- **Infrastructure:** IaC, networking, databases
- **Observability:** Logging, metrics, alerts
- **Docs:** README, API docs, runbooks
- **Final:** Staging → Production → Monitor
- **Checkpoint:** Production healthy, monitored

## Parallelism
- **Independent:** Backend + Frontend + Infra (Phase 3), Testing + Security (Phase 4), CI/CD + IaC + Observability (Phase 5)
- **Dependencies:** Frontend needs backend API, E2E needs both, production needs staging validation
