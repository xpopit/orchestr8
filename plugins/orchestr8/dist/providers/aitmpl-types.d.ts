export interface AitmplComponent {
    name: string;
    path: string;
    category: string;
    type: "agent" | "command" | "skill" | "mcp" | "hook" | "setting" | "template";
    content: string;
    description?: string;
    downloads: number;
    security?: AitmplSecurityValidation;
}
export interface AitmplSecurityValidation {
    validated: boolean;
    valid: boolean;
    score: number;
    errorCount: number;
    warningCount: number;
    lastValidated: string;
    validators?: {
        structural?: ValidationResult;
        integrity?: ValidationResult;
        semantic?: ValidationResult;
        reference?: ValidationResult;
        provenance?: ValidationResult;
    };
    hash?: string;
}
export interface ValidationResult {
    status: "pass" | "warning" | "error";
    errors?: string[];
    warnings?: string[];
    details?: Record<string, any>;
}
export interface AitmplFrontmatter {
    name?: string;
    description?: string;
    tags?: string[];
    author?: string;
    version?: string;
    license?: string;
    created?: string;
    updated?: string;
    capabilities?: string[];
    useWhen?: string[];
    estimatedTokens?: number;
    dependencies?: string[];
    related?: string[];
    [key: string]: any;
}
export declare const CATEGORY_MAPPING: Record<AitmplComponent["type"], "agent" | "skill" | "example" | "pattern" | "workflow">;
export interface AitmplApiResponse {
    components?: AitmplComponent[];
    metadata?: {
        total: number;
        timestamp: string;
        version?: string;
    };
    error?: {
        code: string;
        message: string;
    };
}
export interface AitmplCacheEntry<T> {
    data: T;
    cachedAt: Date;
    ttl: number;
    etag?: string;
}
export interface RateLimitBucket {
    tokens: number;
    capacity: number;
    lastRefill: Date;
    refillRate: number;
}
export interface AitmplRequestOptions {
    timeout?: number;
    retries?: number;
    useCache?: boolean;
    headers?: Record<string, string>;
    etag?: string;
}
export interface AitmplProviderMetrics {
    apiRequests: number;
    apiSuccesses: number;
    apiFailures: number;
    cacheHits: number;
    cacheMisses: number;
    bytesDownloaded: number;
    avgResponseTime: number;
    rateLimitHits: number;
    lastError?: {
        message: string;
        timestamp: Date;
        code?: string;
    };
}
export declare const AITMPL_DATA_SOURCES: {
    readonly COMPONENTS_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/components.json";
    readonly METADATA_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/components-metadata.json";
    readonly TRENDING_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/trending-data.json";
    readonly GITHUB_REPO: "https://github.com/davila7/claude-code-templates";
    readonly GITHUB_API: "https://api.github.com/repos/davila7/claude-code-templates";
};
export declare const AITMPL_DEFAULTS: {
    readonly CACHE_TTL: number;
    readonly RESOURCE_CACHE_TTL: number;
    readonly TIMEOUT: 30000;
    readonly MAX_RETRIES: 3;
    readonly RATE_LIMIT_PER_MINUTE: 60;
    readonly RATE_LIMIT_PER_HOUR: 1000;
    readonly USER_AGENT: "orchestr8-mcp/8.0.0";
    readonly MAX_CACHE_SIZE: 500;
    readonly MIN_ESTIMATED_TOKENS: 100;
    readonly BACKOFF_BASE: 1000;
    readonly MAX_BACKOFF: 60000;
};
