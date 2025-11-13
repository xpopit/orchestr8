export interface IndexEntry {
    scenario: string;
    keywords: string[];
    uri: string;
    category: string;
    estimatedTokens: number;
    relevance: number;
}
export interface ScoredEntry extends IndexEntry {
    score: number;
}
export interface UseWhenIndex {
    version: string;
    generated: string;
    totalFragments: number;
    index: Record<string, IndexEntry>;
    keywords: Record<string, string[]>;
    stats: {
        totalScenarios: number;
        avgScenariosPerFragment: number;
        avgKeywordsPerScenario: number;
        indexSizeBytes: number;
    };
}
export interface LookupOptions {
    query: string;
    maxResults?: number;
    minScore?: number;
    categories?: string[];
    mode?: string;
}
export declare class IndexLookup {
    private index;
    private quickLookupCache;
    private indexLoadPromise;
    private fuzzyMatcher;
    private resourcesPath;
    private cacheTTL;
    constructor(resourcesPath?: string);
    lookup(query: string, options: LookupOptions): Promise<string>;
    loadIndexes(): Promise<void>;
    private _loadIndexesImpl;
    private findMatchingScenarios;
    private scoreByRelevance;
    private formatCompactResult;
    private fuzzyFallback;
    private extractKeywords;
    private normalizeQuery;
    private capitalize;
    private logMetrics;
    getCacheStats(): {
        size: number;
        hits: number;
        indexLoaded: boolean;
    };
    clearCache(): void;
}
