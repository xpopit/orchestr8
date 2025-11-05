/**
 * Express HTTP server with JSON-RPC handling
 */

import express, { Request, Response } from 'express';
import { config } from './config';
import { logger } from './logger';
import { Handlers } from './handlers';
import { JSONRPCRequest, JSONRPCResponse } from './types';
import { safeValidate, JSONRPCRequestSchema } from './validation';

export class MCPServer {
  private app: express.Application;
  private handlers: Handlers;
  private server: any;

  constructor(handlers: Handlers) {
    this.app = express();
    this.handlers = handlers;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use((req, res, next) => {
      logger.debug('Request received', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Main JSON-RPC endpoint
    this.app.post('/', async (req: Request, res: Response) => {
      await this.handleJSONRPC(req, res);
    });

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      const health = this.handlers.getHealth();
      res.json(health);
    });

    // Metrics
    this.app.get('/metrics', (req: Request, res: Response) => {
      const metrics = this.handlers.getMetrics();
      res.json(metrics);
    });

    // Re-index
    this.app.post('/reindex', async (req: Request, res: Response) => {
      const result = await this.handlers.reindex();
      res.json(result);
    });
  }

  private async handleJSONRPC(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    // Validate JSON-RPC request
    const validation = safeValidate(JSONRPCRequestSchema, req.body);
    if (!validation.success) {
      const response: JSONRPCResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid Request',
          data: validation.error.errors,
        },
        id: null as any,
      };
      res.status(400).json(response);
      return;
    }

    const request = validation.data as JSONRPCRequest;
    const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info('JSON-RPC request', {
        correlation_id: correlationId,
        method: request.method,
        id: request.id,
      });

      let result: any;

      switch (request.method) {
        case 'queryAgents':
          result = await this.handlers.queryAgents(request.params);
          break;

        case 'getOrchestrationPattern':
          result = await this.handlers.getOrchestrationPattern(request.params);
          break;

        case 'queryPattern':
          result = await this.handlers.queryPattern(request.params);
          break;

        case 'cacheDecision':
          result = await this.handlers.cacheDecision(request.params);
          break;

        case 'querySkills':
          result = await this.handlers.querySkills(request.params);
          break;

        case 'queryWorkflows':
          result = await this.handlers.queryWorkflows(request.params);
          break;

        case 'getHealth':
          result = this.handlers.getHealth();
          break;

        case 'getMetrics':
          result = this.handlers.getMetrics();
          break;

        default:
          throw new Error(`Unknown method: ${request.method}`);
      }

      const response: JSONRPCResponse = {
        jsonrpc: '2.0',
        result,
        id: request.id,
      };

      const duration = Date.now() - startTime;
      logger.info('JSON-RPC response', {
        correlation_id: correlationId,
        method: request.method,
        duration_ms: duration,
      });

      res.json(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('JSON-RPC error', {
        correlation_id: correlationId,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: duration,
      });

      const response: JSONRPCResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
        id: request.id,
      };

      res.status(500).json(response);
    }
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(config.port, () => {
        logger.info('MCP Server started', {
          port: config.port,
          pid: process.pid,
        });
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err: Error) => {
        if (err) {
          reject(err);
        } else {
          logger.info('MCP Server stopped');
          resolve();
        }
      });
    });
  }
}
