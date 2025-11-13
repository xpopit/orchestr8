import { TokenUsage, TokenSession } from './types.js';
export interface StoreConfig {
    maxRecords: number;
    retentionDays: number;
    autoCleanup: boolean;
    cleanupIntervalMs: number;
}
export declare class TokenStore {
    private logger;
    private config;
    private usageRecords;
    private sessionMap;
    private cleanupTimer?;
    constructor(config?: Partial<StoreConfig>);
    saveUsage(usage: TokenUsage, sessionId?: string): void;
    getRecentUsage(limit?: number, category?: string): TokenUsage[];
    getUsageInRange(startTime: Date, endTime: Date, category?: string): TokenUsage[];
    getSessionData(sessionId: string): TokenSession | undefined;
    getAllSessions(): TokenSession[];
    endSession(sessionId: string): void;
    getTotalCount(): number;
    getSessionCount(): number;
    cleanup(): number;
    clear(): void;
    getStats(): {
        totalRecords: number;
        totalSessions: number;
        oldestRecord?: Date;
        newestRecord?: Date;
        memoryUsageEstimate: string;
    };
    destroy(): void;
    private updateSession;
    private startAutoCleanup;
}
