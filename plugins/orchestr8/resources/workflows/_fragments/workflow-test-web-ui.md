---
id: workflow-test-web-ui
category: pattern
tags: [workflow, testing, web-ui, e2e, automation, selenium, playwright, cypress, qa, validation]
capabilities:
  - End-to-end web UI testing strategy
  - Multi-level testing pyramid implementation
  - Cross-browser and accessibility validation
useWhen:
  - Building web applications requiring UI testing
  - Implementing comprehensive test automation
  - Need structured testing approach
estimatedTokens: 480
---

# Web UI Testing Pattern

**Phases:** Strategy (0-15%) → Unit/Component (15-40%) → Integration (40-65%) → E2E (65-85%) → Validation (85-100%)

## Phase 1: Test Strategy (0-15%)
- Define testing pyramid: Unit 70% > Integration 20% > E2E 10%
- Select tools (Jest/Vitest, Testing Library, Playwright/Cypress)
- Identify critical user flows for E2E
- Plan CI integration
- **Checkpoint:** Strategy documented, tools selected

## Phase 2: Unit & Component Tests (15-40%)
**Parallel tracks:**
- **Unit:** Pure functions, utilities, business logic (70%+ coverage)
- **Component:** Render tests, interactions, state changes, props validation
- **Visual:** Snapshot tests for UI consistency
- **Checkpoint:** 70%+ unit/component coverage

## Phase 3: Integration Tests (40-65%)
**Parallel tracks:**
- **API Integration:** Mock API calls, response handling, error states
- **State Management:** Redux/Zustand flows, side effects
- **Form Validation:** Multi-step forms, validation logic
- **Checkpoint:** Critical integrations tested

## Phase 4: E2E Tests (65-85%)
**Parallel tracks:**
- **Critical Paths:** Login, checkout, core workflows
- **Multi-Browser:** Chrome, Firefox, Safari (if budget allows)
- **Responsive:** Mobile, tablet, desktop viewports
- **Accessibility:** ARIA, keyboard nav, screen reader
- **Checkpoint:** E2E tests pass on all target environments

## Phase 5: Validation & CI (85-100%)
**Parallel tracks:**
- **Performance:** Load times, bundle size, lighthouse scores
- **Security:** XSS, CSRF, auth flows, input validation
- **CI/CD:** Test automation, parallel execution, reporting
- **Docs:** Test coverage reports, testing guidelines
- **Checkpoint:** CI green, coverage targets met

## Parallelism
- **Independent:** Unit + Component + Visual (Phase 2), API + State + Forms (Phase 3), Browsers + Responsive + A11y (Phase 4), Performance + Security + CI (Phase 5)
- **Dependencies:** Integration needs unit tests, E2E needs integration, CI needs all tests

## Test Selection Criteria
- **Unit/Component:** Fast, reliable, no external deps
- **Integration:** API contracts, state flows, complex interactions
- **E2E:** Revenue-critical paths, signup/login, checkout
