export class StatsCollector {
    startTime;
    stats = {
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
    activityLog = [];
    subscribers = new Set();
    activitySubscribers = new Set();
    maxLatencies = 100;
    maxActivityLog = 1000;
    tokenMetrics = null;
    constructor(tokenMetrics) {
        this.startTime = Date.now();
        this.tokenMetrics = tokenMetrics || null;
    }
    trackRequest(method, latencyMs, params) {
        this.stats.requests.total++;
        this.stats.requests.byMethod[method] =
            (this.stats.requests.byMethod[method] || 0) + 1;
        this.stats.latencies.push(latencyMs);
        if (this.stats.latencies.length > this.maxLatencies) {
            this.stats.latencies.shift();
        }
        this.stats.lastActivity = Date.now();
        this.logActivity('mcp_request', {
            method,
            latency: latencyMs,
            params
        });
        this.notifySubscribers();
    }
    trackCacheHit() {
        this.stats.cache.hits++;
        this.notifySubscribers();
    }
    trackCacheMiss() {
        this.stats.cache.misses++;
        this.notifySubscribers();
    }
    trackError(errorData) {
        this.stats.errors++;
        this.stats.lastActivity = Date.now();
        this.logActivity('error', errorData);
        this.notifySubscribers();
    }
    logActivity(type, data) {
        const event = {
            type,
            timestamp: Date.now(),
            data
        };
        this.activityLog.push(event);
        if (this.activityLog.length > this.maxActivityLog) {
            this.activityLog.shift();
        }
        this.notifyActivitySubscribers(event);
    }
    getActivityLog(limit) {
        if (limit) {
            return this.activityLog.slice(-limit);
        }
        return [...this.activityLog];
    }
    async getSnapshot() {
        const latencies = [...this.stats.latencies].sort((a, b) => a - b);
        const memUsage = process.memoryUsage();
        const snapshot = {
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
                heapUsed: Math.floor(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.floor(memUsage.heapTotal / 1024 / 1024),
                external: Math.floor(memUsage.external / 1024 / 1024),
                rss: Math.floor(memUsage.rss / 1024 / 1024)
            },
            lastActivity: this.stats.lastActivity
        };
        if (this.tokenMetrics) {
            try {
                const tokenSummary = this.tokenMetrics.getSummary({ period: 'last_hour' });
                snapshot.tokens = {
                    efficiency: tokenSummary.efficiency,
                    tokensSaved: tokenSummary.tokensSaved,
                    totalCost: tokenSummary.costUSD,
                    recentSavings: tokenSummary.tokensSaved,
                    totalActualTokens: tokenSummary.totalTokens,
                    totalBaselineTokens: tokenSummary.totalTokens + tokenSummary.tokensSaved,
                };
            }
            catch (error) {
            }
        }
        return snapshot;
    }
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => {
            this.subscribers.delete(callback);
        };
    }
    subscribeToActivity(callback) {
        this.activitySubscribers.add(callback);
        return () => {
            this.activitySubscribers.delete(callback);
        };
    }
    getSubscriberCount() {
        return this.subscribers.size;
    }
    getActivitySubscriberCount() {
        return this.activitySubscribers.size;
    }
    reset() {
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
        this.activityLog = [];
        this.notifySubscribers();
    }
    async notifySubscribers() {
        if (this.subscribers.size === 0) {
            return;
        }
        const snapshot = await this.getSnapshot();
        this.subscribers.forEach(callback => {
            try {
                callback(snapshot);
            }
            catch (error) {
                console.error('[StatsCollector] Error in subscriber callback:', error);
            }
        });
    }
    notifyActivitySubscribers(event) {
        if (this.activitySubscribers.size === 0) {
            return;
        }
        this.activitySubscribers.forEach(callback => {
            try {
                callback(event);
            }
            catch (error) {
                console.error('[StatsCollector] Error in activity subscriber callback:', error);
            }
        });
    }
    calculateHitRate() {
        const total = this.stats.cache.hits + this.stats.cache.misses;
        if (total === 0) {
            return '0.0';
        }
        return ((this.stats.cache.hits / total) * 100).toFixed(1);
    }
    calculatePercentile(sortedValues, percentile) {
        if (sortedValues.length === 0) {
            return 0;
        }
        const index = Math.floor(sortedValues.length * percentile);
        return sortedValues[index] || 0;
    }
    calculateAverage(values) {
        if (values.length === 0) {
            return 0;
        }
        const sum = values.reduce((a, b) => a + b, 0);
        return Math.floor(sum / values.length);
    }
}
