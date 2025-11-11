import fs from "fs/promises";
import path from "path";
import { LRUCache } from "lru-cache";
import chokidar, { FSWatcher } from "chokidar";
import matter from "gray-matter";
import { Logger } from "../utils/logger.js";
import { PromptMetadata } from "../types.js";

export class PromptLoader {
  private logger: Logger;
  private promptsPath: string;
  private cache: LRUCache<string, string>;
  private watcher?: FSWatcher;

  constructor(logger: Logger) {
    this.logger = logger;
    this.promptsPath =
      process.env.PROMPTS_PATH || path.join(process.cwd(), "prompts");

    // Initialize LRU cache
    const cacheSize = parseInt(process.env.CACHE_SIZE || "100", 10);
    this.cache = new LRUCache<string, string>({
      max: cacheSize,
      ttl: 1000 * 60 * 60, // 1 hour TTL
      updateAgeOnGet: true,
    });

    this.logger.debug(
      `Prompt loader initialized with path: ${this.promptsPath}`,
    );
  }

  /**
   * Load all prompts from filesystem
   */
  async loadAllPrompts(): Promise<PromptMetadata[]> {
    const prompts: PromptMetadata[] = [];

    try {
      // Load workflows
      const workflows = await this.loadPromptsFromCategory(
        "workflows",
        "workflow",
      );
      prompts.push(...workflows);

      // Load agents
      const agents = await this.loadPromptsFromCategory("agents", "agent");
      prompts.push(...agents);

      // Load skills
      const skills = await this.loadPromptsFromCategory("skills", "skill");
      prompts.push(...skills);
    } catch (error) {
      this.logger.error("Error loading prompts:", error);
      // Return empty array instead of throwing to allow server to start
      return [];
    }

    return prompts;
  }

  /**
   * Load prompts from a specific category directory
   */
  private async loadPromptsFromCategory(
    directory: string,
    category: "workflow" | "agent" | "skill",
  ): Promise<PromptMetadata[]> {
    const prompts: PromptMetadata[] = [];
    const categoryPath = path.join(this.promptsPath, directory);

    try {
      // Check if directory exists
      await fs.access(categoryPath);

      // Read all .md files in the directory
      const files = await fs.readdir(categoryPath);
      const mdFiles = files.filter((f) => f.endsWith(".md"));

      for (const file of mdFiles) {
        const filePath = path.join(categoryPath, file);
        const metadata = await this.loadPromptMetadata(filePath, category);
        if (metadata) {
          prompts.push(metadata);
        }
      }
    } catch (error) {
      this.logger.warn(`Category directory not found: ${categoryPath}`);
    }

    return prompts;
  }

  /**
   * Load metadata from a prompt file
   */
  private async loadPromptMetadata(
    filePath: string,
    category: "workflow" | "agent" | "skill",
  ): Promise<PromptMetadata | null> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const { data } = matter(content);

      // Extract name from filename if not in frontmatter
      const fileName = path.basename(filePath, ".md");
      const name = data.name || fileName;

      return {
        name,
        title: data.title || name,
        description: data.description || `${category} prompt: ${name}`,
        version: data.version || "1.0.0",
        arguments: data.arguments,
        tags: data.tags,
        estimatedTokens: data.estimatedTokens,
        category,
      };
    } catch (error) {
      this.logger.error(
        `Error loading prompt metadata from ${filePath}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Load prompt content with argument substitution
   */
  async loadPromptContent(
    metadata: PromptMetadata,
    args: Record<string, any>,
  ): Promise<string> {
    const cacheKey = `${metadata.name}:${JSON.stringify(args)}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      this.logger.debug(`Cache hit for prompt: ${metadata.name}`);
      return this.cache.get(cacheKey)!;
    }

    // Load from filesystem
    const filePath = path.join(
      this.promptsPath,
      `${metadata.category}s`,
      `${metadata.name}.md`,
    );

    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const { content } = matter(fileContent);

      // Perform argument substitution
      let processedContent = content;

      // Replace $ARGUMENTS with the first argument value (backward compatibility)
      // This handles cases where prompts use $ARGUMENTS as a generic placeholder
      if (metadata.arguments && metadata.arguments.length > 0) {
        const firstArgName = metadata.arguments[0].name;
        if (args[firstArgName]) {
          processedContent = processedContent.replace(
            /\$ARGUMENTS/g,
            String(args[firstArgName]),
          );
        }
      }

      // Replace individual argument placeholders like ${argument-name}
      for (const [key, value] of Object.entries(args)) {
        // Skip undefined/null values
        if (value === undefined || value === null) continue;

        const placeholder = `\$\{${key}\}`;
        processedContent = processedContent.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          String(value),
        );
      }

      // Cache the processed content
      this.cache.set(cacheKey, processedContent);
      this.logger.debug(`Cached prompt content: ${metadata.name}`);

      return processedContent;
    } catch (error) {
      this.logger.error(
        `Error loading prompt content for ${metadata.name}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Watch for changes in prompt files
   */
  watchForChanges(callback: () => void): void {
    if (this.watcher) {
      return; // Already watching
    }

    this.watcher = chokidar.watch(`${this.promptsPath}/**/*.md`, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on("all", (event: string, filePath: string) => {
      this.logger.info(`Prompt file ${event}: ${filePath}`);
      this.cache.clear(); // Clear cache on any change
      callback();
    });

    this.logger.info("Hot reload enabled for prompt files");
  }

  /**
   * Stop watching for changes
   */
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
  }
}
