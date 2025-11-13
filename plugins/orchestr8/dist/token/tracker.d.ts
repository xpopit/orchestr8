import { TokenUsage, TokenCostConfig, TokenTrackingOptions } from './types.js';
export interface ClaudeTokenUsage {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
}
export declare class TokenTracker {
    private logger;
    private trackedMessageIds;
    private costConfig;
    private options;
    constructor(options?: Partial<TokenTrackingOptions>);
    track(messageId: string, claudeUsage: ClaudeTokenUsage, metadata?: {
        category?: string;
        resourceUri?: string;
        resourceCount?: number;
    }): TokenUsage | null;
    calculateBaseline(claudeUsage: ClaudeTokenUsage, resourceCount?: number): number;
    calculateCost(claudeUsage: ClaudeTokenUsage): number;
    private calculateBaselineCost;
    hasTracked(messageId: string): boolean;
    getTrackedCount(): number;
    clearTracked(): void;
    getConfig(): {
        options: TokenTrackingOptions;
        costs: TokenCostConfig;
    };
    updateConfig(options: Partial<TokenTrackingOptions>): void;
}
