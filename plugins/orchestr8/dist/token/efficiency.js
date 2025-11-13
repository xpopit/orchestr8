import { Logger } from '../utils/logger.js';
export class EfficiencyEngine {
    logger;
    constructor() {
        this.logger = new Logger('EfficiencyEngine');
    }
    calculateEfficiency(actual, baseline) {
        if (baseline === 0)
            return 0;
        const saved = Math.max(0, baseline - actual);
        return (saved / baseline) * 100;
    }
    calculateSavings(actual, baseline) {
        return Math.max(0, baseline - actual);
    }
    groupByCategory(records) {
        const categoryMap = new Map();
        for (const record of records) {
            const category = record.category || 'uncategorized';
            let metrics = categoryMap.get(category);
            if (!metrics) {
                metrics = {
                    category,
                    loadCount: 0,
                    totalTokens: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    cacheTokens: 0,
                    baselineTokens: 0,
                    tokensSaved: 0,
                    efficiency: 0,
                    costUSD: 0,
                    costSavingsUSD: 0,
                    topResources: [],
                };
                categoryMap.set(category, metrics);
            }
            metrics.loadCount++;
            metrics.totalTokens += record.totalTokens;
            metrics.inputTokens += record.inputTokens;
            metrics.outputTokens += record.outputTokens;
            metrics.cacheTokens += record.cacheReadTokens + record.cacheCreationTokens;
            metrics.baselineTokens += record.baselineTokens;
            metrics.tokensSaved += record.tokensSaved;
            metrics.costUSD += record.costUSD;
            metrics.costSavingsUSD += record.costSavingsUSD;
        }
        for (const metrics of categoryMap.values()) {
            metrics.efficiency = this.calculateEfficiency(metrics.totalTokens, metrics.baselineTokens);
        }
        return categoryMap;
    }
    getTopResources(records, metric = 'efficiency', limit = 10) {
        const resourceMap = new Map();
        for (const record of records) {
            if (!record.resourceUri)
                continue;
            const uri = record.resourceUri;
            let resource = resourceMap.get(uri);
            if (!resource) {
                resource = {
                    uri,
                    category: record.category || 'uncategorized',
                    loadCount: 0,
                    tokens: 0,
                    baseline: 0,
                    savings: 0,
                    efficiency: 0,
                };
                resourceMap.set(uri, resource);
            }
            resource.loadCount++;
            resource.tokens += record.totalTokens;
            resource.baseline += record.baselineTokens;
            resource.savings += record.tokensSaved;
        }
        for (const resource of resourceMap.values()) {
            resource.efficiency = this.calculateEfficiency(resource.tokens, resource.baseline);
        }
        const sorted = Array.from(resourceMap.values()).sort((a, b) => {
            switch (metric) {
                case 'efficiency':
                    return b.efficiency - a.efficiency;
                case 'savings':
                    return b.savings - a.savings;
                case 'tokens':
                    return b.tokens - a.tokens;
                default:
                    return 0;
            }
        });
        return sorted.slice(0, limit);
    }
    calculateTrend(current, previous) {
        const efficiencyChange = current.efficiency - previous.efficiency;
        const tokenSavingsChange = current.tokensSaved - previous.tokensSaved;
        const costSavingsChange = current.costSavings - previous.costSavings;
        let direction;
        if (Math.abs(efficiencyChange) < 1) {
            direction = 'stable';
        }
        else if (efficiencyChange > 0) {
            direction = 'improving';
        }
        else {
            direction = 'declining';
        }
        return {
            efficiencyChange,
            tokenSavingsChange,
            costSavingsChange,
            direction,
        };
    }
    generateSnapshot(records, period = 'all_time', previousRecords) {
        const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
        const baselineTokens = records.reduce((sum, r) => sum + r.baselineTokens, 0);
        const tokensSaved = records.reduce((sum, r) => sum + r.tokensSaved, 0);
        const costUSD = records.reduce((sum, r) => sum + r.costUSD, 0);
        const costSavingsUSD = records.reduce((sum, r) => sum + r.costSavingsUSD, 0);
        const efficiencyPercentage = this.calculateEfficiency(totalTokens, baselineTokens);
        const categoryMap = this.groupByCategory(records);
        const byCategory = Array.from(categoryMap.values());
        const totalCacheReads = records.reduce((sum, r) => sum + r.cacheReadTokens, 0);
        const totalCacheCreations = records.reduce((sum, r) => sum + r.cacheCreationTokens, 0);
        const totalCacheHits = records.filter((r) => r.cacheReadTokens > 0).length;
        const cacheHitRate = records.length > 0 ? (totalCacheHits / records.length) * 100 : 0;
        const cacheTokensSaved = totalCacheReads * 9;
        const topPerformers = this.getTopResources(records, 'efficiency', 5).map((r) => ({
            uri: r.uri,
            category: r.category,
            efficiency: r.efficiency,
            tokensSaved: r.savings,
        }));
        const allResources = this.getTopResources(records, 'efficiency', 1000);
        const needsOptimization = allResources
            .filter((r) => r.loadCount >= 3)
            .sort((a, b) => a.efficiency - b.efficiency)
            .slice(0, 5)
            .map((r) => ({
            uri: r.uri,
            category: r.category,
            efficiency: r.efficiency,
            loadCount: r.loadCount,
        }));
        let trend;
        if (previousRecords && previousRecords.length > 0) {
            const prevTotal = previousRecords.reduce((sum, r) => sum + r.totalTokens, 0);
            const prevBaseline = previousRecords.reduce((sum, r) => sum + r.baselineTokens, 0);
            const prevSaved = previousRecords.reduce((sum, r) => sum + r.tokensSaved, 0);
            const prevCost = previousRecords.reduce((sum, r) => sum + r.costSavingsUSD, 0);
            const prevEfficiency = this.calculateEfficiency(prevTotal, prevBaseline);
            trend = this.calculateTrend({ efficiency: efficiencyPercentage, tokensSaved, costSavings: costSavingsUSD }, { efficiency: prevEfficiency, tokensSaved: prevSaved, costSavings: prevCost });
        }
        else {
            trend = {
                efficiencyChange: 0,
                tokenSavingsChange: 0,
                costSavingsChange: 0,
                direction: 'stable',
            };
        }
        return {
            timestamp: new Date(),
            period,
            overall: {
                totalTokens,
                baselineTokens,
                tokensSaved,
                efficiencyPercentage,
                costUSD,
                costSavingsUSD,
            },
            byCategory,
            cache: {
                totalCacheHits,
                totalCacheReads,
                totalCacheCreations,
                cacheHitRate,
                cacheTokensSaved,
            },
            trend,
            topPerformers,
            needsOptimization,
        };
    }
    formatEfficiency(efficiency) {
        const formatted = efficiency.toFixed(1);
        if (efficiency >= 50)
            return `${formatted}% (excellent)`;
        if (efficiency >= 30)
            return `${formatted}% (good)`;
        if (efficiency >= 10)
            return `${formatted}% (fair)`;
        return `${formatted}% (needs improvement)`;
    }
    formatCost(costUSD) {
        if (costUSD < 0.01)
            return `$${(costUSD * 1000).toFixed(3)}m`;
        if (costUSD < 1)
            return `$${costUSD.toFixed(3)}`;
        return `$${costUSD.toFixed(2)}`;
    }
    formatTokens(tokens) {
        if (tokens >= 1_000_000)
            return `${(tokens / 1_000_000).toFixed(2)}M`;
        if (tokens >= 1_000)
            return `${(tokens / 1_000).toFixed(1)}K`;
        return tokens.toString();
    }
}
