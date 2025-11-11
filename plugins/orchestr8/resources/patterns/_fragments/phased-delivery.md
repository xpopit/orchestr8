---
id: phased-delivery-workflow
category: pattern
tags: [workflow, phased, incremental, iterative, mvp]
capabilities:
  - Incremental delivery
  - MVP-first approach
  - Risk mitigation
  - User feedback integration
  - Iterative refinement
useWhen:
  - Uncertain or evolving requirements requiring iterative validation with user feedback between each phase
  - MVP-first development needing working software within days rather than weeks with incremental enhancements
  - Risk mitigation scenarios requiring early hypothesis validation before committing to full feature development
  - Learning-oriented projects in unfamiliar domains where core assumptions need validation before scale-out
  - Long-term initiatives with changing business needs requiring flexible pivot points between delivery phases
estimatedTokens: 500
---

# Phased Delivery Workflow Pattern

## Overview

Deliver functionality incrementally through well-defined phases, starting with a minimal viable product (MVP) and iterating based on feedback and learning.

## Execution Model

**Phase 1: MVP / Core (0-30%)**
- Identify absolute minimum viable functionality
- Implement only essential features
- Validate core assumptions
- Get working end-to-end flow

**Phase 2: Enhancement (30-70%)**
- Add secondary features
- Improve user experience
- Address feedback from Phase 1
- Optimize performance

**Phase 3: Polish (70-100%)**
- Edge case handling
- Error messages and validation
- Documentation
- Production readiness

## Key Principles

✅ **Ship early** - Get something working quickly
✅ **Validate assumptions** - Test core hypothesis first
✅ **Iterate based on feedback** - Don't build what's not needed
✅ **Risk mitigation** - Fail fast if approach is wrong
✅ **Continuous delivery** - Each phase produces working software

## Phase Boundaries

Between phases:
1. **Review** - Assess what worked and what didn't
2. **Decide** - Continue, pivot, or stop
3. **Plan** - Adjust approach for next phase
4. **Communicate** - Update stakeholders

## Best Practices

- Define clear success criteria for each phase
- Keep MVP truly minimal
- Get user feedback between phases
- Don't skip to polish before core is solid
- Be prepared to abandon features that don't add value

## Example: API Development

**Phase 1 (MVP):**
- Single endpoint working end-to-end
- Basic request/response handling
- Minimal error handling

**Phase 2 (Enhancement):**
- All planned endpoints
- Authentication
- Data validation
- Database integration

**Phase 3 (Polish):**
- Rate limiting
- Comprehensive error handling
- API documentation
- Monitoring and logging
