import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Statistics tracking
const stats = {
  requestCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  latencies: [],
  resourceUsage: {},
  errors: 0,
  startTime: Date.now(),
  lastActivity: Date.now()
};

// MCP Server Manager with WebSocket broadcast
class MCPServerManager {
  constructor() {
    this.mcpProcess = null;
    this.messageId = 1;
    this.pendingRequests = new Map();
    this.clients = new Set();
    this.activityLog = [];
    this.maxLogSize = 1000;
  }

  addClient(ws) {
    this.clients.add(ws);
    // Send recent activity log to new client
    ws.send(JSON.stringify({
      type: 'activity_history',
      data: this.activityLog.slice(-50)
    }));
  }

  removeClient(ws) {
    this.clients.delete(ws);
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(message);
        } catch (error) {
          console.error('[Broadcast Error]:', error);
        }
      }
    });
  }

  logActivity(type, data) {
    const activity = {
      timestamp: Date.now(),
      type,
      data
    };

    this.activityLog.push(activity);
    if (this.activityLog.length > this.maxLogSize) {
      this.activityLog.shift();
    }

    this.broadcast({
      type: 'activity',
      data: activity
    });

    stats.lastActivity = Date.now();
  }

  start() {
    return new Promise((resolve, reject) => {
      const mcpServerPath = path.join(__dirname, '..', 'dist', 'index.js');

      console.log('[Server] Starting MCP server:', mcpServerPath);
      this.logActivity('server_start', { path: mcpServerPath });

      this.mcpProcess = spawn('node', [mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PROMPTS_PATH: path.join(__dirname, '..', 'prompts'),
          RESOURCES_PATH: path.join(__dirname, '..', 'resources'),
          LOG_LEVEL: 'debug'
        }
      });

      let initTimeout = setTimeout(() => {
        reject(new Error('MCP server initialization timeout'));
      }, 10000);

      let initialized = false;
      let jsonBuffer = '';

      this.mcpProcess.stdout.on('data', (data) => {
        jsonBuffer += data.toString();

        const lines = jsonBuffer.split('\n');
        jsonBuffer = lines.pop() || '';

        lines.forEach(line => {
          if (!line.trim()) return;

          try {
            const jsonMsg = JSON.parse(line);
            console.log('[MCP Response]:', JSON.stringify(jsonMsg, null, 2));

            // Log MCP response
            this.logActivity('mcp_response', {
              method: jsonMsg.method || 'response',
              id: jsonMsg.id
            });

            if (jsonMsg.id && this.pendingRequests.has(jsonMsg.id)) {
              const { resolve: resolveReq, reject: rejectReq, startTime } = this.pendingRequests.get(jsonMsg.id);
              this.pendingRequests.delete(jsonMsg.id);

              // Track latency
              const latency = Date.now() - startTime;
              stats.latencies.push(latency);
              if (stats.latencies.length > 100) {
                stats.latencies.shift();
              }

              if (jsonMsg.error) {
                stats.errors++;
                this.logActivity('error', {
                  message: jsonMsg.error.message,
                  id: jsonMsg.id
                });
                rejectReq(new Error(jsonMsg.error.message || 'MCP error'));
              } else {
                resolveReq(jsonMsg);

                if (jsonMsg.id === 1 && !initialized) {
                  initialized = true;
                  clearTimeout(initTimeout);
                  this.logActivity('server_ready', { version: '1.0.0' });
                  resolve();
                }
              }

              // Broadcast stats update
              this.broadcast({
                type: 'stats',
                data: this.getStats()
              });
            }
          } catch (e) {
            console.log('[MCP stdout (non-JSON)]:', line);
          }
        });
      });

      this.mcpProcess.stderr.on('data', (data) => {
        const logMessage = data.toString();
        console.log('[MCP stderr]:', logMessage);

        // Broadcast log message to connected clients
        this.logActivity('log', {
          level: 'info',
          message: logMessage.trim()
        });
      });

      this.mcpProcess.on('error', (error) => {
        console.error('[MCP Process Error]:', error);
        stats.errors++;
        this.logActivity('error', {
          message: `Process error: ${error.message}`
        });
        reject(error);
      });

      this.mcpProcess.on('exit', (code) => {
        console.log('[MCP Process] exited with code:', code);
        this.logActivity('server_exit', { code });
      });

      // Send initialize request
      this.sendRequest({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'orchestr8-web-ui',
            version: '2.0.0'
          }
        },
        id: this.messageId++
      }).catch(reject);
    });
  }

  sendRequest(message) {
    return new Promise((resolve, reject) => {
      if (!this.mcpProcess) {
        reject(new Error('MCP server not running'));
        return;
      }

      const requestId = message.id || this.messageId++;
      message.id = requestId;

      stats.requestCount++;

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        startTime: Date.now()
      });

      const jsonMessage = JSON.stringify(message) + '\n';
      console.log('[Sending to MCP]:', jsonMessage.trim());

      // Log request
      this.logActivity('mcp_request', {
        method: message.method,
        id: requestId
      });

      this.mcpProcess.stdin.write(jsonMessage);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          stats.errors++;
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  getStats() {
    const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
    const latencies = stats.latencies.length > 0 ? [...stats.latencies].sort((a, b) => a - b) : [0];

    return {
      uptime,
      requestCount: stats.requestCount,
      cacheHits: stats.cacheHits,
      cacheMisses: stats.cacheMisses,
      cacheHitRate: stats.requestCount > 0
        ? ((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1)
        : 0,
      latency: {
        p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
        p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
        p99: latencies[Math.floor(latencies.length * 0.99)] || 0,
        avg: latencies.length > 0 ? Math.floor(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0
      },
      errors: stats.errors,
      lastActivity: stats.lastActivity,
      resourceUsage: stats.resourceUsage,
      memoryUsage: process.memoryUsage()
    };
  }

  stop() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
      this.logActivity('server_stop', {});
    }
  }
}

const mcpManager = new MCPServerManager();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  mcpManager.addClient(ws);

  // Send initial stats
  ws.send(JSON.stringify({
    type: 'stats',
    data: mcpManager.getStats()
  }));

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
    mcpManager.removeClient(ws);
  });

  ws.on('error', (error) => {
    console.error('[WebSocket Error]:', error);
  });
});

// REST API Endpoints

// List all available prompts
app.get('/api/prompts', async (req, res) => {
  try {
    const response = await mcpManager.sendRequest({
      jsonrpc: '2.0',
      method: 'prompts/list',
      params: {},
      id: mcpManager.messageId++
    });

    mcpManager.logActivity('prompts_list', {
      count: response.result?.prompts?.length || 0
    });

    res.json(response);
  } catch (error) {
    console.error('Error listing prompts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific prompt
app.post('/api/prompts/get', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    const response = await mcpManager.sendRequest({
      jsonrpc: '2.0',
      method: 'prompts/get',
      params: {
        name,
        arguments: args || {}
      },
      id: mcpManager.messageId++
    });

    mcpManager.logActivity('prompt_get', { name });

    res.json(response);
  } catch (error) {
    console.error('Error getting prompt:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all available resources
app.get('/api/resources', async (req, res) => {
  try {
    const response = await mcpManager.sendRequest({
      jsonrpc: '2.0',
      method: 'resources/list',
      params: {},
      id: mcpManager.messageId++
    });

    const resources = response.result?.resources || [];

    // Track resource usage statistics
    resources.forEach(resource => {
      const category = extractCategory(resource.uri);
      if (category) {
        stats.resourceUsage[category] = (stats.resourceUsage[category] || 0) + 1;
      }
    });

    mcpManager.logActivity('resources_list', {
      count: resources.length
    });

    res.json(response);
  } catch (error) {
    console.error('Error listing resources:', error);
    res.status(500).json({ error: error.message });
  }
});

// Read a specific resource
app.post('/api/resources/read', async (req, res) => {
  try {
    const { uri } = req.body;

    const response = await mcpManager.sendRequest({
      jsonrpc: '2.0',
      method: 'resources/read',
      params: { uri },
      id: mcpManager.messageId++
    });

    const category = extractCategory(uri);
    mcpManager.logActivity('resource_read', {
      uri,
      category
    });

    // Track resource usage
    if (category) {
      stats.resourceUsage[category] = (stats.resourceUsage[category] || 0) + 1;
    }

    res.json(response);
  } catch (error) {
    console.error('Error reading resource:', error);
    res.status(500).json({ error: error.message });
  }
});

// Custom MCP request
app.post('/api/request', async (req, res) => {
  try {
    const response = await mcpManager.sendRequest({
      ...req.body,
      id: mcpManager.messageId++
    });

    mcpManager.logActivity('custom_request', {
      method: req.body.method
    });

    res.json(response);
  } catch (error) {
    console.error('Error sending custom request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mcpRunning: !!mcpManager.mcpProcess,
    uptime: Math.floor((Date.now() - stats.startTime) / 1000),
    connectedClients: mcpManager.clients.size
  });
});

// Get statistics
app.get('/api/stats', (req, res) => {
  res.json(mcpManager.getStats());
});

// Get activity log
app.get('/api/activity', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(mcpManager.activityLog.slice(-limit));
});

// Helper: Extract category from orchestr8:// URI
function extractCategory(uri) {
  const match = uri.match(/^orchestr8:\/\/([^/?]+)/);
  return match ? match[1] : null;
}

// Helper: Group resources by category
function groupByCategory(resources) {
  const grouped = {};
  resources.forEach(resource => {
    const category = extractCategory(resource.uri);
    if (category && category !== 'match') {
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(resource);
    }
  });
  return grouped;
}

// Get MCP server metadata
app.get('/api/metadata', async (req, res) => {
  try {
    const response = await mcpManager.sendRequest({
      jsonrpc: '2.0',
      method: 'resources/list',
      params: {},
      id: mcpManager.messageId++
    });

    if (!response.result || !response.result.resources) {
      return res.status(500).json({ error: 'Invalid response from MCP server' });
    }

    const resources = response.result.resources;
    const byCategory = groupByCategory(resources);

    const metadata = {
      totalResources: resources.length,
      categories: Object.keys(byCategory).map(cat => ({
        name: cat,
        count: byCategory[cat].length
      })),
      dynamicMatchingEnabled: true,
      serverCapabilities: {
        fuzzyMatching: true,
        staticResources: true,
        promptWorkflows: true
      }
    };

    res.json(metadata);
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get resource categories
app.get('/api/resources/categories', async (req, res) => {
  try {
    const response = await mcpManager.sendRequest({
      jsonrpc: '2.0',
      method: 'resources/list',
      params: {},
      id: mcpManager.messageId++
    });

    if (!response.result || !response.result.resources) {
      return res.status(500).json({ error: 'Invalid response from MCP server' });
    }

    const byCategory = groupByCategory(response.result.resources);
    const categories = Object.keys(byCategory).map(cat => ({
      category: cat,
      count: byCategory[cat].length,
      resources: byCategory[cat]
    }));

    res.json(categories);
  } catch (error) {
    console.error('Error listing categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
async function startServer() {
  try {
    console.log('[Server] Starting MCP server...');
    await mcpManager.start();
    console.log('[Server] MCP server started successfully');

    server.listen(PORT, () => {
      console.log(`[Server] Web UI running at http://localhost:${PORT}`);
      console.log('[Server] WebSocket server ready');
      console.log('[Server] Ready to handle requests');
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Server] Shutting down...');
  mcpManager.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...');
  mcpManager.stop();
  process.exit(0);
});

// Broadcast stats every 5 seconds
setInterval(() => {
  if (mcpManager.clients.size > 0) {
    mcpManager.broadcast({
      type: 'stats',
      data: mcpManager.getStats()
    });
  }
}, 5000);

startServer();
