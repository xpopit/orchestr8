/**
 * Index Builder: Generates useWhen-based indexes for efficient resource lookup
 *
 * Scans all fragment files, extracts useWhen scenarios, and builds:
 * 1. Main useWhen index (scenario hash -> metadata)
 * 2. Inverted keyword index (keyword -> scenario hashes)
 * 3. Quick lookup cache (common queries -> results)
 */

import { promises as fs } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import matter from "gray-matter";
import { Logger } from "./logger.js";
import { ResourceFragment } from "./fuzzyMatcher.js";

const logger = new Logger("IndexBuilder");

/**
 * Index entry for a single useWhen scenario
 */
export interface UseWhenIndexEntry {
  /** The useWhen scenario text */
  scenario: string;
  /** Extracted keywords for matching */
  keywords: string[];
  /** MCP URI to load the fragment */
  uri: string;
  /** Fragment category */
  category: "agent" | "skill" | "example" | "pattern" | "workflow";
  /** Estimated token count */
  estimatedTokens: number;
  /** Default relevance score */
  relevance: number;
}

/**
 * Main useWhen index structure
 */
export interface UseWhenIndex {
  /** Index version */
  version: string;
  /** Generation timestamp */
  generated: string;
  /** Total number of fragments indexed */
  totalFragments: number;
  /** Map of scenario hash -> metadata */
  index: Record<string, UseWhenIndexEntry>;
  /** Statistics about the index */
  stats: {
    totalScenarios: number;
    avgScenariosPerFragment: number;
    avgKeywordsPerScenario: number;
    indexSizeBytes: number;
  };
}

/**
 * Inverted keyword index structure
 */
export interface KeywordIndex {
  /** Index version */
  version: string;
  /** Map of keyword -> array of scenario hashes */
  keywords: Record<string, string[]>;
  /** Statistics */
  stats: {
    totalKeywords: number;
    avgScenariosPerKeyword: number;
  };
}

/**
 * Quick lookup cache entry
 */
export interface QuickLookupEntry {
  /** Array of MCP URIs for this query */
  uris: string[];
  /** Total estimated tokens */
  tokens: number;
}

/**
 * Quick lookup cache structure
 */
export interface QuickLookupCache {
  /** Cache version */
  version: string;
  /** Map of normalized query -> cached result */
  commonQueries: Record<string, QuickLookupEntry>;
}

/**
 * IndexBuilder class handles generation of all index files
 */
export class IndexBuilder {
  private resourcesPath: string;

  constructor(resourcesPath?: string) {
    this.resourcesPath = resourcesPath || join(process.cwd(), "resources");
  }

  /**
   * Build all indexes from fragment files
   *
   * @returns Object containing all generated indexes
   */
  async buildIndexes(): Promise<{
    useWhenIndex: UseWhenIndex;
    keywordIndex: KeywordIndex;
    quickLookup: QuickLookupCache;
  }> {
    logger.info("Starting index generation...");

    // 1. Scan all fragments
    const fragments = await this.scanAllFragments();
    logger.info(`Scanned ${fragments.length} fragments`);

    // 2. Build main useWhen index
    const { useWhenIndex, scenarioToFragment } = await this.buildUseWhenIndex(fragments);
    logger.info(`Built useWhen index with ${useWhenIndex.stats.totalScenarios} scenarios`);

    // 3. Build inverted keyword index
    const keywordIndex = this.buildKeywordIndex(useWhenIndex);
    logger.info(`Built keyword index with ${keywordIndex.stats.totalKeywords} keywords`);

    // 4. Build quick lookup cache
    const quickLookup = this.buildQuickLookup(fragments, scenarioToFragment);
    logger.info(`Built quick lookup cache with ${Object.keys(quickLookup.commonQueries).length} queries`);

    return { useWhenIndex, keywordIndex, quickLookup };
  }

  /**
   * Scan all fragment files from resources directory
   *
   * @returns Array of ResourceFragment objects
   */
  private async scanAllFragments(): Promise<ResourceFragment[]> {
    const categories = [
      { dir: "agents", type: "agent" as const },
      { dir: "skills", type: "skill" as const },
      { dir: "examples", type: "example" as const },
      { dir: "patterns", type: "pattern" as const },
      { dir: "guides", type: "pattern" as const },
      { dir: "workflows", type: "workflow" as const },
    ];

    const allFragments: ResourceFragment[] = [];

    for (const { dir, type } of categories) {
      const categoryPath = join(this.resourcesPath, dir, "_fragments");

      try {
        await fs.access(categoryPath);
        await this.scanFragmentsDirectory(categoryPath, type, dir, allFragments);
      } catch (error) {
        logger.debug(`Fragments directory not found: ${categoryPath}`);
      }
    }

    return allFragments;
  }

  /**
   * Recursively scan a directory for fragment files
   *
   * @param dirPath - Directory to scan
   * @param category - Fragment category
   * @param categoryName - Category name for ID generation
   * @param fragments - Array to accumulate fragments
   */
  private async scanFragmentsDirectory(
    dirPath: string,
    category: ResourceFragment["category"],
    categoryName: string,
    fragments: ResourceFragment[],
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanFragmentsDirectory(fullPath, category, categoryName, fragments);
        } else if (entry.name.endsWith(".md")) {
          // Parse markdown file
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            const fragment = this.parseResourceFragment(
              content,
              category,
              categoryName,
              fullPath,
            );
            fragments.push(fragment);
          } catch (error) {
            logger.warn(`Failed to parse fragment: ${fullPath}`, error);
          }
        }
      }
    } catch (error) {
      logger.warn(`Error scanning directory: ${dirPath}`, error);
    }
  }

  /**
   * Parse a markdown file into a ResourceFragment
   *
   * @param content - File content
   * @param category - Fragment category
   * @param categoryName - Category name
   * @param filePath - Full file path
   * @returns ResourceFragment object
   */
  private parseResourceFragment(
    content: string,
    category: ResourceFragment["category"],
    categoryName: string,
    filePath: string,
  ): ResourceFragment {
    // Parse frontmatter
    const parsed = matter(content);
    const frontmatter = parsed.data;
    const body = parsed.content;

    // Extract metadata from frontmatter with fallbacks
    const id =
      frontmatter.id ||
      filePath
        .split("_fragments/")[1]
        ?.replace(/\.md$/, "")
        .replace(/\\/g, "/") ||
      "unknown";

    const tags = Array.isArray(frontmatter.tags)
      ? frontmatter.tags.map((tag: any) => String(tag).toLowerCase())
      : [];

    const capabilities = Array.isArray(frontmatter.capabilities)
      ? frontmatter.capabilities.map((cap: any) => String(cap))
      : [];

    const useWhen = Array.isArray(frontmatter.useWhen)
      ? frontmatter.useWhen.map((use: any) => String(use))
      : [];

    const estimatedTokens =
      typeof frontmatter.estimatedTokens === "number"
        ? frontmatter.estimatedTokens
        : Math.ceil(body.length / 4);

    return {
      id: `${categoryName}/${id}`,
      category,
      tags,
      capabilities,
      useWhen,
      estimatedTokens,
      content: body,
    };
  }

  /**
   * Build main useWhen index from fragments
   *
   * @param fragments - Array of fragments
   * @returns UseWhen index and mapping of scenarios to fragments
   */
  private async buildUseWhenIndex(
    fragments: ResourceFragment[],
  ): Promise<{
    useWhenIndex: UseWhenIndex;
    scenarioToFragment: Map<string, ResourceFragment>;
  }> {
    const index: Record<string, UseWhenIndexEntry> = {};
    const scenarioToFragment = new Map<string, ResourceFragment>();
    let totalScenarios = 0;
    let totalKeywords = 0;

    for (const fragment of fragments) {
      for (const scenario of fragment.useWhen) {
        // Generate stable hash for scenario
        const hash = this.hashScenario(scenario, fragment.id);

        // Extract keywords from scenario
        const keywords = this.extractKeywords(scenario);

        // Generate MCP URI
        const uri = this.fragmentToURI(fragment);

        // Create index entry
        index[hash] = {
          scenario,
          keywords,
          uri,
          category: fragment.category,
          estimatedTokens: fragment.estimatedTokens,
          relevance: 100, // Default relevance
        };

        // Track mapping for quick lookup
        scenarioToFragment.set(hash, fragment);

        totalScenarios++;
        totalKeywords += keywords.length;
      }
    }

    const avgScenariosPerFragment = fragments.length > 0
      ? totalScenarios / fragments.length
      : 0;

    const avgKeywordsPerScenario = totalScenarios > 0
      ? totalKeywords / totalScenarios
      : 0;

    const useWhenIndex: UseWhenIndex = {
      version: "1.0.0",
      generated: new Date().toISOString(),
      totalFragments: fragments.length,
      index,
      stats: {
        totalScenarios,
        avgScenariosPerFragment: Math.round(avgScenariosPerFragment * 10) / 10,
        avgKeywordsPerScenario: Math.round(avgKeywordsPerScenario * 10) / 10,
        indexSizeBytes: 0, // Will be calculated after serialization
      },
    };

    return { useWhenIndex, scenarioToFragment };
  }

  /**
   * Build inverted keyword index from useWhen index
   *
   * @param useWhenIndex - Main useWhen index
   * @returns Keyword index
   */
  private buildKeywordIndex(useWhenIndex: UseWhenIndex): KeywordIndex {
    const keywords: Record<string, string[]> = {};

    // Build inverted index
    for (const [hash, entry] of Object.entries(useWhenIndex.index)) {
      if (!Array.isArray(entry.keywords)) {
        logger.warn(`Invalid keywords for entry ${hash}`);
        continue;
      }

      for (const keyword of entry.keywords) {
        const kw = String(keyword);
        if (!keywords[kw]) {
          keywords[kw] = [];
        }
        if (!Array.isArray(keywords[kw])) {
          keywords[kw] = [];
        }
        keywords[kw].push(hash);
      }
    }

    // Calculate statistics
    const totalKeywords = Object.keys(keywords).length;
    const totalMappings = Object.values(keywords).reduce(
      (sum, hashes) => sum + hashes.length,
      0,
    );
    const avgScenariosPerKeyword = totalKeywords > 0
      ? totalMappings / totalKeywords
      : 0;

    return {
      version: "1.0.0",
      keywords,
      stats: {
        totalKeywords,
        avgScenariosPerKeyword: Math.round(avgScenariosPerKeyword * 10) / 10,
      },
    };
  }

  /**
   * Build quick lookup cache for common queries
   *
   * @param fragments - Array of fragments
   * @param scenarioToFragment - Mapping of scenario hashes to fragments
   * @returns Quick lookup cache
   */
  private buildQuickLookup(
    fragments: ResourceFragment[],
    scenarioToFragment: Map<string, ResourceFragment>,
  ): QuickLookupCache {
    // Common query patterns to pre-cache
    const commonQueries: Record<string, QuickLookupEntry> = {};

    // Extract most common keywords from fragments
    const keywordCounts = new Map<string, Set<string>>();

    for (const fragment of fragments) {
      for (const scenario of fragment.useWhen) {
        const keywords = this.extractKeywords(scenario);
        for (const keyword of keywords) {
          if (!keywordCounts.has(keyword)) {
            keywordCounts.set(keyword, new Set());
          }
          keywordCounts.get(keyword)!.add(this.fragmentToURI(fragment));
        }
      }
    }

    // Create quick lookup entries for top keywords
    const sortedKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 20); // Top 20 most common keywords

    for (const [keyword, uriSet] of sortedKeywords) {
      const uris = Array.from(uriSet).slice(0, 5); // Top 5 URIs per keyword
      const tokens = uris.reduce((sum, uri) => {
        const fragment = fragments.find(f => this.fragmentToURI(f) === uri);
        return sum + (fragment?.estimatedTokens || 0);
      }, 0);

      commonQueries[keyword] = { uris, tokens };
    }

    return {
      version: "1.0.0",
      commonQueries,
    };
  }

  /**
   * Generate stable hash for a scenario
   *
   * @param scenario - Scenario text
   * @param fragmentId - Fragment ID for additional uniqueness
   * @returns Hash string
   */
  private hashScenario(scenario: string, fragmentId: string): string {
    // Use first 50 chars + length + fragment ID for uniqueness
    const normalized = scenario.toLowerCase().replace(/\s+/g, "-");
    const prefix = normalized.substring(0, 50);

    // Create a more stable hash using crypto
    const hash = createHash("sha256")
      .update(`${fragmentId}:${scenario}`)
      .digest("hex")
      .substring(0, 12);

    return `scenario-${hash}`;
  }

  /**
   * Extract keywords from text (reuses fuzzyMatcher logic)
   *
   * @param text - Text to extract keywords from
   * @returns Array of keywords
   */
  extractKeywords(text: string): string[] {
    // Normalize: lowercase and remove special characters
    const normalized = text.toLowerCase().replace(/[^\w\s-]/g, " ");

    // Common stop words to filter out
    const stopWords = new Set([
      "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
      "been", "being", "have", "has", "had", "do", "does", "did", "will",
      "would", "should", "could", "may", "might", "can", "i", "you", "he",
      "she", "it", "we", "they", "this", "that", "these", "those",
    ]);

    // Split and filter
    const words = normalized
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    // Return unique keywords
    return Array.from(new Set(words));
  }

  /**
   * Convert fragment to MCP URI
   *
   * @param fragment - Resource fragment
   * @returns MCP URI string
   */
  private fragmentToURI(fragment: ResourceFragment): string {
    // Extract just the filename from the ID
    const filename = fragment.id.split('/').pop() || fragment.id;

    // Map category to plural form for URI
    const categoryPlural = fragment.category === "agent" ? "agents" :
                          fragment.category === "skill" ? "skills" :
                          fragment.category === "example" ? "examples" :
                          fragment.category === "pattern" ? "patterns" :
                          "workflows";

    return `orchestr8://${categoryPlural}/_fragments/${filename}`;
  }

  /**
   * Write index to file
   *
   * @param index - Index object to write
   * @param filePath - Target file path
   */
  async writeIndex(index: any, filePath: string): Promise<void> {
    const json = JSON.stringify(index, null, 2);
    await fs.writeFile(filePath, json, "utf-8");

    // Update size in stats if it's a useWhen index
    if (index.stats && 'indexSizeBytes' in index.stats) {
      index.stats.indexSizeBytes = Buffer.byteLength(json, "utf-8");
    }

    logger.info(`Wrote index to ${filePath} (${Buffer.byteLength(json, "utf-8")} bytes)`);
  }
}
