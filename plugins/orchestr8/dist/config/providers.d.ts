import { Logger } from "../utils/logger.js";
import { ConfigLoader } from "./loader.js";
import { Config, AitmplProviderConfig, GithubProviderConfig, CustomProviderConfig } from "./schema.js";
export interface ProviderInfo {
    name: string;
    enabled: boolean;
    configured: boolean;
}
export declare class ProviderConfigManager {
    private logger;
    private configLoader;
    private config;
    constructor(logger: Logger, configLoader: ConfigLoader);
    initialize(): Promise<void>;
    getAvailableProviders(): ProviderInfo[];
    getEnabledProviders(): string[];
    private isAitmplConfigured;
    private isGithubConfigured;
    private isCustomConfigured;
    getAitmplConfig(): AitmplProviderConfig;
    getGithubConfig(): GithubProviderConfig;
    getCustomConfig(): CustomProviderConfig;
    getProviderDefaults(): {
        cacheTTL: number;
        timeout: number;
        retryAttempts: number;
        priority: number;
    };
    enableProvider(provider: "aitmpl" | "github" | "custom"): Promise<void>;
    disableProvider(provider: "aitmpl" | "github" | "custom"): Promise<void>;
    updateRateLimits(provider: "aitmpl", limits: {
        requestsPerMinute?: number;
        requestsPerHour?: number;
    }): Promise<void>;
    updateCacheTTL(provider: "aitmpl" | "github" | "custom", cacheTTL: number): Promise<void>;
    updateTimeout(provider: "aitmpl" | "github" | "custom", timeout: number): Promise<void>;
    updateRetryAttempts(provider: "aitmpl" | "github" | "custom", retryAttempts: number): Promise<void>;
    reload(): Promise<void>;
    getConfig(): Config;
    private ensureInitialized;
    validateConfiguration(): {
        valid: boolean;
        warnings: string[];
        errors: string[];
    };
}
