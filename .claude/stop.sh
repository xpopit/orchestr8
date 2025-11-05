#!/bin/bash

# MCP Server Stop Script

set -e

echo "Stopping MCP server..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/mcp-server/mcp.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "❌ PID file not found. Server may not be running."
    exit 0
fi

PID=$(cat "$PID_FILE")

if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "❌ Process $PID not found. Server may have already stopped."
    rm -f "$PID_FILE"
    exit 0
fi

# Send SIGTERM for graceful shutdown
echo "Sending SIGTERM to process $PID..."
kill "$PID"

# Wait for process to stop
MAX_WAIT=10
WAIT_COUNT=0

while ps -p "$PID" > /dev/null 2>&1; do
    if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
        echo "⚠️  Process did not stop gracefully. Sending SIGKILL..."
        kill -9 "$PID" 2>/dev/null || true
        break
    fi

    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

rm -f "$PID_FILE"

echo "✅ MCP server stopped"
