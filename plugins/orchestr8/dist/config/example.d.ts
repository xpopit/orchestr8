import { ConfigLoader, ProviderConfigManager } from "./index.js";
export declare function exampleGetDefaults(): void;
export declare function exampleLoadConfig(): Promise<ConfigLoader>;
export declare function exampleProviderManager(): Promise<ProviderConfigManager>;
export declare function exampleRuntimeUpdates(): Promise<void>;
export declare function exampleCheckProvider(): Promise<void>;
export declare function runAllExamples(): Promise<void>;
