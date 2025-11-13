import { TokenUsage, CategoryMetrics, EfficiencySnapshot } from './types.js';
export declare class EfficiencyEngine {
    private logger;
    constructor();
    calculateEfficiency(actual: number, baseline: number): number;
    calculateSavings(actual: number, baseline: number): number;
    groupByCategory(records: TokenUsage[]): Map<string, CategoryMetrics>;
    getTopResources(records: TokenUsage[], metric?: 'efficiency' | 'savings' | 'tokens', limit?: number): Array<{
        uri: string;
        category: string;
        loadCount: number;
        tokens: number;
        efficiency: number;
        savings: number;
    }>;
    calculateTrend(current: {
        efficiency: number;
        tokensSaved: number;
        costSavings: number;
    }, previous: {
        efficiency: number;
        tokensSaved: number;
        costSavings: number;
    }): {
        efficiencyChange: number;
        tokenSavingsChange: number;
        costSavingsChange: number;
        direction: 'improving' | 'declining' | 'stable';
    };
    generateSnapshot(records: TokenUsage[], period?: string, previousRecords?: TokenUsage[]): EfficiencySnapshot;
    formatEfficiency(efficiency: number): string;
    formatCost(costUSD: number): string;
    formatTokens(tokens: number): string;
}
