export class URIParser {
    static PROTOCOL = "orchestr8://";
    static MATCH_PATH = "/match";
    static DEFAULT_MAX_TOKENS = 3000;
    parse(uri) {
        if (!uri.startsWith(URIParser.PROTOCOL)) {
            throw new Error(`Invalid URI protocol. Expected '${URIParser.PROTOCOL}', got: ${uri}`);
        }
        const withoutProtocol = uri.substring(URIParser.PROTOCOL.length);
        if (withoutProtocol.includes(URIParser.MATCH_PATH + "?") ||
            withoutProtocol.startsWith("match?")) {
            return this.parseDynamicURI(withoutProtocol);
        }
        return this.parseStaticURI(withoutProtocol);
    }
    parseStaticURI(path) {
        const parts = path.split("/");
        if (parts.length < 2) {
            throw new Error(`Invalid static URI format. Expected 'category/resourceId', got: ${path}`);
        }
        const category = parts[0];
        const resourceId = parts.slice(1).join("/");
        if (!category || !resourceId) {
            throw new Error(`Invalid static URI. Category and resourceId are required. Got: ${path}`);
        }
        return {
            type: "static",
            category,
            resourceId,
        };
    }
    parseDynamicURI(path) {
        const [basePath, queryString] = path.split("?");
        if (!queryString) {
            throw new Error(`Invalid dynamic URI. Query string is required for match URIs. Got: ${path}`);
        }
        const pathParts = basePath.split("/");
        const category = pathParts.length > 1 && pathParts[0] !== "match"
            ? pathParts[0]
            : undefined;
        const matchParams = this.parseQueryParams(queryString);
        return {
            type: "dynamic",
            category,
            matchParams,
        };
    }
    parseQueryParams(queryString) {
        const params = new URLSearchParams(queryString);
        const query = params.get("query");
        if (!query) {
            throw new Error('Invalid dynamic URI. "query" parameter is required for match URIs.');
        }
        const decodedQuery = decodeURIComponent(query.replace(/\+/g, " "));
        const maxTokensStr = params.get("maxTokens");
        const maxTokens = maxTokensStr
            ? parseInt(maxTokensStr, 10)
            : URIParser.DEFAULT_MAX_TOKENS;
        if (maxTokensStr && isNaN(maxTokens)) {
            throw new Error(`Invalid maxTokens parameter. Expected number, got: ${maxTokensStr}`);
        }
        const tagsStr = params.get("tags");
        const tags = tagsStr
            ? tagsStr
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : undefined;
        const categoriesStr = params.get("categories");
        const categories = categoriesStr
            ? categoriesStr
                .split(",")
                .map((cat) => cat.trim())
                .filter(Boolean)
            : undefined;
        const modeStr = params.get("mode");
        let mode = 'catalog';
        if (modeStr === 'full') {
            mode = 'full';
        }
        else if (modeStr === 'index') {
            mode = 'index';
        }
        const maxResultsStr = params.get("maxResults");
        const maxResults = maxResultsStr ? parseInt(maxResultsStr, 10) : 15;
        if (maxResultsStr && isNaN(maxResults)) {
            throw new Error(`Invalid maxResults parameter. Expected number, got: ${maxResultsStr}`);
        }
        const minScoreStr = params.get("minScore");
        const minScore = minScoreStr ? parseInt(minScoreStr, 10) : 10;
        if (minScoreStr && isNaN(minScore)) {
            throw new Error(`Invalid minScore parameter. Expected number, got: ${minScoreStr}`);
        }
        return {
            query: decodedQuery,
            maxTokens,
            tags,
            categories,
            mode,
            maxResults,
            minScore,
        };
    }
    isDynamicURI(uri) {
        const withoutProtocol = uri.startsWith(URIParser.PROTOCOL)
            ? uri.substring(URIParser.PROTOCOL.length)
            : uri;
        return (withoutProtocol.includes(URIParser.MATCH_PATH + "?") ||
            withoutProtocol.startsWith("match?"));
    }
    isStaticURI(uri) {
        return !this.isDynamicURI(uri);
    }
}
export default URIParser;
