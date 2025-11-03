#!/bin/bash
# Intelligence Database Initialization Script
# Creates the SQLite database with full schema for code intelligence, learning, and workflow tracking

set -e

DB_PATH=".orchestr8/intelligence.db"

echo "🚀 Initializing Intelligence Database..."

# Create .orchestr8 directory if it doesn't exist
mkdir -p .orchestr8

# Remove old database if exists (for fresh start)
if [ -f "$DB_PATH" ]; then
    echo "⚠️  Removing existing database..."
    rm "$DB_PATH"
fi

# Create database and schema
sqlite3 "$DB_PATH" << 'EOF'
-- ============================================================================
-- CODE INTELLIGENCE SCHEMA
-- ============================================================================

-- Code Index: Fast symbol lookup and retrieval
CREATE TABLE code_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    symbol_type TEXT NOT NULL,  -- 'class', 'function', 'interface', 'type', 'variable'
    symbol_name TEXT NOT NULL,
    symbol_signature TEXT,
    docstring TEXT,
    line_start INTEGER NOT NULL,
    line_end INTEGER NOT NULL,
    language TEXT NOT NULL,
    complexity INTEGER DEFAULT 0,  -- Cyclomatic complexity
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_path, symbol_name, line_start)
);

CREATE INDEX idx_code_symbol_name ON code_index(symbol_name);
CREATE INDEX idx_code_file_path ON code_index(file_path);
CREATE INDEX idx_code_language ON code_index(language);
CREATE INDEX idx_code_symbol_type ON code_index(symbol_type);
CREATE INDEX idx_code_file_hash ON code_index(file_hash);

-- Code Dependencies: Track imports, calls, inheritance
CREATE TABLE code_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_symbol_id INTEGER NOT NULL,
    target_symbol_name TEXT NOT NULL,
    target_file_path TEXT,
    dependency_type TEXT NOT NULL,  -- 'imports', 'calls', 'extends', 'implements', 'uses'
    line_number INTEGER,
    FOREIGN KEY (source_symbol_id) REFERENCES code_index(id) ON DELETE CASCADE
);

CREATE INDEX idx_dep_source ON code_dependencies(source_symbol_id);
CREATE INDEX idx_dep_target ON code_dependencies(target_symbol_name);
CREATE INDEX idx_dep_type ON code_dependencies(dependency_type);

-- ============================================================================
-- ERROR LEARNING SCHEMA
-- ============================================================================

-- Error History: Learn from mistakes
CREATE TABLE error_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error_type TEXT NOT NULL,  -- 'compilation', 'runtime', 'test', 'lint', 'security', 'performance'
    error_code TEXT,  -- E.g., 'TS2304', 'ENOENT'
    error_message TEXT NOT NULL,
    file_path TEXT,
    line_number INTEGER,
    context TEXT,  -- Code snippet around error
    stack_trace TEXT,
    resolution TEXT,  -- How it was fixed
    resolution_code TEXT,  -- Actual code fix
    resolved_by TEXT,  -- Which agent fixed it
    confidence REAL DEFAULT 1.0,  -- 0.0 to 1.0
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_error_type ON error_history(error_type);
CREATE INDEX idx_error_code ON error_history(error_code);
CREATE INDEX idx_error_file ON error_history(file_path);
CREATE INDEX idx_error_resolved ON error_history(resolved_at);
CREATE INDEX idx_error_message ON error_history(error_message);

-- ============================================================================
-- AGENT KNOWLEDGE SCHEMA
-- ============================================================================

-- Agent Knowledge: Cross-agent learning and pattern recognition
CREATE TABLE agent_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    knowledge_type TEXT NOT NULL,  -- 'pattern', 'decision', 'best-practice', 'anti-pattern', 'optimization'
    context TEXT NOT NULL,  -- When this applies (e.g., "React authentication", "PostgreSQL indexing")
    knowledge TEXT NOT NULL,  -- The actual knowledge/insight
    code_example TEXT,  -- Optional code example
    confidence REAL DEFAULT 1.0,  -- 0.0 to 1.0, increases with validation
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,  -- How many times it worked
    failure_count INTEGER DEFAULT 0,  -- How many times it didn't work
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    last_validated_at TIMESTAMP
);

CREATE INDEX idx_knowledge_agent ON agent_knowledge(agent_name);
CREATE INDEX idx_knowledge_type ON agent_knowledge(knowledge_type);
CREATE INDEX idx_knowledge_context ON agent_knowledge(context);
CREATE INDEX idx_knowledge_confidence ON agent_knowledge(confidence);

-- ============================================================================
-- WORKFLOW TRACKING SCHEMA
-- ============================================================================

-- Workflows: Track autonomous workflow execution
CREATE TABLE workflows (
    id TEXT PRIMARY KEY,  -- workflow-20251103-150000
    workflow_type TEXT NOT NULL,  -- 'add-feature', 'fix-bug', 'refactor', etc.
    status TEXT NOT NULL,  -- 'pending', 'running', 'completed', 'failed', 'blocked'
    user_request TEXT NOT NULL,
    current_phase INTEGER DEFAULT 1,
    total_phases INTEGER NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    blocked_reason TEXT,
    total_tokens_used INTEGER DEFAULT 0,
    main_context_tokens INTEGER DEFAULT 0,
    background_tokens INTEGER DEFAULT 0
);

CREATE INDEX idx_workflow_status ON workflows(status);
CREATE INDEX idx_workflow_type ON workflows(workflow_type);
CREATE INDEX idx_workflow_started ON workflows(started_at);

-- Workflow Phases: Individual phase tracking
CREATE TABLE workflow_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    phase_number INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL,  -- 'pending', 'running', 'completed', 'failed', 'retrying'
    input_summary TEXT,
    output_summary TEXT,
    output_file_path TEXT,
    tokens_used INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
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
-- QUALITY GATES SCHEMA
-- ============================================================================

-- Quality Gates: Historical quality metrics
CREATE TABLE quality_gates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    gate_type TEXT NOT NULL,  -- 'code-review', 'tests', 'security', 'performance', 'accessibility'
    status TEXT NOT NULL,  -- 'passed', 'failed', 'warning', 'skipped'
    score REAL,  -- Optional numeric score (0.0-1.0)
    details TEXT,  -- JSON with gate-specific results
    issues_found INTEGER DEFAULT 0,
    issues_fixed INTEGER DEFAULT 0,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_gate_workflow ON quality_gates(workflow_id);
CREATE INDEX idx_gate_type ON quality_gates(gate_type);
CREATE INDEX idx_gate_status ON quality_gates(status);

-- ============================================================================
-- TOKEN USAGE TRACKING SCHEMA
-- ============================================================================

-- Token Usage: Track token consumption for optimization
CREATE TABLE token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    context_type TEXT NOT NULL,  -- 'main', 'agent', 'workflow', 'background'
    agent_name TEXT,
    workflow_id TEXT,
    tokens_used INTEGER NOT NULL,
    operation TEXT,  -- Description of what was done
    model TEXT,  -- 'claude-opus-4', 'claude-sonnet-4-5', etc.
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_context ON token_usage(context_type);
CREATE INDEX idx_tokens_workflow ON token_usage(workflow_id);
CREATE INDEX idx_tokens_agent ON token_usage(agent_name);
CREATE INDEX idx_tokens_recorded ON token_usage(recorded_at);

-- ============================================================================
-- FILE CHANGE TRACKING SCHEMA
-- ============================================================================

-- File Changes: Track what changed in each workflow
CREATE TABLE file_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    change_type TEXT NOT NULL,  -- 'created', 'modified', 'deleted', 'renamed'
    old_hash TEXT,
    new_hash TEXT,
    lines_added INTEGER DEFAULT 0,
    lines_deleted INTEGER DEFAULT 0,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_file_workflow ON file_changes(workflow_id);
CREATE INDEX idx_file_path ON file_changes(file_path);
CREATE INDEX idx_file_type ON file_changes(change_type);

-- ============================================================================
-- NOTIFICATIONS SCHEMA
-- ============================================================================

-- Notifications: Queue notifications to main context
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT,
    notification_type TEXT NOT NULL,  -- 'workflow-completed', 'workflow-blocked', 'error', 'info'
    priority TEXT NOT NULL DEFAULT 'normal',  -- 'low', 'normal', 'high', 'urgent'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT,  -- JSON with additional details
    read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notif_workflow ON notifications(workflow_id);
CREATE INDEX idx_notif_type ON notifications(notification_type);
CREATE INDEX idx_notif_read ON notifications(read);
CREATE INDEX idx_notif_priority ON notifications(priority);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert welcome notification
INSERT INTO notifications (notification_type, priority, title, message, details)
VALUES (
    'info',
    'normal',
    'Intelligence Database Initialized',
    'The orchestr8 intelligence database has been successfully initialized. All agents can now use persistent code intelligence, error learning, and autonomous workflow tracking.',
    '{"version": "2.0.0", "features": ["code_index", "error_learning", "agent_knowledge", "workflow_tracking", "quality_gates", "token_tracking"]}'
);

EOF

echo "✅ Intelligence Database created: $DB_PATH"
echo ""
echo "📊 Database Statistics:"
sqlite3 "$DB_PATH" "SELECT COUNT(*) || ' tables' FROM sqlite_master WHERE type='table';"
sqlite3 "$DB_PATH" "SELECT COUNT(*) || ' indexes' FROM sqlite_master WHERE type='index';"
echo ""
echo "🎯 Ready for:"
echo "  - Code intelligence and indexing"
echo "  - Error learning and pattern recognition"
echo "  - Agent knowledge sharing"
echo "  - Autonomous workflow tracking"
echo "  - Quality gate enforcement"
echo "  - Token usage optimization"
echo ""
echo "🚀 Next steps:"
echo "  1. Run code-intelligence-watcher to index codebase"
echo "  2. Start background-project-manager for workflow coordination"
echo "  3. Use /add-feature to test autonomous workflows"
