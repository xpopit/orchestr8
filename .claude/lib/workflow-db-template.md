# Workflow Database Integration Template

This template shows the standard database integration patterns for all workflows.

## 1. Workflow Initialization (Add after frontmatter)

```bash
## Database Intelligence Integration

**At workflow start:**
```bash
source /Users/seth/Projects/orchestr8/.claude/lib/db-helpers.sh

# Create workflow record
WORKFLOW_ID="<workflow-name>-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "<workflow-type>" "$*" <total-phases> "<priority>"
db_update_workflow_status "$WORKFLOW_ID" "in_progress"

# Query similar past workflows for estimation
echo "=== Learning from past <workflow-type> workflows ==="
db_find_similar_workflows "<workflow-type>" 5
```
```

Replace:
- `<workflow-name>`: e.g., "add-feature", "fix-bug", "deploy"
- `<workflow-type>`: e.g., "add-feature", "fix-bug", "security-audit"
- `<total-phases>`: Number of major phases (3-5)
- `<priority>`: "critical", "high", "normal", "low"

## 2. Quality Gate Logging (Add to each quality gate)

```bash
# Log quality gate
db_log_quality_gate "$WORKFLOW_ID" "<gate-type>" "running"

# ... run the quality gate checks ...

# Log result
SCORE=$(calculate_score)  # 0-100
ISSUES=$(count_issues)     # Number of issues found
db_log_quality_gate "$WORKFLOW_ID" "<gate-type>" "passed" $SCORE $ISSUES

# Send notification for important gates
db_send_notification "$WORKFLOW_ID" "quality_gate" "<priority>" \
  "<Gate Name> Passed" \
  "<Details about the gate result>"
```

Common gate types:
- `code_review`
- `testing`
- `security`
- `performance`
- `accessibility`
- `architecture`

## 3. Token Tracking (Add after each major phase)

```bash
# Track token usage for this phase
PHASE_TOKENS=$(get_phase_token_usage)
db_track_tokens "$WORKFLOW_ID" "<phase-name>" "<agent-name>" $PHASE_TOKENS "<operation-description>"
```

## 4. Error Logging (For workflows that deal with errors)

```bash
# Log error to database
ERROR_TYPE="<error-type>"
ERROR_MSG="<error-message>"
CATEGORY="<category>"  # e.g., "sql", "authentication", "validation"
FILE_PATH="<file-path>"
LINE_NUM=<line-number>

ERROR_ID=$(db_log_error "$ERROR_TYPE" "$ERROR_MSG" "$CATEGORY" "$FILE_PATH" "$LINE_NUM")

# Later, when resolved:
RESOLUTION="<resolution-description>"
RESOLUTION_CODE="<fix-code-snippet>"
CONFIDENCE=0.95
db_resolve_error "$ERROR_ID" "$RESOLUTION" "$RESOLUTION_CODE" $CONFIDENCE
```

## 5. Notification Sending (Add for important milestones)

```bash
db_send_notification "$WORKFLOW_ID" "<type>" "<priority>" \
  "<title>" \
  "<message>"
```

Notification types:
- `workflow_start`
- `phase_complete`
- `quality_gate`
- `bug_critical`
- `security_finding`
- `performance_degradation`
- `workflow_complete`
- `workflow_failed`

Priorities:
- `urgent` - Critical issues requiring immediate attention
- `high` - Important milestones or issues
- `normal` - Standard progress updates
- `low` - Informational messages

## 6. Knowledge Storage (Add when learning occurs)

```bash
db_store_knowledge "<agent-name>" "<knowledge-type>" "<context>" \
  "<knowledge-description>" \
  "<code-example>"
```

Knowledge types:
- `best_practice`
- `bug_pattern`
- `optimization`
- `security_pattern`
- `architecture_decision`
- `lesson_learned`

## 7. Workflow Completion (Add at end of workflow)

```bash
## Workflow Completion & Learning

**At workflow end:**
```bash
# Calculate total token usage
TOTAL_TOKENS=$(sum_agent_token_usage)
db_track_tokens "$WORKFLOW_ID" "completion" "orchestrator" $TOTAL_TOKENS "workflow-complete"

# Update workflow status
db_update_workflow_status "$WORKFLOW_ID" "completed"

# Store lessons learned
db_store_knowledge "<agent-name>" "lesson_learned" "<workflow-type>" \
  "Key learnings: [summarize what worked well, challenges, optimizations]" \
  "# Example code or pattern"

# Get workflow metrics
echo "=== Workflow Metrics ==="
db_workflow_metrics "$WORKFLOW_ID"

# Send completion notification
DURATION=$(calculate_workflow_duration)
db_send_notification "$WORKFLOW_ID" "workflow_complete" "high" \
  "<Workflow> Completed Successfully" \
  "Completed in ${DURATION} minutes. All quality gates passed. Tokens: ${TOTAL_TOKENS}."

# Display token usage report
echo "=== Token Usage Report ==="
db_token_savings "$WORKFLOW_ID"
```
```

## 8. Workflow Failure Handling (Add for error cases)

```bash
# If workflow fails or is blocked
REASON="<failure-reason>"
db_update_workflow_status "$WORKFLOW_ID" "failed" "$REASON"

# Or if blocked waiting for user input
BLOCKER="<blocker-description>"
db_update_workflow_status "$WORKFLOW_ID" "blocked" "$BLOCKER"

# Send urgent notification
db_send_notification "$WORKFLOW_ID" "workflow_failed" "urgent" \
  "<Workflow> Failed" \
  "Reason: ${REASON}. Requires manual intervention."
```

## Usage Examples

### Example: Security Audit Workflow

```bash
# Initialization
WORKFLOW_ID="security-audit-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "security-audit" "$*" 6 "high"
db_update_workflow_status "$WORKFLOW_ID" "in_progress"

# Quality gate for OWASP Top 10
db_log_quality_gate "$WORKFLOW_ID" "owasp_top_10" "running"
# ... run checks ...
db_log_quality_gate "$WORKFLOW_ID" "owasp_top_10" "passed" 92 3
db_send_notification "$WORKFLOW_ID" "quality_gate" "high" \
  "OWASP Top 10 Audit Complete" \
  "Score: 92/100. Found 3 medium-severity issues."

# Store security knowledge
db_store_knowledge "security-auditor" "security_pattern" "input-validation" \
  "Always use parameterized queries to prevent SQL injection" \
  "cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))"

# Completion
db_update_workflow_status "$WORKFLOW_ID" "completed"
TOTAL_TOKENS=$(sum_agent_token_usage)
db_track_tokens "$WORKFLOW_ID" "completion" "security-auditor" $TOTAL_TOKENS "audit-complete"
db_send_notification "$WORKFLOW_ID" "workflow_complete" "high" \
  "Security Audit Complete" \
  "Found 3 issues, all remediated. Compliance validated."
```

## Integration Checklist

For each workflow, ensure:
- [ ] Database helpers sourced at start
- [ ] Workflow record created with appropriate priority
- [ ] Similar past workflows queried for estimation
- [ ] All quality gates logged with scores
- [ ] Token usage tracked per phase
- [ ] Important milestones send notifications
- [ ] Lessons learned stored in knowledge base
- [ ] Workflow completion logged with metrics
- [ ] Failure cases handled with notifications
- [ ] Users can query past similar workflows for insights
