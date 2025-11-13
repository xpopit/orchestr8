import { Logger } from '../utils/logger.js';
import { EfficiencyEngine } from './efficiency.js';
export class TokenMetrics {
    logger;
    store;
    efficiency;
    constructor(store, efficiency) {
        this.logger = new Logger('TokenMetrics');
        this.store = store;
        this.efficiency = efficiency || new EfficiencyEngine();
        this.logger.info('TokenMetrics initialized');
    }
    getEfficiencySnapshot(query = {}) {
        const { period = 'all_time', category, includeTrend = true } = query;
        const { startTime, endTime } = this.getTimeRange(query);
        const records = category
            ? this.store.getUsageInRange(startTime, endTime, category)
            : this.store.getUsageInRange(startTime, endTime);
        let previousRecords;
        if (includeTrend) {
            const periodDuration = endTime.getTime() - startTime.getTime();
            const prevStart = new Date(startTime.getTime() - periodDuration);
            const prevEnd = startTime;
            previousRecords = category
                ? this.store.getUsageInRange(prevStart, prevEnd, category)
                : this.store.getUsageInRange(prevStart, prevEnd);
        }
        const snapshot = this.efficiency.generateSnapshot(records, period, previousRecords);
        this.logger.debug('Efficiency snapshot generated', {
            period,
            recordCount: records.length,
            efficiency: snapshot.overall.efficiencyPercentage.toFixed(1) + '%',
        });
        return snapshot;
    }
    calculateSessionEfficiency(sessionId) {
        const session = this.store.getSessionData(sessionId);
        if (!session) {
            this.logger.warn('Session not found', { sessionId });
            return null;
        }
        return session;
    }
    getByCategory(query = {}) {
        const { startTime, endTime } = this.getTimeRange(query);
        const records = this.store.getUsageInRange(startTime, endTime);
        const categoryMap = this.efficiency.groupByCategory(records);
        for (const [category, metrics] of categoryMap.entries()) {
            const categoryRecords = records.filter((r) => r.category === category);
            const topResources = this.efficiency
                .getTopResources(categoryRecords, 'tokens', 5)
                .map((r) => ({
                uri: r.uri,
                loadCount: r.loadCount,
                tokens: r.tokens,
            }));
            metrics.topResources = topResources;
        }
        return Array.from(categoryMap.values()).sort((a, b) => b.tokensSaved - a.tokensSaved);
    }
    getCostSavings(query = {}) {
        const { period = 'all_time' } = query;
        const { startTime, endTime } = this.getTimeRange(query);
        const records = this.store.getUsageInRange(startTime, endTime);
        const totalCost = records.reduce((sum, r) => sum + r.costUSD, 0);
        const savings = records.reduce((sum, r) => sum + r.costSavingsUSD, 0);
        const baselineCost = totalCost + savings;
        const savingsPercentage = baselineCost > 0 ? (savings / baselineCost) * 100 : 0;
        const categoryMap = this.efficiency.groupByCategory(records);
        const byCategory = Array.from(categoryMap.values())
            .map((c) => ({
            category: c.category,
            cost: c.costUSD,
            savings: c.costSavingsUSD,
        }))
            .sort((a, b) => b.savings - a.savings);
        return {
            period,
            totalCost,
            baselineCost,
            savings,
            savingsPercentage,
            byCategory,
        };
    }
    getTopResources(metric = 'efficiency', limit = 10, query = {}) {
        const { startTime, endTime } = this.getTimeRange(query);
        const records = query.category
            ? this.store.getUsageInRange(startTime, endTime, query.category)
            : this.store.getUsageInRange(startTime, endTime);
        return this.efficiency.getTopResources(records, metric, limit);
    }
    getSummary(query = {}) {
        const { period = 'all_time' } = query;
        const { startTime, endTime } = this.getTimeRange(query);
        const records = this.store.getUsageInRange(startTime, endTime);
        const totalMessages = records.length;
        const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
        const baselineTokens = records.reduce((sum, r) => sum + r.baselineTokens, 0);
        const tokensSaved = records.reduce((sum, r) => sum + r.tokensSaved, 0);
        const efficiency = this.efficiency.calculateEfficiency(totalTokens, baselineTokens);
        const costUSD = records.reduce((sum, r) => sum + r.costUSD, 0);
        const costSavingsUSD = records.reduce((sum, r) => sum + r.costSavingsUSD, 0);
        const cacheHits = records.filter((r) => r.cacheReadTokens > 0).length;
        const cacheHitRate = totalMessages > 0 ? (cacheHits / totalMessages) * 100 : 0;
        const uniqueResources = new Set(records.map((r) => r.resourceUri).filter(Boolean)).size;
        const categoryMap = this.efficiency.groupByCategory(records);
        const topCategory = Array.from(categoryMap.values()).sort((a, b) => b.tokensSaved - a.tokensSaved)[0]
            ?.category || 'none';
        return {
            period,
            totalMessages,
            totalTokens,
            tokensSaved,
            efficiency,
            costUSD,
            costSavingsUSD,
            cacheHitRate,
            uniqueResources,
            topCategory,
        };
    }
    getStorageStats() {
        return this.store.getStats();
    }
    getTimeRange(query) {
        if (query.startTime && query.endTime) {
            return {
                startTime: query.startTime,
                endTime: query.endTime,
            };
        }
        const endTime = new Date();
        let startTime = new Date(0);
        switch (query.period) {
            case 'last_hour':
                startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
                break;
            case 'last_day':
                startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'last_week':
                startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'all_time':
            default:
                break;
        }
        return { startTime, endTime };
    }
}
