/**
 * Structured logging with Winston
 */

import winston from 'winston';
import path from 'path';
import { config } from './config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports: [
    // Console output (for development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...rest }) => {
          const extra = Object.keys(rest).length > 0 ? JSON.stringify(rest) : '';
          return `${timestamp} ${level}: ${message} ${extra}`;
        })
      ),
    }),
    // File output (for production)
    new winston.transports.File({
      filename: path.join(config.dataDir, '../logs/mcp.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 7,
      tailable: true,
    }),
    // Error-only log file
    new winston.transports.File({
      filename: path.join(config.dataDir, '../logs/error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 7,
    }),
  ],
});

/**
 * Create a child logger with additional context
 */
export function createContextLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log query with correlation ID
 */
export function logQuery(
  correlationId: string,
  method: string,
  params: any,
  duration_ms: number,
  cache_hit: boolean
) {
  logger.info('Query executed', {
    correlation_id: correlationId,
    method,
    params,
    duration_ms,
    cache_hit,
  });
}

/**
 * Log error with correlation ID
 */
export function logError(
  correlationId: string,
  method: string,
  error: Error,
  params?: any
) {
  logger.error('Query failed', {
    correlation_id: correlationId,
    method,
    error: error.message,
    stack: error.stack,
    params,
  });
}
