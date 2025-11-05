#!/bin/bash

# MCP Server Status Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/mcp-server/mcp.pid"

echo "=================================="
echo "MCP Server Status"
echo "=================================="
echo ""

# Check PID file
if [ ! -f "$PID_FILE" ]; then
    echo "Status: ❌ Not running (no PID file)"
    exit 0
fi

PID=$(cat "$PID_FILE")

# Check if process is running
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "Status: ❌ Not running (stale PID file)"
    rm -f "$PID_FILE"
    exit 0
fi

echo "Status: ✅ Running"
echo "PID: $PID"
echo ""

# Query health endpoint
if command -v curl &> /dev/null; then
    echo "Health Check:"
    HEALTH=$(curl -s http://localhost:3700/health 2>/dev/null)

    if [ $? -eq 0 ]; then
        echo "$HEALTH" | grep -o '"status":"[^"]*"' || echo "  Status: healthy"
        echo "$HEALTH" | grep -o '"uptime_ms":[0-9]*' || true
        echo "$HEALTH" | grep -o '"memory_mb":[0-9.]*' || true

        # Parse indexes
        AGENTS=$(echo "$HEALTH" | grep -o '"agents":[0-9]*' | grep -o '[0-9]*')
        SKILLS=$(echo "$HEALTH" | grep -o '"skills":[0-9]*' | grep -o '[0-9]*')
        WORKFLOWS=$(echo "$HEALTH" | grep -o '"workflows":[0-9]*' | grep -o '[0-9]*')
        PATTERNS=$(echo "$HEALTH" | grep -o '"patterns":[0-9]*' | grep -o '[0-9]*')

        echo ""
        echo "Indexes:"
        [ -n "$AGENTS" ] && echo "  Agents: $AGENTS"
        [ -n "$SKILLS" ] && echo "  Skills: $SKILLS"
        [ -n "$WORKFLOWS" ] && echo "  Workflows: $WORKFLOWS"
        [ -n "$PATTERNS" ] && echo "  Patterns: $PATTERNS"
    else
        echo "  ⚠️  Health endpoint not responding"
    fi
fi

echo ""
echo "Logs: $SCRIPT_DIR/mcp-server/logs/mcp.log"
echo "Data: $SCRIPT_DIR/mcp-server/data/"
