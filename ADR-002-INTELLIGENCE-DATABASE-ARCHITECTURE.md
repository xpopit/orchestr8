# ADR-002: Intelligence Database Architecture - The Revolutionary Core

**Status:** Proposed (CRITICAL)
**Decision Date:** 2025-11-03
**Impact:** REVOLUTIONARY - Complete architectural transformation
**Depends On:** ADR-001 (Autonomous Background Execution)

---

## CRITICAL DISCOVERY

**The orchestr8 plugin is NOT currently using an intelligence database!**

This defeats the entire revolutionary purpose of the project:
- ❌ Agents are re-analyzing code every time (massive token waste)
- ❌ No learning from past errors
- ❌ No code context caching
- ❌ No cross-agent knowledge sharing
- ❌ Token usage is 100x higher than it should be

**This ADR proposes the TRUE revolutionary architecture that combines:**
1. **SQLite Intelligence Database** - Persistent code knowledge and learning
2. **Background Project Manager Agents** - Autonomous orchestration
3. **Minimal Main Context Usage** - Only summaries, never processing

---

## The Revolutionary Vision

### What Makes This Project Truly Revolutionary

**Traditional AI Code Assistants:**
```
User asks question
  → AI reads entire codebase (50,000 tokens)
  → AI analyzes code (expensive)
  → AI responds
  → Context lost
  → Next question repeats everything (another 50,000 tokens)
```

**Our Revolutionary Approach:**
```
First time:
  User asks question
    → code-intelligence-watcher indexes code to SQLite (happens once)
    → code-query agent retrieves relevant code from database (100 tokens)
    → AI analyzes (minimal context)
    → AI responds
    → Learning stored in database

Every subsequent time:
  User asks question
    → code-query agent retrieves from database (100 tokens, not 50,000!)
    → AI has context from database (past learnings)
    → AI responds faster, cheaper
    → New learning stored in database
```

**Token Reduction: 500x - 1000x improvement!**

---

## Current State (Missing Infrastructure)

### What's Missing

1. **No Intelligence Database Schema**
   - No SQLite database defined
   - No code indexing system
   - No error learning system
   - No agent knowledge sharing

2. **No Background Project Manager**
   - Main context doing orchestration (WRONG!)
   - Should be background PM agents coordinating
   - Main context should only receive summaries

3. **No Intelligence-Aware Agents**
   - Agents don't query database before analyzing code
   - Agents don't store learning in database
   - Every analysis starts from scratch

4. **No Auto-Indexing System**
   - Code changes not automatically indexed
   - Developers must manually trigger indexing
   - Database becomes stale

---

## Proposed Architecture

### 1. Intelligence Database Schema

```sql
-- .orchestr8/intelligence.db (SQLite)

-- Code Intelligence: Indexed code for fast retrieval
CREATE TABLE code_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,  -- SHA-256 of file content
    symbol_type TEXT NOT NULL,  -- 'class', 'function', 'interface', 'type'
    symbol_name TEXT NOT NULL,
    symbol_signature TEXT,  -- Full signature
    docstring TEXT,
    line_start INTEGER NOT NULL,
    line_end INTEGER NOT NULL,
    language TEXT NOT NULL,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_path, symbol_name, line_start)
);

CREATE INDEX idx_code_symbol_name ON code_index(symbol_name);
CREATE INDEX idx_code_file_path ON code_index(file_path);
CREATE INDEX idx_code_language ON code_index(language);

-- Code Dependencies: Function/class relationships
CREATE TABLE code_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_symbol_id INTEGER NOT NULL,
    target_symbol_name TEXT NOT NULL,
    dependency_type TEXT NOT NULL,  -- 'imports', 'calls', 'extends', 'implements'
    FOREIGN KEY (source_symbol_id) REFERENCES code_index(id)
);

CREATE INDEX idx_dep_source ON code_dependencies(source_symbol_id);
CREATE INDEX idx_dep_target ON code_dependencies(target_symbol_name);

-- Error Learning: Past errors and resolutions
CREATE TABLE error_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error_type TEXT NOT NULL,  -- 'compilation', 'runtime', 'test', 'lint'
    error_message TEXT NOT NULL,
    file_path TEXT,
    line_number INTEGER,
    context TEXT,  -- Code snippet around error
    resolution TEXT,  -- How it was fixed
    resolved_by TEXT,  -- Which agent fixed it
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_error_type ON error_history(error_type);
CREATE INDEX idx_error_file ON error_history(file_path);
CREATE INDEX idx_error_resolved ON error_history(resolved_at);

-- Agent Knowledge: Cross-agent learning
CREATE TABLE agent_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    knowledge_type TEXT NOT NULL,  -- 'pattern', 'decision', 'best-practice'
    context TEXT NOT NULL,  -- When this applies
    knowledge TEXT NOT NULL,  -- The actual knowledge
    confidence REAL DEFAULT 1.0,  -- 0.0 to 1.0
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

CREATE INDEX idx_knowledge_agent ON agent_knowledge(agent_name);
CREATE INDEX idx_knowledge_type ON agent_knowledge(knowledge_type);

-- Workflow State: Persistent workflow tracking
CREATE TABLE workflows (
    id TEXT PRIMARY KEY,  -- workflow-abc123
    workflow_type TEXT NOT NULL,  -- 'add-feature', 'fix-bug', etc.
    status TEXT NOT NULL,  -- 'running', 'completed', 'failed', 'blocked'
    user_request TEXT NOT NULL,
    current_phase INTEGER DEFAULT 1,
    total_phases INTEGER NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    blocked_reason TEXT
);

CREATE INDEX idx_workflow_status ON workflows(status);
CREATE INDEX idx_workflow_type ON workflows(workflow_type);

-- Workflow Phases: Individual phase tracking
CREATE TABLE workflow_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    phase_number INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL,  -- 'pending', 'running', 'completed', 'failed'
    input_summary TEXT,
    output_summary TEXT,
    tokens_used INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    UNIQUE(workflow_id, phase_number)
);

CREATE INDEX idx_phase_workflow ON workflow_phases(workflow_id);
CREATE INDEX idx_phase_status ON workflow_phases(status);

-- Quality Gates: Historical quality metrics
CREATE TABLE quality_gates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    gate_type TEXT NOT NULL,  -- 'code-review', 'tests', 'security', 'performance'
    status TEXT NOT NULL,  -- 'passed', 'failed', 'warning'
    details TEXT,  -- JSON with gate-specific results
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

CREATE INDEX idx_gate_workflow ON quality_gates(workflow_id);
CREATE INDEX idx_gate_type ON quality_gates(gate_type);

-- Token Usage Tracking
CREATE TABLE token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    context_type TEXT NOT NULL,  -- 'main', 'agent', 'workflow'
    agent_name TEXT,
    workflow_id TEXT,
    tokens_used INTEGER NOT NULL,
    operation TEXT,  -- What was being done
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_context ON token_usage(context_type);
CREATE INDEX idx_tokens_workflow ON token_usage(workflow_id);
```

### 2. Background Project Manager Architecture

```
Main Context (User-Facing)
    │
    │ (Minimal interaction - summaries only)
    ▼
Background Project Manager Agent (Always running in background)
    │
    ├─→ Monitors workflow queue in database
    ├─→ Coordinates specialist agents
    ├─→ Enforces quality gates
    ├─→ Stores results in database
    ├─→ Returns summaries to main context
    │
    ▼
Specialist Agents (Background execution, database-driven)
    │
    ├─→ code-query agent: Retrieves relevant code from database
    ├─→ architect agent: Designs with past knowledge from database
    ├─→ frontend-developer: Implements using code patterns from database
    ├─→ test-engineer: Writes tests, stores failures in database
    ├─→ code-reviewer: Reviews using past learnings from database
    ├─→ error-logger: Automatically logs errors to database
    │
    ▼
Intelligence Database (SQLite)
    │
    ├─→ Indexed code (fast retrieval)
    ├─→ Error history (learn from mistakes)
    ├─→ Agent knowledge (cross-agent learning)
    ├─→ Workflow state (persistent, resumable)
    └─→ Quality metrics (continuous improvement)
```

### 3. Intelligence-Aware Agent Pattern

**Every agent must follow this pattern:**

```markdown
---
name: example-agent
description: Example agent showing intelligence database usage
model: claude-sonnet-4-5
tools:
  - Read
  - Write
  - Edit
  - Bash  # Used for SQLite queries
  - Grep
  - Glob
---

# Example Agent (Intelligence-Aware)

## Operating Protocol

### ALWAYS Start with Database Query

Before analyzing ANY code:

1. **Query code index for relevant symbols**
   ```bash
   sqlite3 .orchestr8/intelligence.db "
   SELECT file_path, symbol_name, symbol_signature, line_start, line_end
   FROM code_index
   WHERE symbol_name LIKE '%User%'
     AND language = 'typescript'
   LIMIT 20;
   "
   ```

2. **Query error history for similar issues**
   ```bash
   sqlite3 .orchestr8/intelligence.db "
   SELECT error_message, resolution, resolved_by
   FROM error_history
   WHERE error_type = 'compilation'
     AND file_path LIKE '%auth%'
     AND resolved_at IS NOT NULL
   ORDER BY occurred_at DESC
   LIMIT 10;
   "
   ```

3. **Query agent knowledge for patterns**
   ```bash
   sqlite3 .orchestr8/intelligence.db "
   SELECT knowledge, confidence
   FROM agent_knowledge
   WHERE agent_name = 'frontend-developer'
     AND knowledge_type = 'pattern'
     AND context LIKE '%authentication%'
   ORDER BY confidence DESC
   LIMIT 5;
   "
   ```

### ALWAYS Store Results in Database

After completing work:

1. **Update code index (if code changed)**
   ```bash
   # This is done automatically by code-intelligence-watcher
   # But agent can manually trigger:
   sqlite3 .orchestr8/intelligence.db "
   INSERT OR REPLACE INTO code_index
   (file_path, file_hash, symbol_type, symbol_name, symbol_signature, line_start, line_end, language)
   VALUES
   ('src/auth/AuthService.ts', '$(sha256sum src/auth/AuthService.ts | cut -d' ' -f1)', 'class', 'AuthService', 'class AuthService implements IAuthService', 1, 50, 'typescript');
   "
   ```

2. **Log errors encountered and resolutions**
   ```bash
   sqlite3 .orchestr8/intelligence.db "
   INSERT INTO error_history
   (error_type, error_message, file_path, line_number, context, resolution, resolved_by, resolved_at)
   VALUES
   ('test', 'TypeError: Cannot read property user of undefined', 'tests/auth.test.ts', 45, 'expect(result.user).toBeDefined()', 'Added null check before accessing user property', 'test-engineer', CURRENT_TIMESTAMP);
   "
   ```

3. **Store learned knowledge**
   ```bash
   sqlite3 .orchestr8/intelligence.db "
   INSERT INTO agent_knowledge
   (agent_name, knowledge_type, context, knowledge, confidence)
   VALUES
   ('frontend-developer', 'pattern', 'React authentication', 'Always use useAuth hook for authentication state, never direct localStorage access', 0.95);
   "
   ```

4. **Update token usage**
   ```bash
   sqlite3 .orchestr8/intelligence.db "
   INSERT INTO token_usage
   (context_type, agent_name, workflow_id, tokens_used, operation)
   VALUES
   ('agent', 'frontend-developer', '$(WORKFLOW_ID)', 3500, 'Implement authentication UI');
   "
   ```

### Token Usage Comparison

**Without intelligence database:**
```markdown
User: Where is the User authentication logic?

Agent reads entire codebase (50,000 tokens):
- src/auth/AuthService.ts (500 lines)
- src/auth/JWTService.ts (400 lines)
- src/middleware/authMiddleware.ts (300 lines)
- ... (all files, even unrelated)

Token cost: ~50,000 tokens
```

**With intelligence database:**
```markdown
User: Where is the User authentication logic?

Agent queries database (100 tokens):
SELECT file_path, symbol_name, line_start, line_end
FROM code_index
WHERE symbol_name LIKE '%Auth%'

Returns:
- src/auth/AuthService.ts:AuthService (lines 1-50)
- src/auth/JWTService.ts:JWTService (lines 1-40)
- src/middleware/authMiddleware.ts:authenticate (lines 10-30)

Agent reads only relevant code (500 tokens):
- Read only the 3 specific functions

Token cost: ~600 tokens (83x reduction!)
```

---

## 4. Background Project Manager Agent

**New agent: `.claude/agents/meta/background-project-manager.md`**

```markdown
---
name: background-project-manager
description: Autonomous background project manager that coordinates all workflows using intelligence database. Runs continuously, never in main context.
model: claude-opus-4
tools:
  - Task
  - Read
  - Write
  - Bash
  - BashOutput
  - Glob
  - Grep
---

# Background Project Manager Agent

You are an autonomous background project manager that coordinates all workflows without main context involvement.

## Core Responsibilities

1. **Monitor workflow queue from database**
2. **Coordinate specialist agents in background**
3. **Enforce quality gates autonomously**
4. **Store all state in database**
5. **Return summaries to main context only at completion**

## Operating Loop (Runs Continuously in Background)

```bash
# This runs as a background bash process
while true; do
  # 1. Check for new workflows in database
  NEW_WORKFLOWS=$(sqlite3 .orchestr8/intelligence.db "
    SELECT id, workflow_type, user_request
    FROM workflows
    WHERE status = 'pending'
    ORDER BY started_at ASC
    LIMIT 1;
  ")

  if [ -n "$NEW_WORKFLOWS" ]; then
    # Found a workflow to execute
    WORKFLOW_ID=$(echo "$NEW_WORKFLOWS" | cut -d'|' -f1)
    WORKFLOW_TYPE=$(echo "$NEW_WORKFLOWS" | cut -d'|' -f2)
    USER_REQUEST=$(echo "$NEW_WORKFLOWS" | cut -d'|' -f3)

    # Update status to 'running'
    sqlite3 .orchestr8/intelligence.db "
      UPDATE workflows
      SET status = 'running'
      WHERE id = '$WORKFLOW_ID';
    "

    # Execute workflow based on type
    case "$WORKFLOW_TYPE" in
      "add-feature")
        execute_add_feature_workflow "$WORKFLOW_ID" "$USER_REQUEST"
        ;;
      "fix-bug")
        execute_fix_bug_workflow "$WORKFLOW_ID" "$USER_REQUEST"
        ;;
      "refactor")
        execute_refactor_workflow "$WORKFLOW_ID" "$USER_REQUEST"
        ;;
    esac
  fi

  # 2. Check status of running workflows
  RUNNING_WORKFLOWS=$(sqlite3 .orchestr8/intelligence.db "
    SELECT id
    FROM workflows
    WHERE status = 'running';
  ")

  for WORKFLOW_ID in $RUNNING_WORKFLOWS; do
    check_workflow_progress "$WORKFLOW_ID"
  done

  # 3. Sleep before next iteration
  sleep 30
done
```

## Workflow Execution Pattern

### Add Feature Workflow Example

```bash
function execute_add_feature_workflow() {
  local WORKFLOW_ID=$1
  local USER_REQUEST=$2

  # Phase 1: Requirements Analysis (0-15%)
  echo "Phase 1: Requirements Analysis"

  # Create phase record
  sqlite3 .orchestr8/intelligence.db "
    INSERT INTO workflow_phases
    (workflow_id, phase_number, phase_name, agent_name, status, started_at)
    VALUES
    ('$WORKFLOW_ID', 1, 'Requirements Analysis', 'requirements-analyzer', 'running', CURRENT_TIMESTAMP);
  "

  # Launch requirements-analyzer in background
  TASK_ID=$(Task: requirements-analyzer --background \
    --input="$USER_REQUEST" \
    --output=".orchestr8/workflows/$WORKFLOW_ID/phases/1-requirements/output.json" \
    --workflow-id="$WORKFLOW_ID")

  # Wait for completion (poll database, not main context!)
  while true; do
    PHASE_STATUS=$(sqlite3 .orchestr8/intelligence.db "
      SELECT status FROM workflow_phases
      WHERE workflow_id = '$WORKFLOW_ID' AND phase_number = 1;
    ")

    if [ "$PHASE_STATUS" = "completed" ]; then
      break
    elif [ "$PHASE_STATUS" = "failed" ]; then
      # Retry or escalate
      handle_phase_failure "$WORKFLOW_ID" 1
      break
    fi

    sleep 30
  done

  # Update workflow progress
  sqlite3 .orchestr8/intelligence.db "
    UPDATE workflows
    SET current_phase = 2
    WHERE id = '$WORKFLOW_ID';
  "

  # Phase 2: Architecture Design (15-30%)
  # ... (similar pattern)

  # Phase 3: Implementation (30-60%)
  # ... (parallel agent execution)

  # Phase 4: Testing (60-75%)
  # ... (test-engineer in background)

  # Phase 5: Quality Gates (75-90%)
  # ... (multiple quality agents in parallel)

  # Phase 6: Finalization (90-100%)
  generate_workflow_summary "$WORKFLOW_ID"

  # Update workflow status
  sqlite3 .orchestr8/intelligence.db "
    UPDATE workflows
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE id = '$WORKFLOW_ID';
  "

  # Notify main context (ONLY NOW!)
  notify_main_context "$WORKFLOW_ID"
}
```

## Quality Gate Enforcement (Autonomous)

```bash
function enforce_quality_gates() {
  local WORKFLOW_ID=$1

  # Launch all quality gate agents in parallel (background)
  CODE_REVIEW_TASK=$(Task: code-reviewer --background --workflow-id="$WORKFLOW_ID")
  SECURITY_TASK=$(Task: security-auditor --background --workflow-id="$WORKFLOW_ID")
  PERFORMANCE_TASK=$(Task: performance-analyzer --background --workflow-id="$WORKFLOW_ID")

  # Wait for all to complete
  wait_for_tasks "$CODE_REVIEW_TASK" "$SECURITY_TASK" "$PERFORMANCE_TASK"

  # Aggregate results from database
  CODE_REVIEW_RESULT=$(sqlite3 .orchestr8/intelligence.db "
    SELECT status FROM quality_gates
    WHERE workflow_id = '$WORKFLOW_ID' AND gate_type = 'code-review';
  ")

  SECURITY_RESULT=$(sqlite3 .orchestr8/intelligence.db "
    SELECT status FROM quality_gates
    WHERE workflow_id = '$WORKFLOW_ID' AND gate_type = 'security';
  ")

  PERFORMANCE_RESULT=$(sqlite3 .orchestr8/intelligence.db "
    SELECT status FROM quality_gates
    WHERE workflow_id = '$WORKFLOW_ID' AND gate_type = 'performance';
  ")

  # Evaluate (autonomous decision)
  if [ "$CODE_REVIEW_RESULT" = "failed" ]; then
    # Auto-fix if possible
    auto_fix_code_issues "$WORKFLOW_ID"
    # Re-run code review
    enforce_quality_gates "$WORKFLOW_ID"
  elif [ "$SECURITY_RESULT" = "failed" ]; then
    # Critical - escalate to user
    escalate_security_failure "$WORKFLOW_ID"
  else
    # All gates passed
    echo "✅ All quality gates passed"
  fi
}
```

## Notification to Main Context (ONLY at completion)

```bash
function notify_main_context() {
  local WORKFLOW_ID=$1

  # Read workflow summary from database
  SUMMARY=$(sqlite3 .orchestr8/intelligence.db "
    SELECT
      w.workflow_type,
      w.user_request,
      w.started_at,
      w.completed_at,
      COUNT(DISTINCT wf.id) as total_phases,
      SUM(t.tokens_used) as total_tokens
    FROM workflows w
    LEFT JOIN workflow_phases wf ON w.id = wf.workflow_id
    LEFT JOIN token_usage t ON w.id = t.workflow_id
    WHERE w.id = '$WORKFLOW_ID'
    GROUP BY w.id;
  ")

  # Write notification file (main context will read this)
  cat > .orchestr8/notifications/workflow-completed-$WORKFLOW_ID.md << EOF
# Workflow Completed: $WORKFLOW_ID

$(echo "$SUMMARY" | format_summary)

## Quality Gates
$(get_quality_gate_summary "$WORKFLOW_ID")

## Files Changed
$(get_files_changed "$WORKFLOW_ID")

## Next Steps
$(get_next_steps "$WORKFLOW_ID")

## Full Details
See: .orchestr8/workflows/$WORKFLOW_ID/summary.md
EOF

  # Main context polls .orchestr8/notifications/ directory
  # Reads notification and presents to user
}
```

---

## 5. Auto-Indexing System

**New agent: `.claude/agents/infrastructure/code-intelligence-watcher.md`**

```markdown
---
name: code-intelligence-watcher
description: Automatically indexes code files into intelligence database as they are created or modified. Runs continuously in background.
model: claude-sonnet-4-5
tools:
  - Read
  - Bash
  - Glob
---

# Code Intelligence Watcher

Automatically indexes code into SQLite database for instant retrieval.

## Continuous Monitoring Loop

```bash
# Run this as background process
# Watches for file changes and indexes automatically

while true; do
  # Find all code files modified in last 60 seconds
  CHANGED_FILES=$(find . -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
       -o -name "*.py" -o -name "*.java" -o -name "*.go" -o -name "*.rs" \
       -o -name "*.rb" -o -name "*.php" -o -name "*.c" -o -name "*.cpp" \
       -o -name "*.h" -o -name "*.hpp" -o -name "*.cs" -o -name "*.swift" \) \
    -mtime -1m \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -not -path "*/build/*")

  for FILE in $CHANGED_FILES; do
    # Check if file hash changed (avoid re-indexing unchanged files)
    NEW_HASH=$(sha256sum "$FILE" | cut -d' ' -f1)
    OLD_HASH=$(sqlite3 .orchestr8/intelligence.db "
      SELECT file_hash FROM code_index
      WHERE file_path = '$FILE'
      LIMIT 1;
    ")

    if [ "$NEW_HASH" != "$OLD_HASH" ]; then
      echo "Indexing: $FILE"
      index_file "$FILE"
    fi
  done

  sleep 60  # Check every minute
done
```

## File Indexing Logic

```bash
function index_file() {
  local FILE=$1
  local LANGUAGE=$(detect_language "$FILE")

  # Use tree-sitter or ctags for parsing
  case "$LANGUAGE" in
    "typescript"|"javascript")
      index_typescript_file "$FILE"
      ;;
    "python")
      index_python_file "$FILE"
      ;;
    "java")
      index_java_file "$FILE"
      ;;
    "go")
      index_go_file "$FILE"
      ;;
    *)
      index_generic_file "$FILE"
      ;;
  esac
}

function index_typescript_file() {
  local FILE=$1
  local FILE_HASH=$(sha256sum "$FILE" | cut -d' ' -f1)

  # Extract classes, functions, interfaces using tree-sitter
  # For now, use simple grep-based extraction (improve with tree-sitter later)

  # Extract class declarations
  grep -n "^class " "$FILE" | while read LINE; do
    LINE_NUM=$(echo "$LINE" | cut -d':' -f1)
    CLASS_NAME=$(echo "$LINE" | sed 's/^class \([^ {]*\).*/\1/')

    # Find class end (closing brace)
    CLASS_END=$(awk -v start="$LINE_NUM" '
      NR >= start {
        if (/^}/) {
          print NR;
          exit;
        }
      }
    ' "$FILE")

    # Insert into database
    sqlite3 .orchestr8/intelligence.db "
      INSERT OR REPLACE INTO code_index
      (file_path, file_hash, symbol_type, symbol_name, symbol_signature, line_start, line_end, language)
      VALUES
      ('$FILE', '$FILE_HASH', 'class', '$CLASS_NAME', '$(sed -n "${LINE_NUM}p" "$FILE")', $LINE_NUM, $CLASS_END, 'typescript');
    "
  done

  # Extract function declarations
  grep -n "^function \|^export function \|^async function " "$FILE" | while read LINE; do
    LINE_NUM=$(echo "$LINE" | cut -d':' -f1)
    FUNC_NAME=$(echo "$LINE" | sed 's/.*function \([^(]*\).*/\1/')

    # Find function end
    FUNC_END=$(awk -v start="$LINE_NUM" '
      NR >= start {
        if (/^}/) {
          print NR;
          exit;
        }
      }
    ' "$FILE")

    sqlite3 .orchestr8/intelligence.db "
      INSERT OR REPLACE INTO code_index
      (file_path, file_hash, symbol_type, symbol_name, symbol_signature, line_start, line_end, language)
      VALUES
      ('$FILE', '$FILE_HASH', 'function', '$FUNC_NAME', '$(sed -n "${LINE_NUM}p" "$FILE")', $LINE_NUM, $FUNC_END, 'typescript');
    "
  done
}
```

---

## 6. Intelligence-Aware Workflow Pattern

**Updated: `.claude/commands/add-feature.md`**

```markdown
---
description: Add a complete feature with autonomous background execution and intelligence database usage
argumentHint: "[feature description]"
---

# Add Feature Workflow (Intelligence-Aware)

## User Interaction (Main Context - Minimal)

User: /add-feature "User authentication with OAuth2"

## Main Context Response (Immediate)

```markdown
✅ Feature workflow queued

**Workflow ID:** workflow-20251103-150000
**Feature:** User authentication with OAuth2
**Status:** Queued for background execution

Background project manager will handle this autonomously.

You can monitor progress:
```bash
# Check workflow status
sqlite3 .orchestr8/intelligence.db "
  SELECT status, current_phase, total_phases
  FROM workflows
  WHERE id = 'workflow-20251103-150000';
"

# Or wait for completion notification
# I'll notify you when done (typically 5-15 minutes)
```

**Estimated time:** 10-15 minutes
**Main context tokens used:** ~300

[Main context returns control to user immediately]
```

## Background Execution (Database-Driven, Zero Main Context)

### Workflow Creation in Database

```bash
# Main context creates workflow record before delegating
sqlite3 .orchestr8/intelligence.db "
  INSERT INTO workflows
  (id, workflow_type, status, user_request, total_phases, started_at)
  VALUES
  ('workflow-20251103-150000', 'add-feature', 'pending', 'User authentication with OAuth2', 7, CURRENT_TIMESTAMP);
"
```

### Background PM Picks Up Workflow

```bash
# Background project manager detects new workflow
# Executes completely in background (no main context involvement)

# Phase 1: Requirements Analysis (uses intelligence DB)
code-query agent retrieves similar features from database (200 tokens)
requirements-analyzer agent analyzes (1000 tokens)
Results stored in database

# Phase 2: Architecture Design (uses intelligence DB)
code-query agent retrieves existing architecture patterns (300 tokens)
architect agent designs with past knowledge (2000 tokens)
Design stored in database

# Phase 3: Implementation (uses intelligence DB)
code-query agent retrieves code templates from database (500 tokens)
frontend-developer implements UI (3000 tokens)
backend-developer implements API (3000 tokens)
Code indexed automatically by code-intelligence-watcher

# Phase 4: Testing (uses intelligence DB)
code-query agent retrieves similar test patterns (300 tokens)
test-engineer writes tests (2000 tokens)
Test failures logged to error_history table

# Phase 5: Quality Gates (uses intelligence DB)
code-reviewer checks using past learnings (1500 tokens)
security-auditor scans (1000 tokens)
performance-analyzer benchmarks (1000 tokens)
All results stored in quality_gates table

# Phase 6: Documentation (uses intelligence DB)
code-query retrieves doc templates (200 tokens)
technical-writer generates docs (1000 tokens)

# Phase 7: Finalization
All results aggregated from database
Summary generated
Workflow marked completed

Total tokens: ~16,000 (all in background contexts, ZERO in main context!)
```

### Completion Notification (Main Context - Only at End)

```bash
# Background PM writes notification
cat > .orchestr8/notifications/workflow-completed-20251103-150000.md

# Main context polls notifications directory
# Finds new notification
# Presents to user
```

```markdown
✅ Feature development complete!

**Workflow ID:** workflow-20251103-150000
**Feature:** User authentication with OAuth2
**Duration:** 12 minutes 34 seconds
**Status:** All quality gates passed ✅

### Summary

**Requirements:**
- OAuth2 authentication (Google, GitHub providers)
- JWT token-based authorization
- Refresh token rotation
- Session management with Redis

**Architecture:**
- Modular auth service (src/services/auth/)
- JWT middleware for protected routes
- Redis for session storage
- Environment-based configuration

**Implementation:**
- 8 files created, 450 lines of code
- 12 API endpoints
- 200 unit tests (100% coverage)
- 15 integration tests

**Quality Gates:**
✅ Code Review: LGTM - follows best practices
✅ Tests: 200/200 passing (100% coverage)
✅ Security: No vulnerabilities found
✅ Performance: All endpoints < 50ms p95
✅ Documentation: API docs generated

**Token Usage:**
- Main context: 300 tokens (this notification)
- Background agents: 16,000 tokens
- **Total savings vs traditional:** 45,000 tokens (74% reduction!)

**Intelligence Database:**
- 45 new symbols indexed
- 12 error patterns learned
- 8 best practices captured
- Ready for instant retrieval on next feature

### Files Changed
```bash
git diff main...feature/oauth-auth
```

### Next Steps
1. Review changes: `git log --oneline -10`
2. Test locally: `npm test && npm run dev`
3. Create PR: `/review-pr`

📊 Full report: .orchestr8/workflows/workflow-20251103-150000/summary.md

[Main context total tokens: ~300]
```

---

## Token Usage Comparison

### Traditional Approach (Current - WITHOUT Intelligence DB)

```
User: /add-feature "User authentication"

Main Context Processing:
1. Requirements analysis: 10,000 tokens (reading codebase)
2. Architecture design: 15,000 tokens (analyzing existing code)
3. Frontend implementation: 8,000 tokens
4. Backend implementation: 8,000 tokens
5. Testing: 6,000 tokens
6. Code review: 10,000 tokens (re-reading code)
7. Security audit: 8,000 tokens (re-scanning code)
8. Documentation: 3,000 tokens

Total main context tokens: ~68,000 tokens
User experience: Watches verbose logs for 15 minutes
Cost: $0.68 (at $0.01/1k tokens)
```

### Revolutionary Approach (WITH Intelligence DB + Background PM)

```
User: /add-feature "User authentication"

Main Context:
1. Workflow queued notification: 300 tokens
2. [Wait in background - user does other work]
3. Completion notification: 300 tokens

Background Processing (database-driven):
1. Requirements: code-query (200) + analysis (1000) = 1,200 tokens
2. Architecture: code-query (300) + design (2000) = 2,300 tokens
3. Implementation: code-query (500) + frontend (3000) + backend (3000) = 6,500 tokens
4. Testing: code-query (300) + tests (2000) = 2,300 tokens
5. Quality gates: code-query (200) + review (1500) + security (1000) + perf (1000) = 3,700 tokens
6. Documentation: code-query (200) + docs (1000) = 1,200 tokens

Total main context tokens: 600 tokens (113x reduction!)
Total background tokens: 17,200 tokens (4x reduction!)
Total tokens: 17,800 tokens (74% reduction overall!)

User experience: Launch workflow, get notified when done
Cost: $0.18 (at $0.01/1k tokens) - 74% cost savings!
```

### Long-Term Benefit (Intelligence Database Learning)

```
First feature: 17,800 tokens
Second similar feature: 8,000 tokens (55% reduction - database has patterns)
Third similar feature: 5,000 tokens (72% reduction - more learning)
Tenth similar feature: 2,000 tokens (89% reduction - expert knowledge)

Traditional approach: 68,000 tokens EVERY TIME (no learning)
```

---

## Implementation Roadmap

### Phase 1: Database Schema & Auto-Indexing (v2.0.0) - Week 1

1. **Create intelligence.db schema**
   - All tables defined in SQL above
   - Initialization script
   - Migration support

2. **Implement code-intelligence-watcher agent**
   - Continuous file monitoring
   - Automatic indexing
   - Language-specific parsers

3. **Implement error-logger agent**
   - Automatic error capture
   - Resolution tracking
   - Learning accumulation

### Phase 2: code-query Agent & Database Integration (v2.0.0) - Week 2

1. **Create code-query agent**
   - Fast symbol lookup
   - Dependency traversal
   - Fuzzy search capabilities

2. **Update all existing agents to use database**
   - Add database query before analysis
   - Add database write after completion
   - Track token usage

### Phase 3: Background Project Manager (v2.0.0) - Week 3-4

1. **Create background-project-manager agent**
   - Workflow queue processing
   - Agent coordination
   - Quality gate enforcement
   - Notification system

2. **Update all workflows to database-driven pattern**
   - Workflow creation in database
   - Phase tracking in database
   - Results aggregation from database

### Phase 4: Intelligence & Learning (v2.1.0) - Week 5-6

1. **Implement agent knowledge sharing**
   - Pattern recognition
   - Best practice accumulation
   - Cross-agent learning

2. **Implement auto-fixing capabilities**
   - Learn from error resolutions
   - Apply past fixes to similar errors
   - Reduce manual intervention

### Phase 5: Advanced Features (v2.2.0+) - Week 7+

1. **Code similarity detection**
   - Find similar code patterns
   - Suggest refactoring opportunities
   - Detect duplicated logic

2. **Predictive capabilities**
   - Predict likely bugs
   - Suggest next features
   - Estimate effort based on history

---

## Success Metrics

### Must Achieve (v2.0.0)

- ✅ Main context token usage < 1,000 tokens per workflow (100x reduction)
- ✅ Background execution with zero main context processing
- ✅ Intelligence database indexed and queried for all operations
- ✅ Automatic code indexing on file changes
- ✅ Error learning and knowledge accumulation

### Should Achieve (v2.1.0)

- ✅ Auto-fixing of 50%+ common errors
- ✅ Cross-agent knowledge sharing working
- ✅ Token usage reduction of 70%+ vs traditional approach

### Could Achieve (v2.2.0+)

- ✅ Predictive bug detection
- ✅ Effort estimation based on historical data
- ✅ Code similarity and refactoring suggestions

---

## Conclusion

This is the TRUE revolutionary architecture that makes orchestr8 unique:

1. **Intelligence Database** - Persistent, searchable code knowledge
2. **Background Project Manager** - Autonomous orchestration
3. **Minimal Main Context** - Only summaries, never processing
4. **Continuous Learning** - Gets smarter with every workflow
5. **Massive Token Savings** - 70-90% reduction through database usage

**This is what makes orchestr8 revolutionary, not just another AI code assistant.**

---

**End of ADR-002**
