export interface ResourceFragment {
    id: string;
    category: "agent" | "skill" | "example" | "pattern" | "workflow";
    tags: string[];
    capabilities: string[];
    useWhen: string[];
    estimatedTokens: number;
    content: string;
}
export interface MatchRequest {
    query: string;
    category?: string;
    categories?: string[];
    maxTokens?: number;
    requiredTags?: string[];
    mode?: 'full' | 'catalog' | 'index' | 'minimal';
    maxResults?: number;
    minScore?: number;
}
export interface MatchResult {
    fragments: ResourceFragment[];
    totalTokens: number;
    matchScores: number[];
    assembledContent: string;
}
interface ScoredResource {
    resource: ResourceFragment;
    score: number;
}
export declare class FuzzyMatcher {
    private resourceIndex;
    private indexLoaded;
    private indexLoadPromise;
    private resourcesPath;
    constructor();
    match(request: MatchRequest): Promise<MatchResult>;
    extractKeywords(query: string): string[];
    calculateScore(resource: ResourceFragment, keywords: string[], request: MatchRequest): number;
    private calculateLevenshteinSimilarity;
    private levenshteinDistance;
    selectWithinBudget(scored: ScoredResource[], maxTokens: number): ScoredResource[];
    assembleContent(fragments: ScoredResource[]): {
        content: string;
        tokens: number;
    };
    assembleCatalog(fragments: ScoredResource[]): {
        content: string;
        tokens: number;
    };
    assembleMinimal(fragments: ScoredResource[]): {
        content: string;
        tokens: number;
    };
    private loadResourceIndex;
    private _loadResourceIndexImpl;
    private _scanFragmentsDirectory;
    private _parseResourceFragment;
    setResourceIndex(resources: ResourceFragment[]): void;
    private categoryLabel;
}
export {};
