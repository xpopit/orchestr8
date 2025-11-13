import { Logger } from "../utils/logger.js";
import { PromptMetadata } from "../types.js";
export declare class PromptLoader {
    private logger;
    private promptsPath;
    private cache;
    private watcher?;
    constructor(logger: Logger);
    loadAllPrompts(): Promise<PromptMetadata[]>;
    private loadPromptsFromCategory;
    private loadPromptMetadata;
    loadPromptContent(metadata: PromptMetadata, args: Record<string, any>): Promise<string>;
    watchForChanges(callback: () => void): void;
    stopWatching(): Promise<void>;
}
