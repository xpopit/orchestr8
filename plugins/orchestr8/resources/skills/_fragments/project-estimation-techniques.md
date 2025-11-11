---
id: project-estimation-techniques
category: skill
tags: [estimation, story-points, velocity, planning-poker, sizing, forecasting, capacity, metrics, t-shirt-sizing, effort]
capabilities:
  - Story point estimation
  - Velocity calculation and forecasting
  - Planning poker facilitation
  - T-shirt sizing for epics
  - Effort estimation calibration
  - Risk-adjusted timeline planning
useWhen:
  - Estimating software project timelines with story points, planning poker, and historical velocity data
  - Building estimation framework breaking down features into tasks with optimistic, realistic, and pessimistic scenarios
  - Implementing three-point estimation technique calculating expected duration with uncertainty ranges
  - Designing estimation process accounting for technical debt, unknown unknowns, and integration complexity
  - Creating estimation tracking system comparing actual vs estimated effort for continuous estimation improvement
estimatedTokens: 650
---

# Project Estimation Techniques

## Story Points (Fibonacci Scale)

**Scale:** 1, 2, 3, 5, 8, 13, 21
**Principle:** Relative sizing, not time-based

```markdown
## Reference Stories (Calibration)

**1 point:** Simple config change
- Update environment variable
- Fix typo in documentation
- ~1-2 hours

**3 points:** Straightforward feature
- Add new API endpoint (CRUD)
- Basic form with validation
- ~4-6 hours

**8 points:** Complex feature
- Multi-step workflow
- Integration with external service
- Multiple components affected
- ~2-3 days

**13 points:** Epic-level work
- New subsystem
- Significant architecture change
- Multiple dependencies
- ~1 week (consider splitting)
```

## Planning Poker Process

**Steps:**
1. Product owner presents story
2. Team asks clarifying questions (5 min max)
3. Everyone selects estimate privately
4. Reveal simultaneously
5. Discuss highest and lowest estimates
6. Re-estimate until consensus (within 1-2 points)

✅ **Consensus:** 3, 3, 5, 5 → Settle on 5
❌ **No Consensus:** 2, 8, 13 → Need more discussion

**Time-box:** 5 minutes per story

## T-Shirt Sizing (Epics)

**XS (1-2 sprints):** 10-20pts - Minor features, UI polish, docs
**S (2-4 sprints):** 20-40pts - New feature, API upgrade, optimization
**M (4-8 sprints):** 40-80pts - New module, refactoring, integration
**L (8-16 sprints):** 80-160pts - Platform capability, multi-team, architecture
**XL (16+ sprints):** >160pts - Break into smaller epics (too risky)

## Velocity Tracking

**Velocity = Completed Points / Sprint** (use 3-sprint rolling average)

**Example:** Sprint 1: 18pts, Sprint 2: 22pts, Sprint 3: 20pts → **Velocity: 20pts/sprint**

**Forecasting:** 80pt epic ÷ 20pts/sprint = 4 sprints + 20% buffer = **5 sprints**

## Three-Point Estimation

**Formula:** Expected = (Optimistic + 4×Realistic + Pessimistic) / 6

**Example - Auth System:**
- Optimistic: 5d (best case)
- Realistic: 10d (most likely)
- Pessimistic: 20d (worst case)
- **Expected:** (5 + 40 + 20) / 6 = **11 days**
- **90% Confidence:** Add buffer = **14 days**

## Capacity Planning

**Team Capacity:** 10 days × 5 devs = 50 person-days
**Adjustments:** -10% meetings, -15% bugs, -10% context = **32.5 days (65%)**

**To Story Points:** 32.5 days ÷ 0.5 days/pt = 65pts
**Commit:** 80% = 52pts | **Buffer:** 20% = 13pts

## Anti-Patterns

❌ **Don't:** Estimate in hours, one-person dominance, skip small tasks, ignore velocity, estimate without clarity
✅ **Do:** Relative sizing, team participation, track all work, regular calibration, clarify before estimating

## Accuracy Tracking

```markdown
**Story:** USER-101 Payment | **Est:** 8pts | **Actual:** 13pts | **Var:** +62%
**Reason:** Missed PCI compliance testing
**Lesson:** Add 5pt buffer for payment features
```

**Calibrate:** Every 3-5 sprints - review variance patterns, adjust reference stories
