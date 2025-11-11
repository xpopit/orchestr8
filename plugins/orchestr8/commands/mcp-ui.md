---
description: Launch the Orchestr8 MCP web UI for interactive testing of prompts, resources, and dynamic fuzzy matching
---

# Orchestr8 MCP Web UI - Interactive Testing Interface

This command launches a web-based testing interface for the Orchestr8 MCP server, allowing you to interactively test prompts, resources, and the dynamic fuzzy matching system without needing to use Claude Code directly.

## What You'll Get

The web UI provides:

- **Interactive Testing**: Test MCP prompts, resources, and dynamic matching queries in real-time
- **Three View Modes**:
  - **MCP Protocol**: Raw JSON-RPC protocol messages for debugging
  - **Assembled Content**: Human-readable formatted content
  - **Metadata**: Structured metadata about responses
- **Example Queries**: Pre-configured examples for common operations
- **Custom Queries**: Build and execute your own MCP requests
- **Real-time Feedback**: Instant results from the MCP server

## Launching the Web UI

I'll launch the web UI server for you now. Here's what will happen:

1. **Build Check**: Verify the MCP server is built
2. **Start Server**: Launch the web UI on port 3000 (or custom port)
3. **Open Browser**: You can access the UI at `http://localhost:3000`

## Executing Launch Sequence

Let me start the web UI server and open your default browser:

```bash
# First, ensure the MCP server is built
cd /Users/seth/Projects/orchestr8-mcp/plugins/orchestr8
npm run build

# Launch the web UI in the background
npm run ui &

# Wait a moment for server to start
sleep 3

# Open the default browser (macOS)
open http://localhost:3000

# Note: The server will run in the background.
# To stop it later: pkill -f "node web-ui/server.js"
```

## What You Can Test

### 1. List Operations
- **List All Prompts**: See all available workflow prompts
- **List All Resources**: Browse all 143 resource fragments

### 2. Prompt Testing
- **new-project**: Test project creation workflow with arguments
- **add-feature**: Test feature addition workflow
- **fix-bug**: Test bug fixing workflow

### 3. Static Resources (Legacy)
- Load individual resources by URI
- Example: `orchestr8://agents/typescript-developer`

### 4. Dynamic Fuzzy Matching (Primary Use Case)
This is where the web UI really shines! Test the dynamic resource assembly:

**Example Queries:**

**TypeScript API Development:**
```
URI: orchestr8://agents/match?query=typescript+api&maxTokens=2000
```
→ Fuzzy matcher selects relevant TypeScript and API fragments

**Async Error Handling:**
```
URI: orchestr8://skills/match?query=async+error+handling&maxTokens=1500
```
→ Assembles error handling skills for async operations

**Full Stack Development:**
```
URI: orchestr8://match?query=build+rest+api&categories=agent,skill,example&maxTokens=3000
```
→ Combines agents, skills, and examples for comprehensive REST API guidance

**Research & Requirements:**
```
URI: orchestr8://match?query=research+requirements&categories=agent,skill,pattern&maxTokens=2000
```
→ Assembles research specialist, requirement analysis, and patterns

### 5. Test Token Budgets
- Try different `maxTokens` values (1000, 2000, 3000, 4000)
- See how the fuzzy matcher selects fragments to fit the budget
- Verify token counts are accurate

### 6. Test Category Filtering
- `categories=agent` - Only load agent fragments
- `categories=skill` - Only load skill fragments
- `categories=agent,skill` - Combine agents and skills
- `categories=agent,skill,example,pattern` - Load from all categories

## Using the Interface

Once the server starts and you open `http://localhost:3000`:

1. **Example Buttons (Left Sidebar)**:
   - Click any button to execute a pre-configured query
   - Instant results displayed in the main panel

2. **Custom Queries (Top Section)**:
   - Select query type (List Prompts, List Resources, Get Prompt, Read Resource)
   - Fill in required fields (prompt name, arguments, resource URI)
   - Click "Execute Query"

3. **Response Tabs**:
   - **MCP Protocol**: Raw JSON-RPC response (debugging)
   - **Assembled Content**: Formatted, readable content
   - **Metadata**: Structured information about the response

## Server Configuration

The web UI runs on **port 3000** by default.

To use a different port:
```bash
PORT=8080 npm run ui
```

Environment variables:
- `PORT`: HTTP server port (default: 3000)
- `LOG_LEVEL`: MCP server log level (default: debug)
- `PROMPTS_PATH`: Override prompts directory
- `RESOURCES_PATH`: Override resources directory

## Troubleshooting

### Server Won't Start

**Error**: `Cannot find module 'express'`
- **Solution**:
  ```bash
  cd web-ui
  npm install
  ```

**Error**: `MCP server not found`
- **Solution**: Build the MCP server:
  ```bash
  cd /Users/seth/Projects/orchestr8-mcp/plugins/orchestr8
  npm run build
  ```

### Connection Issues

If you see "Connection Failed" in the UI:
1. Check the terminal for server errors
2. Open browser console (F12) for JavaScript errors
3. Restart the web UI server

### Empty Responses

If queries succeed but show no content:
1. Check the "MCP Protocol" tab for the raw response
2. Look at server logs in the terminal
3. Verify the resource URI or prompt name is correct

## Stopping the Server

Press `Ctrl+C` in the terminal where the web UI is running.

## Next Steps

After testing in the web UI:
1. **Verify Fuzzy Matching**: Ensure relevant fragments are selected
2. **Check Token Budgets**: Confirm token estimates are accurate
3. **Test Edge Cases**: Try unusual queries, empty queries, very large budgets
4. **Validate Metadata**: Ensure tags, capabilities, useWhen fields help matching

---

**Ready to launch!** The command above will start the web UI. Open your browser to `http://localhost:3000` once it's running.
