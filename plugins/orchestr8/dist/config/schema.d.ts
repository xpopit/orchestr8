import { z } from "zod";
declare const rateLimitSchema: z.ZodObject<{
    requestsPerMinute: z.ZodDefault<z.ZodNumber>;
    requestsPerHour: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    requestsPerMinute: number;
    requestsPerHour: number;
}, {
    requestsPerMinute?: number | undefined;
    requestsPerHour?: number | undefined;
}>;
declare const aitmplProviderSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    apiUrl: z.ZodDefault<z.ZodString>;
    cacheTTL: z.ZodDefault<z.ZodNumber>;
    categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    rateLimit: z.ZodDefault<z.ZodObject<{
        requestsPerMinute: z.ZodDefault<z.ZodNumber>;
        requestsPerHour: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestsPerMinute: number;
        requestsPerHour: number;
    }, {
        requestsPerMinute?: number | undefined;
        requestsPerHour?: number | undefined;
    }>>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    apiUrl: string;
    cacheTTL: number;
    categories: string[];
    rateLimit: {
        requestsPerMinute: number;
        requestsPerHour: number;
    };
    timeout: number;
    retryAttempts: number;
}, {
    enabled?: boolean | undefined;
    apiUrl?: string | undefined;
    cacheTTL?: number | undefined;
    categories?: string[] | undefined;
    rateLimit?: {
        requestsPerMinute?: number | undefined;
        requestsPerHour?: number | undefined;
    } | undefined;
    timeout?: number | undefined;
    retryAttempts?: number | undefined;
}>;
declare const githubAuthSchema: z.ZodObject<{
    token: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["personal", "oauth"]>>;
}, "strip", z.ZodTypeAny, {
    type: "personal" | "oauth";
    token: string;
}, {
    token: string;
    type?: "personal" | "oauth" | undefined;
}>;
declare const githubProviderSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    repos: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    branch: z.ZodDefault<z.ZodString>;
    cacheTTL: z.ZodDefault<z.ZodNumber>;
    auth: z.ZodOptional<z.ZodObject<{
        token: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["personal", "oauth"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "personal" | "oauth";
        token: string;
    }, {
        token: string;
        type?: "personal" | "oauth" | undefined;
    }>>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    cacheTTL: number;
    timeout: number;
    retryAttempts: number;
    repos: string[];
    branch: string;
    auth?: {
        type: "personal" | "oauth";
        token: string;
    } | undefined;
}, {
    auth?: {
        token: string;
        type?: "personal" | "oauth" | undefined;
    } | undefined;
    enabled?: boolean | undefined;
    cacheTTL?: number | undefined;
    timeout?: number | undefined;
    retryAttempts?: number | undefined;
    repos?: string[] | undefined;
    branch?: string | undefined;
}>;
declare const customEndpointSchema: z.ZodObject<{
    name: z.ZodString;
    url: z.ZodString;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    url: string;
    headers?: Record<string, string> | undefined;
}, {
    name: string;
    url: string;
    headers?: Record<string, string> | undefined;
}>;
declare const customProviderSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    endpoints: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        url: z.ZodString;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        url: string;
        headers?: Record<string, string> | undefined;
    }, {
        name: string;
        url: string;
        headers?: Record<string, string> | undefined;
    }>, "many">>;
    cacheTTL: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    cacheTTL: number;
    timeout: number;
    retryAttempts: number;
    endpoints: {
        name: string;
        url: string;
        headers?: Record<string, string> | undefined;
    }[];
}, {
    enabled?: boolean | undefined;
    cacheTTL?: number | undefined;
    timeout?: number | undefined;
    retryAttempts?: number | undefined;
    endpoints?: {
        name: string;
        url: string;
        headers?: Record<string, string> | undefined;
    }[] | undefined;
}>;
declare const resourceProvidersSchema: z.ZodObject<{
    aitmpl: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        apiUrl: z.ZodDefault<z.ZodString>;
        cacheTTL: z.ZodDefault<z.ZodNumber>;
        categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        rateLimit: z.ZodDefault<z.ZodObject<{
            requestsPerMinute: z.ZodDefault<z.ZodNumber>;
            requestsPerHour: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            requestsPerMinute: number;
            requestsPerHour: number;
        }, {
            requestsPerMinute?: number | undefined;
            requestsPerHour?: number | undefined;
        }>>;
        timeout: z.ZodDefault<z.ZodNumber>;
        retryAttempts: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        apiUrl: string;
        cacheTTL: number;
        categories: string[];
        rateLimit: {
            requestsPerMinute: number;
            requestsPerHour: number;
        };
        timeout: number;
        retryAttempts: number;
    }, {
        enabled?: boolean | undefined;
        apiUrl?: string | undefined;
        cacheTTL?: number | undefined;
        categories?: string[] | undefined;
        rateLimit?: {
            requestsPerMinute?: number | undefined;
            requestsPerHour?: number | undefined;
        } | undefined;
        timeout?: number | undefined;
        retryAttempts?: number | undefined;
    }>>;
    github: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        repos: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        branch: z.ZodDefault<z.ZodString>;
        cacheTTL: z.ZodDefault<z.ZodNumber>;
        auth: z.ZodOptional<z.ZodObject<{
            token: z.ZodString;
            type: z.ZodDefault<z.ZodEnum<["personal", "oauth"]>>;
        }, "strip", z.ZodTypeAny, {
            type: "personal" | "oauth";
            token: string;
        }, {
            token: string;
            type?: "personal" | "oauth" | undefined;
        }>>;
        timeout: z.ZodDefault<z.ZodNumber>;
        retryAttempts: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        cacheTTL: number;
        timeout: number;
        retryAttempts: number;
        repos: string[];
        branch: string;
        auth?: {
            type: "personal" | "oauth";
            token: string;
        } | undefined;
    }, {
        auth?: {
            token: string;
            type?: "personal" | "oauth" | undefined;
        } | undefined;
        enabled?: boolean | undefined;
        cacheTTL?: number | undefined;
        timeout?: number | undefined;
        retryAttempts?: number | undefined;
        repos?: string[] | undefined;
        branch?: string | undefined;
    }>>;
    custom: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        endpoints: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            url: string;
            headers?: Record<string, string> | undefined;
        }, {
            name: string;
            url: string;
            headers?: Record<string, string> | undefined;
        }>, "many">>;
        cacheTTL: z.ZodDefault<z.ZodNumber>;
        timeout: z.ZodDefault<z.ZodNumber>;
        retryAttempts: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        cacheTTL: number;
        timeout: number;
        retryAttempts: number;
        endpoints: {
            name: string;
            url: string;
            headers?: Record<string, string> | undefined;
        }[];
    }, {
        enabled?: boolean | undefined;
        cacheTTL?: number | undefined;
        timeout?: number | undefined;
        retryAttempts?: number | undefined;
        endpoints?: {
            name: string;
            url: string;
            headers?: Record<string, string> | undefined;
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    aitmpl: {
        enabled: boolean;
        apiUrl: string;
        cacheTTL: number;
        categories: string[];
        rateLimit: {
            requestsPerMinute: number;
            requestsPerHour: number;
        };
        timeout: number;
        retryAttempts: number;
    };
    github: {
        enabled: boolean;
        cacheTTL: number;
        timeout: number;
        retryAttempts: number;
        repos: string[];
        branch: string;
        auth?: {
            type: "personal" | "oauth";
            token: string;
        } | undefined;
    };
    custom: {
        enabled: boolean;
        cacheTTL: number;
        timeout: number;
        retryAttempts: number;
        endpoints: {
            name: string;
            url: string;
            headers?: Record<string, string> | undefined;
        }[];
    };
}, {
    aitmpl?: {
        enabled?: boolean | undefined;
        apiUrl?: string | undefined;
        cacheTTL?: number | undefined;
        categories?: string[] | undefined;
        rateLimit?: {
            requestsPerMinute?: number | undefined;
            requestsPerHour?: number | undefined;
        } | undefined;
        timeout?: number | undefined;
        retryAttempts?: number | undefined;
    } | undefined;
    github?: {
        auth?: {
            token: string;
            type?: "personal" | "oauth" | undefined;
        } | undefined;
        enabled?: boolean | undefined;
        cacheTTL?: number | undefined;
        timeout?: number | undefined;
        retryAttempts?: number | undefined;
        repos?: string[] | undefined;
        branch?: string | undefined;
    } | undefined;
    custom?: {
        enabled?: boolean | undefined;
        cacheTTL?: number | undefined;
        timeout?: number | undefined;
        retryAttempts?: number | undefined;
        endpoints?: {
            name: string;
            url: string;
            headers?: Record<string, string> | undefined;
        }[] | undefined;
    } | undefined;
}>;
declare const providerDefaultsSchema: z.ZodObject<{
    priority: z.ZodDefault<z.ZodNumber>;
    cacheTTL: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    cacheTTL: number;
    timeout: number;
    retryAttempts: number;
    priority: number;
}, {
    cacheTTL?: number | undefined;
    timeout?: number | undefined;
    retryAttempts?: number | undefined;
    priority?: number | undefined;
}>;
export declare const configSchema: z.ZodObject<{
    resourceProviders: z.ZodDefault<z.ZodObject<{
        aitmpl: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            apiUrl: z.ZodDefault<z.ZodString>;
            cacheTTL: z.ZodDefault<z.ZodNumber>;
            categories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            rateLimit: z.ZodDefault<z.ZodObject<{
                requestsPerMinute: z.ZodDefault<z.ZodNumber>;
                requestsPerHour: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                requestsPerMinute: number;
                requestsPerHour: number;
            }, {
                requestsPerMinute?: number | undefined;
                requestsPerHour?: number | undefined;
            }>>;
            timeout: z.ZodDefault<z.ZodNumber>;
            retryAttempts: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            apiUrl: string;
            cacheTTL: number;
            categories: string[];
            rateLimit: {
                requestsPerMinute: number;
                requestsPerHour: number;
            };
            timeout: number;
            retryAttempts: number;
        }, {
            enabled?: boolean | undefined;
            apiUrl?: string | undefined;
            cacheTTL?: number | undefined;
            categories?: string[] | undefined;
            rateLimit?: {
                requestsPerMinute?: number | undefined;
                requestsPerHour?: number | undefined;
            } | undefined;
            timeout?: number | undefined;
            retryAttempts?: number | undefined;
        }>>;
        github: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            repos: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            branch: z.ZodDefault<z.ZodString>;
            cacheTTL: z.ZodDefault<z.ZodNumber>;
            auth: z.ZodOptional<z.ZodObject<{
                token: z.ZodString;
                type: z.ZodDefault<z.ZodEnum<["personal", "oauth"]>>;
            }, "strip", z.ZodTypeAny, {
                type: "personal" | "oauth";
                token: string;
            }, {
                token: string;
                type?: "personal" | "oauth" | undefined;
            }>>;
            timeout: z.ZodDefault<z.ZodNumber>;
            retryAttempts: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            cacheTTL: number;
            timeout: number;
            retryAttempts: number;
            repos: string[];
            branch: string;
            auth?: {
                type: "personal" | "oauth";
                token: string;
            } | undefined;
        }, {
            auth?: {
                token: string;
                type?: "personal" | "oauth" | undefined;
            } | undefined;
            enabled?: boolean | undefined;
            cacheTTL?: number | undefined;
            timeout?: number | undefined;
            retryAttempts?: number | undefined;
            repos?: string[] | undefined;
            branch?: string | undefined;
        }>>;
        custom: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            endpoints: z.ZodDefault<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
                headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
                headers?: Record<string, string> | undefined;
            }, {
                name: string;
                url: string;
                headers?: Record<string, string> | undefined;
            }>, "many">>;
            cacheTTL: z.ZodDefault<z.ZodNumber>;
            timeout: z.ZodDefault<z.ZodNumber>;
            retryAttempts: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            cacheTTL: number;
            timeout: number;
            retryAttempts: number;
            endpoints: {
                name: string;
                url: string;
                headers?: Record<string, string> | undefined;
            }[];
        }, {
            enabled?: boolean | undefined;
            cacheTTL?: number | undefined;
            timeout?: number | undefined;
            retryAttempts?: number | undefined;
            endpoints?: {
                name: string;
                url: string;
                headers?: Record<string, string> | undefined;
            }[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        aitmpl: {
            enabled: boolean;
            apiUrl: string;
            cacheTTL: number;
            categories: string[];
            rateLimit: {
                requestsPerMinute: number;
                requestsPerHour: number;
            };
            timeout: number;
            retryAttempts: number;
        };
        github: {
            enabled: boolean;
            cacheTTL: number;
            timeout: number;
            retryAttempts: number;
            repos: string[];
            branch: string;
            auth?: {
                type: "personal" | "oauth";
                token: string;
            } | undefined;
        };
        custom: {
            enabled: boolean;
            cacheTTL: number;
            timeout: number;
            retryAttempts: number;
            endpoints: {
                name: string;
                url: string;
                headers?: Record<string, string> | undefined;
            }[];
        };
    }, {
        aitmpl?: {
            enabled?: boolean | undefined;
            apiUrl?: string | undefined;
            cacheTTL?: number | undefined;
            categories?: string[] | undefined;
            rateLimit?: {
                requestsPerMinute?: number | undefined;
                requestsPerHour?: number | undefined;
            } | undefined;
            timeout?: number | undefined;
            retryAttempts?: number | undefined;
        } | undefined;
        github?: {
            auth?: {
                token: string;
                type?: "personal" | "oauth" | undefined;
            } | undefined;
            enabled?: boolean | undefined;
            cacheTTL?: number | undefined;
            timeout?: number | undefined;
            retryAttempts?: number | undefined;
            repos?: string[] | undefined;
            branch?: string | undefined;
        } | undefined;
        custom?: {
            enabled?: boolean | undefined;
            cacheTTL?: number | undefined;
            timeout?: number | undefined;
            retryAttempts?: number | undefined;
            endpoints?: {
                name: string;
                url: string;
                headers?: Record<string, string> | undefined;
            }[] | undefined;
        } | undefined;
    }>>;
    providerDefaults: z.ZodDefault<z.ZodObject<{
        priority: z.ZodDefault<z.ZodNumber>;
        cacheTTL: z.ZodDefault<z.ZodNumber>;
        timeout: z.ZodDefault<z.ZodNumber>;
        retryAttempts: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        cacheTTL: number;
        timeout: number;
        retryAttempts: number;
        priority: number;
    }, {
        cacheTTL?: number | undefined;
        timeout?: number | undefined;
        retryAttempts?: number | undefined;
        priority?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    resourceProviders: {
        aitmpl: {
            enabled: boolean;
            apiUrl: string;
            cacheTTL: number;
            categories: string[];
            rateLimit: {
                requestsPerMinute: number;
                requestsPerHour: number;
            };
            timeout: number;
            retryAttempts: number;
        };
        github: {
            enabled: boolean;
            cacheTTL: number;
            timeout: number;
            retryAttempts: number;
            repos: string[];
            branch: string;
            auth?: {
                type: "personal" | "oauth";
                token: string;
            } | undefined;
        };
        custom: {
            enabled: boolean;
            cacheTTL: number;
            timeout: number;
            retryAttempts: number;
            endpoints: {
                name: string;
                url: string;
                headers?: Record<string, string> | undefined;
            }[];
        };
    };
    providerDefaults: {
        cacheTTL: number;
        timeout: number;
        retryAttempts: number;
        priority: number;
    };
}, {
    resourceProviders?: {
        aitmpl?: {
            enabled?: boolean | undefined;
            apiUrl?: string | undefined;
            cacheTTL?: number | undefined;
            categories?: string[] | undefined;
            rateLimit?: {
                requestsPerMinute?: number | undefined;
                requestsPerHour?: number | undefined;
            } | undefined;
            timeout?: number | undefined;
            retryAttempts?: number | undefined;
        } | undefined;
        github?: {
            auth?: {
                token: string;
                type?: "personal" | "oauth" | undefined;
            } | undefined;
            enabled?: boolean | undefined;
            cacheTTL?: number | undefined;
            timeout?: number | undefined;
            retryAttempts?: number | undefined;
            repos?: string[] | undefined;
            branch?: string | undefined;
        } | undefined;
        custom?: {
            enabled?: boolean | undefined;
            cacheTTL?: number | undefined;
            timeout?: number | undefined;
            retryAttempts?: number | undefined;
            endpoints?: {
                name: string;
                url: string;
                headers?: Record<string, string> | undefined;
            }[] | undefined;
        } | undefined;
    } | undefined;
    providerDefaults?: {
        cacheTTL?: number | undefined;
        timeout?: number | undefined;
        retryAttempts?: number | undefined;
        priority?: number | undefined;
    } | undefined;
}>;
export type RateLimitConfig = z.infer<typeof rateLimitSchema>;
export type AitmplProviderConfig = z.infer<typeof aitmplProviderSchema>;
export type GithubAuthConfig = z.infer<typeof githubAuthSchema>;
export type GithubProviderConfig = z.infer<typeof githubProviderSchema>;
export type CustomEndpointConfig = z.infer<typeof customEndpointSchema>;
export type CustomProviderConfig = z.infer<typeof customProviderSchema>;
export type ResourceProvidersConfig = z.infer<typeof resourceProvidersSchema>;
export type ProviderDefaultsConfig = z.infer<typeof providerDefaultsSchema>;
export type Config = z.infer<typeof configSchema>;
export declare function validateConfig(config: unknown): Config;
export declare function safeValidateConfig(config: unknown): {
    success: boolean;
    data?: Config;
    errors?: Array<{
        path: string;
        message: string;
    }>;
};
export declare function getDefaultConfig(): Config;
export {};
