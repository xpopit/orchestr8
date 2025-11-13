export const CATEGORY_MAPPING = {
    agent: "agent",
    skill: "skill",
    command: "workflow",
    template: "example",
    mcp: "pattern",
    hook: "pattern",
    setting: "pattern",
};
export const AITMPL_DATA_SOURCES = {
    COMPONENTS_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/components.json",
    METADATA_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/components-metadata.json",
    TRENDING_JSON: "https://raw.githubusercontent.com/davila7/claude-code-templates/main/docs/trending-data.json",
    GITHUB_REPO: "https://github.com/davila7/claude-code-templates",
    GITHUB_API: "https://api.github.com/repos/davila7/claude-code-templates",
};
export const AITMPL_DEFAULTS = {
    CACHE_TTL: 24 * 60 * 60 * 1000,
    RESOURCE_CACHE_TTL: 7 * 24 * 60 * 60 * 1000,
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RATE_LIMIT_PER_MINUTE: 60,
    RATE_LIMIT_PER_HOUR: 1000,
    USER_AGENT: "orchestr8-mcp/8.0.0",
    MAX_CACHE_SIZE: 500,
    MIN_ESTIMATED_TOKENS: 100,
    BACKOFF_BASE: 1000,
    MAX_BACKOFF: 60000,
};
