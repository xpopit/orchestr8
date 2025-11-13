export interface UseWhenIndexEntry {
    scenario: string;
    keywords: string[];
    uri: string;
    category: "agent" | "skill" | "example" | "pattern" | "workflow";
    estimatedTokens: number;
    relevance: number;
}
export interface UseWhenIndex {
    version: string;
    generated: string;
    totalFragments: number;
    index: Record<string, UseWhenIndexEntry>;
    stats: {
        totalScenarios: number;
        avgScenariosPerFragment: number;
        avgKeywordsPerScenario: number;
        indexSizeBytes: number;
    };
}
export interface KeywordIndex {
    version: string;
    keywords: Record<string, string[]>;
    stats: {
        totalKeywords: number;
        avgScenariosPerKeyword: number;
    };
}
export interface QuickLookupEntry {
    uris: string[];
    tokens: number;
}
export interface QuickLookupCache {
    version: string;
    commonQueries: Record<string, QuickLookupEntry>;
}
export declare class IndexBuilder {
    private resourcesPath;
    constructor(resourcesPath?: string);
    buildIndexes(): Promise<{
        useWhenIndex: UseWhenIndex;
        keywordIndex: KeywordIndex;
        quickLookup: QuickLookupCache;
    }>;
    private scanAllFragments;
    private scanFragmentsDirectory;
    private parseResourceFragment;
    private buildUseWhenIndex;
    private buildKeywordIndex;
    private buildQuickLookup;
    private hashScenario;
    extractKeywords(text: string): string[];
    private fragmentToURI;
    writeIndex(index: any, filePath: string): Promise<void>;
}
