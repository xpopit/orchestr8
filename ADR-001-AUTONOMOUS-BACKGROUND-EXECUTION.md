# ADR-001: Autonomous Background Agent Execution Architecture

**Status:** Proposed
**Decision Date:** 2025-11-03
**Impact:** CRITICAL - Fundamental architectural change
**Affects:** All workflows, orchestrators, and agent invocation patterns

---

## Problem Statement

### Current Architecture Flaw

The orchestr8 plugin currently processes too much in the **main Claude Code context**, leading to:

1. **Context bloat**: Main conversation accumulates hundreds of thousands of tokens
2. **Poor user experience**: Users see verbose agent execution logs instead of clean summaries
3. **Token waste**: Main context pays for agent thinking, not just results
4. **Limited autonomy**: Workflows require constant main context interaction
5. **Scalability issues**: Cannot run truly long-running autonomous workflows

### Example of Current (Bad) Pattern

```markdown
# Current: add-feature.md workflow
User: /add-feature "User authentication"

Main Context (claude.ai conversation):
[Orchestrator thinking: 5000 tokens]
→ Analyzing requirements... [verbose output]
→ Designing architecture... [verbose output]
→ Implementing frontend... [verbose code review]
→ Implementing backend... [verbose code review]
→ Writing tests... [verbose test output]
→ Running security audit... [verbose scan results]
→ Generating documentation... [verbose docs]

Total main context usage: 50,000+ tokens
User sees: Everything (overwhelming)
User gets: Verbose logs, not clean summary
```

### Desired (Good) Pattern

```markdown
# Desired: add-feature.md workflow
User: /add-feature "User authentication"

Main Context (claude.ai conversation):
Starting autonomous feature development workflow...
Feature: User authentication
Background workflow ID: workflow-abc123

[Wait 5 minutes - background agents working]

✅ Feature development complete!

Summary:
- Requirements analyzed: OAuth2 + JWT tokens
- Architecture designed: Modular auth service
- Implementation: 8 files created, 200 tests passing
- Security: No vulnerabilities found
- Documentation: API docs generated

📊 Details: /reports/workflow-abc123/summary.md
🔍 Review changes: git diff main...feature/auth

Total main context usage: 500 tokens
User sees: Clean summary only
User gets: Actionable results
```

---

## Decision

### Implement True Background Agent Execution

Transform orchestr8 from **interactive orchestration** to **autonomous background orchestration** using the `run_in_background` parameter of the Task and Bash tools.

### Core Principles

1. **Main context is for summarization only**
   - User interaction
   - High-level status updates
   - Final results presentation
   - Error escalation (when agent needs user input)

2. **Background agents do the work**
   - All agent invocations run in background
   - Agents communicate via files (not main context)
   - Orchestrators poll agent status
   - Results summarized at completion

3. **File-based state management**
   - All intermediate results written to files
   - State persists across context boundaries
   - Main context reads final summaries only

4. **Iterative autonomy**
   - Agents retry failures automatically
   - Orchestrators handle dependencies
   - Quality gates enforced without user interaction
   - Only escalate to user when blocked

---

## Implementation Design

### 1. Background Task Execution API

#### New Agent Invocation Pattern

**Before (Current - BAD):**
```markdown
# In workflow or orchestrator
Task: Use architect agent to design feature X
[Waits synchronously, returns full output to main context]
```

**After (Proposed - GOOD):**
```markdown
# In workflow or orchestrator
Background Task: Launch architect agent for feature X
  - task_id: design-abc123
  - output_file: .orchestr8/workflows/abc123/design-result.md
  - status_file: .orchestr8/workflows/abc123/design-status.json
  - run_in_background: true

[Returns immediately to main context]
[Orchestrator polls status_file every 30s]
[Reads output_file when status = completed]
```

#### Workflow State Directory Structure

```
.orchestr8/
├── workflows/
│   └── workflow-abc123/              # Per-workflow directory
│       ├── manifest.json             # Workflow metadata
│       ├── status.json               # Overall workflow status
│       ├── phases/
│       │   ├── 1-requirements/
│       │   │   ├── status.json       # Phase status
│       │   │   ├── input.md          # Phase input
│       │   │   ├── output.md         # Phase output
│       │   │   └── agent-logs.txt    # Agent execution logs
│       │   ├── 2-architecture/
│       │   ├── 3-implementation/
│       │   ├── 4-testing/
│       │   └── 5-deployment/
│       ├── summary.md                # Final summary for user
│       └── errors.log                # Errors requiring escalation
```

### 2. Orchestrator Background Execution Pattern

#### Meta-Orchestrator Design

```markdown
---
name: autonomous-workflow-orchestrator
description: Executes workflows autonomously in background with minimal main context usage
model: claude-opus-4
tools:
  - Task
  - Read
  - Write
  - Bash
  - BashOutput  # NEW: Monitor background bash shells
  - Glob
  - Grep
---

# Autonomous Workflow Orchestrator

You execute multi-phase workflows completely in the background, only returning to main context with final summaries.

## Operating Principles

1. **Minimize Main Context Interaction**
   - Launch all agents in background
   - Write all state to files
   - Only return to main context at completion or when blocked

2. **File-Based State Management**
   - Write phase inputs to files
   - Read phase outputs from files
   - Track status in JSON files
   - Log everything for debugging

3. **Autonomous Iteration**
   - Retry failed phases automatically (up to 3 attempts)
   - Handle dependencies (wait for prerequisite phases)
   - Enforce quality gates without user interaction
   - Only escalate critical blockers

## Execution Pattern

### Phase Execution Template

For each workflow phase:

```markdown
### Phase: [Name] ([N]% complete)

1. **Setup Phase Directory**
   ```bash
   mkdir -p .orchestr8/workflows/${WORKFLOW_ID}/phases/${PHASE_NUM}-${PHASE_NAME}
   ```

2. **Write Phase Input**
   ```bash
   cat > .orchestr8/workflows/${WORKFLOW_ID}/phases/${PHASE_NUM}-${PHASE_NAME}/input.md << EOF
   [Phase requirements and context]
   EOF
   ```

3. **Launch Agent in Background**
   ```bash
   # Use Task tool with background execution
   # Returns immediately with task_id
   ```

4. **Write Status File**
   ```json
   {
     "phase": "[PHASE_NAME]",
     "status": "running",
     "agent": "[AGENT_NAME]",
     "task_id": "[TASK_ID]",
     "started_at": "[TIMESTAMP]",
     "output_file": ".orchestr8/workflows/abc123/phases/1-requirements/output.md"
   }
   ```

5. **Poll Status (Background Loop)**
   ```bash
   while true; do
     status=$(jq -r '.status' .orchestr8/workflows/abc123/phases/1-requirements/status.json)
     if [ "$status" = "completed" ] || [ "$status" = "failed" ]; then
       break
     fi
     sleep 30
   done
   ```

6. **Process Results**
   - If completed: Read output.md, proceed to next phase
   - If failed: Retry (up to 3 attempts) or escalate to user

7. **Update Workflow Status**
   ```json
   {
     "workflow_id": "abc123",
     "status": "in_progress",
     "current_phase": 2,
     "total_phases": 8,
     "completion_percentage": 25,
     "phases_completed": ["1-requirements"],
     "phases_running": ["2-architecture"],
     "updated_at": "[TIMESTAMP]"
   }
   ```

### Example: Autonomous Add Feature Workflow

```markdown
# /add-feature workflow execution

## User Request (Main Context)
User: /add-feature "User authentication with OAuth2"

## Orchestrator Response (Main Context - IMMEDIATE)
✅ Autonomous workflow started
📋 Workflow ID: workflow-20251103-143022
📂 Working directory: .orchestr8/workflows/workflow-20251103-143022

Background execution in progress. I'll notify you when complete.

You can monitor progress:
- Status: cat .orchestr8/workflows/workflow-20251103-143022/status.json
- Summary: cat .orchestr8/workflows/workflow-20251103-143022/summary.md

[Main context ends here - returns control to user immediately]

---

## Background Execution (NO MAIN CONTEXT INVOLVEMENT)

### Phase 1: Requirements Analysis (0-15%)
[Agent runs in background, writes to files]
Status: .orchestr8/workflows/workflow-20251103-143022/phases/1-requirements/status.json
Output: .orchestr8/workflows/workflow-20251103-143022/phases/1-requirements/output.md

### Phase 2: Architecture Design (15-30%)
[Agent runs in background, reads Phase 1 output from file]
[Writes architecture design to file]

### Phase 3: Implementation (30-60%)
[Frontend agent runs in background]
[Backend agent runs in background]
[Both agents coordinate via files, not main context]

### Phase 4: Testing (60-75%)
[Test engineer runs in background]
[Writes test results to file]

### Phase 5: Quality Gates (75-90%)
[Code review agent runs in background]
[Security agent runs in background]
[Performance agent runs in background]
[All agents write results to files]

### Phase 6: Documentation (90-95%)
[Documentation agent runs in background]
[Generates API docs, README updates]

### Phase 7: Finalization (95-100%)
[Orchestrator summarizes all results]
[Writes final summary.md]
[Updates status.json to "completed"]

---

## Notification to User (Main Context - ONLY AT COMPLETION)

✅ Feature development complete!

**Feature:** User authentication with OAuth2
**Workflow ID:** workflow-20251103-143022
**Duration:** 12 minutes
**Status:** All quality gates passed

### Summary

**Requirements:**
- OAuth2 authentication with Google, GitHub providers
- JWT token-based authorization
- Refresh token rotation
- Session management

**Architecture:**
- Modular auth service (src/services/auth/)
- JWT middleware for protected routes
- Redis for session storage
- Environment-based configuration

**Implementation:**
- 8 files created
- 450 lines of code
- 12 API endpoints
- 200 unit tests (100% coverage)
- 15 integration tests

**Quality Gates:**
✅ Code Review: LGTM - follows best practices
✅ Tests: 200/200 passing (100% coverage)
✅ Security: No vulnerabilities found
✅ Performance: All endpoints < 50ms p95
✅ Documentation: API docs generated

### Files Changed
- src/services/auth/AuthService.ts (new)
- src/services/auth/JWTService.ts (new)
- src/middleware/authMiddleware.ts (new)
- src/routes/auth.ts (new)
- tests/services/auth/*.test.ts (new)
- README.md (updated)
- docs/API.md (updated)

### Next Steps
1. Review changes: `git diff main...feature/oauth-auth`
2. Test locally: `npm test && npm run dev`
3. Create PR: `gh pr create --base main --head feature/oauth-auth`

📊 Full report: .orchestr8/workflows/workflow-20251103-143022/summary.md

[Main context ends - total tokens used: ~500]
```

---

## 3. Background Agent Communication Protocol

### Agent-to-Orchestrator Communication (File-Based)

**Agents write results to structured files instead of returning to main context:**

```json
// .orchestr8/workflows/abc123/phases/2-architecture/output.json
{
  "agent": "architect",
  "phase": "architecture",
  "status": "completed",
  "timestamp": "2025-11-03T14:35:22Z",
  "results": {
    "files_created": [
      "docs/ARCHITECTURE.md",
      "docs/decisions/ADR-001-auth-design.md"
    ],
    "summary": "Designed modular authentication service with JWT tokens",
    "architecture_decisions": [
      {
        "title": "Use JWT for stateless auth",
        "rationale": "Scalability and simplicity",
        "alternatives": "Session-based auth",
        "decision": "JWT with refresh tokens"
      }
    ],
    "next_steps": [
      "Implement AuthService",
      "Implement JWTService",
      "Add auth middleware"
    ]
  },
  "quality_gates": {
    "architecture_review": "passed",
    "feasibility_check": "passed",
    "security_review": "passed"
  },
  "metrics": {
    "execution_time_seconds": 45,
    "tokens_used": 8500,
    "files_analyzed": 12
  }
}
```

**Orchestrators read results from files and proceed:**

```bash
# Orchestrator polls for completion
while [ "$(jq -r '.status' output.json)" != "completed" ]; do
  sleep 10
done

# Read results
ARCHITECTURE_FILES=$(jq -r '.results.files_created[]' output.json)
NEXT_STEPS=$(jq -r '.results.next_steps[]' output.json)

# Proceed to next phase with file-based context
cat > ../3-implementation/input.md << EOF
# Implementation Phase Input

## Architecture (from previous phase)
See: $(jq -r '.results.files_created[0]' ../2-architecture/output.json)

## Tasks
$(jq -r '.results.next_steps[]' ../2-architecture/output.json)

## Quality Gates Required
- Code review
- Unit tests (80%+ coverage)
- Integration tests
EOF
```

---

## 4. Orchestrator Monitoring & Status Updates

### Periodic Status Updates (Optional)

If user wants live updates, orchestrator can provide lightweight status:

```markdown
# User asks for status
User: What's the status of workflow-20251103-143022?

Main Context Response:
📊 Workflow Status: workflow-20251103-143022

**Feature:** User authentication with OAuth2
**Status:** In Progress (65% complete)
**Current Phase:** Testing (Phase 4/7)

**Completed Phases:**
✅ Requirements Analysis (15%)
✅ Architecture Design (30%)
✅ Implementation (60%)

**Running:**
⏳ Testing - test-engineer writing unit tests

**Upcoming:**
⏸️ Quality Gates
⏸️ Documentation
⏸️ Finalization

**Estimated completion:** 5 minutes

[Main context usage: ~200 tokens]
```

### Error Escalation

Orchestrator only returns to main context for critical blockers:

```markdown
# Agent encounters blocker it can't resolve

Main Context:
⚠️ Workflow Blocked: workflow-20251103-143022

**Phase:** Implementation
**Agent:** backend-developer
**Blocker:** Missing environment variable: DATABASE_URL

**Question:** Where should the authentication service connect to the database?

**Options:**
1. Use existing PostgreSQL database (postgresql://localhost:5432/myapp)
2. Create new auth-specific database (postgresql://localhost:5432/auth)
3. Use different database technology (e.g., MongoDB)

**Context:**
- Current architecture uses PostgreSQL for user data
- Auth service needs to store: users, sessions, refresh tokens
- Located in: .orchestr8/workflows/abc123/phases/3-implementation/blocker.md

Please advise, and I'll continue the workflow.

[Main context usage: ~300 tokens for critical blocker only]
```

---

## 5. Workflow-Level Retry and Error Handling

### Autonomous Retry Strategy

```markdown
# In autonomous-workflow-orchestrator.md

## Error Handling Protocol

### Retry Strategy (Autonomous)

For each phase failure:

1. **Attempt 1:** Execute phase
   - If success: proceed
   - If failure: wait 30s, retry

2. **Attempt 2:** Execute phase with additional context
   - Include error from Attempt 1
   - Provide more specific guidance
   - If success: proceed
   - If failure: wait 60s, retry

3. **Attempt 3:** Execute phase with alternative agent
   - Try different agent with same capability
   - Example: frontend-developer fails → try react-specialist
   - If success: proceed
   - If failure: escalate to user

### Escalation Criteria

Escalate to user (return to main context) ONLY when:
- ❌ All 3 retry attempts failed
- ❌ Missing critical information (API keys, DB credentials)
- ❌ Ambiguous requirements (need user decision)
- ❌ External service unavailable (GitHub, npm registry)
- ❌ Quality gate failure requiring architectural change

DO NOT escalate for:
- ✅ Transient test failures (retry with fix)
- ✅ Linting errors (auto-fix with code formatter)
- ✅ Missing dependencies (auto-install)
- ✅ Simple bugs (auto-fix and re-test)
```

---

## 6. Quality Gates in Background

### Autonomous Quality Gate Validation

```markdown
# Quality gates run in background, no main context involvement

## Quality Gate Execution Pattern

For each quality gate:

1. **Launch quality agent in background**
   ```bash
   # code-reviewer runs in background
   Task: code-reviewer (background)
   Output: .orchestr8/workflows/abc123/phases/5-quality/code-review.json
   ```

2. **Wait for completion**
   ```bash
   while [ "$(jq -r '.status' code-review.json)" != "completed" ]; do
     sleep 10
   done
   ```

3. **Evaluate results autonomously**
   ```bash
   RESULT=$(jq -r '.quality_gates.code_review' code-review.json)

   if [ "$RESULT" = "passed" ]; then
     # Proceed to next gate
     echo "✅ Code review passed"
   elif [ "$RESULT" = "failed_minor" ]; then
     # Auto-fix minor issues and retry
     echo "⚠️ Code review found minor issues, auto-fixing..."
     # Launch code-fixer agent in background
     # Retry code review
   elif [ "$RESULT" = "failed_major" ]; then
     # Escalate to user
     echo "❌ Code review found major issues requiring human review"
     # Write to .orchestr8/workflows/abc123/errors.log
     # Return to main context
   fi
   ```

4. **Aggregate all quality gate results**
   ```json
   // .orchestr8/workflows/abc123/quality-gates-summary.json
   {
     "code_review": {
       "status": "passed",
       "issues_found": 3,
       "issues_fixed": 3,
       "severity": "low"
     },
     "testing": {
       "status": "passed",
       "tests_run": 200,
       "tests_passed": 200,
       "coverage": "100%"
     },
     "security": {
       "status": "passed",
       "vulnerabilities_found": 0,
       "dependencies_scanned": 45
     },
     "performance": {
       "status": "passed",
       "endpoints_tested": 12,
       "p95_latency_ms": 45,
       "target_ms": 200
     }
   }
   ```

5. **Only return to main context with summary**
   ```markdown
   ✅ All quality gates passed

   - Code Review: 3 minor issues auto-fixed
   - Testing: 200/200 tests passing (100% coverage)
   - Security: No vulnerabilities
   - Performance: All endpoints < 50ms p95
   ```

---

## 7. Implementation Roadmap

### Phase 1: Core Background Execution (v2.0.0)

**Changes Required:**

1. **Update all workflows to use background execution**
   ```markdown
   # In .claude/commands/add-feature.md

   ## Execution Strategy

   This workflow runs completely in background. Main context is only used for:
   - Initial user request
   - Final summary presentation
   - Critical blocker escalation

   ## Implementation

   1. Create workflow directory: .orchestr8/workflows/${WORKFLOW_ID}
   2. Launch autonomous-workflow-orchestrator in background
   3. Return to user immediately with workflow ID
   4. Orchestrator manages all phases autonomously
   5. Only return to main context at completion or blocker
   ```

2. **Create autonomous-workflow-orchestrator.md**
   - New meta-orchestrator specialized in background execution
   - Manages file-based state
   - Polls agent status
   - Handles retries autonomously
   - Only escalates critical blockers

3. **Update all orchestrators to write file-based outputs**
   ```markdown
   # In all orchestrators (project, feature, etc.)

   ## Output Protocol

   ALWAYS write results to files, NEVER return verbose output to main context.

   Output file: .orchestr8/workflows/${WORKFLOW_ID}/phases/${PHASE}/output.json

   Structure:
   {
     "agent": "agent-name",
     "status": "completed" | "failed" | "blocked",
     "summary": "One-line summary for main context",
     "results": { ... },
     "files_created": [ ... ],
     "next_steps": [ ... ]
   }
   ```

4. **Add BashOutput monitoring**
   ```markdown
   # Orchestrators use BashOutput to monitor background tasks

   # Launch agent in background
   bash_id=$(Task: architect --background)

   # Poll for completion
   while true; do
     output=$(BashOutput: $bash_id)
     if [[ $output == *"COMPLETED"* ]]; then
       break
     fi
     sleep 30
   done
   ```

### Phase 2: Iterative Quality Gates (v2.1.0)

**Auto-fixing capabilities:**

1. **code-fixer.md agent**
   - Automatically fixes linting errors
   - Applies code formatters
   - Resolves simple bugs
   - Re-runs quality gates after fixes

2. **test-fixer.md agent**
   - Analyzes test failures
   - Fixes broken tests
   - Adds missing test cases
   - Re-runs test suite

3. **Retry orchestration**
   - 3 retry attempts per phase
   - Escalate only after all retries exhausted

### Phase 3: Long-Running Autonomous Workflows (v2.2.0)

**Multi-hour/multi-day workflows:**

1. **Persistent workflow state**
   - Workflows survive IDE restarts
   - Resume from last checkpoint
   - Durable state in .orchestr8/

2. **Background daemon mode**
   - Workflows run even when IDE closed
   - Notification on completion
   - Email/Slack integration for status

3. **Dependency management**
   - Workflows wait for external dependencies
   - Retry transient failures indefinitely
   - Only escalate persistent blockers

---

## Benefits

### 1. Optimal Context Usage

**Before:**
- Main context: 50,000 tokens per workflow
- User sees: Verbose agent logs
- Cost: High token consumption

**After:**
- Main context: 500 tokens per workflow (100x reduction!)
- User sees: Clean summaries only
- Cost: 99% token reduction in main context

### 2. True Autonomy

**Before:**
- User must monitor workflow progress
- Frequent context switches
- Manual intervention for retries

**After:**
- User launches workflow, gets result later
- Zero monitoring required
- Automatic retries and error handling

### 3. Scalability

**Before:**
- Limited to workflows that fit in context window
- Cannot run multiple workflows concurrently
- Main context becomes bloated

**After:**
- Unlimited workflow length (file-based state)
- Run 10+ workflows concurrently
- Main context stays clean

### 4. User Experience

**Before:**
```
User: /add-feature "auth"
[Waits 10 minutes watching verbose logs]
[Context window fills with 50k tokens of agent execution]
User: [Overwhelmed, can't find actual results]
```

**After:**
```
User: /add-feature "auth"
Claude: ✅ Workflow started (ID: abc123). I'll notify you when complete.
[User continues other work]
[10 minutes later]
Claude: ✅ Feature complete! Here's the summary: ...
User: [Happy, clear results]
```

---

## Consequences

### Positive

1. **✅ 99% reduction in main context token usage**
2. **✅ True autonomous workflows** (no user monitoring needed)
3. **✅ Better user experience** (summaries, not logs)
4. **✅ Scalability** (file-based state, unlimited workflow length)
5. **✅ Concurrent workflows** (multiple features in parallel)
6. **✅ Resumability** (workflows survive IDE restarts)

### Negative

1. **⚠️ Complexity increase** (file-based orchestration is harder)
2. **⚠️ Debugging harder** (logs in files, not main context)
3. **⚠️ Requires file system access** (won't work in restricted environments)
4. **⚠️ Migration effort** (rewrite all 19 workflows)

### Mitigation

1. **Complexity:** Provide clear templates and examples
2. **Debugging:** Create debug command: `/workflow-logs abc123`
3. **File system:** Document requirements clearly
4. **Migration:** Gradual migration, keep old workflows during transition

---

## Alternatives Considered

### Alternative 1: Keep Current Interactive Pattern

**Rejected because:**
- Does not solve context bloat problem
- Does not enable true autonomy
- Poor user experience at scale

### Alternative 2: Use External Service (Separate Backend)

**Rejected because:**
- Requires infrastructure (complexity, cost)
- Defeats purpose of lightweight plugin
- Network latency issues
- Would need API keys, authentication

### Alternative 3: Hybrid Approach (Some Background, Some Interactive)

**Considered for future:**
- Let user choose: `/add-feature --background` vs `/add-feature --interactive`
- Default to background for autonomy
- Interactive mode for learning/debugging

---

## Implementation Priority

### CRITICAL Priority (v2.0.0 - Next Major Release)

This is a **fundamental architectural improvement** that addresses the core weakness of the current system. Should be prioritized above all other enhancements.

**Timeline:** 4-6 weeks

**Effort Breakdown:**
1. Design autonomous-workflow-orchestrator: 1 week
2. Update all 19 workflows: 2 weeks
3. Update file-based output protocol: 1 week
4. Testing and refinement: 1 week
5. Documentation: 1 week

**Success Metrics:**
- Main context token usage < 1,000 tokens per workflow
- User sees clean summaries, not verbose logs
- Workflows complete without user intervention
- Quality gates pass autonomously (>90% of the time)

---

## Migration Plan

### Step 1: Create autonomous-workflow-orchestrator.md

New meta-orchestrator that manages background execution:
- File-based state management
- Status polling
- Retry logic
- Error escalation

### Step 2: Update One Workflow as Proof of Concept

Start with `/add-feature` (most used workflow):
- Rewrite to use background execution
- Test thoroughly
- Measure token usage reduction
- Get user feedback

### Step 3: Update Remaining Workflows

Apply pattern to all 19 workflows:
- `/new-project`
- `/fix-bug`
- `/refactor`
- `/security-audit`
- `/optimize-performance`
- etc.

### Step 4: Deprecate Old Pattern

- Mark old interactive pattern as deprecated
- Provide migration guide
- Keep old workflows for backward compatibility (1 release cycle)

### Step 5: Document New Pattern

- Update ARCHITECTURE.md
- Update workflow creation guide
- Add examples to CLAUDE.md
- Create video tutorial

---

## Example Implementation

See separate file: `examples/autonomous-add-feature-workflow.md`

---

## References

- Claude Code Task tool documentation (background execution)
- Claude Code BashOutput tool (monitoring background tasks)
- File-based state management patterns
- Workflow orchestration best practices

---

## Decision Maker

**Proposed by:** Architecture Review (2025-11-03)
**Approved by:** [Pending - Project Owner]
**Implemented by:** [Pending]

---

## Related ADRs

- ADR-002: File-Based State Management Protocol (TBD)
- ADR-003: Quality Gate Auto-Fixing Strategy (TBD)
- ADR-004: Multi-Workflow Concurrency (TBD)

---

**End of ADR-001**
