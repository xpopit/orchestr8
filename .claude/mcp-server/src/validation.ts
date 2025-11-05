/**
 * Input validation schemas using Zod
 */

import { z } from 'zod';

export const AgentQueryParamsSchema = z.object({
  capability: z.string().max(100).optional(),
  role: z.string().max(50).optional(),
  context: z.string().max(500).optional(),
  limit: z.number().int().min(1).max(20).optional().default(5),
}).refine(
  (data) => data.capability || data.role || data.context,
  {
    message: 'At least one of capability, role, or context must be provided',
  }
);

export const PatternQueryParamsSchema = z.object({
  goal: z.string().min(1).max(500),
  context: z.string().max(500).optional(),
});

export const PatternSimilarityParamsSchema = z.object({
  goal: z.string().min(1).max(500),
  min_similarity: z.number().min(0).max(1).optional().default(0.7),
});

export const DecisionParamsSchema = z.object({
  task_id: z.string().min(1).max(100),
  task_description: z.string().min(1).max(1000),
  agents_used: z.array(z.string()).min(1),
  result: z.enum(['success', 'failure', 'partial']),
  duration_ms: z.number().int().min(0).optional(),
  tokens_saved: z.number().int().min(0).optional(),
});

export const SkillQueryParamsSchema = z.object({
  context: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

export const WorkflowQueryParamsSchema = z.object({
  goal: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

export const JSONRPCRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.any().optional(),
  id: z.union([z.number(), z.string()]),
});

/**
 * Validate and parse input with Zod schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validation that returns error instead of throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}
