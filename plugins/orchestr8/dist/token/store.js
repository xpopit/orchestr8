import { Logger } from '../utils/logger.js';
const DEFAULT_STORE_CONFIG = {
    maxRecords: 10000,
    retentionDays: 7,
    autoCleanup: true,
    cleanupIntervalMs: 3600000,
};
export class TokenStore {
    logger;
    config;
    usageRecords;
    sessionMap;
    cleanupTimer;
    constructor(config = {}) {
        this.logger = new Logger('TokenStore');
        this.config = { ...DEFAULT_STORE_CONFIG, ...config };
        this.usageRecords = [];
        this.sessionMap = new Map();
        if (this.config.autoCleanup) {
            this.startAutoCleanup();
        }
        this.logger.info('TokenStore initialized', {
            maxRecords: this.config.maxRecords,
            retentionDays: this.config.retentionDays,
            autoCleanup: this.config.autoCleanup,
        });
    }
    saveUsage(usage, sessionId) {
        this.usageRecords.push(usage);
        if (sessionId) {
            this.updateSession(sessionId, usage);
        }
        if (this.usageRecords.length > this.config.maxRecords) {
            const excess = this.usageRecords.length - this.config.maxRecords;
            this.usageRecords.splice(0, excess);
            this.logger.debug(`Removed ${excess} oldest records to enforce limit`);
        }
        this.logger.debug('Usage saved', {
            messageId: usage.messageId,
            sessionId,
            totalRecords: this.usageRecords.length,
        });
    }
    getRecentUsage(limit = 100, category) {
        let records = [...this.usageRecords];
        if (category) {
            records = records.filter((r) => r.category === category);
        }
        return records
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    getUsageInRange(startTime, endTime, category) {
        let records = this.usageRecords.filter((r) => r.timestamp >= startTime && r.timestamp <= endTime);
        if (category) {
            records = records.filter((r) => r.category === category);
        }
        return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getSessionData(sessionId) {
        return this.sessionMap.get(sessionId);
    }
    getAllSessions() {
        return Array.from(this.sessionMap.values());
    }
    endSession(sessionId) {
        const session = this.sessionMap.get(sessionId);
        if (session && !session.endTime) {
            session.endTime = new Date();
            this.logger.debug('Session ended', { sessionId });
        }
    }
    getTotalCount() {
        return this.usageRecords.length;
    }
    getSessionCount() {
        return this.sessionMap.size;
    }
    cleanup() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
        const initialCount = this.usageRecords.length;
        this.usageRecords = this.usageRecords.filter((r) => r.timestamp >= cutoffDate);
        for (const [sessionId, session] of this.sessionMap.entries()) {
            if (session.endTime && session.endTime < cutoffDate) {
                this.sessionMap.delete(sessionId);
            }
        }
        const removed = initialCount - this.usageRecords.length;
        if (removed > 0) {
            this.logger.info('Cleanup completed', {
                removed,
                remaining: this.usageRecords.length,
                cutoffDate: cutoffDate.toISOString(),
            });
        }
        return removed;
    }
    clear() {
        this.usageRecords = [];
        this.sessionMap.clear();
        this.logger.debug('Store cleared');
    }
    getStats() {
        const oldest = this.usageRecords.length > 0
            ? this.usageRecords.reduce((min, r) => r.timestamp < min ? r.timestamp : min, this.usageRecords[0].timestamp)
            : undefined;
        const newest = this.usageRecords.length > 0
            ? this.usageRecords.reduce((max, r) => r.timestamp > max ? r.timestamp : max, this.usageRecords[0].timestamp)
            : undefined;
        const estimatedBytes = this.usageRecords.length * 500;
        const memoryUsageEstimate = estimatedBytes > 1024 * 1024
            ? `${(estimatedBytes / 1024 / 1024).toFixed(2)} MB`
            : `${(estimatedBytes / 1024).toFixed(2)} KB`;
        return {
            totalRecords: this.usageRecords.length,
            totalSessions: this.sessionMap.size,
            oldestRecord: oldest,
            newestRecord: newest,
            memoryUsageEstimate,
        };
    }
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.clear();
        this.logger.info('TokenStore destroyed');
    }
    updateSession(sessionId, usage) {
        let session = this.sessionMap.get(sessionId);
        if (!session) {
            session = {
                sessionId,
                startTime: usage.timestamp,
                messageCount: 0,
                trackedMessageIds: new Set(),
                totalInputTokens: 0,
                totalOutputTokens: 0,
                totalCacheReadTokens: 0,
                totalCacheCreationTokens: 0,
                totalTokens: 0,
                totalBaselineTokens: 0,
                totalTokensSaved: 0,
                sessionEfficiency: 0,
                totalCostUSD: 0,
                totalCostSavingsUSD: 0,
                usageRecords: [],
            };
            this.sessionMap.set(sessionId, session);
        }
        if (!session.trackedMessageIds.has(usage.messageId)) {
            session.trackedMessageIds.add(usage.messageId);
            session.messageCount++;
            session.usageRecords.push(usage);
            session.totalInputTokens += usage.inputTokens;
            session.totalOutputTokens += usage.outputTokens;
            session.totalCacheReadTokens += usage.cacheReadTokens;
            session.totalCacheCreationTokens += usage.cacheCreationTokens;
            session.totalTokens += usage.totalTokens;
            session.totalBaselineTokens += usage.baselineTokens;
            session.totalTokensSaved += usage.tokensSaved;
            session.totalCostUSD += usage.costUSD;
            session.totalCostSavingsUSD += usage.costSavingsUSD;
            session.sessionEfficiency =
                session.totalBaselineTokens > 0
                    ? (session.totalTokensSaved / session.totalBaselineTokens) * 100
                    : 0;
        }
    }
    startAutoCleanup() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupIntervalMs);
        this.cleanupTimer.unref();
        this.logger.debug('Auto-cleanup started', {
            intervalMs: this.config.cleanupIntervalMs,
        });
    }
}
