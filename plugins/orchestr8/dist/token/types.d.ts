export interface TokenUsage {
    messageId: string;
    timestamp: Date;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
    totalTokens: number;
    category?: string;
    resourceUri?: string;
    baselineTokens: number;
    tokensSaved: number;
    efficiencyPercentage: number;
    costUSD: number;
    costSavingsUSD: number;
}
export interface TokenSession {
    sessionId: string;
    startTime: Date;
    endTime?: Date;
    messageCount: number;
    trackedMessageIds: Set<string>;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCacheReadTokens: number;
    totalCacheCreationTokens: number;
    totalTokens: number;
    totalBaselineTokens: number;
    totalTokensSaved: number;
    sessionEfficiency: number;
    totalCostUSD: number;
    totalCostSavingsUSD: number;
    usageRecords: TokenUsage[];
}
export interface CategoryMetrics {
    category: string;
    loadCount: number;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    cacheTokens: number;
    baselineTokens: number;
    tokensSaved: number;
    efficiency: number;
    costUSD: number;
    costSavingsUSD: number;
    topResources: Array<{
        uri: string;
        loadCount: number;
        tokens: number;
    }>;
}
export interface EfficiencySnapshot {
    timestamp: Date;
    period: string;
    overall: {
        totalTokens: number;
        baselineTokens: number;
        tokensSaved: number;
        efficiencyPercentage: number;
        costUSD: number;
        costSavingsUSD: number;
    };
    byCategory: CategoryMetrics[];
    cache: {
        totalCacheHits: number;
        totalCacheReads: number;
        totalCacheCreations: number;
        cacheHitRate: number;
        cacheTokensSaved: number;
    };
    trend: {
        efficiencyChange: number;
        tokenSavingsChange: number;
        costSavingsChange: number;
        direction: 'improving' | 'declining' | 'stable';
    };
    topPerformers: Array<{
        uri: string;
        category: string;
        efficiency: number;
        tokensSaved: number;
    }>;
    needsOptimization: Array<{
        uri: string;
        category: string;
        efficiency: number;
        loadCount: number;
    }>;
}
export interface TokenCostConfig {
    inputCostPerMillion: number;
    outputCostPerMillion: number;
    cacheReadCostPerMillion: number;
    cacheCreationCostPerMillion: number;
}
export declare const DEFAULT_TOKEN_COSTS: TokenCostConfig;
export type BaselineStrategy = 'no_jit' | 'no_cache' | 'custom';
export interface TokenTrackingOptions {
    enabled: boolean;
    baselineStrategy: BaselineStrategy;
    customCosts?: TokenCostConfig;
    deduplication: boolean;
    retentionDays: number;
    enableTrends: boolean;
}
export declare const DEFAULT_TRACKING_OPTIONS: TokenTrackingOptions;
