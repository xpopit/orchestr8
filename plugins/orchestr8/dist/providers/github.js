import { LRUCache } from "lru-cache";
import matter from "gray-matter";
import { ProviderError, ProviderTimeoutError, ResourceNotFoundError, ProviderAuthenticationError, RateLimitError, } from "./types.js";
import { KNOWN_DIRECTORY_STRUCTURES, } from "./github-types.js";
const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";
const DEFAULT_CACHE_TTL = {
    index: 24 * 60 * 60 * 1000,
    resource: 7 * 24 * 60 * 60 * 1000,
    tree: 60 * 60 * 1000,
};
export class GitHubProvider {
    name = "github";
    enabled = true;
    priority = 15;
    config;
    logger;
    indexCache;
    resourceCache;
    treeCache;
    rateLimit = null;
    rateLimitCheckedAt = null;
    stats;
    requestTimes = [];
    cacheStats;
    repositories = new Map();
    initialized = false;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.enabled = config.enabled;
        const cacheTTL = config.cacheTTL || DEFAULT_CACHE_TTL.index;
        this.indexCache = new LRUCache({
            max: 100,
            ttl: cacheTTL,
        });
        this.resourceCache = new LRUCache({
            max: 1000,
            ttl: config.cacheTTL || DEFAULT_CACHE_TTL.resource,
        });
        this.treeCache = new LRUCache({
            max: 50,
            ttl: DEFAULT_CACHE_TTL.tree,
        });
        this.stats = {
            provider: this.name,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            resourcesFetched: 0,
            tokensFetched: 0,
            avgResponseTime: 0,
            cacheHitRate: 0,
            uptime: 1.0,
            statsResetAt: new Date(),
        };
        this.cacheStats = {
            totalEntries: 0,
            hits: 0,
            misses: 0,
            evictions: 0,
            hitRate: 0,
            estimatedSize: 0,
        };
    }
    async initialize() {
        this.logger.info("Initializing GitHubProvider");
        if (!this.config.repos || this.config.repos.length === 0) {
            this.logger.warn("No repositories configured for GitHub provider");
            this.enabled = false;
            return;
        }
        for (const repo of this.config.repos) {
            if (!this.isValidRepoFormat(repo)) {
                throw new ProviderError(`Invalid repository format: ${repo}. Expected format: owner/repo`, this.name, "INVALID_CONFIG");
            }
        }
        if (this.config.auth?.token) {
            try {
                await this.checkAuthentication();
                this.logger.info("GitHub authentication verified");
            }
            catch (error) {
                this.logger.error("GitHub authentication failed", error);
                throw error;
            }
        }
        try {
            await this.updateRateLimit();
            this.logger.info("GitHub rate limit checked", {
                remaining: this.rateLimit?.remaining,
                limit: this.rateLimit?.limit,
            });
        }
        catch (error) {
            this.logger.warn("Could not check rate limit", error);
        }
        this.initialized = true;
        this.logger.info(`GitHubProvider initialized with ${this.config.repos.length} repositories`);
    }
    async shutdown() {
        this.logger.info("Shutting down GitHubProvider");
        this.indexCache.clear();
        this.resourceCache.clear();
        this.treeCache.clear();
        this.repositories.clear();
        this.initialized = false;
        this.logger.info("GitHubProvider shut down");
    }
    async fetchIndex() {
        this.logger.info("Fetching GitHub resource index");
        const startTime = Date.now();
        try {
            const scanPromises = this.config.repos.map((repo) => this.scanRepository(repo));
            const scanResults = await Promise.allSettled(scanPromises);
            const successfulScans = [];
            const failedScans = [];
            scanResults.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    successfulScans.push(result.value);
                    if (!result.value.success) {
                        failedScans.push({
                            repo: this.config.repos[index],
                            error: result.value.error || "Unknown error",
                        });
                    }
                }
                else {
                    failedScans.push({
                        repo: this.config.repos[index],
                        error: result.reason?.message || "Scan failed",
                    });
                }
            });
            if (failedScans.length > 0) {
                this.logger.warn("Some repositories failed to scan", { failedScans });
            }
            const allResources = [];
            const categories = new Set();
            const byCategory = {};
            let totalTokens = 0;
            const tagCounts = new Map();
            for (const [repoKey, repoIndex] of this.repositories.entries()) {
                for (const resource of repoIndex.resources) {
                    const metadata = {
                        id: resource.id,
                        category: resource.category,
                        title: resource.title || resource.id,
                        description: resource.description || "",
                        tags: resource.tags || [],
                        capabilities: resource.capabilities || [],
                        useWhen: resource.useWhen || [],
                        estimatedTokens: resource.estimatedTokens || Math.ceil(resource.size / 4),
                        source: `github:${resource.repo.owner}/${resource.repo.repo}`,
                        sourceUri: `https://github.com/${resource.repo.owner}/${resource.repo.repo}/blob/${resource.repo.branch}/${resource.path}`,
                    };
                    allResources.push(metadata);
                    categories.add(resource.category);
                    byCategory[resource.category] =
                        (byCategory[resource.category] || 0) + 1;
                    totalTokens += metadata.estimatedTokens;
                    for (const tag of metadata.tags) {
                        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                    }
                }
            }
            const topTags = Array.from(tagCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([tag, count]) => ({ tag, count }));
            const duration = Date.now() - startTime;
            this.recordRequest(duration, true);
            const index = {
                provider: this.name,
                totalCount: allResources.length,
                resources: allResources,
                version: new Date().toISOString(),
                timestamp: new Date(),
                categories: Array.from(categories),
                stats: {
                    byCategory,
                    totalTokens,
                    topTags,
                },
            };
            this.logger.info("GitHub index fetched", {
                totalResources: allResources.length,
                repositories: this.repositories.size,
                duration,
            });
            return index;
        }
        catch (error) {
            this.recordRequest(Date.now() - startTime, false);
            this.logger.error("Failed to fetch GitHub index", error);
            throw this.wrapError(error, "Failed to fetch GitHub index");
        }
    }
    async fetchResource(id, category) {
        this.logger.info("Fetching GitHub resource", { id, category });
        const startTime = Date.now();
        try {
            const cacheKey = `${id}:${category}`;
            const cached = this.resourceCache.get(cacheKey);
            if (cached) {
                this.logger.debug("Resource cache hit", { id });
                this.stats.cachedRequests++;
                this.cacheStats.hits++;
                this.updateCacheHitRate();
                return this.buildRemoteResource(id, category, cached);
            }
            this.cacheStats.misses++;
            this.updateCacheHitRate();
            const parts = id.split("/");
            if (parts.length < 3) {
                throw new ResourceNotFoundError(this.name, id, category, new Error("Invalid resource ID format"));
            }
            const owner = parts[0];
            const repo = parts[1];
            const path = parts.slice(2).join("/");
            const branch = this.config.branch || "main";
            const url = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${path}`;
            const response = await this.fetchWithRetry(url, {
                timeout: this.config.timeout,
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new ResourceNotFoundError(this.name, id, category);
                }
                throw new ProviderError(`Failed to fetch resource: ${response.statusText}`, this.name, "FETCH_FAILED", response.status);
            }
            const content = await response.text();
            const parsed = matter(content);
            const frontmatter = parsed.data;
            const body = parsed.content;
            const cachedResource = {
                content: body,
                frontmatter,
                sha: "",
                cachedAt: new Date(),
                etag: response.headers.get("etag") || undefined,
            };
            this.resourceCache.set(cacheKey, cachedResource);
            const duration = Date.now() - startTime;
            this.recordRequest(duration, true);
            this.stats.resourcesFetched++;
            this.stats.tokensFetched += Math.ceil(body.length / 4);
            return this.buildRemoteResource(id, category, cachedResource);
        }
        catch (error) {
            this.recordRequest(Date.now() - startTime, false);
            this.logger.error("Failed to fetch GitHub resource", { id, error });
            throw this.wrapError(error, `Failed to fetch resource ${id}`);
        }
    }
    async search(query, options) {
        this.logger.info("Searching GitHub resources", { query, options });
        const startTime = Date.now();
        try {
            if (this.repositories.size === 0) {
                await this.fetchIndex();
            }
            const keywords = this.extractKeywords(query);
            this.logger.debug("Extracted keywords", { keywords });
            const allResources = [];
            for (const repoIndex of this.repositories.values()) {
                allResources.push(...repoIndex.resources);
            }
            let filtered = allResources;
            if (options?.categories && options.categories.length > 0) {
                filtered = filtered.filter((r) => options.categories.includes(r.category));
            }
            const scored = filtered
                .map((resource) => {
                const score = this.calculateScore(resource, keywords, options);
                return {
                    resource: {
                        id: resource.id,
                        category: resource.category,
                        tags: resource.tags || [],
                        capabilities: resource.capabilities || [],
                        useWhen: resource.useWhen || [],
                        estimatedTokens: resource.estimatedTokens || 0,
                        content: "",
                        source: this.name,
                    },
                    score,
                    matchReason: this.getMatchReasons(resource, keywords),
                };
            })
                .filter((result) => result.score >= (options?.minScore || 0));
            scored.sort((a, b) => b.score - a.score);
            const maxResults = options?.maxResults || scored.length;
            const limited = scored.slice(0, maxResults);
            const duration = Date.now() - startTime;
            this.recordRequest(duration, true);
            return {
                results: limited,
                totalMatches: scored.length,
                query,
                searchTime: duration,
            };
        }
        catch (error) {
            this.recordRequest(Date.now() - startTime, false);
            this.logger.error("Failed to search GitHub resources", error);
            throw this.wrapError(error, "Failed to search GitHub resources");
        }
    }
    async healthCheck() {
        this.logger.debug("Performing health check");
        const startTime = Date.now();
        try {
            await this.updateRateLimit();
            const responseTime = Date.now() - startTime;
            const remainingPercent = this.rateLimit
                ? this.rateLimit.remaining / this.rateLimit.limit
                : 1;
            let status;
            if (!this.initialized) {
                status = "unhealthy";
            }
            else if (remainingPercent < 0.1) {
                status = "degraded";
            }
            else if (this.stats.successfulRequests === 0 &&
                this.stats.totalRequests > 0) {
                status = "unhealthy";
            }
            else if (this.stats.failedRequests / Math.max(this.stats.totalRequests, 1) >
                0.5) {
                status = "degraded";
            }
            else {
                status = "healthy";
            }
            const successRate = this.stats.totalRequests > 0
                ? this.stats.successfulRequests / this.stats.totalRequests
                : 1;
            return {
                provider: this.name,
                status,
                lastCheck: new Date(),
                responseTime,
                reachable: true,
                authenticated: !!this.config.auth?.token,
                metrics: {
                    successRate,
                    avgResponseTime: this.stats.avgResponseTime,
                    consecutiveFailures: 0,
                    lastSuccess: new Date(),
                },
            };
        }
        catch (error) {
            this.logger.error("Health check failed", error);
            return {
                provider: this.name,
                status: "unhealthy",
                lastCheck: new Date(),
                reachable: false,
                authenticated: false,
                error: error.message,
            };
        }
    }
    getStats() {
        if (this.rateLimit) {
            this.stats.rateLimit = {
                remaining: this.rateLimit.remaining,
                limit: this.rateLimit.limit,
                resetAt: new Date(this.rateLimit.reset * 1000),
            };
        }
        return { ...this.stats };
    }
    resetStats() {
        this.stats = {
            provider: this.name,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            resourcesFetched: 0,
            tokensFetched: 0,
            avgResponseTime: 0,
            cacheHitRate: 0,
            uptime: 1.0,
            statsResetAt: new Date(),
        };
        this.requestTimes = [];
        this.cacheStats = {
            totalEntries: 0,
            hits: 0,
            misses: 0,
            evictions: 0,
            hitRate: 0,
            estimatedSize: 0,
        };
        this.logger.info("Statistics reset");
    }
    async scanRepository(repoString) {
        this.logger.info("Scanning repository", { repo: repoString });
        const startTime = Date.now();
        try {
            const repo = this.parseRepository(repoString);
            const repoKey = `${repo.owner}/${repo.repo}`;
            const cachedIndex = this.indexCache.get(repoKey);
            if (cachedIndex) {
                this.logger.debug("Repository index cache hit", { repo: repoKey });
                this.repositories.set(repoKey, cachedIndex);
                this.stats.cachedRequests++;
                return {
                    repo,
                    success: true,
                    resourceCount: cachedIndex.resources.length,
                    structureType: cachedIndex.structure.structureType,
                    duration: Date.now() - startTime,
                };
            }
            const tree = await this.fetchRepositoryTree(repo);
            const structure = this.detectStructure(repo, tree);
            const mdFiles = tree.tree.filter((entry) => entry.type === "blob" &&
                entry.path?.endsWith(".md") &&
                this.isResourceFile(entry.path, structure));
            this.logger.debug("Found markdown files", {
                repo: repoKey,
                count: mdFiles.length,
            });
            const resources = mdFiles.map((file) => {
                const category = this.inferCategory(file.path, structure);
                const id = `${repo.owner}/${repo.repo}/${file.path}`;
                return {
                    id,
                    category,
                    path: file.path,
                    repo,
                    sha: file.sha,
                    size: file.size || 0,
                    estimatedTokens: file.size ? Math.ceil(file.size / 4) : 0,
                };
            });
            const repoIndex = {
                repo,
                structure,
                resources,
                version: tree.sha,
                timestamp: new Date(),
            };
            this.indexCache.set(repoKey, repoIndex);
            this.repositories.set(repoKey, repoIndex);
            const duration = Date.now() - startTime;
            this.logger.info("Repository scanned successfully", {
                repo: repoKey,
                resources: resources.length,
                structure: structure.structureType,
                duration,
            });
            return {
                repo,
                success: true,
                resourceCount: resources.length,
                structureType: structure.structureType,
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error("Failed to scan repository", {
                repo: repoString,
                error,
            });
            const repo = this.parseRepository(repoString);
            return {
                repo,
                success: false,
                resourceCount: 0,
                structureType: "flat",
                error: error.message,
                duration,
            };
        }
    }
    async fetchRepositoryTree(repo) {
        const repoKey = `${repo.owner}/${repo.repo}`;
        const cached = this.treeCache.get(repoKey);
        if (cached) {
            this.logger.debug("Tree cache hit", { repo: repoKey });
            return cached;
        }
        const url = `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.repo}/git/trees/${repo.branch}?recursive=1`;
        const response = await this.fetchWithRetry(url, {
            headers: this.getHeaders(),
            timeout: this.config.timeout,
        });
        await this.checkRateLimit(response);
        if (!response.ok) {
            if (response.status === 404) {
                throw new ProviderError(`Repository not found: ${repoKey}`, this.name, "NOT_FOUND", 404);
            }
            throw new ProviderError(`Failed to fetch repository tree: ${response.statusText}`, this.name, "FETCH_FAILED", response.status);
        }
        const tree = (await response.json());
        this.treeCache.set(repoKey, tree);
        return tree;
    }
    detectStructure(repo, tree) {
        const directories = new Set();
        for (const entry of tree.tree) {
            if (entry.type === "tree") {
                const topLevel = entry.path.split("/")[0];
                directories.add(topLevel);
            }
        }
        const orchestr8Dirs = new Set(Object.keys(KNOWN_DIRECTORY_STRUCTURES.orchestr8));
        const templateDirs = new Set(Object.keys(KNOWN_DIRECTORY_STRUCTURES["claude-code-templates"]));
        const hasOrchstr8 = Array.from(orchestr8Dirs).some((dir) => directories.has(dir));
        const hasTemplate = Array.from(templateDirs).some((dir) => directories.has(dir));
        let structureType;
        let categoryMap;
        if (hasOrchstr8) {
            structureType = "orchestr8";
            categoryMap = KNOWN_DIRECTORY_STRUCTURES.orchestr8;
        }
        else if (hasTemplate) {
            structureType = "claude-code-templates";
            categoryMap = KNOWN_DIRECTORY_STRUCTURES["claude-code-templates"];
        }
        else {
            structureType = "flat";
            categoryMap = {};
        }
        const resourceDirs = [];
        for (const dir of directories) {
            const category = categoryMap[dir];
            if (category) {
                const fileCount = tree.tree.filter((e) => e.type === "blob" &&
                    e.path.startsWith(`${dir}/`) &&
                    e.path.endsWith(".md")).length;
                resourceDirs.push({
                    category,
                    path: dir,
                    fileCount,
                });
            }
        }
        return {
            repo,
            structureType,
            directories: resourceDirs,
            totalFiles: tree.tree.filter((e) => e.type === "blob" && e.path.endsWith(".md")).length,
            lastScanned: new Date(),
        };
    }
    isResourceFile(path, structure) {
        if (structure.structureType === "flat") {
            return true;
        }
        return structure.directories.some((dir) => path.startsWith(`${dir.path}/`));
    }
    inferCategory(path, structure) {
        for (const dir of structure.directories) {
            if (path.startsWith(`${dir.path}/`)) {
                return dir.category;
            }
        }
        return "pattern";
    }
    async fetchWithRetry(url, options = {}) {
        const maxRetries = options.retryCount ?? this.config.retryAttempts ?? 3;
        const timeout = options.timeout ?? this.config.timeout ?? 30000;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                const response = await fetch(url, {
                    method: options.method || "GET",
                    headers: options.headers || {},
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                return response;
            }
            catch (error) {
                lastError = error;
                if (error instanceof Error && error.name === "AbortError") {
                    this.logger.warn(`Request timeout (attempt ${attempt + 1}/${maxRetries + 1})`, { url });
                }
                else {
                    this.logger.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
                        url,
                        error: error.message,
                    });
                }
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw new ProviderTimeoutError(this.name, timeout, lastError);
    }
    getHeaders() {
        const headers = {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "orchestr8-mcp-server",
        };
        if (this.config.auth?.token) {
            headers["Authorization"] = `Bearer ${this.config.auth.token}`;
        }
        return headers;
    }
    async updateRateLimit() {
        const url = `${GITHUB_API_BASE}/rate_limit`;
        const response = await this.fetchWithRetry(url, {
            headers: this.getHeaders(),
            timeout: 10000,
        });
        if (!response.ok) {
            throw new ProviderError("Failed to check rate limit", this.name, "RATE_LIMIT_CHECK_FAILED", response.status);
        }
        const data = (await response.json());
        this.rateLimit = data.rate;
        this.rateLimitCheckedAt = new Date();
        this.logger.debug("Rate limit updated", {
            remaining: this.rateLimit.remaining,
            limit: this.rateLimit.limit,
            reset: new Date(this.rateLimit.reset * 1000),
        });
    }
    async checkRateLimit(response) {
        const remaining = response.headers.get("x-ratelimit-remaining");
        const limit = response.headers.get("x-ratelimit-limit");
        const reset = response.headers.get("x-ratelimit-reset");
        if (remaining && limit && reset) {
            this.rateLimit = {
                remaining: parseInt(remaining, 10),
                limit: parseInt(limit, 10),
                reset: parseInt(reset, 10),
                used: parseInt(limit, 10) - parseInt(remaining, 10),
            };
            this.rateLimitCheckedAt = new Date();
            if (this.rateLimit.remaining < 10) {
                this.logger.warn("GitHub rate limit low", {
                    remaining: this.rateLimit.remaining,
                    resetAt: new Date(this.rateLimit.reset * 1000),
                });
            }
            if (this.rateLimit.remaining === 0) {
                const retryAfter = this.rateLimit.reset * 1000 - Date.now();
                throw new RateLimitError(this.name, retryAfter);
            }
        }
    }
    async checkAuthentication() {
        if (!this.config.auth?.token) {
            return;
        }
        const url = `${GITHUB_API_BASE}/user`;
        const response = await this.fetchWithRetry(url, {
            headers: this.getHeaders(),
            timeout: 10000,
        });
        if (response.status === 401) {
            throw new ProviderAuthenticationError(this.name, "Invalid token");
        }
        if (!response.ok) {
            throw new ProviderAuthenticationError(this.name, `Authentication check failed: ${response.statusText}`);
        }
        const user = (await response.json());
        this.logger.info("Authenticated as GitHub user", { login: user.login });
    }
    extractKeywords(query) {
        const normalized = query.toLowerCase().replace(/[^\w\s-]/g, " ");
        const stopWords = new Set([
            "a",
            "an",
            "the",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "from",
            "as",
            "is",
            "was",
            "are",
            "were",
            "be",
        ]);
        const words = normalized
            .split(/\s+/)
            .filter((word) => word.length > 1 && !stopWords.has(word));
        return Array.from(new Set(words));
    }
    calculateScore(resource, keywords, options) {
        let score = 0;
        if (options?.requiredTags && options.requiredTags.length > 0) {
            const hasAll = options.requiredTags.every((tag) => resource.tags?.includes(tag));
            if (!hasAll)
                return 0;
        }
        if (options?.categories?.includes(resource.category)) {
            score += 15;
        }
        const tags = (resource.tags || []).map((t) => t.toLowerCase());
        const capabilities = (resource.capabilities || []).map((c) => c.toLowerCase());
        const useWhen = (resource.useWhen || []).map((u) => u.toLowerCase());
        for (const keyword of keywords) {
            if (tags.some((tag) => tag.includes(keyword))) {
                score += 10;
            }
            if (capabilities.some((cap) => cap.includes(keyword))) {
                score += 8;
            }
            if (useWhen.some((use) => use.includes(keyword))) {
                score += 5;
            }
        }
        if ((resource.estimatedTokens || 0) < 1000) {
            score += 5;
        }
        return score;
    }
    getMatchReasons(resource, keywords) {
        const reasons = [];
        const tags = (resource.tags || []).map((t) => t.toLowerCase());
        const capabilities = (resource.capabilities || []).map((c) => c.toLowerCase());
        for (const keyword of keywords) {
            if (tags.some((tag) => tag.includes(keyword))) {
                reasons.push(`Tag match: ${keyword}`);
            }
            if (capabilities.some((cap) => cap.includes(keyword))) {
                reasons.push(`Capability match: ${keyword}`);
            }
        }
        return reasons;
    }
    isValidRepoFormat(repo) {
        return /^[\w-]+\/[\w.-]+$/.test(repo);
    }
    parseRepository(repoString) {
        const [owner, repo] = repoString.split("/");
        return {
            owner,
            repo,
            branch: this.config.branch || "main",
        };
    }
    buildRemoteResource(id, category, cached) {
        const parts = id.split("/");
        const owner = parts[0];
        const repo = parts[1];
        const path = parts.slice(2).join("/");
        return {
            id,
            category: category,
            title: cached.frontmatter.title || id,
            description: cached.frontmatter.description || "",
            tags: cached.frontmatter.tags || [],
            capabilities: cached.frontmatter.capabilities || [],
            useWhen: cached.frontmatter.useWhen || [],
            estimatedTokens: cached.frontmatter.estimatedTokens ||
                Math.ceil(cached.content.length / 4),
            source: `github:${owner}/${repo}`,
            sourceUri: `https://github.com/${owner}/${repo}/blob/${this.config.branch || "main"}/${path}`,
            content: cached.content,
            dependencies: cached.frontmatter.dependencies,
            related: cached.frontmatter.related,
        };
    }
    recordRequest(duration, success) {
        this.stats.totalRequests++;
        if (success) {
            this.stats.successfulRequests++;
        }
        else {
            this.stats.failedRequests++;
        }
        this.requestTimes.push(duration);
        if (this.requestTimes.length > 100) {
            this.requestTimes.shift();
        }
        this.stats.avgResponseTime =
            this.requestTimes.reduce((sum, t) => sum + t, 0) /
                this.requestTimes.length;
    }
    updateCacheHitRate() {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        this.cacheStats.hitRate = total > 0 ? this.cacheStats.hits / total : 0;
        this.stats.cacheHitRate = this.cacheStats.hitRate;
    }
    wrapError(error, message) {
        if (error instanceof ProviderError) {
            return error;
        }
        return new ProviderError(message, this.name, "UNKNOWN_ERROR", undefined, error);
    }
}
