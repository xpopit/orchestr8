import { StatsCollector } from "../stats/collector.js";
import type { TokenTracker } from "../token/tracker.js";
import type { TokenStore } from "../token/store.js";
import type { TokenMetrics } from "../token/metrics.js";
import type { EfficiencyEngine } from "../token/efficiency.js";
export interface HTTPTransportConfig {
    port: number;
    staticPath: string;
    enableCORS?: boolean;
}
export interface MCPServerInterface {
    handleRequest(method: string, params: any): Promise<any>;
    getAvailableAgents(): Promise<any[]>;
    getAvailableSkills(): Promise<any[]>;
    getAvailableWorkflows(): Promise<any[]>;
    getAvailablePatterns(): Promise<any[]>;
    searchResources(query: string): Promise<any[]>;
    getResourceContent(uri: string): Promise<string>;
    getProviders(): Promise<any[]>;
    getProviderIndex(name: string): Promise<any>;
    searchAllProviders(query: string, options?: any): Promise<any[]>;
    getProviderHealth(name: string): Promise<any>;
    getAllProvidersHealth(): Promise<Record<string, any>>;
    getProviderStats(name: string): any;
    enableProvider(name: string): Promise<void>;
    disableProvider(name: string): Promise<void>;
    tokenSystem?: {
        tracker: TokenTracker;
        store: TokenStore;
        metrics: TokenMetrics;
        efficiency: EfficiencyEngine;
    };
}
export declare class HTTPTransport {
    private app;
    private httpServer;
    private wsServer;
    private wsClients;
    private config;
    private mcpServer;
    private stats;
    private statsInterval;
    constructor(config: HTTPTransportConfig, mcpServer: MCPServerInterface, stats: StatsCollector);
    private setupMiddleware;
    private setupRoutes;
    private setupWebSocket;
    private broadcastStats;
    private broadcastActivity;
    start(): Promise<void>;
    stop(): Promise<void>;
}
