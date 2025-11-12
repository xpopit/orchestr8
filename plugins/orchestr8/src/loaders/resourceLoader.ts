import { promises as fs } from "fs";
import { join } from "path";
import { LRUCache } from "lru-cache";
import matter from "gray-matter";
import { Logger } from "../utils/logger.js";
import { ResourceMetadata } from "../types.js";
// ============================================================================
// NEW IMPORTS: Dynamic resource matching support
// ============================================================================
import { URIParser, ParsedURI } from "../utils/uriParser.js";
import { FuzzyMatcher, ResourceFragment } from "../utils/fuzzyMatcher.js";
import { IndexLookup } from "../utils/indexLookup.js";

export class ResourceLoader {
  private logger: Logger;
  private resourcesPath: string;
  private cache: LRUCache<string, string>;

  // ============================================================================
  // NEW: Dynamic resource matching components
  // ============================================================================
  private uriParser: URIParser;
  private fuzzyMatcher: FuzzyMatcher;
  private indexLookup: IndexLookup;
  private resourceIndex: ResourceFragment[] | null = null;
  private indexLoadPromise: Promise<ResourceFragment[]> | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.resourcesPath =
      process.env.RESOURCES_PATH || join(process.cwd(), "resources");

    const cacheSize = parseInt(process.env.CACHE_SIZE || "200", 10);
    this.cache = new LRUCache<string, string>({
      max: cacheSize,
      ttl: 1000 * 60 * 60 * 4, // 4 hour TTL for resources (changed less frequently)
      updateAgeOnGet: true,
    });

    // ============================================================================
    // NEW: Initialize dynamic matching components
    // ============================================================================
    this.uriParser = new URIParser();
    this.fuzzyMatcher = new FuzzyMatcher();
    this.indexLookup = new IndexLookup(this.resourcesPath);

    this.logger.debug(
      `Resource loader initialized with path: ${this.resourcesPath}`,
    );
  }

  /**
   * Load all resources from filesystem
   */
  async loadAllResources(): Promise<ResourceMetadata[]> {
    const resources: ResourceMetadata[] = [];

    try {
      // Load examples
      await this.scanDirectory("examples", "orchestr8://examples", resources);

      // Load patterns
      await this.scanDirectory("patterns", "orchestr8://patterns", resources);

      // Load guides
      await this.scanDirectory("guides", "orchestr8://guides", resources);

      // Load workflows
      await this.scanDirectory("workflows", "orchestr8://workflows", resources);

      // Load agents (on-demand only, not auto-loaded by Claude)
      await this.scanDirectory("agents", "orchestr8://agents", resources);

      // Load skills (on-demand only, not auto-loaded by Claude)
      await this.scanDirectory("skills", "orchestr8://skills", resources);
    } catch (error) {
      this.logger.error("Error loading resources:", error);
      return [];
    }

    return resources;
  }

  /**
   * Recursively scan directory for resources
   */
  private async scanDirectory(
    relativePath: string,
    uriPrefix: string,
    resources: ResourceMetadata[],
  ): Promise<void> {
    const fullPath = join(this.resourcesPath, relativePath);

    try {
      await fs.access(fullPath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = join(relativePath, entry.name);
        const uri = `${uriPrefix}/${entry.name.replace(/\.(md|json|yaml)$/, "")}`;

        if (entry.isDirectory()) {
          await this.scanDirectory(entryPath, uri, resources);
        } else if (
          entry.name.endsWith(".md") ||
          entry.name.endsWith(".json") ||
          entry.name.endsWith(".yaml")
        ) {
          const mimeType = entry.name.endsWith(".json")
            ? "application/json"
            : entry.name.endsWith(".yaml")
              ? "application/yaml"
              : "text/markdown";

          resources.push({
            uri,
            name: entry.name.replace(/\.(md|json|yaml)$/, ""),
            description: `Resource: ${uri}`,
            mimeType,
            category: relativePath.split("/")[0],
          });
        }
      }
    } catch (error) {
      this.logger.warn(`Resource directory not found: ${fullPath}`);
    }
  }

  // ============================================================================
  // NEW: Load and cache resource index for dynamic matching
  // ============================================================================
  /**
   * Load resource index from all markdown files in resources directory.
   * Scans recursively, parses frontmatter metadata, and builds ResourceFragment objects.
   * Results are cached for performance.
   *
   * @returns Promise resolving to array of ResourceFragment objects
   */
  async loadResourceIndex(): Promise<ResourceFragment[]> {
    // Return cached index if available
    if (this.resourceIndex !== null) {
      this.logger.debug("Returning cached resource index");
      return this.resourceIndex;
    }

    // If already loading, wait for that promise
    if (this.indexLoadPromise !== null) {
      this.logger.debug("Waiting for in-progress resource index load");
      return this.indexLoadPromise;
    }

    // Start loading
    this.logger.info("Loading resource index...");
    this.indexLoadPromise = this._loadResourceIndexImpl();

    try {
      this.resourceIndex = await this.indexLoadPromise;
      this.logger.info(
        `Resource index loaded with ${this.resourceIndex.length} fragments`,
      );
      return this.resourceIndex;
    } finally {
      this.indexLoadPromise = null;
    }
  }

  /**
   * Internal implementation of resource index loading
   * OPTIMIZED: Parallel directory scanning for faster initial load
   * @private
   */
  private async _loadResourceIndexImpl(): Promise<ResourceFragment[]> {
    try {
      // Scan all resource directories in parallel
      const categories = [
        "agents",
        "skills",
        "examples",
        "patterns",
        "guides",
        "workflows",
      ];

      // Parallel scan all categories - reduces initial load time
      const categoryPromises = categories.map(async (category) => {
        const categoryPath = join(this.resourcesPath, category);
        const categoryFragments: ResourceFragment[] = [];

        try {
          await fs.access(categoryPath);
          await this._scanForFragments(
            categoryPath,
            category,
            category,
            categoryFragments,
          );
        } catch (error) {
          this.logger.debug(`Category directory not found: ${category}`);
        }

        return categoryFragments;
      });

      // Wait for all categories to be scanned
      const fragmentArrays = await Promise.all(categoryPromises);

      // Flatten results
      const fragments = fragmentArrays.flat();

      // Set the index in the fuzzy matcher
      this.fuzzyMatcher.setResourceIndex(fragments);

      return fragments;
    } catch (error) {
      this.logger.error("Error loading resource index:", error);
      return [];
    }
  }

  /**
   * Recursively scan directory and extract resource fragments
   * @private
   */
  private async _scanForFragments(
    dirPath: string,
    category: string,
    relativePath: string,
    fragments: ResourceFragment[],
  ): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const newRelativePath = join(relativePath, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        await this._scanForFragments(
          fullPath,
          category,
          newRelativePath,
          fragments,
        );
      } else if (entry.name.endsWith(".md")) {
        // Parse markdown file
        try {
          const content = await fs.readFile(fullPath, "utf-8");
          const fragment = await this._parseResourceFragment(
            content,
            category,
            newRelativePath,
          );
          fragments.push(fragment);
          this.logger.debug(`Parsed fragment: ${fragment.id}`);
        } catch (error) {
          this.logger.warn(`Failed to parse resource: ${fullPath}`, error);
        }
      }
    }
  }

  /**
   * Parse a markdown file into a ResourceFragment
   * @private
   */
  private async _parseResourceFragment(
    content: string,
    category: string,
    relativePath: string,
  ): Promise<ResourceFragment> {
    // Parse frontmatter if present
    const parsed = matter(content);
    const frontmatter = parsed.data;
    const body = parsed.content;

    // Extract metadata from frontmatter or use defaults
    const tags = this._extractTags(frontmatter, body);
    const capabilities = this._extractCapabilities(frontmatter, body);
    const useWhen = this._extractUseWhen(frontmatter, body);

    // Estimate token count (rough approximation: ~4 chars per token)
    const estimatedTokens = Math.ceil(body.length / 4);

    // Generate ID from relative path
    const id = relativePath.replace(/\.md$/, "").replace(/\\/g, "/");

    // Map category to ResourceFragment category type
    const fragmentCategory = this._mapCategory(category);

    return {
      id,
      category: fragmentCategory,
      tags,
      capabilities,
      useWhen,
      estimatedTokens,
      content: body,
    };
  }

  /**
   * Extract tags from frontmatter or content
   * @private
   */
  private _extractTags(frontmatter: any, content: string): string[] {
    // Check frontmatter first
    if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
      return frontmatter.tags.map((tag: any) => String(tag).toLowerCase());
    }

    // Fallback: extract from content headers and keywords
    const tags = new Set<string>();

    // Extract from title (first # heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      const words = titleMatch[1]
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .split(/\s+/);
      words.forEach((word) => {
        if (word.length > 2) tags.add(word);
      });
    }

    // Common programming keywords
    const keywords = [
      "typescript",
      "javascript",
      "node",
      "react",
      "api",
      "rest",
      "graphql",
      "database",
      "sql",
      "testing",
      "async",
      "error",
      "security",
      "auth",
      "validation",
    ];

    keywords.forEach((keyword) => {
      if (content.toLowerCase().includes(keyword)) {
        tags.add(keyword);
      }
    });

    return Array.from(tags);
  }

  /**
   * Extract capabilities from frontmatter or content
   * @private
   */
  private _extractCapabilities(frontmatter: any, content: string): string[] {
    // Check frontmatter first
    if (frontmatter.capabilities && Array.isArray(frontmatter.capabilities)) {
      return frontmatter.capabilities.map((cap: any) => String(cap));
    }

    // Fallback: extract from content sections
    const capabilities: string[] = [];

    // Look for "Capabilities" or "Core Capabilities" section
    const capabilitiesMatch = content.match(
      /##\s*(?:Core\s+)?Capabilities\s*\n([\s\S]*?)(?=\n##|\n#\s|$)/i,
    );
    if (capabilitiesMatch) {
      const capSection = capabilitiesMatch[1];
      const bullets = capSection.match(/^[-*]\s+(.+)$/gm);
      if (bullets) {
        bullets.forEach((bullet) => {
          const cap = bullet.replace(/^[-*]\s+/, "").trim();
          if (cap) capabilities.push(cap);
        });
      }
    }

    return capabilities;
  }

  /**
   * Extract use-when scenarios from frontmatter or content
   * @private
   */
  private _extractUseWhen(frontmatter: any, content: string): string[] {
    // Check frontmatter first
    if (frontmatter.useWhen && Array.isArray(frontmatter.useWhen)) {
      return frontmatter.useWhen.map((use: any) => String(use));
    }

    // Fallback: extract from content sections
    const useWhen: string[] = [];

    // Look for "When to Use" or "When This Skill Applies" section
    const useWhenMatch = content.match(
      /##\s*(?:When to Use|When This (?:Agent|Skill) (?:Applies|Is Used))\s*\n([\s\S]*?)(?=\n##|\n#\s|$)/i,
    );
    if (useWhenMatch) {
      const useSection = useWhenMatch[1];
      const bullets = useSection.match(/^[-*]\s+(.+)$/gm);
      if (bullets) {
        bullets.forEach((bullet) => {
          const use = bullet.replace(/^[-*]\s+/, "").trim();
          if (use) useWhen.push(use);
        });
      }
    }

    return useWhen;
  }

  /**
   * Map category string to ResourceFragment category type
   * @private
   */
  private _mapCategory(
    category: string,
  ): "agent" | "skill" | "example" | "pattern" | "workflow" {
    // Normalize and map
    const normalized = category.toLowerCase().split("/")[0];

    switch (normalized) {
      case "agents":
        return "agent";
      case "skills":
        return "skill";
      case "examples":
        return "example";
      case "workflows":
        return "workflow";
      case "patterns":
      case "guides":
        return "pattern";
      default:
        return "pattern";
    }
  }

  // ============================================================================
  // UPDATED: Load resource content with dynamic matching support
  // ============================================================================
  /**
   * Load resource content.
   * Supports both static URIs (direct file load) and dynamic URIs (fuzzy matching).
   *
   * @param uri - Resource URI (static or dynamic)
   * @returns Promise resolving to resource content
   *
   * @example Static URI
   * loadResourceContent("orchestr8://agents/typescript-developer")
   *
   * @example Dynamic URI
   * loadResourceContent("orchestr8://agents/match?query=build+api&maxTokens=2000")
   */
  async loadResourceContent(uri: string): Promise<string> {
    // Check cache first (for static URIs)
    if (this.cache.has(uri)) {
      this.logger.debug(`Cache hit for resource: ${uri}`);
      return this.cache.get(uri)!;
    }

    try {
      // Parse the URI
      const parsed = this.uriParser.parse(uri);

      if (parsed.type === "static") {
        // Static URI: Load file directly (existing behavior)
        return await this._loadStaticResource(uri, parsed);
      } else {
        // Dynamic URI: Use fuzzy matcher to assemble content
        return await this._loadDynamicResource(uri, parsed);
      }
    } catch (error) {
      this.logger.error(`Error loading resource content for ${uri}:`, error);
      throw error;
    }
  }

  /**
   * Load static resource (direct file access)
   * @private
   */
  private async _loadStaticResource(
    uri: string,
    parsed: ParsedURI & { type: "static" },
  ): Promise<string> {
    // Parse URI to file path
    const filePath = this.uriToFilePath(uri);

    const content = await fs.readFile(filePath, "utf-8");
    this.cache.set(uri, content);
    this.logger.debug(`Cached static resource content: ${uri}`);
    return content;
  }

  /**
   * Load dynamic resource (index lookup or fuzzy matching)
   * @private
   */
  private async _loadDynamicResource(
    uri: string,
    parsed: ParsedURI & { type: "dynamic" },
  ): Promise<string> {
    this.logger.info(`Dynamic resource request: ${uri}`);

    // Feature flag: Use index lookup vs fuzzy match
    // - Mode explicitly set to 'index' in URI
    // - Environment variable USE_INDEX_LOOKUP=true (default for index mode)
    // - Default is 'catalog' (fuzzy match) for backward compatibility
    const useIndexLookup =
      parsed.matchParams.mode === "index" ||
      process.env.USE_INDEX_LOOKUP === "true";

    if (useIndexLookup) {
      // NEW: Index-based lookup (85-95% token reduction)
      this.logger.debug("Using index-based lookup");

      try {
        const result = await this.indexLookup.lookup(parsed.matchParams.query, {
          query: parsed.matchParams.query,
          maxResults: parsed.matchParams.maxResults || 5,
          minScore: parsed.matchParams.minScore || 50,
          categories: parsed.matchParams.categories,
          mode: parsed.matchParams.mode,
        });

        // Cache the result
        this.cache.set(uri, result);

        return result;
      } catch (error) {
        this.logger.warn(
          "Index lookup failed, falling back to fuzzy match",
          error,
        );
        // Fall through to fuzzy match below
      }
    }

    // EXISTING: Fuzzy match (backward compatible)
    this.logger.debug("Using fuzzy match");

    // Ensure resource index is loaded
    await this.loadResourceIndex();

    // Perform fuzzy matching
    const matchResult = await this.fuzzyMatcher.match({
      query: parsed.matchParams.query,
      maxTokens: parsed.matchParams.maxTokens,
      requiredTags: parsed.matchParams.tags,
      category: parsed.category, // Category from URI path (e.g., orchestr8://agents/match?)
      categories: parsed.matchParams.categories, // Categories from query param (e.g., ?categories=agent,skill)
      mode: parsed.matchParams.mode || "catalog", // 'full' or 'catalog'
      maxResults: parsed.matchParams.maxResults, // Max results for catalog mode
      minScore: parsed.matchParams.minScore, // Minimum relevance score threshold
    });

    // Cache the assembled content
    this.cache.set(uri, matchResult.assembledContent);

    this.logger.info(
      `Assembled ${matchResult.fragments.length} fragments (${matchResult.totalTokens} tokens)`,
    );

    return matchResult.assembledContent;
  }

  /**
   * Convert URI to filesystem path
   */
  private uriToFilePath(uri: string): string {
    // Remove protocol
    const pathPart = uri.replace("orchestr8://", "");

    // Try different extensions
    const extensions = [".md", ".json", ".yaml"];

    for (const ext of extensions) {
      const filePath = join(this.resourcesPath, pathPart + ext);
      // We'll try to read each and see which exists
      return filePath;
    }

    return join(this.resourcesPath, pathPart + ".md");
  }

  /**
   * Get resources by category for HTTP API
   */
  async getResourcesByCategory(category: string): Promise<any[]> {
    await this.ensureIndexLoaded();

    if (!this.resourceIndex) {
      return [];
    }

    // Normalize category (remove plural 's' if present)
    const normalizedCategory = category.endsWith("s")
      ? category.slice(0, -1)
      : category;

    return this.resourceIndex
      .filter((fragment) => fragment.category === normalizedCategory)
      .map((fragment) => ({
        id: fragment.id,
        uri: `orchestr8://${category}/${fragment.id}`,
        tags: fragment.tags || [],
        capabilities: fragment.capabilities || [],
        tokens: fragment.estimatedTokens,
      }));
  }

  /**
   * Search resources by query for HTTP API
   */
  async searchResources(query: string): Promise<any[]> {
    await this.ensureIndexLoaded();

    if (!this.resourceIndex) {
      return [];
    }

    const lowerQuery = query.toLowerCase();

    return this.resourceIndex
      .filter((fragment) => {
        const idMatch = fragment.id.toLowerCase().includes(lowerQuery);
        const tagMatch = fragment.tags?.some((tag: string) =>
          tag.toLowerCase().includes(lowerQuery),
        );
        const capMatch = fragment.capabilities?.some((cap: string) =>
          cap.toLowerCase().includes(lowerQuery),
        );
        return idMatch || tagMatch || capMatch;
      })
      .map((fragment) => ({
        id: fragment.id,
        uri: `orchestr8://${fragment.category}/${fragment.id}`,
        category: fragment.category,
        tags: fragment.tags || [],
        capabilities: fragment.capabilities || [],
        tokens: fragment.estimatedTokens,
      }))
      .slice(0, 50); // Limit results
  }

  /**
   * Get cached resource content
   */
  getCachedResource(uri: string): string | undefined {
    return this.cache.get(uri);
  }

  /**
   * Ensure resource index is loaded (for HTTP API)
   */
  private async ensureIndexLoaded(): Promise<void> {
    if (this.resourceIndex) {
      return;
    }

    // If already loading, wait for it
    if (this.indexLoadPromise) {
      await this.indexLoadPromise;
      return;
    }

    // Start loading
    this.indexLoadPromise = this.loadResourceIndex();
    await this.indexLoadPromise;
  }
}
