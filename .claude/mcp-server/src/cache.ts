/**
 * In-memory caching layer
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';
import { config } from './config';
import { logger } from './logger';

export class CacheManager {
  private cache: NodeCache;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(ttlSeconds: number = config.cacheTTL) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: Math.floor(ttlSeconds / 2),
      useClones: false, // Better performance, but be careful with mutations
    });

    logger.info('Cache initialized', {
      ttl_seconds: ttlSeconds,
      check_period: Math.floor(ttlSeconds / 2),
    });
  }

  /**
   * Generate cache key from method and params
   */
  private generateKey(method: string, params: any): string {
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    const hash = crypto.createHash('sha256').update(paramsStr).digest('hex').substring(0, 16);
    return `${method}:${hash}`;
  }

  /**
   * Get value from cache
   */
  get<T>(method: string, params: any): T | undefined {
    const key = this.generateKey(method, params);
    const value = this.cache.get<T>(key);

    if (value !== undefined) {
      this.stats.hits++;
      logger.debug('Cache hit', { method, key });
    } else {
      this.stats.misses++;
      logger.debug('Cache miss', { method, key });
    }

    return value;
  }

  /**
   * Set value in cache
   */
  set<T>(method: string, params: any, value: T, ttl?: number): boolean {
    const key = this.generateKey(method, params);
    const success = this.cache.set(key, value, ttl);

    logger.debug('Cache set', { method, key, success });

    return success;
  }

  /**
   * Delete value from cache
   */
  delete(method: string, params: any): number {
    const key = this.generateKey(method, params);
    return this.cache.del(key);
  }

  /**
   * Clear all cache
   */
  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hits: number;
    misses: number;
    hit_rate: number;
    keys: number;
  } {
    const keys = this.cache.keys().length;
    const total = this.stats.hits + this.stats.misses;
    const hit_rate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hit_rate,
      keys,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
    };
  }

  /**
   * Close cache
   */
  close(): void {
    this.cache.close();
    logger.info('Cache closed');
  }
}

// Singleton instance
let cacheInstance: CacheManager | null = null;

export function getCache(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
}

export function closeCache(): void {
  if (cacheInstance) {
    cacheInstance.close();
    cacheInstance = null;
  }
}
