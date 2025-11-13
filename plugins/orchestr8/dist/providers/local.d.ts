import { Logger } from "../utils/logger.js";
import { ResourceProvider, RemoteResource, RemoteResourceIndex, SearchResponse, SearchOptions, ProviderHealth, ProviderStats } from "./types.js";
export interface LocalProviderConfig {
    resourcesPath?: string;
    cacheSize?: number;
    cacheTTL?: number;
    indexCacheTTL?: number;
    enableCache?: boolean;
}
export declare class LocalProvider implements ResourceProvider {
    readonly name = "local";
    enabled: boolean;
    readonly priority = 0;
    private resourcesPath;
    private config;
    private logger;
    private fuzzyMatcher;
    private resourceCache;
    private indexCache;
    private resourceIndex;
    private indexLoadPromise;
    private metrics;
    constructor(config: LocalProviderConfig, logger: Logger);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    fetchIndex(): Promise<RemoteResourceIndex>;
    fetchResource(id: string, category: string): Promise<RemoteResource>;
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    healthCheck(): Promise<ProviderHealth>;
    getStats(): ProviderStats;
    resetStats(): void;
    private loadResourceIndex;
    private loadResourceIndexImpl;
    private scanFragmentsDirectory;
    private parseResourceFragment;
    private fragmentToMetadata;
    private categoryToDirectory;
    private generateMatchReason;
    private sortResults;
    private calculateFacets;
    private trackResponseTime;
    private trackError;
    private calculateAvgResponseTime;
}
