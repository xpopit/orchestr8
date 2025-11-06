#!/usr/bin/env bash
# Session start hook for orchestr8
# Runs when Claude Code starts a new session or resumes an existing session
# Ensures MCP binary is downloaded, executable, and functional

set -euo pipefail

# Use CLAUDE_PLUGIN_ROOT if available, otherwise determine from script location
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
    PLUGIN_ROOT="$CLAUDE_PLUGIN_ROOT"
else
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

MCP_DATA_DIR="$PLUGIN_ROOT/mcp-server/data"
MCP_BINARY="$PLUGIN_ROOT/mcp-server/orchestr8-bin/target/release/orchestr8-bin"

# Handle Windows .exe extension
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    MCP_BINARY="${MCP_BINARY}.exe"
fi

# Create MCP data directory if it doesn't exist
mkdir -p "$MCP_DATA_DIR"

# Check if MCP binary exists and is executable
NEEDS_DOWNLOAD=false

if [ ! -f "$MCP_BINARY" ]; then
    NEEDS_DOWNLOAD=true
    echo "⚠️  orchestr8 MCP binary not found, downloading..."
elif [ ! -x "$MCP_BINARY" ]; then
    echo "⚠️  MCP binary exists but is not executable, fixing permissions..."
    chmod +x "$MCP_BINARY" || {
        echo "❌ Failed to make binary executable"
        NEEDS_DOWNLOAD=true
    }
fi

# Download binary if needed
if [ "$NEEDS_DOWNLOAD" = true ]; then
    if [ -f "$PLUGIN_ROOT/hooks/post-install.sh" ]; then
        bash "$PLUGIN_ROOT/hooks/post-install.sh" || {
            echo "❌ Failed to download MCP binary"
            echo "   Please run manually: bash $PLUGIN_ROOT/hooks/post-install.sh"
            exit 1
        }
    else
        echo "❌ Post-install script not found at: $PLUGIN_ROOT/hooks/post-install.sh"
        exit 1
    fi

    # Verify binary was downloaded and is executable
    if [ ! -f "$MCP_BINARY" ]; then
        echo "❌ MCP binary not found after download attempt: $MCP_BINARY"
        exit 1
    fi

    if [ ! -x "$MCP_BINARY" ]; then
        echo "❌ MCP binary is not executable after download"
        exit 1
    fi
fi

# Verify binary is functional (quick test)
if ! "$MCP_BINARY" --help &>/dev/null; then
    echo "❌ MCP binary exists but failed to run"
    echo "   Binary path: $MCP_BINARY"
    echo "   Try reinstalling: bash $PLUGIN_ROOT/hooks/post-install.sh"
    exit 1
fi

# Store MCP paths in environment for Claude Code's use
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo "ORCHESTR8_MCP_BINARY=$MCP_BINARY" >> "$CLAUDE_ENV_FILE"
    echo "ORCHESTR8_MCP_DATA_DIR=$MCP_DATA_DIR" >> "$CLAUDE_ENV_FILE"
fi

# Silent success - MCP server will be started by Claude Code using mcpServers config
exit 0
