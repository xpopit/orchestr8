# Workflow Database Integration - Quick Reference

## Quick Start

```bash
# 1. Source helpers
source .claude/lib/db-helpers.sh

# 2. Create workflow
WORKFLOW_ID="workflow-name-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "workflow-type" "$*" <phases> "<priority>"
db_update_workflow_status "$WORKFLOW_ID" "in_progress"

# 3. Query similar workflows
db_find_similar_workflows "workflow-type" 5

# 4. During execution
db_log_quality_gate "$WORKFLOW_ID" "<gate-type>" "passed" <score> <issues>
db_track_tokens "$WORKFLOW_ID" "<phase>" "<agent>" <tokens> "<operation>"
db_send_notification "$WORKFLOW_ID" "<type>" "<priority>" "<title>" "<message>"

# 5. Completion
db_update_workflow_status "$WORKFLOW_ID" "completed"
db_workflow_metrics "$WORKFLOW_ID"
db_token_savings "$WORKFLOW_ID"
```

## Database Functions

### Workflow Management
```bash
db_create_workflow <id> <type> <request> <phases> <priority>
db_update_workflow_status <id> <status> [reason]
db_find_similar_workflows <type> [limit]
db_workflow_metrics <id>
```

### Quality Gates
```bash
db_log_quality_gate <workflow_id> <gate_type> <status> [score] [issues]
db_quality_gate_history <gate_type> [days]
```

### Token Tracking
```bash
db_track_tokens <workflow_id> <phase> <agent> <tokens> <operation>
db_token_savings <workflow_id>
```

### Notifications
```bash
db_send_notification <workflow_id> <type> <priority> <title> <message>
db_get_notifications [limit]
db_mark_notification_read <id>
```

### Knowledge Storage
```bash
db_store_knowledge <agent> <type> <context> <knowledge> [code]
db_query_knowledge <agent> <context> [limit]
db_update_knowledge_confidence <id> <success>
```

### Error Tracking
```bash
db_log_error <type> <message> <category> [file] [line]
db_find_similar_errors <message> [limit]
db_resolve_error <id> <resolution> [code] [confidence]
db_error_stats [days]
```

## Common Patterns

### Pattern 1: Standard Workflow
```bash
# Init
source .claude/lib/db-helpers.sh
WORKFLOW_ID="my-workflow-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "my-workflow" "$*" 3 "normal"
db_update_workflow_status "$WORKFLOW_ID" "in_progress"
db_find_similar_workflows "my-workflow" 5

# Execute with quality gate
db_log_quality_gate "$WORKFLOW_ID" "validation" "running"
# ... do validation ...
db_log_quality_gate "$WORKFLOW_ID" "validation" "passed" 95 0
db_send_notification "$WORKFLOW_ID" "quality_gate" "normal" "Validation Passed" "Score: 95"

# Complete
db_update_workflow_status "$WORKFLOW_ID" "completed"
db_workflow_metrics "$WORKFLOW_ID"
```

### Pattern 2: Error Resolution Workflow
```bash
# Init
source .claude/lib/db-helpers.sh
WORKFLOW_ID="fix-bug-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "fix-bug" "$*" 5 "high"
db_find_similar_errors "$(echo "$*" | head -c 100)" 5

# Log error
ERROR_ID=$(db_log_error "BugType" "Error description" "category" "file.py" 42)

# ... fix bug ...

# Resolve
db_resolve_error "$ERROR_ID" "Fixed by adding null check" "if x: process(x)" 0.95
db_update_workflow_status "$WORKFLOW_ID" "completed"
db_error_stats 30
```

### Pattern 3: Learning Workflow
```bash
# Init
source .claude/lib/db-helpers.sh
WORKFLOW_ID="add-feature-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "add-feature" "$*" 4 "normal"

# Query knowledge
db_query_knowledge "python-developer" "error-handling" 10

# Execute
# ... implement feature ...

# Store new knowledge
db_store_knowledge "python-developer" "best_practice" "add-feature" \
  "For database features: Use transactions, add indexes, test rollback" \
  "with db.transaction(): ..."

# Complete
db_update_workflow_status "$WORKFLOW_ID" "completed"
```

## Notification Types

| Type | Priority | When to Use |
|------|----------|-------------|
| `workflow_start` | normal | Workflow begins |
| `phase_complete` | normal | Major phase done |
| `quality_gate` | normal/high | Gate passed/failed |
| `bug_critical` | urgent | Critical bug found |
| `security_finding` | urgent/high | Security issue |
| `performance_degradation` | high | Performance drop |
| `workflow_complete` | high | Workflow done |
| `workflow_failed` | urgent | Workflow failed |

## Quality Gate Types

| Gate Type | Score Range | Issues Count |
|-----------|-------------|--------------|
| `code_review` | 0-100 | # of issues |
| `testing` | % coverage | # failures |
| `security` | 0-100 | # vulnerabilities |
| `performance` | 0-100 | # bottlenecks |
| `accessibility` | 0-100 | # violations |
| `architecture` | 0-100 | # concerns |

## Knowledge Types

| Type | When to Use | Example |
|------|-------------|---------|
| `best_practice` | Proven approach | "Always use parameterized queries" |
| `bug_pattern` | Common bug | "NullPointer when user not logged in" |
| `optimization` | Performance gain | "Index user_id column for 10x speedup" |
| `security_pattern` | Security practice | "Validate all user input" |
| `architecture_decision` | Design choice | "Use microservices for scalability" |
| `lesson_learned` | Experience | "Deploy on Tuesday, not Friday" |

## Workflow Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `pending` | Created, not started | Start workflow |
| `in_progress` | Currently running | Continue execution |
| `blocked` | Waiting on input | Resolve blocker |
| `completed` | Successfully done | Review metrics |
| `failed` | Error occurred | Investigate, retry |

## Priorities

| Priority | When to Use | Example |
|----------|-------------|---------|
| `critical` | Production down | Emergency hotfix |
| `high` | Important feature | Security audit |
| `normal` | Standard work | Add feature |
| `low` | Nice to have | Documentation update |

## Error Categories

Common categories for `db_log_error`:
- `sql` - Database errors
- `authentication` - Auth failures
- `validation` - Input validation
- `api` - External API errors
- `configuration` - Config issues
- `network` - Network failures
- `deployment` - Deploy problems
- `security` - Security issues

## Confidence Scores

When using `db_resolve_error` or `db_store_knowledge`:
- `1.0` - Absolutely certain
- `0.95` - Very confident
- `0.90` - Confident
- `0.80` - Moderately confident
- `0.70` - Somewhat confident
- `< 0.70` - Uncertain (not recommended)

## Useful Queries

### Get workflow duration
```bash
db_workflow_metrics "$WORKFLOW_ID" | grep duration
```

### Check recent errors
```bash
db_error_stats 7  # Last 7 days
```

### View unread notifications
```bash
db_get_notifications 10
```

### Query best practices
```bash
db_query_knowledge "code-reviewer" "security" 10
```

### Check quality trends
```bash
db_quality_gate_history "code_review" 30
```

## Tips

1. **Always source db-helpers.sh first**
   ```bash
   source .claude/lib/db-helpers.sh
   ```

2. **Use unique workflow IDs**
   ```bash
   WORKFLOW_ID="workflow-name-$(date +%s)"
   ```

3. **Query history for estimation**
   ```bash
   db_find_similar_workflows "workflow-type" 5
   ```

4. **Log all quality gates**
   - Even if they pass
   - Include scores when possible
   - Track issues found

5. **Store knowledge liberally**
   - Best practices
   - Bug patterns
   - Optimizations
   - Lessons learned

6. **Send important notifications**
   - Workflow start/complete
   - Critical issues
   - Quality gate failures

7. **Track tokens per phase**
   - Helps optimize costs
   - Identifies expensive operations
   - Enables comparison

8. **Check database health**
   ```bash
   db_health_check && db_stats
   ```

## Troubleshooting

### Database not found
```bash
# Check DB_PATH
echo $DB_PATH
# Default: .orchestr8/intelligence.db

# Create if missing
mkdir -p .orchestr8
# (Schema will be auto-created)
```

### Functions not available
```bash
# Source the helpers
source .claude/lib/db-helpers.sh

# Verify functions loaded
type db_create_workflow
```

### Queries return no results
```bash
# Check database has data
db_stats

# Check table exists
sqlite3 $DB_PATH "SELECT name FROM sqlite_master WHERE type='table';"
```

### Permission denied
```bash
# Check file permissions
ls -la .orchestr8/intelligence.db

# Fix if needed
chmod 644 .orchestr8/intelligence.db
```

## Full Example

```bash
#!/usr/bin/env bash
# Complete workflow integration example

# 1. Source helpers
source .claude/lib/db-helpers.sh

# 2. Initialize workflow
WORKFLOW_ID="add-feature-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "add-feature" "Add user notifications" 4 "normal"
db_update_workflow_status "$WORKFLOW_ID" "in_progress"

# 3. Learn from past
echo "=== Similar past workflows ==="
db_find_similar_workflows "add-feature" 5

echo "=== Relevant knowledge ==="
db_query_knowledge "fullstack-developer" "notifications" 5

# 4. Send start notification
db_send_notification "$WORKFLOW_ID" "workflow_start" "normal" \
  "Feature Development Started" \
  "Adding user notifications feature"

# 5. Execute with quality gates
db_log_quality_gate "$WORKFLOW_ID" "code_review" "running"
# ... run code review ...
db_log_quality_gate "$WORKFLOW_ID" "code_review" "passed" 92 2
db_send_notification "$WORKFLOW_ID" "quality_gate" "normal" \
  "Code Review Passed" \
  "Score: 92/100. 2 minor issues found and fixed."

db_log_quality_gate "$WORKFLOW_ID" "testing" "running"
# ... run tests ...
COVERAGE=87
db_log_quality_gate "$WORKFLOW_ID" "testing" "passed" $COVERAGE 0
db_track_tokens "$WORKFLOW_ID" "testing" "test-engineer" 12000 "test-execution"

db_log_quality_gate "$WORKFLOW_ID" "security" "running"
# ... security scan ...
db_log_quality_gate "$WORKFLOW_ID" "security" "passed" 100 0

# 6. Store knowledge
db_store_knowledge "fullstack-developer" "best_practice" "notifications" \
  "For real-time notifications: Use WebSockets, store in Redis for offline users, add push notification fallback" \
  "// WebSocket connection\nconst ws = new WebSocket('wss://...');"

# 7. Complete workflow
TOTAL_TOKENS=145000
db_track_tokens "$WORKFLOW_ID" "completion" "orchestrator" $TOTAL_TOKENS "workflow-complete"
db_update_workflow_status "$WORKFLOW_ID" "completed"

# 8. Display metrics
echo "=== Workflow Metrics ==="
db_workflow_metrics "$WORKFLOW_ID"

echo "=== Token Usage ==="
db_token_savings "$WORKFLOW_ID"

# 9. Send completion notification
db_send_notification "$WORKFLOW_ID" "workflow_complete" "high" \
  "Feature Completed Successfully" \
  "User notifications feature added in 67 minutes. All quality gates passed."
```

---

**For More Details:** See `WORKFLOW-DATABASE-INTEGRATION-GUIDE.md`
