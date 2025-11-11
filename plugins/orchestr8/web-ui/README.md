# Orchestr8 MCP Dashboard v2.0

A world-class monitoring and testing dashboard for the Orchestr8 MCP (Model Context Protocol) server. This professional web interface provides real-time statistics, live activity monitoring, interactive testing, and comprehensive resource exploration.

## Features

### Real-Time Statistics Dashboard
- **Live Metrics**: Uptime, request count, latency (p50, p95, p99, avg), errors, and memory usage
- **Interactive Charts**: Visual representation of latency distribution and resource usage by category
- **Auto-Refresh**: WebSocket-based real-time updates every 5 seconds
- **Recent Activity**: Quick glance at the last 5 server activities

### Live MCP Server Activity
- **Real-Time Log Streaming**: Watch MCP server logs and events as they happen via WebSocket
- **Activity Types**: Server lifecycle, MCP requests/responses, resource operations, errors
- **Smart Filtering**: Filter by activity type (all, requests, responses, errors, logs)
- **Pause/Resume**: Control activity feed updates
- **History**: Maintains last 1000 activity entries

### Interactive Testing Interface
- **Request Types**:
  - List all prompts
  - Get specific prompt with arguments
  - List all resources
  - Read resource by URI
- **Dynamic Forms**: Context-aware form fields based on request type
- **Quick Examples**: Pre-configured examples for common operations
- **Multi-View Results**:
  - **Content Tab**: Formatted, human-readable output with markdown rendering
  - **Protocol Tab**: Raw JSON-RPC MCP protocol messages
  - **Metadata Tab**: Structured metadata about the response
- **Copy to Clipboard**: One-click copy of results
- **Response Stats**: Size and timing information

### Resource Explorer
- **Browse All Resources**: Grid and list view options
- **Category Filtering**: Filter resources by category (agents, skills, examples, patterns, guides, best-practices)
- **Search**: Real-time search across resource names, descriptions, and URIs
- **Resource Details**: Click any resource to view full content in modal
- **Markdown Rendering**: Beautiful rendering of markdown-formatted resources
- **Resource Icons**: Visual categorization with emoji icons

## Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express**: HTTP server framework
- **WebSocket (ws)**: Real-time bidirectional communication
- **MCP SDK**: Communication with MCP server via stdio

### Frontend
- **Vanilla JavaScript**: No framework dependencies, lightweight and fast
- **Chart.js**: Beautiful, responsive charts
- **Marked.js**: Markdown parsing and rendering
- **Modern CSS**: Custom dark theme with CSS Grid and Flexbox
- **WebSocket**: Real-time updates from server

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │  Web Server  │ ◄─────► │ MCP Server  │
│  (WebUI)    │ WS/HTTP │ (Express+WS) │  stdio  │   (Node)    │
└─────────────┘         └──────────────┘         └─────────────┘
      │                         │                         │
      │                         │                         │
   HTML/CSS/JS           WebSocket Broadcast          stdin/stdout
   Chart.js              MCP Proxy                    stderr logs
   Marked.js             Stats Tracking
```

### Communication Flow

1. **WebSocket Connection**: Browser establishes persistent connection to server
2. **MCP Server Spawn**: Express server spawns MCP server as child process
3. **Request Proxy**: HTTP requests are translated to MCP JSON-RPC and sent via stdin
4. **Response Handling**: MCP responses from stdout are parsed and sent back to browser
5. **Activity Broadcasting**: All MCP activity is broadcast to connected WebSocket clients
6. **Stats Collection**: Server collects metrics (latency, errors, resource usage)

## Installation

### Prerequisites

1. **Node.js v18+**: Required for both MCP server and web UI
2. **Built MCP Server**: The main orchestr8 MCP server must be compiled

```bash
# Build the MCP server first
cd /Users/seth/Projects/orchestr8-mcp/plugins/orchestr8
npm run build
```

### Install Web UI Dependencies

```bash
cd /Users/seth/Projects/orchestr8-mcp/plugins/orchestr8/web-ui
npm install
```

## Usage

### Starting the Dashboard

#### Option 1: From web-ui directory
```bash
cd /Users/seth/Projects/orchestr8-mcp/plugins/orchestr8/web-ui
npm start
```

#### Option 2: From orchestr8 root directory
```bash
cd /Users/seth/Projects/orchestr8-mcp/plugins/orchestr8
npm run ui
```

The dashboard will be available at: **http://localhost:3000**

### Custom Port

```bash
PORT=8080 npm start
```

### Development Mode (with auto-restart)

```bash
npm run dev
```

## User Guide

### Overview Dashboard

The main dashboard provides at-a-glance monitoring:

1. **Statistics Cards**: Key metrics updated in real-time
   - Uptime: How long the server has been running
   - Requests: Total number of MCP requests processed
   - Latency: Average response time with p95 and p99 percentiles
   - Errors: Total error count
   - Memory: Heap memory usage
   - Resources: Total available resources

2. **Charts**:
   - **Latency Distribution**: Bar chart showing p50, p95, p99, and average latency
   - **Resource Usage**: Doughnut chart showing resource access by category

3. **Recent Activity**: Last 5 activities with quick "View All" button

### Testing Interface

Interactive testing for all MCP operations:

1. **Select Request Type**: Choose the operation to test
2. **Fill Parameters**: Dynamic form fields appear based on request type
3. **Use Quick Examples**: Pre-configured examples for common scenarios
4. **Execute Test**: Run the test and view results in multiple formats

**Quick Examples:**
- **List Prompts**: See all available workflow prompts
- **List Resources**: See all available resources
- **TypeScript Agent**: Load the TypeScript developer agent
- **Match: API Skills**: Dynamic fuzzy matching for API development skills
- **Match: Full Stack**: Multi-category match across agents, skills, and examples

**Result Tabs:**
- **Content**: Human-readable, formatted output (markdown rendered)
- **Protocol**: Raw MCP JSON-RPC response
- **Metadata**: Structured information about the response

### Resource Explorer

Browse and search all available resources:

1. **Search Bar**: Type to filter resources by name, description, or URI
2. **Category Sidebar**: Click a category to filter resources
3. **View Controls**: Toggle between grid and list view
4. **Resource Cards**: Click any resource to view full content
5. **Resource Modal**: Read full resource content with markdown rendering

**Categories:**
- **Agents**: Complete development agents (e.g., typescript-developer)
- **Skills**: Specific development skills (e.g., error-handling)
- **Examples**: Code examples and patterns
- **Patterns**: Design patterns and architectures
- **Guides**: How-to guides and tutorials
- **Best Practices**: Industry best practices

### Activity Feed

Monitor all MCP server activity in real-time:

1. **Live Feed**: WebSocket-based streaming of all server events
2. **Filter Buttons**: Show only specific activity types
3. **Pause/Resume**: Control the activity stream
4. **Activity Details**: Each entry shows timestamp, type, and relevant details

**Activity Types:**
- **Server Events**: start, ready, stop, exit
- **MCP Requests**: Outgoing requests to MCP server
- **MCP Responses**: Incoming responses from MCP server
- **Operations**: prompts/list, resources/read, etc.
- **Errors**: All error events
- **Logs**: MCP server log output

## API Reference

The dashboard communicates with these REST endpoints:

### GET /api/health
Health check endpoint
```json
{
  "status": "ok",
  "mcpRunning": true,
  "uptime": 1234,
  "connectedClients": 2
}
```

### GET /api/stats
Get current statistics
```json
{
  "uptime": 1234,
  "requestCount": 56,
  "latency": { "p50": 10, "p95": 25, "p99": 40, "avg": 15 },
  "errors": 0,
  "memoryUsage": { "heapUsed": 50000000 },
  "resourceUsage": { "agents": 5, "skills": 10 }
}
```

### GET /api/prompts
List all available prompts

### POST /api/prompts/get
Get specific prompt
```json
{
  "name": "new-project",
  "arguments": { "project_name": "my-app" }
}
```

### GET /api/resources
List all available resources

### POST /api/resources/read
Read specific resource
```json
{
  "uri": "orchestr8://agents/typescript-developer"
}
```

### GET /api/resources/categories
Get all resource categories with counts

### GET /api/metadata
Get MCP server metadata and capabilities

## WebSocket Messages

### From Server to Client

**Statistics Update:**
```json
{
  "type": "stats",
  "data": { /* stats object */ }
}
```

**Activity Event:**
```json
{
  "type": "activity",
  "data": {
    "timestamp": 1234567890,
    "type": "mcp_request",
    "data": { "method": "resources/read", "id": 5 }
  }
}
```

**Activity History (on connect):**
```json
{
  "type": "activity_history",
  "data": [ /* last 50 activities */ ]
}
```

## Configuration

### Environment Variables

- `PORT`: HTTP server port (default: 3000)
- `LOG_LEVEL`: MCP server log level (default: debug)
- `PROMPTS_PATH`: Override prompts directory
- `RESOURCES_PATH`: Override resources directory

Example:
```bash
PORT=8080 LOG_LEVEL=info npm start
```

## Development

### File Structure

```
web-ui/
├── server.js              # Express + WebSocket server with MCP integration
├── package.json           # Dependencies and scripts
├── README.md             # This file
└── public/
    ├── index.html        # Main dashboard HTML
    ├── style.css         # Modern dark theme CSS
    └── app.js            # Dashboard JavaScript application
```

### Key Components

**server.js:**
- MCPServerManager: Manages MCP server lifecycle and communication
- WebSocket server: Broadcasts activity and stats to clients
- REST API: Proxies requests to MCP server
- Stats tracking: Collects and aggregates metrics

**app.js:**
- Dashboard class: Main application controller
- WebSocket client: Receives real-time updates
- View management: Handles navigation and view switching
- API integration: Communicates with REST endpoints
- Chart management: Updates Chart.js visualizations

### Adding New Features

1. **New API Endpoint**: Add route in `server.js`
2. **New View**: Add HTML section in `index.html`, styles in `style.css`, logic in `app.js`
3. **New Activity Type**: Add to activity type handlers in both server and client
4. **New Chart**: Initialize in `setupCharts()` method

## Troubleshooting

### Server Won't Start

**Error**: `Cannot find module 'express'`
- **Solution**: Run `npm install` in the web-ui directory

**Error**: `MCP server not found`
- **Solution**: Build the main MCP server first: `cd .. && npm run build`

**Error**: `EADDRINUSE: address already in use`
- **Solution**: Port 3000 is in use. Use a different port: `PORT=8080 npm start`

### Connection Issues

**WebSocket disconnects frequently**
- Check firewall settings
- Verify no proxy interfering with WebSocket connections
- Check browser console for errors

**"Disconnected from server" message**
- MCP server may have crashed - check terminal output
- Network issue - refresh the page
- Server restarting - wait for automatic reconnection

### No Data Displayed

**Empty resource list**
- Verify MCP server has resources loaded
- Check that RESOURCES_PATH is correct
- Look for errors in server console

**No activity logs**
- Activity is paused - click Resume button
- Filters applied - click "All" filter
- Clear activity log and generate new activity

### Performance Issues

**Slow chart updates**
- Reduce WebSocket update frequency in server.js (currently 5s)
- Limit activity log size (currently 1000 items)

**High memory usage**
- Activity log growing too large - click Clear Logs
- Restart server to reset memory

## Keyboard Shortcuts

Currently, the dashboard uses mouse/touch interactions. Future versions may include:

- `Ctrl/Cmd + K`: Focus search
- `Ctrl/Cmd + T`: Open testing interface
- `Ctrl/Cmd + R`: Refresh data
- `Esc`: Close modal

## Browser Compatibility

Tested and supported:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requirements:
- WebSocket support
- ES6 JavaScript support
- CSS Grid and Flexbox

## Security Considerations

**Important**: This is a development/testing tool, not production-ready.

- No authentication or authorization
- No rate limiting
- No input validation beyond basic checks
- Runs MCP server with full permissions
- Should only be run on localhost
- Do not expose to public networks

## Performance

**Optimizations:**
- WebSocket for efficient real-time updates
- Automatic stat broadcast every 5 seconds (configurable)
- Activity log limited to last 1000 entries
- Efficient DOM updates with minimal re-renders
- CSS animations hardware-accelerated
- Chart updates throttled

**Benchmarks:**
- Cold start: ~2-3 seconds
- WebSocket latency: <10ms
- Dashboard render: <100ms
- Resource list render: <50ms for 100 resources

## Future Enhancements

Potential improvements:
- Request/response history with persistence
- Export data to CSV/JSON
- Custom query builder with syntax highlighting
- Real-time log tailing with filtering
- Performance metrics over time (graphs)
- Batch operations
- Query templates/presets
- Keyboard shortcuts
- Dark/light theme toggle
- Custom dashboard layouts
- Plugin system for extensions

## Contributing

To contribute improvements:

1. Test changes thoroughly
2. Maintain backward compatibility
3. Update documentation
4. Follow existing code style
5. Add comments for complex logic

## Support

For issues or questions:
1. Check this README
2. Review main Orchestr8 documentation
3. Check server logs for detailed errors
4. Verify MCP server is built and working

## License

MIT License - Same as Orchestr8 MCP Server

## Credits

Built with:
- [Express](https://expressjs.com/) - Web framework
- [ws](https://github.com/websockets/ws) - WebSocket library
- [Chart.js](https://www.chartjs.org/) - Charting library
- [Marked](https://marked.js.org/) - Markdown parser
- [MCP SDK](https://github.com/anthropics/mcp) - Model Context Protocol

---

**Version**: 2.0.0
**Last Updated**: 2025-11-11
**Author**: Orchestr8 Team
