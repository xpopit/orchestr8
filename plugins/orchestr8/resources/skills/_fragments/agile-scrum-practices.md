---
id: agile-scrum-practices
category: skill
tags: [agile, scrum, sprint, ceremonies, retrospective, standup, backlog, iteration, planning, team-collaboration]
capabilities:
  - Sprint planning and execution
  - Scrum ceremony facilitation
  - Backlog grooming and prioritization
  - Retrospective analysis and improvement
  - Iterative delivery management
  - Team velocity optimization
useWhen:
  - Planning two-week sprint for distributed team building multi-tenant SaaS dashboard with velocity tracking and capacity management
  - Facilitating sprint retrospective to address production incident patterns and implement continuous improvement action items
  - Grooming product backlog for e-commerce platform with MoSCoW prioritization framework and story point estimation
  - Coordinating daily standup ceremonies for remote engineering team with focus on identifying and removing blockers
  - Defining sprint goals and acceptance criteria for API migration project with measurable deliverables and risk buffers
  - Establishing scrum metrics dashboard tracking velocity variance, burndown trends, and cycle time for stakeholder reporting
estimatedTokens: 650
---

# Agile Scrum Practices

## Sprint Planning Template

**Sprint Duration:** 1-2 weeks
**Capacity:** Team velocity × sprint length

```markdown
## Sprint Goal
Clear, achievable objective that unifies sprint work

## Sprint Backlog
- [ ] USER-101: Feature X (8 points) - High Priority
- [ ] USER-102: Feature Y (5 points) - High Priority
- [ ] TECH-50: Refactor Z (3 points) - Medium Priority

**Total Points:** 16 / 20 capacity
**Risk Buffer:** 4 points (20%)
```

## Daily Standup Structure

**Duration:** 15 minutes max
**Format:** Each member answers:
1. Yesterday: What I completed
2. Today: What I'm working on
3. Blockers: What's preventing progress

✅ **Good:** "Completed API integration. Today: writing tests. Blocked: need DB credentials"
❌ **Bad:** "Working on stuff. Making progress. No blockers"

## Backlog Management

**Priority Framework:**
1. **Must Have:** Critical for release
2. **Should Have:** Important but not critical
3. **Could Have:** Nice to have if time permits
4. **Won't Have:** Deferred to future sprints

**Grooming Cadence:** Mid-sprint (every 3-5 days)

```markdown
## Backlog Item Template
**Title:** [USER-ID] User action/goal
**As a:** [user role]
**I want:** [capability]
**So that:** [business value]

**Acceptance Criteria:**
- ✓ Testable condition 1
- ✓ Testable condition 2
- ✓ Testable condition 3

**Definition of Done:**
- Code complete and reviewed
- Tests passing (>80% coverage)
- Documentation updated
- Deployed to staging
```

## Sprint Retrospective

**Format:** Start-Stop-Continue

```markdown
## What Went Well ✅
- Fast PR reviews (avg 2 hours)
- Clean test coverage (85%)

## What Didn't Go Well ❌
- 3 production incidents
- Scope creep on USER-101

## Action Items
- [ ] Implement feature flags (Owner: Dev Lead, Due: Next sprint)
- [ ] Add staging environment checks (Owner: DevOps, Due: 3 days)
- [ ] Tighten scope definition process (Owner: PM, Due: Immediately)
```

## Sprint Metrics

**Track:**
- Velocity: Points completed per sprint
- Burndown: Work remaining over time
- Cycle Time: Idea to production duration
- Defect Rate: Bugs per story point

**Healthy Indicators:**
- Velocity variance <20%
- Burndown follows linear trend
- Cycle time decreasing
- Defect rate <10%

## Anti-Patterns

❌ **Don't:**
- Commit to 100% capacity (leaves no buffer)
- Skip retrospectives (misses improvement opportunities)
- Let standups become status meetings (wastes time)
- Carry over >20% of sprint (indicates poor planning)
- Change sprint scope mid-sprint (destabilizes team)

✅ **Do:**
- Maintain 80% capacity commitment
- Time-box all ceremonies strictly
- Focus standup on blockers
- Complete or cut stories cleanly
- Protect team from interruptions
