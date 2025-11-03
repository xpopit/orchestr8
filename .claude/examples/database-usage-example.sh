#!/usr/bin/env bash
# Working example demonstrating actual database usage by agents/workflows

set -euo pipefail

# Source database helpers
source .claude/lib/db-helpers.sh

echo "=== orchestr8 Database Usage Example ==="
echo ""

# Example 1: Workflow creates and tracks itself in database
echo "1️⃣  Creating workflow in database..."
WORKFLOW_ID="workflow-example-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "add-feature" "Add user authentication" 5 "normal"

echo "   ✅ Workflow created: $WORKFLOW_ID"
echo ""

# Example 2: Update workflow status
echo "2️⃣  Updating workflow to in_progress..."
db_update_workflow_status "$WORKFLOW_ID" "in_progress"
echo "   ✅ Status updated"
echo ""

# Example 3: Agent stores knowledge in database
echo "3️⃣  Agent storing knowledge..."
db_store_knowledge \
    "react-specialist" \
    "best-practice" \
    "React hooks authentication" \
    "Use useContext for auth state, avoid prop drilling" \
    "const auth = useContext(AuthContext);"

echo "   ✅ Knowledge stored"
echo ""

# Example 4: Query knowledge from database
echo "4️⃣  Querying agent knowledge..."
KNOWLEDGE=$(db_query_knowledge "react-specialist" "auth")
if [ -n "$KNOWLEDGE" ]; then
    echo "   ✅ Found knowledge:"
    echo "$KNOWLEDGE" | head -n 3
else
    echo "   ℹ️  No matching knowledge found"
fi
echo ""

# Example 5: Log an error
echo "5️⃣  Logging error to database..."
ERROR_ID=$(db_log_error "TypeError" "Cannot read property 'user' of undefined" "runtime" "src/auth.ts" 42)
echo "   ✅ Error logged with ID: $ERROR_ID"
echo ""

# Example 6: Resolve the error
echo "6️⃣  Resolving error..."
db_resolve_error "$ERROR_ID" "Added null check before accessing user property" "if (data?.user) { ... }" 0.95
echo "   ✅ Error marked as resolved"
echo ""

# Example 7: Track token usage
echo "7️⃣  Tracking token usage..."
db_track_tokens "$WORKFLOW_ID" "implementation" "react-specialist" 3500 "implement-auth-component"
db_track_tokens "$WORKFLOW_ID" "testing" "test-engineer" 2100 "write-auth-tests"
echo "   ✅ Token usage tracked"
echo ""

# Example 8: Log quality gate result
echo "8️⃣  Logging quality gate..."
db_log_quality_gate "$WORKFLOW_ID" "code-review" "passed" 8.5 0
db_log_quality_gate "$WORKFLOW_ID" "testing" "passed" 9.2 0
db_log_quality_gate "$WORKFLOW_ID" "security" "passed" 10.0 0
echo "   ✅ Quality gates logged"
echo ""

# Example 9: Complete workflow
echo "9️⃣  Completing workflow..."
db_update_workflow_status "$WORKFLOW_ID" "completed"
echo "   ✅ Workflow marked as completed"
echo ""

# Example 10: Send notification
echo "🔟 Sending notification..."
db_send_notification \
    "$WORKFLOW_ID" \
    "workflow-completed" \
    "normal" \
    "Feature Complete" \
    "User authentication feature has been successfully implemented and validated."

echo "   ✅ Notification sent"
echo ""

# Show results
echo "=== Database Contents After Workflow ==="
echo ""

echo "📊 Workflow Info:"
sqlite3 .orchestr8/intelligence.db "SELECT id, workflow_type, status, created_at FROM workflows WHERE id = '$WORKFLOW_ID';"
echo ""

echo "📚 Knowledge Stored:"
sqlite3 .orchestr8/intelligence.db "SELECT agent_name, context, knowledge FROM agent_knowledge LIMIT 3;"
echo ""

echo "❌ Errors (with resolutions):"
sqlite3 .orchestr8/intelligence.db "SELECT id, error_type, error_message, resolution FROM error_history LIMIT 3;"
echo ""

echo "✅ Quality Gates:"
sqlite3 .orchestr8/intelligence.db "SELECT gate_type, status, score FROM quality_gates WHERE workflow_id = '$WORKFLOW_ID';"
echo ""

echo "🔔 Notifications:"
sqlite3 .orchestr8/intelligence.db "SELECT title, message, created_at FROM notifications ORDER BY created_at DESC LIMIT 3;"
echo ""

echo "📈 Token Usage:"
STATS=$(db_token_savings "$WORKFLOW_ID")
echo "$STATS"
echo ""

echo "=== Example Complete ==="
echo "The database now contains real data from this example workflow."
echo "All agents, skills, and workflows can use these same db_* functions."
