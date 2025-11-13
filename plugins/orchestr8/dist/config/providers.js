export class ProviderConfigManager {
    logger;
    configLoader;
    config = null;
    constructor(logger, configLoader) {
        this.logger = logger;
        this.configLoader = configLoader;
    }
    async initialize() {
        this.logger.info("Initializing provider configuration");
        this.config = await this.configLoader.load();
        this.logger.info("Provider configuration initialized");
    }
    getAvailableProviders() {
        this.ensureInitialized();
        return [
            {
                name: "aitmpl",
                enabled: this.config.resourceProviders.aitmpl.enabled,
                configured: this.isAitmplConfigured(),
            },
            {
                name: "github",
                enabled: this.config.resourceProviders.github.enabled,
                configured: this.isGithubConfigured(),
            },
            {
                name: "custom",
                enabled: this.config.resourceProviders.custom.enabled,
                configured: this.isCustomConfigured(),
            },
        ];
    }
    getEnabledProviders() {
        return this.getAvailableProviders()
            .filter((p) => p.enabled && p.configured)
            .map((p) => p.name);
    }
    isAitmplConfigured() {
        const config = this.config.resourceProviders.aitmpl;
        return !!(config.apiUrl && config.categories.length > 0);
    }
    isGithubConfigured() {
        const config = this.config.resourceProviders.github;
        return !!(config.repos.length > 0 && config.branch);
    }
    isCustomConfigured() {
        const config = this.config.resourceProviders.custom;
        return config.endpoints.length > 0;
    }
    getAitmplConfig() {
        this.ensureInitialized();
        return this.config.resourceProviders.aitmpl;
    }
    getGithubConfig() {
        this.ensureInitialized();
        return this.config.resourceProviders.github;
    }
    getCustomConfig() {
        this.ensureInitialized();
        return this.config.resourceProviders.custom;
    }
    getProviderDefaults() {
        this.ensureInitialized();
        return this.config.providerDefaults;
    }
    async enableProvider(provider) {
        this.ensureInitialized();
        this.logger.info(`Enabling provider: ${provider}`);
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...this.config.resourceProviders[provider],
                    enabled: true,
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Provider ${provider} enabled`);
    }
    async disableProvider(provider) {
        this.ensureInitialized();
        this.logger.info(`Disabling provider: ${provider}`);
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...this.config.resourceProviders[provider],
                    enabled: false,
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Provider ${provider} disabled`);
    }
    async updateRateLimits(provider, limits) {
        this.ensureInitialized();
        this.logger.info(`Updating rate limits for provider: ${provider}`, limits);
        const currentConfig = this.config.resourceProviders[provider];
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...currentConfig,
                    rateLimit: {
                        ...currentConfig.rateLimit,
                        ...limits,
                    },
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Rate limits updated for provider ${provider}`);
    }
    async updateCacheTTL(provider, cacheTTL) {
        this.ensureInitialized();
        this.logger.info(`Updating cache TTL for provider: ${provider}`, { cacheTTL });
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...this.config.resourceProviders[provider],
                    cacheTTL,
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Cache TTL updated for provider ${provider}`);
    }
    async updateTimeout(provider, timeout) {
        this.ensureInitialized();
        this.logger.info(`Updating timeout for provider: ${provider}`, { timeout });
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...this.config.resourceProviders[provider],
                    timeout,
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Timeout updated for provider ${provider}`);
    }
    async updateRetryAttempts(provider, retryAttempts) {
        this.ensureInitialized();
        this.logger.info(`Updating retry attempts for provider: ${provider}`, { retryAttempts });
        const updates = {
            resourceProviders: {
                ...this.config.resourceProviders,
                [provider]: {
                    ...this.config.resourceProviders[provider],
                    retryAttempts,
                },
            },
        };
        this.config = await this.configLoader.updateConfig(updates);
        this.logger.info(`Retry attempts updated for provider ${provider}`);
    }
    async reload() {
        this.logger.info("Reloading provider configuration");
        this.config = await this.configLoader.reload();
        this.logger.info("Provider configuration reloaded");
    }
    getConfig() {
        this.ensureInitialized();
        return this.config;
    }
    ensureInitialized() {
        if (!this.config) {
            throw new Error("Provider configuration not initialized. Call initialize() first.");
        }
    }
    validateConfiguration() {
        this.ensureInitialized();
        const warnings = [];
        const errors = [];
        if (this.config.resourceProviders.aitmpl.enabled) {
            if (!this.isAitmplConfigured()) {
                warnings.push("AITMPL provider is enabled but not properly configured");
            }
        }
        if (this.config.resourceProviders.github.enabled) {
            if (!this.isGithubConfigured()) {
                warnings.push("GitHub provider is enabled but not properly configured (missing repos or branch)");
            }
            if (!this.config.resourceProviders.github.auth) {
                warnings.push("GitHub provider is enabled without authentication token (rate limits will apply)");
            }
        }
        if (this.config.resourceProviders.custom.enabled) {
            if (!this.isCustomConfigured()) {
                warnings.push("Custom provider is enabled but has no endpoints configured");
            }
        }
        const enabledProviders = this.getEnabledProviders();
        if (enabledProviders.length === 0) {
            warnings.push("No resource providers are enabled");
        }
        warnings.forEach((warning) => this.logger.warn(warning));
        errors.forEach((error) => this.logger.error(error));
        return {
            valid: errors.length === 0,
            warnings,
            errors,
        };
    }
}
