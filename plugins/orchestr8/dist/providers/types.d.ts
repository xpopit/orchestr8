import { ResourceFragment } from "../utils/fuzzyMatcher.js";
export interface ProviderConfig {
    name: string;
    enabled?: boolean;
    priority?: number;
    baseUrl?: string;
    apiKey?: string;
    timeout?: number;
    maxRetries?: number;
    enableCache?: boolean;
    cacheTTL?: number;
    rateLimit?: number;
    headers?: Record<string, string>;
    custom?: Record<string, any>;
}
export interface RemoteResourceMetadata {
    id: string;
    category: "agent" | "skill" | "example" | "pattern" | "workflow";
    title: string;
    description: string;
    tags: string[];
    capabilities: string[];
    useWhen: string[];
    estimatedTokens: number;
    version?: string;
    author?: string;
    createdAt?: Date;
    updatedAt?: Date;
    source: string;
    sourceUri: string;
}
export interface RemoteResource extends RemoteResourceMetadata {
    content: string;
    dependencies?: string[];
    related?: string[];
}
export interface RemoteResourceIndex {
    provider: string;
    totalCount: number;
    resources: RemoteResourceMetadata[];
    version: string;
    timestamp: Date;
    categories: Array<"agent" | "skill" | "example" | "pattern" | "workflow">;
    stats: {
        byCategory: Record<string, number>;
        totalTokens: number;
        topTags: Array<{
            tag: string;
            count: number;
        }>;
    };
}
export interface SearchOptions {
    query?: string;
    categories?: Array<"agent" | "skill" | "example" | "pattern" | "workflow">;
    requiredTags?: string[];
    optionalTags?: string[];
    maxResults?: number;
    minScore?: number;
    maxTokens?: number;
    sortBy?: "relevance" | "date" | "tokens" | "popularity";
    sortOrder?: "asc" | "desc";
    offset?: number;
    limit?: number;
}
export interface SearchResult {
    resource: ResourceFragment;
    score: number;
    matchReason?: string[];
    highlights?: string[];
}
export interface SearchResponse {
    results: SearchResult[];
    totalMatches: number;
    query: string;
    searchTime: number;
    facets?: {
        categories?: Record<string, number>;
        tags?: Record<string, number>;
    };
}
export interface ProviderHealth {
    provider: string;
    status: "healthy" | "degraded" | "unhealthy" | "unknown";
    lastCheck: Date;
    responseTime?: number;
    reachable: boolean;
    authenticated: boolean;
    error?: string;
    metrics?: {
        successRate?: number;
        avgResponseTime?: number;
        consecutiveFailures?: number;
        lastSuccess?: Date;
    };
}
export interface ProviderStats {
    provider: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    cachedRequests: number;
    resourcesFetched: number;
    tokensFetched: number;
    avgResponseTime: number;
    cacheHitRate: number;
    uptime: number;
    rateLimit?: {
        remaining: number;
        limit: number;
        resetAt: Date;
    };
    statsResetAt: Date;
}
export declare class ProviderError extends Error {
    provider: string;
    code?: string | undefined;
    statusCode?: number | undefined;
    cause?: Error | undefined;
    constructor(message: string, provider: string, code?: string | undefined, statusCode?: number | undefined, cause?: Error | undefined);
}
export declare class ProviderTimeoutError extends ProviderError {
    constructor(provider: string, timeout: number, cause?: Error);
}
export declare class ProviderUnavailableError extends ProviderError {
    constructor(provider: string, reason?: string, cause?: Error);
}
export declare class ResourceNotFoundError extends ProviderError {
    constructor(provider: string, resourceId: string, category?: string, cause?: Error);
    resourceId: string;
    category?: string;
}
export declare class ProviderAuthenticationError extends ProviderError {
    constructor(provider: string, reason?: string, cause?: Error);
}
export declare class RateLimitError extends ProviderError {
    constructor(provider: string, retryAfter?: number, cause?: Error);
    retryAfter?: number;
}
export interface ResourceProvider {
    readonly name: string;
    enabled: boolean;
    readonly priority: number;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    fetchIndex(): Promise<RemoteResourceIndex>;
    fetchResource(id: string, category: string): Promise<RemoteResource>;
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    healthCheck(): Promise<ProviderHealth>;
    getStats(): ProviderStats;
    resetStats(): void;
}
export interface ProviderEvent {
    type: "provider-registered" | "provider-unregistered" | "provider-enabled" | "provider-disabled" | "provider-error" | "provider-health-changed";
    provider: string;
    timestamp: Date;
    data?: any;
}
export interface RegistryConfig {
    enableHealthChecks?: boolean;
    healthCheckInterval?: number;
    autoDisableUnhealthy?: boolean;
    maxConsecutiveFailures?: number;
    enableEvents?: boolean;
}
export interface RegistryStats {
    totalProviders: number;
    enabledProviders: number;
    healthyProviders: number;
    aggregate: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        totalResourcesFetched: number;
        totalTokensFetched: number;
        avgResponseTime: number;
    };
}
