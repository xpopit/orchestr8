#!/usr/bin/env bash
# Intelligence Database Initialization Script
# Creates SQLite database with full schema for code intelligence, learning, and workflow tracking

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DB_PATH="$PROJECT_ROOT/.orchestr8/intelligence.db"

echo "🚀 Initializing Intelligence Database..."
echo "   Path: $DB_PATH"

# Create .orchestr8 directory if needed
mkdir -p "$(dirname "$DB_PATH")"

# Remove old database if exists (for fresh start)
if [ -f "$DB_PATH" ]; then
    echo "   ⚠️  Removing existing database..."
    rm "$DB_PATH"
fi

# Create database with complete schema
sqlite3 "$DB_PATH" << 'EOF'
-- ============================================================================
-- INTELLIGENCE DATABASE SCHEMA v2.0
-- ============================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- CODE INTELLIGENCE TABLES
-- ============================================================================

-- Code Index: Fast symbol lookup
CREATE TABLE code_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    symbol_type TEXT NOT NULL,  -- class, function, interface, type, variable
    symbol_name TEXT NOT NULL,
    symbol_signature TEXT,
    docstring TEXT,
    line_start INTEGER NOT NULL,
    line_end INTEGER NOT NULL,
    language TEXT NOT NULL,
    complexity INTEGER DEFAULT 0,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_path, symbol_name, line_start)
);

CREATE INDEX idx_code_symbol_name ON code_index(symbol_name);
CREATE INDEX idx_code_file_path ON code_index(file_path);
CREATE INDEX idx_code_language ON code_index(language);
CREATE INDEX idx_code_file_hash ON code_index(file_hash);

-- Code Dependencies: Import/call relationships
CREATE TABLE code_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_symbol_id INTEGER NOT NULL,
    target_symbol_name TEXT NOT NULL,
    target_file_path TEXT,
    dependency_type TEXT NOT NULL,  -- imports, calls, extends, implements
    line_number INTEGER,
    FOREIGN KEY (source_symbol_id) REFERENCES code_index(id) ON DELETE CASCADE
);

CREATE INDEX idx_dep_source ON code_dependencies(source_symbol_id);
CREATE INDEX idx_dep_target ON code_dependencies(target_symbol_name);

-- ============================================================================
-- ERROR LEARNING TABLES
-- ============================================================================

-- Error History: Complete error records
CREATE TABLE error_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error_type TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT NOT NULL,
    category TEXT NOT NULL,  -- bash, test, compile, runtime, lint
    file_path TEXT,
    line_number INTEGER,
    code_context TEXT,
    stack_trace TEXT,
    resolution TEXT,
    resolution_code TEXT,
    resolved_by TEXT,
    confidence REAL DEFAULT 1.0,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_error_type ON error_history(error_type);
CREATE INDEX idx_error_code ON error_history(error_code);
CREATE INDEX idx_error_category ON error_history(category);
CREATE INDEX idx_error_resolved ON error_history(resolved_at);

-- Error Patterns: Aggregated error statistics
CREATE TABLE error_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signature TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    error_type TEXT,
    frequency INTEGER DEFAULT 1,
    resolution_success_rate REAL DEFAULT 0.0,
    avg_resolution_time_minutes INTEGER,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pattern_signature ON error_patterns(signature);
CREATE INDEX idx_pattern_frequency ON error_patterns(frequency DESC);

-- ============================================================================
-- WORKFLOW ORCHESTRATION TABLES
-- ============================================================================

-- Workflows: Workflow tracking
CREATE TABLE workflows (
    id TEXT PRIMARY KEY,
    workflow_type TEXT NOT NULL,
    user_request TEXT NOT NULL,
    total_phases INTEGER NOT NULL,
    current_phase INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    blocked_reason TEXT,
    context TEXT,  -- JSON
    total_tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_status ON workflows(status);
CREATE INDEX idx_workflow_type ON workflows(workflow_type);
CREATE INDEX idx_workflow_priority ON workflows(priority);

-- Workflow Phases: Phase execution tracking
CREATE TABLE workflow_phases (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    phase_number INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    input_summary TEXT,
    output_summary TEXT,
    output_file_path TEXT,
    tokens_used INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    UNIQUE(workflow_id, phase_number)
);

CREATE INDEX idx_phase_workflow ON workflow_phases(workflow_id);
CREATE INDEX idx_phase_status ON workflow_phases(status);
CREATE INDEX idx_phase_agent ON workflow_phases(agent_name);

-- ============================================================================
-- QUALITY GATES TABLES
-- ============================================================================

-- Quality Gates: Validation results
CREATE TABLE quality_gates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    gate_type TEXT NOT NULL,  -- code-review, tests, security, performance
    status TEXT NOT NULL,  -- passed, failed, warning
    score REAL,
    details TEXT,  -- JSON
    issues_found INTEGER DEFAULT 0,
    issues_fixed INTEGER DEFAULT 0,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_gate_workflow ON quality_gates(workflow_id);
CREATE INDEX idx_gate_type ON quality_gates(gate_type);
CREATE INDEX idx_gate_status ON quality_gates(status);

-- ============================================================================
-- METRICS & OPTIMIZATION TABLES
-- ============================================================================

-- Token Usage: Track token consumption
CREATE TABLE token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT,
    phase TEXT,
    agent_name TEXT,
    tokens_used INTEGER NOT NULL,
    operation TEXT,
    model TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_workflow ON token_usage(workflow_id);
CREATE INDEX idx_tokens_agent ON token_usage(agent_name);
CREATE INDEX idx_tokens_recorded ON token_usage(recorded_at);

-- Agent Knowledge: Cross-agent learning
CREATE TABLE agent_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    knowledge_type TEXT NOT NULL,  -- pattern, best-practice, anti-pattern
    context TEXT NOT NULL,
    knowledge TEXT NOT NULL,
    code_example TEXT,
    confidence REAL DEFAULT 1.0,
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    UNIQUE(agent_name, context, knowledge_type)
);

CREATE INDEX idx_knowledge_agent ON agent_knowledge(agent_name);
CREATE INDEX idx_knowledge_type ON agent_knowledge(knowledge_type);
CREATE INDEX idx_knowledge_confidence ON agent_knowledge(confidence DESC);

-- ============================================================================
-- NOTIFICATION TABLES
-- ============================================================================

-- Notifications: Messages for main context
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT,
    notification_type TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',  -- low, normal, high, urgent
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT,  -- JSON
    read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notif_workflow ON notifications(workflow_id);
CREATE INDEX idx_notif_type ON notifications(notification_type);
CREATE INDEX idx_notif_priority ON notifications(priority);
CREATE INDEX idx_notif_read ON notifications(read);

-- File Changes: Track modifications
CREATE TABLE file_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    change_type TEXT NOT NULL,  -- created, modified, deleted
    old_hash TEXT,
    new_hash TEXT,
    lines_added INTEGER DEFAULT 0,
    lines_deleted INTEGER DEFAULT 0,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_file_workflow ON file_changes(workflow_id);
CREATE INDEX idx_file_path ON file_changes(file_path);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert schema version
INSERT INTO notifications (notification_type, priority, title, message, details)
VALUES (
    'system',
    'normal',
    'Intelligence Database Initialized',
    'Schema version 2.0 created successfully with 11 tables and 30+ indexes.',
    '{"version": "2.0.0", "tables": 11, "indexes": 30}'
);

EOF

# Verify database was created
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Failed to create database"
    exit 1
fi

# Verify schema
TABLES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
INDEXES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='index';")

echo "✅ Database created successfully:"
echo "   - Tables: $TABLES"
echo "   - Indexes: $INDEXES"
echo "   - Size: $(du -h "$DB_PATH" | awk '{print $1}')"
echo ""
