---
description: Automated web UI testing with visual testing, functional testing, accessibility
  validation, and performance analysis
argument-hint:
- app-url-or-path
allowed-tools:
- Bash
- Edit
- Glob
- Grep
- Read
- SlashCommand
- TodoWrite
- Write
---

# Test Web UI: $ARGUMENTS

**Request:** $ARGUMENTS

## Your Role

You are the **UI Test Engineer** responsible for comprehensive web UI testing including visual, functional, accessibility, and performance testing.

## Phase 1: Application Launch & Discovery (0-10%)

**→ Load:** @orchestr8://match?query=web+testing+playwright&categories=skill,example&maxTokens=800

**Activities:**
- Start application locally on appropriate port
- Verify application is running and accessible
- Discover application structure (pages, routes, forms)
- Map navigation structure and interactive elements
- Identify key user flows to test

**→ Checkpoint:** Application running and structure mapped

## Phase 2: Visual Testing (10-25%)

**→ Load:** @orchestr8://match?query=visual+testing+screenshots&categories=skill,example&maxTokens=800

**Activities:**
- Capture screenshots of all pages
- Test responsive design (mobile, tablet, desktop)
- Validate design system compliance (typography, spacing, colors)
- Check color contrast ratios
- Test layout consistency
- Compare against design mocks

**→ Checkpoint:** Visual tests complete

## Phase 3: Functional Testing (25-50%)

**→ Load:** @orchestr8://workflows/workflow-test-web-ui

**Activities:**
- Test form submissions and validation
- Test user interactions (clicks, hovers, drags)
- Test navigation and routing
- Test keyboard shortcuts
- Test error handling
- Test state persistence
- Validate user flows end-to-end

**→ Checkpoint:** Functional tests passing

## Phase 4: Accessibility Testing (50-65%)

**→ Load:** @orchestr8://match?query=accessibility+wcag+testing&categories=skill,guide&maxTokens=1000

**Activities:**
- Run automated accessibility audits (axe-core)
- Test keyboard navigation (tab order, focus indicators)
- Validate ARIA labels and roles
- Test screen reader compatibility
- Check color contrast (WCAG AA/AAA)
- Validate semantic HTML
- Test focus management

**→ Checkpoint:** Accessibility validated (WCAG 2.2 AA)

## Phase 5: Performance Testing (65-80%)

**→ Load:** @orchestr8://match?query=web+performance+lighthouse&categories=skill,guide&maxTokens=800

**Activities:**
- Run Lighthouse performance audits
- Measure Core Web Vitals (LCP, FID, CLS)
- Analyze bundle sizes
- Test load times under various conditions
- Check for performance regressions
- Validate against performance budget

**→ Checkpoint:** Performance meets targets

## Phase 6: Security Testing (80-90%)

**→ Load:** @orchestr8://match?query=web+security+testing&categories=skill,guide&maxTokens=800

**Activities:**
- Check CSP headers
- Test XSS prevention
- Validate input sanitization
- Test authentication flows
- Check for exposed secrets
- Validate HTTPS usage

**→ Checkpoint:** Security validated

## Phase 7: Issue Detection & Fixing (90-100%)

**→ Load:** @orchestr8://match?query=debugging+fixing+testing&categories=skill&maxTokens=600

**Activities:**
- Analyze all test failures
- Prioritize issues by severity
- Generate bug reports
- Suggest fixes for common issues
- Create automated test suite
- Document test coverage

**→ Checkpoint:** Issues documented and tests generated

## Success Criteria

✅ Application successfully launched
✅ Visual tests pass on all viewports
✅ Functional tests cover critical paths
✅ Accessibility meets WCAG 2.2 AA standards
✅ Performance meets Lighthouse targets
✅ Security headers configured
✅ All critical issues documented
✅ Automated test suite generated
✅ Test coverage report created
