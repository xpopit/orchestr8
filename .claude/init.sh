#!/bin/bash

# MCP Server Initialization Script
# Installs dependencies and starts the MCP server for Claude Code Orchestration System

set -e

echo "=================================="
echo "MCP Server Initialization"
echo "=================================="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_DIR="$SCRIPT_DIR/mcp-server"

# Check Node.js version
echo "[1/6] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    echo ""
    echo "Please install Node.js >= 18.0.0:"
    echo "  - macOS: brew install node"
    echo "  - Linux: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  - Windows: Download from https://nodejs.org/"
    echo ""
    echo "⚠️  MCP server will not be available. Falling back to embedded agent registry."
    exit 0
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be >= 18.0.0 (found: $(node -v))"
    echo "⚠️  MCP server will not be available. Falling back to embedded agent registry."
    exit 0
fi

echo "✓ Node.js $(node -v) found"

# Check npm
echo ""
echo "[2/6] Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    echo "⚠️  MCP server will not be available. Falling back to embedded agent registry."
    exit 0
fi

echo "✓ npm $(npm -v) found"

# Install dependencies
echo ""
echo "[3/6] Installing MCP server dependencies..."
cd "$MCP_DIR"

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in $MCP_DIR"
    exit 1
fi

npm install --silent 2>&1 | grep -v "npm WARN"
echo "✓ Dependencies installed"

# Build TypeScript
echo ""
echo "[4/6] Building MCP server..."
npm run build --silent
echo "✓ Build complete"

# Stop existing server if running
echo ""
echo "[5/6] Checking for existing server..."
PID_FILE="$MCP_DIR/mcp.pid"

if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "Stopping existing server (PID: $OLD_PID)..."
        kill "$OLD_PID" 2>/dev/null || true
        sleep 1
    fi
    rm -f "$PID_FILE"
fi

# Start server in background
echo ""
echo "[6/6] Starting MCP server..."
cd "$MCP_DIR"

# Create logs directory
mkdir -p logs data

# Start server
nohup node dist/index.js > logs/startup.log 2>&1 &
SERVER_PID=$!

echo "✓ Server started (PID: $SERVER_PID)"

# Wait for server to be ready
echo ""
echo "Waiting for server to be ready..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3700/health > /dev/null 2>&1; then
        echo "✓ Server is healthy"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "  Retry $RETRY_COUNT/$MAX_RETRIES..."
        sleep 1
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Server failed to start within 10 seconds"
    echo "Check logs: $MCP_DIR/logs/mcp.log"
    exit 1
fi

# Success
echo ""
echo "=================================="
echo "✅ MCP Server Initialized"
echo "=================================="
echo ""
echo "Server Details:"
echo "  Port: 3700"
echo "  PID: $SERVER_PID"
echo "  Logs: $MCP_DIR/logs/mcp.log"
echo "  Data: $MCP_DIR/data/"
echo ""
echo "Management commands:"
echo "  Status: .claude/status.sh"
echo "  Stop:   .claude/stop.sh"
echo ""
