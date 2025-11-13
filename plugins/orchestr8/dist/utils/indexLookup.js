import { promises as fs } from "fs";
import { join } from "path";
import { Logger } from "./logger.js";
import { FuzzyMatcher } from "./fuzzyMatcher.js";
const logger = new Logger("IndexLookup");
export class IndexLookup {
    index = null;
    quickLookupCache = new Map();
    indexLoadPromise = null;
    fuzzyMatcher;
    resourcesPath;
    cacheTTL = 1000 * 60 * 15;
    constructor(resourcesPath) {
        this.resourcesPath =
            resourcesPath || process.env.RESOURCES_PATH || join(process.cwd(), "resources");
        this.fuzzyMatcher = new FuzzyMatcher();
    }
    async lookup(query, options) {
        const startTime = Date.now();
        let tier = "index";
        try {
            if (!this.index) {
                await this.loadIndexes();
            }
            const normalized = this.normalizeQuery(query);
            const cached = this.quickLookupCache.get(normalized);
            if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                tier = "quick";
                const latencyMs = Date.now() - startTime;
                logger.debug("Quick lookup cache hit", { query, latencyMs });
                this.logMetrics({
                    query,
                    timestamp: Date.now(),
                    tier,
                    latencyMs,
                    resultsCount: 0,
                    tokenCost: Math.ceil(cached.content.length / 4),
                });
                return cached.content;
            }
            const keywords = this.extractKeywords(query);
            logger.debug("Extracted keywords", { keywords });
            const matches = this.findMatchingScenarios(keywords, options.categories);
            logger.debug(`Found ${matches.length} matching scenarios`);
            const minResults = 2;
            if (matches.length >= minResults) {
                const result = this.formatCompactResult(matches, options);
                this.quickLookupCache.set(normalized, {
                    content: result,
                    timestamp: Date.now(),
                });
                const latencyMs = Date.now() - startTime;
                this.logMetrics({
                    query,
                    timestamp: Date.now(),
                    tier,
                    latencyMs,
                    resultsCount: Math.min(matches.length, options.maxResults || 5),
                    tokenCost: Math.ceil(result.length / 4),
                });
                logger.info("Index lookup success", {
                    matches: matches.length,
                    latencyMs
                });
                return result;
            }
            tier = "fuzzy-fallback";
            logger.info("Index lookup fallback to fuzzy", {
                query,
                matchCount: matches.length,
                reason: "insufficient matches",
            });
            return await this.fuzzyFallback(query, options, startTime);
        }
        catch (error) {
            logger.error("Index lookup error", error);
            tier = "fuzzy-fallback";
            return await this.fuzzyFallback(query, options, startTime);
        }
    }
    async loadIndexes() {
        if (this.indexLoadPromise) {
            return this.indexLoadPromise;
        }
        this.indexLoadPromise = this._loadIndexesImpl();
        await this.indexLoadPromise;
        this.indexLoadPromise = null;
    }
    async _loadIndexesImpl() {
        const indexPath = join(this.resourcesPath, ".index", "usewhen-index.json");
        const keywordIndexPath = join(this.resourcesPath, ".index", "keyword-index.json");
        logger.info("Loading useWhen indexes", { indexPath, keywordIndexPath });
        try {
            const indexContent = await fs.readFile(indexPath, "utf-8");
            const parsedIndex = JSON.parse(indexContent);
            if (!parsedIndex || typeof parsedIndex !== 'object') {
                throw new Error("Invalid index format: not an object");
            }
            if (!parsedIndex.index || typeof parsedIndex.index !== 'object') {
                throw new Error("Invalid index format: missing 'index' property");
            }
            if (!parsedIndex.stats || typeof parsedIndex.stats !== 'object') {
                throw new Error("Invalid index format: missing 'stats' property");
            }
            const keywordContent = await fs.readFile(keywordIndexPath, "utf-8");
            const parsedKeywords = JSON.parse(keywordContent);
            if (!parsedKeywords || typeof parsedKeywords !== 'object') {
                throw new Error("Invalid keyword index format: not an object");
            }
            if (!parsedKeywords.keywords || typeof parsedKeywords.keywords !== 'object') {
                throw new Error("Invalid keyword index format: missing 'keywords' property");
            }
            this.index = {
                version: parsedIndex.version,
                generated: parsedIndex.generated,
                totalFragments: parsedIndex.totalFragments,
                index: parsedIndex.index,
                keywords: parsedKeywords.keywords,
                stats: parsedIndex.stats
            };
            logger.info("Indexes loaded successfully", {
                totalScenarios: this.index.stats.totalScenarios,
                totalKeywords: Object.keys(this.index.keywords).length,
                totalFragments: this.index.totalFragments,
            });
        }
        catch (error) {
            logger.error("Failed to load indexes", error);
            throw new Error(`Failed to load useWhen indexes: ${error}`);
        }
    }
    findMatchingScenarios(keywords, categoryFilter) {
        if (!this.index) {
            throw new Error("Index not loaded");
        }
        const candidateHashes = new Set();
        for (const keyword of keywords) {
            const hashes = this.index.keywords[keyword] || [];
            hashes.forEach((h) => candidateHashes.add(h));
        }
        logger.debug(`Found ${candidateHashes.size} candidate scenarios`);
        const candidates = Array.from(candidateHashes)
            .map((hash) => this.index.index[hash])
            .filter((entry) => entry !== undefined);
        const filtered = categoryFilter && categoryFilter.length > 0
            ? candidates.filter((c) => categoryFilter.includes(c.category))
            : candidates;
        logger.debug(`Filtered to ${filtered.length} scenarios by category`);
        const scored = this.scoreByRelevance(filtered, keywords);
        return scored;
    }
    scoreByRelevance(scenarios, queryKeywords) {
        return scenarios
            .map((scenario) => {
            let score = 0;
            const scenarioKeywords = new Set(scenario.keywords);
            for (const keyword of queryKeywords) {
                if (scenarioKeywords.has(keyword)) {
                    score += 20;
                }
            }
            for (const keyword of queryKeywords) {
                for (const scenarioKeyword of scenarioKeywords) {
                    if (scenarioKeyword.includes(keyword) ||
                        keyword.includes(scenarioKeyword)) {
                        score += 10;
                        break;
                    }
                }
            }
            return { ...scenario, score };
        })
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score);
    }
    formatCompactResult(matches, options) {
        const maxResults = options.maxResults || 5;
        const topMatches = matches.slice(0, maxResults);
        const totalTokens = topMatches.reduce((sum, m) => sum + m.estimatedTokens, 0);
        let output = `# Resource Matches: ${options.query}\n\n`;
        output += `**Found ${topMatches.length} relevant resources (${totalTokens} tokens total)**\n\n`;
        output += `## Top Matches\n\n`;
        topMatches.forEach((match, idx) => {
            const categoryLabel = this.capitalize(match.category);
            const resourceName = match.uri.split("/").pop() || "unknown";
            output += `${idx + 1}. **${categoryLabel}: ${resourceName}** (~${match.estimatedTokens} tokens)\n`;
            output += `   @${match.uri}\n\n`;
        });
        output += `**To load:** Simply reference the @orchestr8:// URIs shown above\n`;
        output += `**To refine:** Add more specific keywords to query\n`;
        return output;
    }
    async fuzzyFallback(query, options, startTime) {
        logger.info("Using fuzzy matcher fallback");
        const matchRequest = {
            query,
            mode: "catalog",
            maxResults: options.maxResults || 15,
            categories: options.categories,
            minScore: options.minScore,
        };
        const result = await this.fuzzyMatcher.match(matchRequest);
        const latencyMs = Date.now() - startTime;
        this.logMetrics({
            query,
            timestamp: Date.now(),
            tier: "fuzzy-fallback",
            latencyMs,
            resultsCount: result.fragments.length,
            tokenCost: Math.ceil(result.assembledContent.length / 4),
        });
        return result.assembledContent;
    }
    extractKeywords(query) {
        const normalized = query.toLowerCase().replace(/[^\w\s-]/g, " ");
        const stopWords = new Set([
            "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
            "been", "being", "have", "has", "had", "do", "does", "did", "will",
            "would", "should", "could", "may", "might", "can", "i", "you", "he",
            "she", "it", "we", "they", "this", "that", "these", "those",
        ]);
        const words = normalized
            .split(/\s+/)
            .filter((word) => word.length > 1 && !stopWords.has(word));
        return Array.from(new Set(words));
    }
    normalizeQuery(query) {
        return query.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    }
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    logMetrics(metrics) {
        logger.info("IndexLookup query metrics", metrics);
    }
    getCacheStats() {
        return {
            size: this.quickLookupCache.size,
            hits: 0,
            indexLoaded: this.index !== null,
        };
    }
    clearCache() {
        this.quickLookupCache.clear();
        logger.info("Index lookup cache cleared");
    }
}
