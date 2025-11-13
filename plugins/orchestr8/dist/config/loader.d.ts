import { Logger } from "../utils/logger.js";
import { Config } from "./schema.js";
export interface ConfigSource {
    name: string;
    priority: number;
    config: Partial<Config>;
}
export declare class ConfigLoader {
    private logger;
    private config;
    private configSources;
    private projectRoot;
    constructor(logger: Logger, projectRoot?: string);
    load(): Promise<Config>;
    private loadUserConfig;
    private loadProjectConfig;
    private loadEnvConfig;
    private mergeConfigs;
    private deepMerge;
    private isObject;
    private logConfigSummary;
    getConfig(): Config;
    reload(): Promise<Config>;
    updateConfig(updates: Partial<Config>): Promise<Config>;
    isProviderEnabled(provider: "aitmpl" | "github" | "custom"): boolean;
    getProviderConfig<T extends "aitmpl" | "github" | "custom">(provider: T): Config["resourceProviders"][T];
}
