/**
 * URI Parser for orchestr8:// protocol
 * Handles both static and dynamic (match-based) URIs
 *
 * @example Static URI
 * orchestr8://agents/typescript-developer
 *
 * @example Dynamic URI
 * orchestr8://agents/match?query=build+api&maxTokens=2000&tags=typescript,async
 */

/**
 * Query parameters for dynamic URI matching
 */
export interface MatchParams {
  /** Search query for fuzzy matching */
  query: string;
  /** Maximum tokens to include in assembled response (default: 3000) */
  maxTokens?: number;
  /** Required tags filter (comma-separated) */
  tags?: string[];
  /** Categories to search within (comma-separated) */
  categories?: string[];
  /** Response mode: 'full' returns content, 'catalog' returns lightweight index, 'index' uses useWhen index (default: 'catalog') */
  mode?: 'full' | 'catalog' | 'index';
  /** Maximum number of results to return in catalog mode (default: 15) */
  maxResults?: number;
  /** Minimum relevance score threshold (0-100, default: 10) */
  minScore?: number;
}

/**
 * Parsed static URI result
 */
export interface StaticURI {
  /** Discriminator for union type */
  type: "static";
  /** Resource category (e.g., 'agents', 'skills', 'examples', 'patterns') */
  category: string;
  /** Specific resource identifier */
  resourceId: string;
}

/**
 * Parsed dynamic URI result
 */
export interface DynamicURI {
  /** Discriminator for union type */
  type: "dynamic";
  /** Optional category filter for matching */
  category?: string;
  /** Match parameters extracted from query string */
  matchParams: MatchParams;
}

/**
 * Discriminated union of parsed URI types
 */
export type ParsedURI = StaticURI | DynamicURI;

/**
 * URI Parser for orchestr8:// protocol
 *
 * Parses both static resource URIs and dynamic match URIs with query parameters.
 *
 * @example
 * ```typescript
 * const parser = new URIParser();
 *
 * // Parse static URI
 * const static = parser.parse('orchestr8://agents/typescript-developer');
 * // { type: 'static', category: 'agents', resourceId: 'typescript-developer' }
 *
 * // Parse dynamic URI
 * const dynamic = parser.parse('orchestr8://agents/match?query=build+api&maxTokens=2000');
 * // { type: 'dynamic', category: 'agents', matchParams: { query: 'build api', maxTokens: 2000 } }
 * ```
 */
export class URIParser {
  private static readonly PROTOCOL = "orchestr8://";
  private static readonly MATCH_PATH = "/match";
  private static readonly DEFAULT_MAX_TOKENS = 3000;

  /**
   * Parse an orchestr8:// URI into its components
   *
   * @param uri - The URI to parse (e.g., 'orchestr8://agents/typescript-developer')
   * @returns Parsed URI with discriminated type
   * @throws {Error} If URI format is invalid
   */
  parse(uri: string): ParsedURI {
    // Validate protocol
    if (!uri.startsWith(URIParser.PROTOCOL)) {
      throw new Error(
        `Invalid URI protocol. Expected '${URIParser.PROTOCOL}', got: ${uri}`,
      );
    }

    // Remove protocol prefix
    const withoutProtocol = uri.substring(URIParser.PROTOCOL.length);

    // Check if this is a dynamic matching URI
    // Can be either 'match?...' or 'category/match?...'
    if (
      withoutProtocol.includes(URIParser.MATCH_PATH + "?") ||
      withoutProtocol.startsWith("match?")
    ) {
      return this.parseDynamicURI(withoutProtocol);
    }

    // Parse as static URI
    return this.parseStaticURI(withoutProtocol);
  }

  /**
   * Parse a static resource URI
   *
   * @param path - URI path without protocol (e.g., 'agents/typescript-developer')
   * @returns StaticURI object
   * @throws {Error} If path format is invalid
   * @private
   */
  private parseStaticURI(path: string): StaticURI {
    const parts = path.split("/");

    if (parts.length < 2) {
      throw new Error(
        `Invalid static URI format. Expected 'category/resourceId', got: ${path}`,
      );
    }

    const category = parts[0];
    const resourceId = parts.slice(1).join("/");

    if (!category || !resourceId) {
      throw new Error(
        `Invalid static URI. Category and resourceId are required. Got: ${path}`,
      );
    }

    return {
      type: "static",
      category,
      resourceId,
    };
  }

  /**
   * Parse a dynamic matching URI with query parameters
   *
   * @param path - URI path without protocol (e.g., 'agents/match?query=build+api')
   * @returns DynamicURI object
   * @throws {Error} If path or query format is invalid
   * @private
   */
  private parseDynamicURI(path: string): DynamicURI {
    // Split path and query string
    const [basePath, queryString] = path.split("?");

    if (!queryString) {
      throw new Error(
        `Invalid dynamic URI. Query string is required for match URIs. Got: ${path}`,
      );
    }

    // Extract category from base path
    // Can be 'match' (no category filter) or 'agents/match' (category-specific)
    const pathParts = basePath.split("/");
    const category =
      pathParts.length > 1 && pathParts[0] !== "match"
        ? pathParts[0]
        : undefined;

    // Parse query parameters
    const matchParams = this.parseQueryParams(queryString);

    return {
      type: "dynamic",
      category,
      matchParams,
    };
  }

  /**
   * Parse query string parameters into MatchParams
   *
   * @param queryString - URL query string (without '?')
   * @returns MatchParams object
   * @throws {Error} If query parameter is missing
   * @private
   */
  private parseQueryParams(queryString: string): MatchParams {
    const params = new URLSearchParams(queryString);

    // Query is required for dynamic matching
    const query = params.get("query");
    if (!query) {
      throw new Error(
        'Invalid dynamic URI. "query" parameter is required for match URIs.',
      );
    }

    // Decode plus signs and URI encoding
    const decodedQuery = decodeURIComponent(query.replace(/\+/g, " "));

    // Parse optional maxTokens
    const maxTokensStr = params.get("maxTokens");
    const maxTokens = maxTokensStr
      ? parseInt(maxTokensStr, 10)
      : URIParser.DEFAULT_MAX_TOKENS;

    if (maxTokensStr && isNaN(maxTokens)) {
      throw new Error(
        `Invalid maxTokens parameter. Expected number, got: ${maxTokensStr}`,
      );
    }

    // Parse optional tags (comma-separated)
    const tagsStr = params.get("tags");
    const tags = tagsStr
      ? tagsStr
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined;

    // Parse optional categories (comma-separated)
    const categoriesStr = params.get("categories");
    const categories = categoriesStr
      ? categoriesStr
          .split(",")
          .map((cat) => cat.trim())
          .filter(Boolean)
      : undefined;

    // Parse optional mode (default: 'catalog')
    const modeStr = params.get("mode");
    let mode: 'full' | 'catalog' | 'index' = 'catalog';
    if (modeStr === 'full') {
      mode = 'full';
    } else if (modeStr === 'index') {
      mode = 'index';
    }

    // Parse optional maxResults (default: 15)
    const maxResultsStr = params.get("maxResults");
    const maxResults = maxResultsStr ? parseInt(maxResultsStr, 10) : 15;

    if (maxResultsStr && isNaN(maxResults)) {
      throw new Error(
        `Invalid maxResults parameter. Expected number, got: ${maxResultsStr}`,
      );
    }

    // Parse optional minScore (default: 10)
    const minScoreStr = params.get("minScore");
    const minScore = minScoreStr ? parseInt(minScoreStr, 10) : 10;

    if (minScoreStr && isNaN(minScore)) {
      throw new Error(
        `Invalid minScore parameter. Expected number, got: ${minScoreStr}`,
      );
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

  /**
   * Check if a URI is a dynamic match URI
   *
   * @param uri - The URI to check
   * @returns true if URI contains match path with query parameters
   */
  isDynamicURI(uri: string): boolean {
    const withoutProtocol = uri.startsWith(URIParser.PROTOCOL)
      ? uri.substring(URIParser.PROTOCOL.length)
      : uri;
    return (
      withoutProtocol.includes(URIParser.MATCH_PATH + "?") ||
      withoutProtocol.startsWith("match?")
    );
  }

  /**
   * Check if a URI is a static resource URI
   *
   * @param uri - The URI to check
   * @returns true if URI is not a dynamic match URI
   */
  isStaticURI(uri: string): boolean {
    return !this.isDynamicURI(uri);
  }
}

/**
 * Default export of URIParser class
 */
export default URIParser;
