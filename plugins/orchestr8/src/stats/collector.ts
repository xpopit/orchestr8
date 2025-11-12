/**
 * Statistics Collector
 *
 * Centralized statistics collection and broadcasting for the MCP server.
 * Used by both stdio and HTTP transports to track server metrics.
 */

export interface StatsSnapshot {
  uptime: number;
  requests: {
    total: number;
    byMethod: Record<string, number>;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: string;
  };
  latency: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  errors: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  lastActivity: number;
}

export type StatsSubscriber = (snapshot: StatsSnapshot) => void;

export class StatsCollector {
  private startTime: number;
  private stats = {
    requests: {
      total: 0,
      byMethod: {} as Record<string, number>
    },
    cache: {
      hits: 0,
      misses: 0
    },
    latencies: [] as number[],
    errors: 0,
    lastActivity: Date.now()
  };

  private subscribers = new Set<StatsSubscriber>();
  private readonly maxLatencies = 100;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Track a request to the MCP server
   */
  trackRequest(method: string, latencyMs: number): void {
    this.stats.requests.total++;
    this.stats.requests.byMethod[method] =
      (this.stats.requests.byMethod[method] || 0) + 1;

    this.stats.latencies.push(latencyMs);
    if (this.stats.latencies.length > this.maxLatencies) {
      this.stats.latencies.shift();
    }

    this.stats.lastActivity = Date.now();
    this.notifySubscribers();
  }

  /**
   * Track a cache hit
   */
  trackCacheHit(): void {
    this.stats.cache.hits++;
    this.notifySubscribers();
  }

  /**
   * Track a cache miss
   */
  trackCacheMiss(): void {
    this.stats.cache.misses++;
    this.notifySubscribers();
  }

  /**
   * Track an error
   */
  trackError(): void {
    this.stats.errors++;
    this.stats.lastActivity = Date.now();
    this.notifySubscribers();
  }

  /**
   * Get current statistics snapshot
   */
  getSnapshot(): StatsSnapshot {
    const latencies = [...this.stats.latencies].sort((a, b) => a - b);
    const memUsage = process.memoryUsage();

    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      requests: {
        total: this.stats.requests.total,
        byMethod: { ...this.stats.requests.byMethod }
      },
      cache: {
        hits: this.stats.cache.hits,
        misses: this.stats.cache.misses,
        hitRate: this.calculateHitRate()
      },
      latency: {
        p50: this.calculatePercentile(latencies, 0.5),
        p95: this.calculatePercentile(latencies, 0.95),
        p99: this.calculatePercentile(latencies, 0.99),
        avg: this.calculateAverage(latencies)
      },
      errors: this.stats.errors,
      memory: {
        heapUsed: Math.floor(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.floor(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.floor(memUsage.external / 1024 / 1024), // MB
        rss: Math.floor(memUsage.rss / 1024 / 1024) // MB
      },
      lastActivity: this.stats.lastActivity
    };
  }

  /**
   * Subscribe to statistics updates
   * Returns an unsubscribe function
   */
  subscribe(callback: StatsSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get number of active subscribers
   */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  /**
   * Reset statistics (useful for testing)
   */
  reset(): void {
    this.startTime = Date.now();
    this.stats = {
      requests: {
        total: 0,
        byMethod: {}
      },
      cache: {
        hits: 0,
        misses: 0
      },
      latencies: [],
      errors: 0,
      lastActivity: Date.now()
    };
    this.notifySubscribers();
  }

  /**
   * Notify all subscribers of stats update
   */
  private notifySubscribers(): void {
    if (this.subscribers.size === 0) {
      return;
    }

    const snapshot = this.getSnapshot();
    this.subscribers.forEach(callback => {
      try {
        callback(snapshot);
      } catch (error) {
        console.error('[StatsCollector] Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Calculate cache hit rate
   */
  private calculateHitRate(): string {
    const total = this.stats.cache.hits + this.stats.cache.misses;
    if (total === 0) {
      return '0.0';
    }
    return ((this.stats.cache.hits / total) * 100).toFixed(1);
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) {
      return 0;
    }
    const index = Math.floor(sortedValues.length * percentile);
    return sortedValues[index] || 0;
  }

  /**
   * Calculate average from array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.floor(sum / values.length);
  }
}
