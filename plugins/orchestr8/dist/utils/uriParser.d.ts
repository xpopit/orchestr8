export interface MatchParams {
    query: string;
    maxTokens?: number;
    tags?: string[];
    categories?: string[];
    mode?: 'full' | 'catalog' | 'index';
    maxResults?: number;
    minScore?: number;
}
export interface StaticURI {
    type: "static";
    category: string;
    resourceId: string;
}
export interface DynamicURI {
    type: "dynamic";
    category?: string;
    matchParams: MatchParams;
}
export type ParsedURI = StaticURI | DynamicURI;
export declare class URIParser {
    private static readonly PROTOCOL;
    private static readonly MATCH_PATH;
    private static readonly DEFAULT_MAX_TOKENS;
    parse(uri: string): ParsedURI;
    private parseStaticURI;
    private parseDynamicURI;
    private parseQueryParams;
    isDynamicURI(uri: string): boolean;
    isStaticURI(uri: string): boolean;
}
export default URIParser;
