export interface GitHubTreeEntry {
    path: string;
    mode: string;
    type: "blob" | "tree" | "commit";
    sha: string;
    size?: number;
    url: string;
}
export interface GitHubTreeResponse {
    sha: string;
    url: string;
    tree: GitHubTreeEntry[];
    truncated: boolean;
}
export interface GitHubContentResponse {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string | null;
    type: "file" | "dir" | "symlink" | "submodule";
    content?: string;
    encoding?: "base64";
    _links: {
        self: string;
        git: string;
        html: string;
    };
}
export interface GitHubRateLimitResponse {
    resources: {
        core: GitHubRateLimit;
        search: GitHubRateLimit;
        graphql: GitHubRateLimit;
    };
    rate: GitHubRateLimit;
}
export interface GitHubRateLimit {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
    resource?: string;
}
export interface RepositoryIdentifier {
    owner: string;
    repo: string;
    branch: string;
}
export interface RepositoryStructure {
    repo: RepositoryIdentifier;
    structureType: "orchestr8" | "claude-code-templates" | "flat" | "custom";
    directories: {
        category: "agent" | "skill" | "example" | "pattern" | "workflow";
        path: string;
        fileCount: number;
    }[];
    totalFiles: number;
    lastScanned: Date;
}
export interface RepositoryIndex {
    repo: RepositoryIdentifier;
    structure: RepositoryStructure;
    resources: GitHubResourceMetadata[];
    version: string;
    timestamp: Date;
    etag?: string;
}
export interface GitHubResourceMetadata {
    id: string;
    category: "agent" | "skill" | "example" | "pattern" | "workflow";
    path: string;
    repo: RepositoryIdentifier;
    sha: string;
    size: number;
    tags?: string[];
    capabilities?: string[];
    useWhen?: string[];
    estimatedTokens?: number;
    title?: string;
    description?: string;
}
export interface CachedResource {
    content: string;
    frontmatter: Record<string, any>;
    sha: string;
    cachedAt: Date;
    etag?: string;
}
export interface CacheStats {
    totalEntries: number;
    hits: number;
    misses: number;
    evictions: number;
    hitRate: number;
    estimatedSize: number;
}
export interface GitHubErrorResponse {
    message: string;
    documentation_url?: string;
    errors?: Array<{
        resource: string;
        field: string;
        code: string;
    }>;
}
export interface RepositoryScanResult {
    repo: RepositoryIdentifier;
    success: boolean;
    resourceCount: number;
    structureType: RepositoryStructure["structureType"];
    error?: string;
    duration: number;
}
export declare const KNOWN_DIRECTORY_STRUCTURES: {
    readonly orchestr8: {
        readonly agents: "agent";
        readonly skills: "skill";
        readonly workflows: "workflow";
        readonly patterns: "pattern";
        readonly examples: "example";
        readonly guides: "pattern";
        readonly "best-practices": "pattern";
    };
    readonly "claude-code-templates": {
        readonly agents: "agent";
        readonly skills: "skill";
        readonly commands: "skill";
        readonly settings: "pattern";
        readonly hooks: "pattern";
        readonly mcps: "example";
        readonly plugins: "example";
    };
};
export type ResourceCategory = "agent" | "skill" | "example" | "pattern" | "workflow";
export interface GitHubFetchOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    timeout?: number;
    retryCount?: number;
    etag?: string;
}
