export interface PromptMetadata {
    name: string;
    title: string;
    description: string;
    version: string;
    arguments?: PromptArgument[];
    tags?: string[];
    estimatedTokens?: number;
    category: "workflow" | "agent" | "skill";
}
export interface PromptArgument {
    name: string;
    description: string;
    required?: boolean;
    default?: any;
}
export interface ResourceMetadata {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    category: string;
}
export type ResourceProviderType = "aitmpl" | "github" | "custom" | "local";
export interface ResourceProviderMetadata {
    type: ResourceProviderType;
    name: string;
    enabled: boolean;
    priority: number;
}
