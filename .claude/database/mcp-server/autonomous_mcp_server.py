#!/usr/bin/env python3
"""
Orchestr8 Autonomous MCP Server

FULLY AUTONOMOUS:
- Zero configuration
- Auto-indexing via hooks
- Language-agnostic
- Global database
- Self-initializing

Usage:
    Just start Claude Code - this runs automatically via MCP config.
"""

import sys
import json
import os
from pathlib import Path

# Add autonomous_db to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from autonomous_db import (
    query_lines, search_files, find_file,
    get_file_info, get_database_stats,
    reconcile_project, auto_index_file
)


class AutonomousMCPServer:
    """MCP Server for Autonomous Database."""

    def __init__(self):
        pass

    def handle_initialize(self, params):
        """Handle initialize request."""
        # Auto-reconcile current directory on startup
        cwd = os.getcwd()
        try:
            reconcile_project(cwd, auto_index=True)
        except:
            pass  # Ignore errors, database will self-correct

        return {
            "protocolVersion": "1.0",
            "capabilities": {"tools": {}},
            "serverInfo": {
                "name": "orchestr8-autonomous-db",
                "version": "2.0.0"
            }
        }

    def handle_list_tools(self, params):
        """List available tools."""
        return {
            "tools": [
                {
                    "name": "query_lines",
                    "description": "Get specific lines from any file. ALWAYS use this instead of reading entire files. Auto-indexes if needed. Works with ALL languages. Saves 80-95% tokens.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Path to file"},
                            "start_line": {"type": "integer", "description": "Start line (1-indexed)"},
                            "end_line": {"type": "integer", "description": "End line (inclusive)"}
                        },
                        "required": ["file_path", "start_line", "end_line"]
                    }
                },
                {
                    "name": "search_files",
                    "description": "Full-text search across all indexed files. Language-agnostic. Finds code by actual content.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query"},
                            "limit": {"type": "integer", "description": "Max results (default 10)", "default": 10}
                        },
                        "required": ["query"]
                    }
                },
                {
                    "name": "find_file",
                    "description": "Find files by name pattern.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "filename": {"type": "string", "description": "Filename or pattern"}
                        },
                        "required": ["filename"]
                    }
                },
                {
                    "name": "get_file_info",
                    "description": "Get metadata about a file (line count, size, language, etc.).",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Path to file"}
                        },
                        "required": ["file_path"]
                    }
                },
                {
                    "name": "database_stats",
                    "description": "Get database statistics (total files, lines, languages, projects).",
                    "inputSchema": {
                        "type": "object",
                        "properties": {}
                    }
                },
                {
                    "name": "reconcile",
                    "description": "Manually reconcile database with current directory (automatic on startup).",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "project_root": {"type": "string", "description": "Project root path (default: current directory)"}
                        }
                    }
                }
            ]
        }

    def handle_call_tool(self, params):
        """Handle tool call."""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        try:
            if tool_name == "query_lines":
                result = query_lines(
                    arguments["file_path"],
                    arguments["start_line"],
                    arguments["end_line"]
                )

                if result:
                    return {
                        "content": [{"type": "text", "text": result}]
                    }
                else:
                    return {
                        "content": [{"type": "text", "text": f"No lines found"}],
                        "isError": True
                    }

            elif tool_name == "search_files":
                results = search_files(
                    arguments["query"],
                    limit=arguments.get("limit", 10)
                )

                return {
                    "content": [{"type": "text", "text": json.dumps(results, indent=2)}]
                }

            elif tool_name == "find_file":
                results = find_file(arguments["filename"])

                return {
                    "content": [{"type": "text", "text": json.dumps(results, indent=2)}]
                }

            elif tool_name == "get_file_info":
                result = get_file_info(arguments["file_path"])

                if result:
                    return {
                        "content": [{"type": "text", "text": json.dumps(result, indent=2)}]
                    }
                else:
                    return {
                        "content": [{"type": "text", "text": "File not indexed"}],
                        "isError": True
                    }

            elif tool_name == "database_stats":
                stats = get_database_stats()

                return {
                    "content": [{"type": "text", "text": json.dumps(stats, indent=2)}]
                }

            elif tool_name == "reconcile":
                project_root = arguments.get("project_root", os.getcwd())
                result = reconcile_project(project_root, auto_index=True)

                return {
                    "content": [{"type": "text", "text": json.dumps(result, indent=2)}]
                }

            else:
                return {
                    "content": [{"type": "text", "text": f"Unknown tool: {tool_name}"}],
                    "isError": True
                }

        except Exception as e:
            return {
                "content": [{"type": "text", "text": f"Error: {str(e)}"}],
                "isError": True
            }

    def run(self):
        """Run MCP server (stdio protocol)."""
        for line in sys.stdin:
            try:
                request = json.loads(line)
                method = request.get("method")
                params = request.get("params", {})
                request_id = request.get("id")

                if method == "initialize":
                    response = self.handle_initialize(params)
                elif method == "tools/list":
                    response = self.handle_list_tools(params)
                elif method == "tools/call":
                    response = self.handle_call_tool(params)
                else:
                    response = {"error": f"Unknown method: {method}"}

                output = {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": response
                }

                print(json.dumps(output), flush=True)

            except Exception as e:
                error_output = {
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "error": {"code": -32603, "message": str(e)}
                }
                print(json.dumps(error_output), flush=True)


if __name__ == "__main__":
    server = AutonomousMCPServer()
    server.run()
