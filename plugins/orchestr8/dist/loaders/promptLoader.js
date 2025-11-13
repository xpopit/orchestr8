import fs from "fs/promises";
import path from "path";
import { LRUCache } from "lru-cache";
import chokidar from "chokidar";
import matter from "gray-matter";
export class PromptLoader {
    logger;
    promptsPath;
    cache;
    watcher;
    constructor(logger) {
        this.logger = logger;
        this.promptsPath =
            process.env.PROMPTS_PATH || path.join(process.cwd(), "prompts");
        const cacheSize = parseInt(process.env.CACHE_SIZE || "100", 10);
        this.cache = new LRUCache({
            max: cacheSize,
            ttl: 1000 * 60 * 60,
            updateAgeOnGet: true,
        });
        this.logger.debug(`Prompt loader initialized with path: ${this.promptsPath}`);
    }
    async loadAllPrompts() {
        const prompts = [];
        try {
            const workflows = await this.loadPromptsFromCategory("workflows", "workflow");
            prompts.push(...workflows);
            const agents = await this.loadPromptsFromCategory("agents", "agent");
            prompts.push(...agents);
            const skills = await this.loadPromptsFromCategory("skills", "skill");
            prompts.push(...skills);
        }
        catch (error) {
            this.logger.error("Error loading prompts:", error);
            return [];
        }
        return prompts;
    }
    async loadPromptsFromCategory(directory, category) {
        const prompts = [];
        const categoryPath = path.join(this.promptsPath, directory);
        try {
            await fs.access(categoryPath);
            const files = await fs.readdir(categoryPath);
            const mdFiles = files.filter((f) => f.endsWith(".md"));
            for (const file of mdFiles) {
                const filePath = path.join(categoryPath, file);
                const metadata = await this.loadPromptMetadata(filePath, category);
                if (metadata) {
                    prompts.push(metadata);
                }
            }
        }
        catch (error) {
            this.logger.warn(`Category directory not found: ${categoryPath}`);
        }
        return prompts;
    }
    async loadPromptMetadata(filePath, category) {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            const { data } = matter(content);
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
        }
        catch (error) {
            this.logger.error(`Error loading prompt metadata from ${filePath}:`, error);
            return null;
        }
    }
    async loadPromptContent(metadata, args) {
        const cacheKey = `${metadata.name}:${JSON.stringify(args)}`;
        if (this.cache.has(cacheKey)) {
            this.logger.debug(`Cache hit for prompt: ${metadata.name}`);
            return this.cache.get(cacheKey);
        }
        const filePath = path.join(this.promptsPath, `${metadata.category}s`, `${metadata.name}.md`);
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            const { content } = matter(fileContent);
            let processedContent = content;
            if (metadata.arguments && metadata.arguments.length > 0) {
                const firstArgName = metadata.arguments[0].name;
                if (args[firstArgName]) {
                    processedContent = processedContent.replace(/\$ARGUMENTS/g, String(args[firstArgName]));
                }
            }
            for (const [key, value] of Object.entries(args)) {
                if (value === undefined || value === null)
                    continue;
                const placeholder = `\$\{${key}\}`;
                processedContent = processedContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), String(value));
            }
            this.cache.set(cacheKey, processedContent);
            this.logger.debug(`Cached prompt content: ${metadata.name}`);
            return processedContent;
        }
        catch (error) {
            this.logger.error(`Error loading prompt content for ${metadata.name}:`, error);
            throw error;
        }
    }
    watchForChanges(callback) {
        if (this.watcher) {
            return;
        }
        this.watcher = chokidar.watch(`${this.promptsPath}/**/*.md`, {
            persistent: true,
            ignoreInitial: true,
        });
        this.watcher.on("all", (event, filePath) => {
            this.logger.info(`Prompt file ${event}: ${filePath}`);
            this.cache.clear();
            callback();
        });
        this.logger.info("Hot reload enabled for prompt files");
    }
    async stopWatching() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = undefined;
        }
    }
}
