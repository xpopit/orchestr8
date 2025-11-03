#!/usr/bin/env bash
# Database Helper Library for orchestr8 Intelligence System
# Provides simple functions for agents, skills, and workflows to interact with database

DB_PATH="${DB_PATH:-.orchestr8/intelligence.db}"

# ============================================================================
# CODE INTELLIGENCE FUNCTIONS
# ============================================================================

# Query code index for symbol
db_find_symbol() {
    local symbol_name="$1"
    local language="${2:-}"

    if [ -z "$language" ]; then
        sqlite3 "$DB_PATH" <<EOF
SELECT file_path, line_start, line_end, symbol_signature, docstring
FROM code_index
WHERE symbol_name = '$symbol_name'
ORDER BY indexed_at DESC
LIMIT 5;
EOF
    else
        sqlite3 "$DB_PATH" <<EOF
SELECT file_path, line_start, line_end, symbol_signature, docstring
FROM code_index
WHERE symbol_name = '$symbol_name' AND language = '$language'
ORDER BY indexed_at DESC
LIMIT 5;
EOF
    fi
}

# Find symbols matching pattern
db_search_symbols() {
    local pattern="$1"
    local limit="${2:-20}"

    sqlite3 "$DB_PATH" <<EOF
SELECT symbol_name, file_path, line_start, symbol_type
FROM code_index
WHERE symbol_name LIKE '%$pattern%'
ORDER BY symbol_name
LIMIT $limit;
EOF
}

# Get file summary
db_file_summary() {
    local file_path="$1"

    sqlite3 "$DB_PATH" <<EOF
SELECT symbol_type, symbol_name, line_start, line_end
FROM code_index
WHERE file_path = '$file_path'
ORDER BY line_start;
EOF
}

# ============================================================================
# ERROR LEARNING FUNCTIONS
# ============================================================================

# Log error to database
db_log_error() {
    local error_type="$1"
    local error_message="$2"
    local category="$3"
    local file_path="${4:-}"
    local line_number="${5:-NULL}"

    # Escape single quotes for SQL
    error_type="${error_type//\'/''}"
    error_message="${error_message//\'/''}"
    file_path="${file_path//\'/''}"

    sqlite3 "$DB_PATH" <<EOF
INSERT INTO error_history (error_type, error_message, category, file_path, line_number)
VALUES ('$error_type', '$error_message', '$category', '$file_path', $line_number);
SELECT last_insert_rowid();
EOF
}

# Find similar past errors
db_find_similar_errors() {
    local error_message="$1"
    local limit="${2:-5}"

    # Get first 100 characters for pattern matching
    local pattern="${error_message:0:100}"

    sqlite3 "$DB_PATH" <<EOF
SELECT id, error_message, resolution, resolution_code, confidence
FROM error_history
WHERE error_message LIKE '%$pattern%'
  AND resolution IS NOT NULL
  AND confidence > 0.7
ORDER BY occurred_at DESC
LIMIT $limit;
EOF
}

# Mark error as resolved
db_resolve_error() {
    local error_id="$1"
    local resolution="$2"
    local resolution_code="${3:-}"
    local confidence="${4:-1.0}"

    sqlite3 "$DB_PATH" <<EOF
UPDATE error_history
SET resolution = '$resolution',
    resolution_code = '$resolution_code',
    resolved_at = datetime('now'),
    confidence = $confidence
WHERE id = $error_id;
EOF
}

# Get error statistics
db_error_stats() {
    local days="${1:-30}"

    sqlite3 "$DB_PATH" <<EOF
SELECT
    category,
    COUNT(*) as total_errors,
    SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved,
    AVG(CASE
        WHEN resolved_at IS NOT NULL
        THEN (julianday(resolved_at) - julianday(occurred_at)) * 24 * 60
        ELSE NULL
    END) as avg_resolution_minutes
FROM error_history
WHERE occurred_at > datetime('now', '-$days days')
GROUP BY category;
EOF
}

# ============================================================================
# WORKFLOW FUNCTIONS
# ============================================================================

# Create new workflow
db_create_workflow() {
    local workflow_id="$1"
    local workflow_type="$2"
    local user_request="$3"
    local total_phases="$4"
    local priority="${5:-normal}"

    sqlite3 "$DB_PATH" <<EOF
INSERT INTO workflows (id, workflow_type, user_request, total_phases, priority, status)
VALUES ('$workflow_id', '$workflow_type', '$user_request', $total_phases, '$priority', 'pending');
EOF
}

# Update workflow status
db_update_workflow_status() {
    local workflow_id="$1"
    local status="$2"
    local blocked_reason="${3:-}"

    if [ "$status" = "in_progress" ]; then
        sqlite3 "$DB_PATH" <<EOF
UPDATE workflows
SET status = '$status', started_at = datetime('now')
WHERE id = '$workflow_id';
EOF
    elif [ "$status" = "completed" ] || [ "$status" = "failed" ]; then
        sqlite3 "$DB_PATH" <<EOF
UPDATE workflows
SET status = '$status', completed_at = datetime('now')
WHERE id = '$workflow_id';
EOF
    elif [ "$status" = "blocked" ]; then
        sqlite3 "$DB_PATH" <<EOF
UPDATE workflows
SET status = '$status', blocked_reason = '$blocked_reason'
WHERE id = '$workflow_id';
EOF
    else
        sqlite3 "$DB_PATH" <<EOF
UPDATE workflows SET status = '$status' WHERE id = '$workflow_id';
EOF
    fi
}

# Query similar past workflows
db_find_similar_workflows() {
    local workflow_type="$1"
    local limit="${2:-5}"

    sqlite3 "$DB_PATH" <<EOF
SELECT id, user_request, status,
       (julianday(completed_at) - julianday(started_at)) * 24 * 60 as duration_minutes,
       total_tokens_used
FROM workflows
WHERE workflow_type = '$workflow_type'
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT $limit;
EOF
}

# Get workflow metrics
db_workflow_metrics() {
    local workflow_id="$1"

    sqlite3 "$DB_PATH" <<EOF
SELECT
    w.workflow_type,
    w.status,
    (julianday(w.completed_at) - julianday(w.started_at)) * 24 * 60 as duration_minutes,
    w.total_tokens_used,
    COUNT(DISTINCT wp.id) as phases_completed,
    (SELECT COUNT(*) FROM quality_gates WHERE workflow_id = w.id AND status = 'passed') as gates_passed
FROM workflows w
LEFT JOIN workflow_phases wp ON w.id = wp.workflow_id AND wp.status = 'completed'
WHERE w.id = '$workflow_id'
GROUP BY w.id;
EOF
}

# ============================================================================
# AGENT KNOWLEDGE FUNCTIONS
# ============================================================================

# Store agent knowledge
db_store_knowledge() {
    local agent_name="$1"
    local knowledge_type="$2"
    local context="$3"
    local knowledge="$4"
    local code_example="${5:-}"

    sqlite3 "$DB_PATH" <<EOF
INSERT INTO agent_knowledge (agent_name, knowledge_type, context, knowledge, code_example)
VALUES ('$agent_name', '$knowledge_type', '$context', '$knowledge', '$code_example')
ON CONFLICT(agent_name, context, knowledge_type) DO UPDATE SET
    knowledge = excluded.knowledge,
    code_example = excluded.code_example,
    usage_count = usage_count + 1;
EOF
}

# Query agent knowledge
db_query_knowledge() {
    local agent_name="$1"
    local context_pattern="$2"
    local limit="${3:-10}"

    sqlite3 "$DB_PATH" <<EOF
SELECT knowledge_type, context, knowledge, code_example, confidence, usage_count
FROM agent_knowledge
WHERE agent_name = '$agent_name'
  AND context LIKE '%$context_pattern%'
  AND confidence > 0.7
ORDER BY confidence DESC, usage_count DESC
LIMIT $limit;
EOF
}

# Update knowledge confidence
db_update_knowledge_confidence() {
    local knowledge_id="$1"
    local success="$2"  # 1 for success, 0 for failure

    if [ "$success" = "1" ]; then
        sqlite3 "$DB_PATH" <<EOF
UPDATE agent_knowledge
SET success_count = success_count + 1,
    usage_count = usage_count + 1,
    confidence = LEAST(1.0, confidence * 1.1),
    last_used_at = datetime('now')
WHERE id = $knowledge_id;
EOF
    else
        sqlite3 "$DB_PATH" <<EOF
UPDATE agent_knowledge
SET failure_count = failure_count + 1,
    usage_count = usage_count + 1,
    confidence = MAX(0.0, confidence * 0.9),
    last_used_at = datetime('now')
WHERE id = $knowledge_id;
EOF
    fi
}

# ============================================================================
# NOTIFICATION FUNCTIONS
# ============================================================================

# Send notification
db_send_notification() {
    local workflow_id="$1"
    local notification_type="$2"
    local priority="$3"
    local title="$4"
    local message="$5"

    sqlite3 "$DB_PATH" <<EOF
INSERT INTO notifications (workflow_id, notification_type, priority, title, message)
VALUES ('$workflow_id', '$notification_type', '$priority', '$title', '$message');
EOF
}

# Get unread notifications
db_get_notifications() {
    local limit="${1:-10}"

    sqlite3 "$DB_PATH" <<EOF
SELECT id, workflow_id, notification_type, priority, title, message, created_at
FROM notifications
WHERE read = 0
ORDER BY
    CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
    END,
    created_at DESC
LIMIT $limit;
EOF
}

# Mark notification as read
db_mark_notification_read() {
    local notification_id="$1"

    sqlite3 "$DB_PATH" <<EOF
UPDATE notifications
SET read = 1, read_at = datetime('now')
WHERE id = $notification_id;
EOF
}

# ============================================================================
# TOKEN TRACKING FUNCTIONS
# ============================================================================

# Track token usage
db_track_tokens() {
    local workflow_id="$1"
    local phase="$2"
    local agent_name="$3"
    local tokens_used="$4"
    local operation="${5:-}"

    sqlite3 "$DB_PATH" <<EOF
INSERT INTO token_usage (workflow_id, phase, agent_name, tokens_used, operation)
VALUES ('$workflow_id', '$phase', '$agent_name', $tokens_used, '$operation');
EOF
}

# Get token savings report
db_token_savings() {
    local workflow_id="$1"

    sqlite3 "$DB_PATH" <<EOF
SELECT
    SUM(tokens_used) as total_tokens,
    COUNT(DISTINCT agent_name) as agents_used,
    AVG(tokens_used) as avg_per_operation
FROM token_usage
WHERE workflow_id = '$workflow_id';
EOF
}

# ============================================================================
# QUALITY GATE FUNCTIONS
# ============================================================================

# Log quality gate result
db_log_quality_gate() {
    local workflow_id="$1"
    local gate_type="$2"
    local status="$3"
    local score="${4:-}"
    local issues_found="${5:-0}"

    sqlite3 "$DB_PATH" <<EOF
INSERT INTO quality_gates (workflow_id, gate_type, status, score, issues_found)
VALUES ('$workflow_id', '$gate_type', '$status', $score, $issues_found);
EOF
}

# Get quality gate history
db_quality_gate_history() {
    local gate_type="$1"
    local days="${2:-30}"

    sqlite3 "$DB_PATH" <<EOF
SELECT
    DATE(executed_at) as date,
    COUNT(*) as total_runs,
    SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
    AVG(score) as avg_score
FROM quality_gates
WHERE gate_type = '$gate_type'
  AND executed_at > datetime('now', '-$days days')
GROUP BY DATE(executed_at)
ORDER BY date DESC;
EOF
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# Check if database exists and is healthy
db_health_check() {
    if [ ! -f "$DB_PATH" ]; then
        echo "ERROR: Database not found at $DB_PATH"
        return 1
    fi

    # Check integrity
    if ! sqlite3 "$DB_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
        echo "ERROR: Database integrity check failed"
        return 1
    fi

    # Check tables exist
    local tables=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
    if [ "$tables" -lt 10 ]; then
        echo "ERROR: Incomplete schema (found $tables tables, expected 10+)"
        return 1
    fi

    echo "OK: Database healthy ($tables tables)"
    return 0
}

# Get database statistics
db_stats() {
    echo "=== Intelligence Database Statistics ==="
    echo ""
    echo "Code Index:"
    sqlite3 "$DB_PATH" "SELECT COUNT(*) || ' symbols indexed' FROM code_index;"
    sqlite3 "$DB_PATH" "SELECT COUNT(DISTINCT language) || ' languages' FROM code_index;"
    echo ""
    echo "Errors:"
    sqlite3 "$DB_PATH" "SELECT COUNT(*) || ' total errors logged' FROM error_history;"
    sqlite3 "$DB_PATH" "SELECT COUNT(*) || ' errors resolved' FROM error_history WHERE resolved_at IS NOT NULL;"
    echo ""
    echo "Workflows:"
    sqlite3 "$DB_PATH" "SELECT COUNT(*) || ' total workflows' FROM workflows;"
    sqlite3 "$DB_PATH" "SELECT COUNT(*) || ' completed' FROM workflows WHERE status = 'completed';"
    echo ""
    echo "Knowledge:"
    sqlite3 "$DB_PATH" "SELECT COUNT(*) || ' knowledge entries' FROM agent_knowledge;"
    sqlite3 "$DB_PATH" "SELECT COUNT(DISTINCT agent_name) || ' contributing agents' FROM agent_knowledge;"
    echo ""
    echo "Notifications:"
    sqlite3 "$DB_PATH" "SELECT COUNT(*) || ' total notifications' FROM notifications;"
    sqlite3 "$DB_PATH" "SELECT COUNT(*) || ' unread' FROM notifications WHERE read = 0;"
}

# Export this file's functions
export -f db_find_symbol
export -f db_search_symbols
export -f db_file_summary
export -f db_log_error
export -f db_find_similar_errors
export -f db_resolve_error
export -f db_error_stats
export -f db_create_workflow
export -f db_update_workflow_status
export -f db_find_similar_workflows
export -f db_workflow_metrics
export -f db_store_knowledge
export -f db_query_knowledge
export -f db_update_knowledge_confidence
export -f db_send_notification
export -f db_get_notifications
export -f db_mark_notification_read
export -f db_track_tokens
export -f db_token_savings
export -f db_log_quality_gate
export -f db_quality_gate_history
export -f db_health_check
export -f db_stats
