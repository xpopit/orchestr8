/**
 * Server configuration management
 */

import path from 'path';
import { ServerConfig } from './types';

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

export const config: ServerConfig = {
  port: getEnvNumber('MCP_PORT', 3700),
  dataDir: path.resolve(getEnv('MCP_DATA_DIR', './data')),
  logLevel: getEnv('MCP_LOG_LEVEL', 'info') as ServerConfig['logLevel'],
  cacheTTL: getEnvNumber('MCP_CACHE_TTL', 300),
  autoRestart: getEnvBoolean('MCP_AUTO_RESTART', true),
  watchFiles: getEnvBoolean('MCP_WATCH_FILES', false),
  maxMemoryMB: getEnvNumber('MCP_MAX_MEMORY_MB', 100),
};

export function validateConfig(): void {
  if (config.port < 1024 || config.port > 65535) {
    throw new Error(`Invalid port: ${config.port}. Must be between 1024 and 65535.`);
  }

  if (config.cacheTTL < 0) {
    throw new Error(`Invalid cache TTL: ${config.cacheTTL}. Must be >= 0.`);
  }

  if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    throw new Error(`Invalid log level: ${config.logLevel}`);
  }

  if (config.maxMemoryMB < 10) {
    throw new Error(`Invalid max memory: ${config.maxMemoryMB}. Must be >= 10MB.`);
  }
}
