import { TokenTracker } from './tracker.js';
import { TokenStore } from './store.js';
import { EfficiencyEngine } from './efficiency.js';
import { TokenMetrics } from './metrics.js';
export { TokenTracker } from './tracker.js';
export { TokenStore } from './store.js';
export { EfficiencyEngine } from './efficiency.js';
export { TokenMetrics } from './metrics.js';
export { DEFAULT_TOKEN_COSTS, DEFAULT_TRACKING_OPTIONS, } from './types.js';
export function createTokenSystem(options) {
    const tracker = new TokenTracker(options?.tracking);
    const store = new TokenStore(options?.storage);
    const efficiency = new EfficiencyEngine();
    const metrics = new TokenMetrics(store, efficiency);
    return {
        tracker,
        store,
        efficiency,
        metrics,
    };
}
