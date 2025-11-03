---
name: database-tracking-patterns
description: Expertise in workflow and execution tracking using the orchestr8 intelligence database. Auto-activates when creating workflows, tracking progress, managing status updates, or analyzing workflow history. Provides patterns for effective workflow lifecycle management.
autoActivationContext:
  - workflow execution
  - progress tracking
  - status management
  - workflow history
  - execution metrics
---

# Database Tracking Patterns Skill

This skill teaches how to effectively track workflows and execution using the orchestr8 intelligence database.

## When to Create Workflows in Database

### Create workflow records for:
- Multi-phase operations (3+ steps)
- Long-running processes (>5 minutes)
- Operations requiring quality gates
- Tasks that need progress tracking
- Processes that may be resumed
- Operations needing audit trails

### DO NOT create workflows for:
- Single-step operations
- Quick utility scripts
- Read-only queries
- Simple file operations

## Workflow Lifecycle Management

### 1. Creating a Workflow

```bash
# ✅ DO: Create workflow at the start of orchestration
source .claude/lib/db-helpers.sh

WORKFLOW_ID="workflow-$(date +%s)-$$"
db_create_workflow \
  "$WORKFLOW_ID" \
  "add-feature" \
  "Add user authentication to API" \
  5 \
  "high"

# Returns: workflow created successfully
```

```bash
# ❌ DON'T: Create workflow without proper ID generation
db_create_workflow \
  "my-workflow" \
  "add-feature" \
  "Add feature" \
  5
# Problem: Non-unique ID, potential conflicts
```

### 2. Updating Workflow Status

```bash
# ✅ DO: Update status at each phase transition
db_update_workflow_status "$WORKFLOW_ID" "in_progress"

# Perform work...

db_update_workflow_status "$WORKFLOW_ID" "completed"
```

```bash
# ❌ DON'T: Forget to update status when blocked
# Problem: Workflow appears in_progress but is stuck
db_update_workflow_status "$WORKFLOW_ID" "in_progress"
# ... blocking issue occurs, no status update
```

```bash
# ✅ DO: Properly handle blocked state
db_update_workflow_status "$WORKFLOW_ID" "blocked" "Waiting for external API approval"
```

### 3. Tracking Progress Through Phases

```bash
# ✅ DO: Track each phase completion
for phase in "analyze" "design" "implement" "test" "deploy"; do
  echo "Phase: $phase"

  # Track token usage for this phase
  db_track_tokens "$WORKFLOW_ID" "$phase" "architect" 1250 "architecture-design"

  # Log quality gates
  db_log_quality_gate "$WORKFLOW_ID" "${phase}-review" "passed" 0.95 0

  # Continue to next phase
done

db_update_workflow_status "$WORKFLOW_ID" "completed"
```

```bash
# ❌ DON'T: Update workflow status without tracking phases
db_update_workflow_status "$WORKFLOW_ID" "in_progress"
# ... do all work
db_update_workflow_status "$WORKFLOW_ID" "completed"
# Problem: No visibility into which phase failed/succeeded
```

## When to Send Notifications

### Send notifications for:

```bash
# ✅ Critical workflow events
db_send_notification \
  "$WORKFLOW_ID" \
  "workflow_blocked" \
  "urgent" \
  "Workflow Blocked" \
  "Security scan failed with 3 critical vulnerabilities. Manual review required."

# ✅ Quality gate failures
db_send_notification \
  "$WORKFLOW_ID" \
  "quality_gate_failed" \
  "high" \
  "Tests Failed" \
  "Integration tests failed: 12/45 tests failing. See error log for details."

# ✅ Workflow completion
db_send_notification \
  "$WORKFLOW_ID" \
  "workflow_completed" \
  "normal" \
  "Feature Deployed" \
  "User authentication feature successfully deployed to production."
```

```bash
# ❌ DON'T: Send notifications for routine progress
db_send_notification \
  "$WORKFLOW_ID" \
  "phase_progress" \
  "low" \
  "Phase Started" \
  "Starting implementation phase..."
# Problem: Creates notification noise
```

## Querying Past Workflows for Learning

### Learning from similar workflows

```bash
# ✅ DO: Query similar workflows before starting
similar_workflows=$(db_find_similar_workflows "add-feature" 10)

echo "Learning from past workflows:"
echo "$similar_workflows" | while IFS='|' read -r id request status duration tokens; do
  echo "  - $request: $duration min, $tokens tokens"
done

# Use insights to estimate current workflow
avg_duration=$(echo "$similar_workflows" | awk -F'|' '{sum+=$4; count++} END {print sum/count}')
echo "Estimated duration: $avg_duration minutes"
```

```bash
# ✅ DO: Query workflow metrics after completion
metrics=$(db_workflow_metrics "$WORKFLOW_ID")
echo "Workflow Performance:"
echo "$metrics"

# Compare with historical data
if [ "$duration" -gt "$avg_duration" ]; then
  echo "⚠️  Workflow took longer than average. Review for optimization opportunities."
fi
```

### Analyzing workflow patterns

```bash
# ✅ DO: Identify common failure points
failed_gates=$(sqlite3 "$DB_PATH" <<EOF
SELECT gate_type, COUNT(*) as failures
FROM quality_gates
WHERE status = 'failed'
  AND executed_at > datetime('now', '-30 days')
GROUP BY gate_type
ORDER BY failures DESC
LIMIT 5;
EOF
)

echo "Common failure points:"
echo "$failed_gates"
```

## Complete Workflow Tracking Example

```bash
#!/usr/bin/env bash
# Complete workflow with comprehensive tracking

source .claude/lib/db-helpers.sh

# 1. Create workflow
WORKFLOW_ID="add-auth-$(date +%s)"
db_create_workflow \
  "$WORKFLOW_ID" \
  "add-feature" \
  "Implement OAuth2 authentication" \
  5 \
  "high"

# 2. Start workflow
db_update_workflow_status "$WORKFLOW_ID" "in_progress"

# 3. Phase 1: Analysis
echo "Phase 1: Requirements Analysis"
db_track_tokens "$WORKFLOW_ID" "analysis" "requirements-analyzer" 850 "requirements-extraction"

# Check for similar past implementations
similar=$(db_find_similar_workflows "add-feature" 5)
if [ -n "$similar" ]; then
  echo "Found $(echo "$similar" | wc -l) similar workflows for reference"
fi

# 4. Phase 2: Design (with quality gate)
echo "Phase 2: Architecture Design"
db_track_tokens "$WORKFLOW_ID" "design" "architect" 1200 "architecture-planning"
db_log_quality_gate "$WORKFLOW_ID" "design-review" "passed" 0.92 0

# 5. Phase 3: Implementation
echo "Phase 3: Implementation"
db_track_tokens "$WORKFLOW_ID" "implementation" "backend-developer" 2400 "code-generation"

# Quality gate: Code review
review_score=0.85
if (( $(echo "$review_score < 0.8" | bc -l) )); then
  db_log_quality_gate "$WORKFLOW_ID" "code-review" "failed" "$review_score" 5
  db_update_workflow_status "$WORKFLOW_ID" "blocked" "Code review score too low: $review_score"
  db_send_notification \
    "$WORKFLOW_ID" \
    "quality_gate_failed" \
    "high" \
    "Code Review Failed" \
    "Code review score $review_score below threshold. 5 issues found."
  exit 1
fi
db_log_quality_gate "$WORKFLOW_ID" "code-review" "passed" "$review_score" 0

# 6. Phase 4: Testing
echo "Phase 4: Testing"
db_track_tokens "$WORKFLOW_ID" "testing" "test-engineer" 1800 "test-generation"
db_log_quality_gate "$WORKFLOW_ID" "unit-tests" "passed" 1.0 0
db_log_quality_gate "$WORKFLOW_ID" "integration-tests" "passed" 1.0 0

# 7. Phase 5: Security
echo "Phase 5: Security Audit"
db_track_tokens "$WORKFLOW_ID" "security" "security-auditor" 950 "security-scan"
db_log_quality_gate "$WORKFLOW_ID" "security-scan" "passed" 0.98 1

# 8. Complete workflow
db_update_workflow_status "$WORKFLOW_ID" "completed"

# 9. Send success notification
db_send_notification \
  "$WORKFLOW_ID" \
  "workflow_completed" \
  "normal" \
  "OAuth2 Implementation Complete" \
  "Successfully implemented and tested OAuth2 authentication. All quality gates passed."

# 10. Generate metrics report
echo ""
echo "=== Workflow Summary ==="
db_workflow_metrics "$WORKFLOW_ID"

echo ""
echo "=== Token Savings ==="
db_token_savings "$WORKFLOW_ID"
```

## Best Practices Summary

### DO
- ✅ Generate unique workflow IDs (timestamp + PID)
- ✅ Update status at each phase transition
- ✅ Track tokens per phase for optimization
- ✅ Log all quality gate results
- ✅ Send notifications for critical events only
- ✅ Query similar workflows before starting
- ✅ Analyze metrics after completion
- ✅ Handle blocked states with clear reasons

### DON'T
- ❌ Reuse workflow IDs
- ❌ Skip status updates during execution
- ❌ Create workflows for trivial tasks
- ❌ Send notifications for routine progress
- ❌ Ignore historical workflow data
- ❌ Complete workflows without all phases
- ❌ Forget to track token usage

## Token Optimization Insight

Use workflow tracking to identify token-heavy operations:

```bash
# Find workflows with highest token usage
sqlite3 "$DB_PATH" <<EOF
SELECT w.workflow_type,
       AVG(w.total_tokens_used) as avg_tokens,
       COUNT(*) as workflow_count
FROM workflows w
WHERE w.status = 'completed'
  AND w.completed_at > datetime('now', '-30 days')
GROUP BY w.workflow_type
ORDER BY avg_tokens DESC;
EOF
```

This helps prioritize optimization efforts on the most expensive workflow types.
