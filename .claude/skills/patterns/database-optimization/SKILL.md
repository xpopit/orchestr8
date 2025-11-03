---
name: database-optimization
description: Expertise in tracking and optimizing token usage and database operations. Auto-activates when analyzing performance, optimizing token consumption, or making database vs file-loading decisions. Enables data-driven optimization and cost reduction.
autoActivationContext:
  - token optimization
  - performance analysis
  - cost optimization
  - query optimization
  - token tracking
---

# Database Optimization Skill

This skill teaches how to track token usage, analyze patterns, and optimize operations for efficiency.

## How to Track Token Usage Per Operation

### Track tokens at operation granularity:

```bash
# ✅ DO: Track tokens for each distinct operation
source .claude/lib/db-helpers.sh

WORKFLOW_ID="feature-auth-$(date +%s)"

# Track analysis phase
db_track_tokens "$WORKFLOW_ID" "analysis" "requirements-analyzer" 850 "requirements-extraction"

# Track design phase
db_track_tokens "$WORKFLOW_ID" "design" "architect" 1200 "architecture-planning"

# Track implementation - multiple operations
db_track_tokens "$WORKFLOW_ID" "implementation" "backend-developer" 2400 "api-endpoints"
db_track_tokens "$WORKFLOW_ID" "implementation" "frontend-developer" 1800 "ui-components"

# Track testing
db_track_tokens "$WORKFLOW_ID" "testing" "test-engineer" 1500 "test-generation"
```

```bash
# ❌ DON'T: Track tokens only at workflow level
db_track_tokens "$WORKFLOW_ID" "all-phases" "various-agents" 7750 "complete-workflow"
# Problem: No granularity for optimization analysis
```

### Track tokens by agent and phase:

```bash
# ✅ DO: Break down token usage by agent role and phase
track_phase_tokens() {
  local workflow_id="$1"
  local phase="$2"
  local agent="$3"
  local operation="$4"
  local estimated_tokens="$5"

  echo "[$phase] $agent - $operation (est. $estimated_tokens tokens)"

  # Actual operation...
  result=$(perform_operation "$operation")

  # Calculate actual tokens (example: from API response or estimation)
  actual_tokens=$(calculate_tokens "$result")

  db_track_tokens "$workflow_id" "$phase" "$agent" "$actual_tokens" "$operation"

  echo "  Actual: $actual_tokens tokens ($(( actual_tokens - estimated_tokens )) vs estimate)"
}

# Usage
track_phase_tokens "$WORKFLOW_ID" "design" "architect" "system-design" 1200
track_phase_tokens "$WORKFLOW_ID" "implementation" "backend-developer" "api-creation" 2500
```

## How to Analyze Token Consumption Patterns

### Analyze by workflow type:

```bash
# ✅ DO: Compare token usage across workflow types
echo "=== Token Usage by Workflow Type ==="
sqlite3 "$DB_PATH" <<EOF
SELECT
  w.workflow_type,
  COUNT(w.id) as workflow_count,
  AVG(w.total_tokens_used) as avg_tokens,
  MIN(w.total_tokens_used) as min_tokens,
  MAX(w.total_tokens_used) as max_tokens
FROM workflows w
WHERE w.status = 'completed'
  AND w.completed_at > datetime('now', '-30 days')
GROUP BY w.workflow_type
ORDER BY avg_tokens DESC;
EOF
```

### Identify token-heavy operations:

```bash
# ✅ DO: Find most expensive operations
echo "=== Top 10 Token-Consuming Operations ==="
sqlite3 "$DB_PATH" <<EOF
SELECT
  operation,
  agent_name,
  COUNT(*) as times_used,
  AVG(tokens_used) as avg_tokens,
  SUM(tokens_used) as total_tokens
FROM token_usage
WHERE created_at > datetime('now', '-30 days')
GROUP BY operation, agent_name
ORDER BY total_tokens DESC
LIMIT 10;
EOF
```

### Analyze by phase:

```bash
# ✅ DO: Understand which phases consume most tokens
echo "=== Token Usage by Development Phase ==="
sqlite3 "$DB_PATH" <<EOF
SELECT
  phase,
  COUNT(*) as operations,
  AVG(tokens_used) as avg_tokens,
  SUM(tokens_used) as total_tokens,
  (SUM(tokens_used) * 100.0 / (SELECT SUM(tokens_used) FROM token_usage)) as percentage
FROM token_usage
WHERE created_at > datetime('now', '-30 days')
GROUP BY phase
ORDER BY total_tokens DESC;
EOF
```

### Agent efficiency comparison:

```bash
# ✅ DO: Compare agent token efficiency
echo "=== Agent Token Efficiency ==="
sqlite3 "$DB_PATH" <<EOF
SELECT
  agent_name,
  COUNT(DISTINCT workflow_id) as workflows_worked,
  COUNT(*) as operations,
  AVG(tokens_used) as avg_tokens_per_op,
  SUM(tokens_used) as total_tokens
FROM token_usage
WHERE created_at > datetime('now', '-30 days')
GROUP BY agent_name
ORDER BY avg_tokens_per_op DESC;
EOF
```

## How to Optimize Based on Historical Data

### Identify optimization opportunities:

```bash
#!/usr/bin/env bash
# Find optimization opportunities

source .claude/lib/db-helpers.sh

analyze_optimization_opportunities() {
  echo "=== Token Optimization Analysis ==="
  echo ""

  # 1. Find operations with high variance (inconsistent token use)
  echo "Operations with High Token Variance (potential optimization targets):"
  sqlite3 "$DB_PATH" <<EOF
SELECT
  operation,
  agent_name,
  COUNT(*) as times_used,
  AVG(tokens_used) as avg_tokens,
  MAX(tokens_used) - MIN(tokens_used) as variance
FROM token_usage
WHERE created_at > datetime('now', '-30 days')
GROUP BY operation, agent_name
HAVING COUNT(*) > 5 AND variance > 1000
ORDER BY variance DESC
LIMIT 5;
EOF

  echo ""

  # 2. Find similar workflows with different token usage
  echo "Similar Workflows with Different Token Usage:"
  sqlite3 "$DB_PATH" <<EOF
SELECT
  w1.id as workflow_1,
  w2.id as workflow_2,
  w1.total_tokens_used as tokens_1,
  w2.total_tokens_used as tokens_2,
  ABS(w1.total_tokens_used - w2.total_tokens_used) as difference
FROM workflows w1, workflows w2
WHERE w1.workflow_type = w2.workflow_type
  AND w1.id < w2.id
  AND w1.status = 'completed'
  AND w2.status = 'completed'
  AND ABS(w1.total_tokens_used - w2.total_tokens_used) > 5000
  AND w1.completed_at > datetime('now', '-30 days')
ORDER BY difference DESC
LIMIT 5;
EOF

  echo ""

  # 3. Phases exceeding average by >50%
  echo "Phases Exceeding Average Token Usage (by >50%):"
  sqlite3 "$DB_PATH" <<EOF
WITH phase_averages AS (
  SELECT phase, AVG(tokens_used) as avg_tokens
  FROM token_usage
  WHERE created_at > datetime('now', '-90 days')
  GROUP BY phase
)
SELECT
  tu.workflow_id,
  tu.phase,
  tu.tokens_used,
  pa.avg_tokens as phase_avg,
  ((tu.tokens_used - pa.avg_tokens) * 100.0 / pa.avg_tokens) as percent_over_avg
FROM token_usage tu
JOIN phase_averages pa ON tu.phase = pa.phase
WHERE tu.created_at > datetime('now', '-7 days')
  AND tu.tokens_used > pa.avg_tokens * 1.5
ORDER BY percent_over_avg DESC
LIMIT 10;
EOF
}

analyze_optimization_opportunities
```

### Apply learned optimizations:

```bash
# ✅ DO: Use historical data to choose optimal approach
choose_implementation_strategy() {
  local operation="$1"

  # Query past token usage for this operation
  past_usage=$(sqlite3 "$DB_PATH" <<EOF
SELECT AVG(tokens_used)
FROM token_usage
WHERE operation = '$operation'
  AND created_at > datetime('now', '-30 days');
EOF
)

  if [ -z "$past_usage" ]; then
    echo "No historical data. Using default strategy."
    return
  fi

  # Make data-driven decision
  if (( $(echo "$past_usage > 5000" | bc -l) )); then
    echo "⚠️  High token usage detected for $operation (avg: $past_usage)"
    echo "Recommendation: Break into smaller operations or use more efficient approach"

    # Store knowledge about this optimization
    db_store_knowledge \
      "performance-analyzer" \
      "optimization" \
      "$operation token optimization" \
      "Operation consistently uses >5000 tokens. Consider breaking into sub-operations." \
      ""
  else
    echo "✅ Token usage for $operation is optimal (avg: $past_usage)"
  fi
}

choose_implementation_strategy "full-file-analysis"
```

## When to Use Database Queries vs Loading Full Files

### Decision matrix:

```bash
# ✅ DO: Use database when you know what you're looking for
find_specific_function() {
  local function_name="$1"

  # Query database (minimal tokens)
  result=$(db_find_symbol "$function_name")

  if [ -n "$result" ]; then
    echo "Found $function_name in database (saved ~2000 tokens)"
    echo "$result"

    # Track token savings
    db_track_tokens "$WORKFLOW_ID" "search" "code-archaeologist" 50 "symbol-lookup"
  else
    echo "Symbol not in index. Falling back to file search."
    # Fallback: grep through files
    db_track_tokens "$WORKFLOW_ID" "search" "code-archaeologist" 2000 "full-file-search"
  fi
}
```

```bash
# ✅ DO: Load full file when context is needed
analyze_with_context() {
  local file_path="$1"
  local symbol="$2"

  # First, get location from database
  location=$(db_find_symbol "$symbol" | head -1)

  if [ -n "$location" ]; then
    line_start=$(echo "$location" | cut -d'|' -f2)
    line_end=$(echo "$location" | cut -d'|' -f3)

    # Read only relevant section (+/- 10 lines for context)
    content=$(sed -n "$((line_start - 10)),$((line_end + 10))p" "$file_path")

    echo "Reading 20 lines of context (saved ~1500 tokens vs full file)"
    echo "$content"

    db_track_tokens "$WORKFLOW_ID" "analysis" "code-reviewer" 500 "targeted-file-read"
  else
    # Need full file
    echo "Full file analysis required"
    db_track_tokens "$WORKFLOW_ID" "analysis" "code-reviewer" 2000 "full-file-read"
  fi
}
```

### Query optimization patterns:

```bash
# ✅ DO: Aggregate data in database rather than loading everything
get_project_statistics() {
  # Query aggregates in database (minimal tokens)
  stats=$(sqlite3 "$DB_PATH" <<EOF
SELECT
  language,
  COUNT(DISTINCT file_path) as file_count,
  COUNT(*) as symbol_count,
  SUM(CASE WHEN symbol_type = 'function' THEN 1 ELSE 0 END) as function_count,
  SUM(CASE WHEN symbol_type = 'class' THEN 1 ELSE 0 END) as class_count
FROM code_index
GROUP BY language
ORDER BY symbol_count DESC;
EOF
)

  echo "Project Statistics (from database):"
  echo "$stats"

  # Track minimal token usage
  db_track_tokens "$WORKFLOW_ID" "analysis" "architect" 100 "db-aggregation"
}
```

```bash
# ❌ DON'T: Load all files to compute statistics
get_project_statistics_inefficient() {
  # This would load every file, consuming 10,000+ tokens
  find . -name "*.ts" -exec cat {} \; | analyze_content

  db_track_tokens "$WORKFLOW_ID" "analysis" "architect" 15000 "full-project-scan"
  # Problem: Database query could have done this with 100 tokens
}
```

## Token Savings Reporting

### Generate savings report:

```bash
# ✅ DO: Report token savings after workflow completion
generate_token_report() {
  local workflow_id="$1"

  echo "=== Token Usage Report for $workflow_id ==="

  # Get total token usage
  savings=$(db_token_savings "$workflow_id")
  total_tokens=$(echo "$savings" | cut -d'|' -f1)
  agents_used=$(echo "$savings" | cut -d'|' -f2)
  avg_per_op=$(echo "$savings" | cut -d'|' -f3)

  echo "Total Tokens Used: $total_tokens"
  echo "Agents Involved: $agents_used"
  echo "Average per Operation: $avg_per_op"
  echo ""

  # Break down by phase
  echo "By Phase:"
  sqlite3 "$DB_PATH" <<EOF
SELECT
  phase,
  SUM(tokens_used) as tokens,
  COUNT(*) as operations
FROM token_usage
WHERE workflow_id = '$workflow_id'
GROUP BY phase
ORDER BY tokens DESC;
EOF

  echo ""

  # Calculate savings from database usage
  db_operations=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM token_usage WHERE workflow_id='$workflow_id' AND operation LIKE '%db-%' OR operation LIKE '%symbol%';")
  estimated_savings=$((db_operations * 1500))  # Assume ~1500 tokens saved per DB operation

  echo "Estimated Token Savings from Database Usage:"
  echo "  Database operations: $db_operations"
  echo "  Estimated savings: ~$estimated_savings tokens"
  echo "  (vs loading full files)"
}

generate_token_report "$WORKFLOW_ID"
```

## Best Practices Summary

### DO
- ✅ Track tokens for every operation
- ✅ Analyze token usage patterns regularly
- ✅ Use database queries instead of loading files when possible
- ✅ Break high-token operations into smaller chunks
- ✅ Compare actual vs estimated token usage
- ✅ Learn from workflows with abnormal token consumption
- ✅ Report token savings to demonstrate value
- ✅ Optimize based on historical data

### DON'T
- ❌ Track tokens only at workflow level
- ❌ Load full files when database query suffices
- ❌ Ignore high-variance operations
- ❌ Skip token tracking for "small" operations
- ❌ Forget to analyze token trends
- ❌ Optimize prematurely without data
- ❌ Assume all workflows use similar tokens

## Optimization Decision Tree

```
Need to find specific symbol/function?
├─ YES → Use db_find_symbol (50 tokens)
│   ├─ Found? → Use location from DB
│   └─ Not found? → Fallback to grep (500 tokens)
└─ NO → Need full context?
    ├─ YES → Load full file (2000+ tokens)
    │   └─ Store key findings in DB for future
    └─ NO → Need statistics/aggregates?
        ├─ YES → Query DB aggregations (100 tokens)
        └─ NO → Targeted file reading (500 tokens)
```

## Token Efficiency Metrics

Track and improve over time:

```bash
# Monthly token efficiency trend
sqlite3 "$DB_PATH" <<EOF
SELECT
  strftime('%Y-%m', created_at) as month,
  COUNT(DISTINCT workflow_id) as workflows,
  SUM(tokens_used) as total_tokens,
  AVG(tokens_used) as avg_per_operation,
  SUM(tokens_used) * 1.0 / COUNT(DISTINCT workflow_id) as tokens_per_workflow
FROM token_usage
GROUP BY strftime('%Y-%m', created_at)
ORDER BY month DESC
LIMIT 6;
EOF
```

Goal: tokens_per_workflow should decrease as system learns optimal patterns.
