import { z } from "zod";
const rateLimitSchema = z.object({
    requestsPerMinute: z.number().int().positive().default(60),
    requestsPerHour: z.number().int().positive().default(1000),
});
const aitmplProviderSchema = z.object({
    enabled: z.boolean().default(true),
    apiUrl: z.string().url().default("https://api.aitmpl.com"),
    cacheTTL: z.number().int().positive().default(3600000),
    categories: z.array(z.string()).default([
        "agents",
        "skills",
        "workflows",
        "patterns",
        "examples",
        "best-practices",
    ]),
    rateLimit: rateLimitSchema.default({
        requestsPerMinute: 60,
        requestsPerHour: 1000,
    }),
    timeout: z.number().int().positive().default(30000),
    retryAttempts: z.number().int().min(0).default(3),
});
const githubAuthSchema = z.object({
    token: z.string().min(1),
    type: z.enum(["personal", "oauth"]).default("personal"),
});
const githubProviderSchema = z.object({
    enabled: z.boolean().default(false),
    repos: z.array(z.string()).default([]),
    branch: z.string().default("main"),
    cacheTTL: z.number().int().positive().default(3600000),
    auth: githubAuthSchema.optional(),
    timeout: z.number().int().positive().default(30000),
    retryAttempts: z.number().int().min(0).default(3),
});
const customEndpointSchema = z.object({
    name: z.string().min(1),
    url: z.string().url(),
    headers: z.record(z.string()).optional(),
});
const customProviderSchema = z.object({
    enabled: z.boolean().default(false),
    endpoints: z.array(customEndpointSchema).default([]),
    cacheTTL: z.number().int().positive().default(3600000),
    timeout: z.number().int().positive().default(30000),
    retryAttempts: z.number().int().min(0).default(3),
});
const resourceProvidersSchema = z.object({
    aitmpl: aitmplProviderSchema.default({}),
    github: githubProviderSchema.default({}),
    custom: customProviderSchema.default({}),
});
const providerDefaultsSchema = z.object({
    priority: z.number().int().min(0).default(100),
    cacheTTL: z.number().int().positive().default(3600000),
    timeout: z.number().int().positive().default(30000),
    retryAttempts: z.number().int().min(0).default(3),
});
export const configSchema = z.object({
    resourceProviders: resourceProvidersSchema.default({}),
    providerDefaults: providerDefaultsSchema.default({}),
});
export function validateConfig(config) {
    return configSchema.parse(config);
}
export function safeValidateConfig(config) {
    const result = configSchema.safeParse(config);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
    }));
    return { success: false, errors };
}
export function getDefaultConfig() {
    return configSchema.parse({});
}
