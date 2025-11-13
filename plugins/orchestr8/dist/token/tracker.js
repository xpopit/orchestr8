import { Logger } from '../utils/logger.js';
import { DEFAULT_TOKEN_COSTS, DEFAULT_TRACKING_OPTIONS, } from './types.js';
export class TokenTracker {
    logger;
    trackedMessageIds;
    costConfig;
    options;
    constructor(options = {}) {
        this.logger = new Logger('TokenTracker');
        this.trackedMessageIds = new Set();
        this.options = { ...DEFAULT_TRACKING_OPTIONS, ...options };
        this.costConfig = this.options.customCosts || DEFAULT_TOKEN_COSTS;
        this.logger.info('TokenTracker initialized', {
            enabled: this.options.enabled,
            baselineStrategy: this.options.baselineStrategy,
            deduplication: this.options.deduplication,
        });
    }
    track(messageId, claudeUsage, metadata) {
        if (!this.options.enabled) {
            this.logger.debug('Tracking disabled, skipping');
            return null;
        }
        if (this.options.deduplication && this.trackedMessageIds.has(messageId)) {
            this.logger.debug(`Message ${messageId} already tracked, skipping duplicate`);
            return null;
        }
        const inputTokens = claudeUsage.input_tokens;
        const outputTokens = claudeUsage.output_tokens;
        const cacheCreationTokens = claudeUsage.cache_creation_input_tokens || 0;
        const cacheReadTokens = claudeUsage.cache_read_input_tokens || 0;
        const totalTokens = inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens;
        const baselineTokens = this.calculateBaseline(claudeUsage, metadata?.resourceCount || 0);
        const tokensSaved = Math.max(0, baselineTokens - totalTokens);
        const efficiencyPercentage = baselineTokens > 0
            ? (tokensSaved / baselineTokens) * 100
            : 0;
        const costUSD = this.calculateCost(claudeUsage);
        const baselineCostUSD = this.calculateBaselineCost(baselineTokens);
        const costSavingsUSD = Math.max(0, baselineCostUSD - costUSD);
        const usage = {
            messageId,
            timestamp: new Date(),
            inputTokens,
            outputTokens,
            cacheReadTokens,
            cacheCreationTokens,
            totalTokens,
            category: metadata?.category,
            resourceUri: metadata?.resourceUri,
            baselineTokens,
            tokensSaved,
            efficiencyPercentage,
            costUSD,
            costSavingsUSD,
        };
        if (this.options.deduplication) {
            this.trackedMessageIds.add(messageId);
        }
        this.logger.debug('Token usage tracked', {
            messageId,
            totalTokens,
            efficiency: `${efficiencyPercentage.toFixed(1)}%`,
            saved: tokensSaved,
            cost: `$${costUSD.toFixed(4)}`,
        });
        return usage;
    }
    calculateBaseline(claudeUsage, resourceCount = 0) {
        const strategy = this.options.baselineStrategy;
        switch (strategy) {
            case 'no_jit':
                const avgResourceSize = 500;
                const estimatedResourceTokens = resourceCount * avgResourceSize;
                return (claudeUsage.input_tokens +
                    claudeUsage.output_tokens +
                    estimatedResourceTokens +
                    (claudeUsage.cache_creation_input_tokens || 0) +
                    (claudeUsage.cache_read_input_tokens || 0));
            case 'no_cache':
                return (claudeUsage.input_tokens +
                    claudeUsage.output_tokens +
                    (claudeUsage.cache_creation_input_tokens || 0) +
                    (claudeUsage.cache_read_input_tokens || 0) * 10);
            case 'custom':
                return claudeUsage.input_tokens + claudeUsage.output_tokens;
            default:
                this.logger.warn(`Unknown baseline strategy: ${strategy}, using no_jit`);
                return this.calculateBaseline(claudeUsage, resourceCount);
        }
    }
    calculateCost(claudeUsage) {
        const inputCost = (claudeUsage.input_tokens / 1_000_000) * this.costConfig.inputCostPerMillion;
        const outputCost = (claudeUsage.output_tokens / 1_000_000) * this.costConfig.outputCostPerMillion;
        const cacheCreationCost = ((claudeUsage.cache_creation_input_tokens || 0) / 1_000_000) *
            this.costConfig.cacheCreationCostPerMillion;
        const cacheReadCost = ((claudeUsage.cache_read_input_tokens || 0) / 1_000_000) *
            this.costConfig.cacheReadCostPerMillion;
        return inputCost + outputCost + cacheCreationCost + cacheReadCost;
    }
    calculateBaselineCost(baselineTokens) {
        return (baselineTokens / 1_000_000) * this.costConfig.inputCostPerMillion;
    }
    hasTracked(messageId) {
        return this.trackedMessageIds.has(messageId);
    }
    getTrackedCount() {
        return this.trackedMessageIds.size;
    }
    clearTracked() {
        this.logger.debug('Clearing tracked message IDs', {
            count: this.trackedMessageIds.size,
        });
        this.trackedMessageIds.clear();
    }
    getConfig() {
        return {
            options: { ...this.options },
            costs: { ...this.costConfig },
        };
    }
    updateConfig(options) {
        this.options = { ...this.options, ...options };
        if (options.customCosts) {
            this.costConfig = options.customCosts;
        }
        this.logger.info('Configuration updated', this.options);
    }
}
