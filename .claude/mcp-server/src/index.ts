/**
 * MCP Server entry point
 */

import path from 'path';
import fs from 'fs';
import { config, validateConfig } from './config';
import { logger } from './logger';
import { getIndexer } from './indexer';
import { getDatabase, closeDatabase } from './database';
import { getCache, closeCache } from './cache';
import { Handlers } from './handlers';
import { MCPServer } from './server';

async function main() {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated', config);

    // Ensure data directory exists
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
      logger.info('Created data directory', { path: config.dataDir });
    }

    // Find project root (go up from mcp-server to project root)
    const rootDir = path.resolve(__dirname, '../../..');
    logger.info('Project root', { path: rootDir });

    // Initialize components
    logger.info('Initializing MCP server...');

    const indexer = await getIndexer(rootDir);
    const db = getDatabase();
    const cache = getCache();

    const handlers = new Handlers(indexer, db, cache);
    const server = new MCPServer(handlers);

    // Start server
    await server.start();

    // Write PID file
    const pidFile = path.join(__dirname, '../mcp.pid');
    fs.writeFileSync(pidFile, process.pid.toString());
    logger.info('PID file written', { path: pidFile, pid: process.pid });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info('Shutdown signal received', { signal });

      try {
        await server.stop();
        closeCache();
        closeDatabase();

        // Remove PID file
        if (fs.existsSync(pidFile)) {
          fs.unlinkSync(pidFile);
        }

        logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Shutdown error', { error });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled errors
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      process.exit(1);
    });

    logger.info('MCP Server ready');
  } catch (error) {
    logger.error('Failed to start MCP server', { error });
    process.exit(1);
  }
}

// Start server
main();
