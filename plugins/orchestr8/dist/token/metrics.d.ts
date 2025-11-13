import { TokenStore } from './store.js';
import { EfficiencyEngine } from './efficiency.js';
import { TokenSession, CategoryMetrics, EfficiencySnapshot } from './types.js';
export interface MetricsQuery {
    period?: 'last_hour' | 'last_day' | 'last_week' | 'all_time';
    startTime?: Date;
    endTime?: Date;
    category?: string;
    includeTrend?: boolean;
}
export declare class TokenMetrics {
    private logger;
    private store;
    private efficiency;
    constructor(store: TokenStore, efficiency?: EfficiencyEngine);
    getEfficiencySnapshot(query?: MetricsQuery): EfficiencySnapshot;
    calculateSessionEfficiency(sessionId: string): TokenSession | null;
    getByCategory(query?: MetricsQuery): CategoryMetrics[];
    getCostSavings(query?: MetricsQuery): {
        period: string;
        totalCost: number;
        baselineCost: number;
        savings: number;
        savingsPercentage: number;
        byCategory: Array<{
            category: string;
            cost: number;
            savings: number;
        }>;
    };
    getTopResources(metric?: 'efficiency' | 'savings' | 'tokens', limit?: number, query?: MetricsQuery): {
        uri: string;
        category: string;
        loadCount: number;
        tokens: number;
        efficiency: number;
        savings: number;
    }[];
    getSummary(query?: MetricsQuery): {
        period: string;
        totalMessages: number;
        totalTokens: number;
        tokensSaved: number;
        efficiency: number;
        costUSD: number;
        costSavingsUSD: number;
        cacheHitRate: number;
        uniqueResources: number;
        topCategory: string;
    };
    getStorageStats(): {
        totalRecords: number;
        totalSessions: number;
        oldestRecord?: Date;
        newestRecord?: Date;
        memoryUsageEstimate: string;
    };
    private getTimeRange;
}
