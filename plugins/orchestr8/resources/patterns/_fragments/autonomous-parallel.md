---
id: autonomous-parallel-workflow
category: pattern
tags: [workflow, parallel, autonomous, orchestration, subagents, concurrent, build, create, implement, develop, api, frontend, backend, fullstack]
capabilities:
  - Parallel task execution
  - Dynamic subagent coordination
  - Autonomous decision making
  - Progress tracking
  - Concurrent workstream management
useWhen:
  - Multi-component projects with 3+ independent workstreams allowing simultaneous development without file conflicts
  - Full-stack development requiring parallel backend API, frontend UI, database schema, and testing track execution
  - Time-critical deliverables where concurrent subagent execution reduces total time by 40%+ versus sequential approach
  - Microservices architecture implementation with independently deployable services requiring isolated development tracks
  - Feature development with separable concerns like core implementation, comprehensive testing, documentation, and integration layers
  - Complex system builds where dependency analysis reveals natural decomposition into parallel-executable components
estimatedTokens: 650
---

# Autonomous Parallel Workflow Pattern

## Overview

Execute complex tasks by breaking them into independent workstreams that run concurrently via subagents. Maximize efficiency through parallel execution while maintaining coordination and integration.

## Execution Model

**Phase 1: Analysis (0-10%)**
- Decompose request into independent tracks
- Identify dependencies and execution order
- Plan integration strategy

**Phase 2: Parallel Execution (10-90%)**
- Launch all subagents in a SINGLE message using multiple Task tool invocations
- Each agent works autonomously on its assigned track
- High-level orchestrator tracks overall progress via TodoWrite

**Phase 3: Integration (90-100%)**
- Collect results from all tracks
- Integrate components
- Resolve conflicts
- Validate end-to-end functionality

## Implementation Guidelines

### Launching Parallel Subagents

To launch subagents in parallel, use multiple Task tool invocations in ONE message:

```
Send a single message with multiple <invoke name="Task"> blocks
Each subagent gets clear, independent scope
Wait for all to complete before integration
```

### Track Independence

Each track should:
- Have minimal dependencies on other tracks
- Work on separate components/layers
- Report back complete, testable results
- Flag blockers immediately

### Common Track Patterns

**Full-Stack Development:**
- Track A: Backend API
- Track B: Frontend UI
- Track C: Database schema
- Track D: Testing & CI/CD

**Microservices:**
- Track A: Service 1
- Track B: Service 2
- Track C: API Gateway
- Track D: Infrastructure

**Feature Development:**
- Track A: Core implementation
- Track B: Tests
- Track C: Documentation
- Track D: Integration

## Best Practices

✅ Launch ALL parallel agents in a single message (required by Claude Code)
✅ Give each agent clear, bounded scope
✅ Use TodoWrite at orchestrator level for high-level tracking
✅ Let subagents manage their own detailed progress
✅ Plan integration points before launching
✅ Have fallback for if parallelization isn't possible

## Integration Strategy

After parallel work completes:
1. **Review outputs** - Check each track's deliverables
2. **Test integration** - Verify components work together
3. **Resolve conflicts** - Handle overlapping concerns
4. **Validate** - Run end-to-end tests
5. **Document** - Update docs with complete solution

## When NOT to Use Parallel Execution

- Tasks have strict sequential dependencies
- Single domain with no natural decomposition
- Resource constraints (user specified serial execution)
- Complexity doesn't justify coordination overhead
