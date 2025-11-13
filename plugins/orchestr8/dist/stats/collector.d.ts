import type { TokenMetrics } from '../token/metrics.js';
export interface ActivityEvent {
    type: string;
    timestamp: number;
    data?: any;
}
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
    tokens?: {
        efficiency: number;
        tokensSaved: number;
        totalCost: number;
        recentSavings: number;
        totalActualTokens: number;
        totalBaselineTokens: number;
    };
}
export type StatsSubscriber = (snapshot: StatsSnapshot) => void;
export type ActivitySubscriber = (event: ActivityEvent) => void;
export declare class StatsCollector {
    private startTime;
    private stats;
    private activityLog;
    private subscribers;
    private activitySubscribers;
    private readonly maxLatencies;
    private readonly maxActivityLog;
    private tokenMetrics;
    constructor(tokenMetrics?: TokenMetrics);
    trackRequest(method: string, latencyMs: number, params?: any): void;
    trackCacheHit(): void;
    trackCacheMiss(): void;
    trackError(errorData?: any): void;
    logActivity(type: string, data?: any): void;
    getActivityLog(limit?: number): ActivityEvent[];
    getSnapshot(): Promise<StatsSnapshot>;
    subscribe(callback: StatsSubscriber): () => void;
    subscribeToActivity(callback: ActivitySubscriber): () => void;
    getSubscriberCount(): number;
    getActivitySubscriberCount(): number;
    reset(): void;
    private notifySubscribers;
    private notifyActivitySubscribers;
    private calculateHitRate;
    private calculatePercentile;
    private calculateAverage;
}
