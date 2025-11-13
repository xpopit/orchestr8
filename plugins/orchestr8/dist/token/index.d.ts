import { TokenTracker } from './tracker.js';
import { TokenStore, StoreConfig } from './store.js';
import { EfficiencyEngine } from './efficiency.js';
import { TokenMetrics } from './metrics.js';
import { TokenTrackingOptions } from './types.js';
export { TokenTracker, ClaudeTokenUsage } from './tracker.js';
export { TokenStore, StoreConfig } from './store.js';
export { EfficiencyEngine } from './efficiency.js';
export { TokenMetrics, MetricsQuery } from './metrics.js';
export { TokenUsage, TokenSession, CategoryMetrics, EfficiencySnapshot, TokenCostConfig, BaselineStrategy, TokenTrackingOptions, DEFAULT_TOKEN_COSTS, DEFAULT_TRACKING_OPTIONS, } from './types.js';
export declare function createTokenSystem(options?: {
    tracking?: Partial<TokenTrackingOptions>;
    storage?: Partial<StoreConfig>;
}): {
    tracker: TokenTracker;
    store: TokenStore;
    efficiency: EfficiencyEngine;
    metrics: TokenMetrics;
};
