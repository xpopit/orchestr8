# Orchestr8 MCP Dashboard - Quick Start

## Start the Dashboard

```bash
# From the web-ui directory
cd /Users/seth/Projects/orchestr8-mcp/plugins/orchestr8/web-ui
npm start
```

Or from the orchestr8 root:

```bash
cd /Users/seth/Projects/orchestr8-mcp/plugins/orchestr8
npm run ui
```

Then open your browser to: **http://localhost:3000**

## What You'll See

### 1. Overview Dashboard (Default View)
- Real-time statistics cards showing uptime, requests, latency, errors, memory, and resources
- Interactive charts visualizing latency distribution and resource usage
- Recent activity feed showing last 5 events

### 2. Testing Interface
Click "Testing" in the navigation to:
- Test any MCP operation (list prompts, get prompt, list resources, read resource)
- Use quick examples for common operations
- View results in three tabs: Content (formatted), Protocol (raw JSON), Metadata

### 3. Resource Explorer
Click "Resources" to:
- Browse all available resources in grid or list view
- Filter by category (agents, skills, examples, patterns, guides, best-practices)
- Search by name, description, or URI
- Click any resource to view full content in modal

### 4. Activity Feed
Click "Activity" to:
- Watch live MCP server events in real-time
- Filter by type (all, requests, responses, errors, logs)
- Pause/resume the feed
- See detailed information about each event

## Quick Test

1. Start the dashboard: `npm start`
2. Wait for "Connected" status in the header
3. Click "Testing" tab
4. Click "List Resources" quick example
5. Click "Execute Test"
6. See all available resources in the Content tab

## Troubleshooting

**If connection fails:**
- Ensure MCP server is built: `cd .. && npm run build`
- Check terminal for error messages
- Refresh the page after fixing issues

**If no data appears:**
- Check that resources and prompts directories exist
- Verify MCP server started successfully (check terminal output)
- Look for errors in browser console (F12)

## Features Highlight

### Real-Time Updates
- WebSocket connection provides instant updates
- Statistics refresh every 5 seconds
- Activity streams live as events occur

### Professional UI
- Modern dark theme optimized for long sessions
- Responsive design works on all screen sizes
- Smooth animations and transitions
- Keyboard-friendly (tab navigation)

### Developer-Friendly
- Raw MCP protocol visible in Testing interface
- Comprehensive error messages
- Copy-to-clipboard for all results
- Activity log for debugging

## Next Steps

1. Explore the Testing interface with different request types
2. Browse resources in the Explorer
3. Try dynamic fuzzy matching: `orchestr8://skills/match?query=api+development&maxTokens=2000`
4. Monitor activity in real-time while testing
5. Check out the README.md for full documentation

Enjoy your world-class MCP dashboard!
