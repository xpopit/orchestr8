import express, { Express, Request, Response } from 'express';
import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { StatsCollector } from '../stats/collector.js';

export interface HTTPTransportConfig {
  port: number;
  staticPath: string;
  enableCORS?: boolean;
}

export interface MCPServerInterface {
  handleRequest(method: string, params: any): Promise<any>;
  getAvailableAgents(): Promise<any[]>;
  getAvailableSkills(): Promise<any[]>;
  getAvailableWorkflows(): Promise<any[]>;
  getAvailablePatterns(): Promise<any[]>;
  searchResources(query: string): Promise<any[]>;
  getResourceContent(uri: string): Promise<string>;
}

export class HTTPTransport {
  private app: Express;
  private httpServer: HTTPServer | null = null;
  private wsServer: WebSocketServer | null = null;
  private wsClients: Set<WebSocket> = new Set();
  private config: HTTPTransportConfig;
  private mcpServer: MCPServerInterface;
  private stats: StatsCollector;
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(
    config: HTTPTransportConfig,
    mcpServer: MCPServerInterface,
    stats: StatsCollector
  ) {
    this.config = config;
    this.mcpServer = mcpServer;
    this.stats = stats;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json());

    // CORS support
    if (this.config.enableCORS) {
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    }

    // Serve static files
    this.app.use(express.static(this.config.staticPath));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', uptime: process.uptime() });
    });

    // MCP API endpoints
    this.app.post('/api/mcp/request', async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const { method, params } = req.body;
        if (!method) {
          res.status(400).json({ error: 'Missing method parameter' });
          return;
        }

        const result = await this.mcpServer.handleRequest(method, params);
        const latency = Date.now() - startTime;
        this.stats.trackRequest(method, latency);

        res.json({ result });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    // Resource discovery endpoints
    this.app.get('/api/agents', async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const agents = await this.mcpServer.getAvailableAgents();
        const latency = Date.now() - startTime;
        this.stats.trackRequest('list_agents', latency);
        res.json({ agents });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/skills', async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const skills = await this.mcpServer.getAvailableSkills();
        const latency = Date.now() - startTime;
        this.stats.trackRequest('list_skills', latency);
        res.json({ skills });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/workflows', async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const workflows = await this.mcpServer.getAvailableWorkflows();
        const latency = Date.now() - startTime;
        this.stats.trackRequest('list_workflows', latency);
        res.json({ workflows });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/patterns', async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const patterns = await this.mcpServer.getAvailablePatterns();
        const latency = Date.now() - startTime;
        this.stats.trackRequest('list_patterns', latency);
        res.json({ patterns });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/search', async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const query = req.query.q as string;
        if (!query) {
          res.status(400).json({ error: 'Missing query parameter' });
          return;
        }

        const results = await this.mcpServer.searchResources(query);
        const latency = Date.now() - startTime;
        this.stats.trackRequest('search_resources', latency);
        res.json({ results });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/resource', async (req: Request, res: Response) => {
      const startTime = Date.now();
      try {
        const uri = req.query.uri as string;
        if (!uri) {
          res.status(400).json({ error: 'Missing uri parameter' });
          return;
        }

        const content = await this.mcpServer.getResourceContent(uri);
        const latency = Date.now() - startTime;
        this.stats.trackRequest('get_resource', latency);
        res.json({ content });
      } catch (error: any) {
        this.stats.trackError();
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/stats', (req: Request, res: Response) => {
      const snapshot = this.stats.getSnapshot();
      res.json(snapshot);
    });

    // Fallback to index.html for SPA routing
    this.app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(this.config.staticPath, 'index.html'));
    });
  }

  private setupWebSocket(server: HTTPServer): void {
    this.wsServer = new WebSocketServer({ server });

    this.wsServer.on('connection', (ws: WebSocket) => {
      console.log('[HTTP Transport] WebSocket client connected');
      this.wsClients.add(ws);

      // Send initial stats snapshot
      ws.send(JSON.stringify({
        type: 'stats',
        data: this.stats.getSnapshot()
      }));

      ws.on('close', () => {
        console.log('[HTTP Transport] WebSocket client disconnected');
        this.wsClients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[HTTP Transport] WebSocket error:', error);
        this.wsClients.delete(ws);
      });
    });

    // Subscribe to stats updates and broadcast to all clients
    this.stats.subscribe((snapshot) => {
      this.broadcastStats(snapshot);
    });

    // Also send periodic updates every 2 seconds
    this.statsInterval = setInterval(() => {
      this.broadcastStats(this.stats.getSnapshot());
    }, 2000);
  }

  private broadcastStats(snapshot: any): void {
    const message = JSON.stringify({
      type: 'stats',
      data: snapshot
    });

    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer = this.app.listen(this.config.port, () => {
          console.log(`[HTTP Transport] Server listening on port ${this.config.port}`);
          console.log(`[HTTP Transport] Web UI: http://localhost:${this.config.port}`);

          if (this.httpServer) {
            this.setupWebSocket(this.httpServer);
          }

          resolve();
        });

        this.httpServer.on('error', (error) => {
          console.error('[HTTP Transport] Server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    console.log('[HTTP Transport] Shutting down...');

    // Clear stats interval
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Close WebSocket connections
    this.wsClients.forEach((client) => {
      client.close();
    });
    this.wsClients.clear();

    // Close WebSocket server
    if (this.wsServer) {
      await new Promise<void>((resolve) => {
        this.wsServer!.close(() => {
          console.log('[HTTP Transport] WebSocket server closed');
          resolve();
        });
      });
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          console.log('[HTTP Transport] HTTP server closed');
          resolve();
        });
      });
    }
  }
}
