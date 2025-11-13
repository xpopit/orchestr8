export class ProviderError extends Error {
    provider;
    code;
    statusCode;
    cause;
    constructor(message, provider, code, statusCode, cause) {
        super(message);
        this.provider = provider;
        this.code = code;
        this.statusCode = statusCode;
        this.cause = cause;
        this.name = "ProviderError";
    }
}
export class ProviderTimeoutError extends ProviderError {
    constructor(provider, timeout, cause) {
        super(`Provider ${provider} request timed out after ${timeout}ms`, provider, "TIMEOUT", 408, cause);
        this.name = "ProviderTimeoutError";
    }
}
export class ProviderUnavailableError extends ProviderError {
    constructor(provider, reason, cause) {
        super(`Provider ${provider} is unavailable${reason ? `: ${reason}` : ""}`, provider, "UNAVAILABLE", 503, cause);
        this.name = "ProviderUnavailableError";
    }
}
export class ResourceNotFoundError extends ProviderError {
    constructor(provider, resourceId, category, cause) {
        super(`Resource ${resourceId}${category ? ` in category ${category}` : ""} not found in provider ${provider}`, provider, "NOT_FOUND", 404, cause);
        this.name = "ResourceNotFoundError";
        this.resourceId = resourceId;
        this.category = category;
    }
    resourceId;
    category;
}
export class ProviderAuthenticationError extends ProviderError {
    constructor(provider, reason, cause) {
        super(`Authentication failed for provider ${provider}${reason ? `: ${reason}` : ""}`, provider, "AUTH_FAILED", 401, cause);
        this.name = "ProviderAuthenticationError";
    }
}
export class RateLimitError extends ProviderError {
    constructor(provider, retryAfter, cause) {
        super(`Rate limit exceeded for provider ${provider}${retryAfter ? `, retry after ${retryAfter}ms` : ""}`, provider, "RATE_LIMIT", 429, cause);
        this.name = "RateLimitError";
        this.retryAfter = retryAfter;
    }
    retryAfter;
}
