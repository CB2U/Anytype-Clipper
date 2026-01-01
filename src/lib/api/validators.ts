/**
 * Zod validation schemas for Anytype API
 *
 * Provides runtime validation for API responses to catch contract violations.
 * These schemas match the TypeScript interfaces in types.ts.
 */

import { z } from 'zod';
import { ValidationError } from './errors';

// ============================================================================
// Authentication Schemas
// ============================================================================

/**
 * Schema for CreateChallengeResponse
 */
export const createChallengeResponseSchema = z.object({
    challengeId: z.string(),
    code: z.string().length(4, 'Challenge code must be exactly 4 characters'),
    expiresAt: z.number().int().positive(),
});

/**
 * Schema for CreateApiKeyResponse
 */
export const createApiKeyResponseSchema = z.object({
    apiKey: z.string().min(1, 'API key cannot be empty'),
    expiresAt: z.number().int().positive().optional(),
});

// ============================================================================
// Spaces Schemas
// ============================================================================

/**
 * Schema for Space object
 */
export const spaceSchema = z.object({
    id: z.string(),
    name: z.string(),
    iconEmoji: z.string().optional(),
    iconImage: z.string().optional(),
});

/**
 * Schema for ListSpacesResponse
 */
export const listSpacesResponseSchema = z.object({
    spaces: z.array(spaceSchema),
});

// ============================================================================
// Objects Schemas
// ============================================================================

/**
 * Schema for CreateObjectResponse
 */
export const createObjectResponseSchema = z.object({
    objectId: z.string(),
    url: z.string().optional(),
});

/**
 * Schema for AnytypeObject
 */
export const anytypeObjectSchema = z.object({
    id: z.string(),
    typeId: z.string(),
    properties: z.record(z.string(), z.unknown()),
    createdAt: z.number().int().positive(),
    updatedAt: z.number().int().positive(),
});

/**
 * Schema for SearchObjectsResponse
 */
export const searchObjectsResponseSchema = z.object({
    objects: z.array(anytypeObjectSchema),
    total: z.number().int().nonnegative(),
});

/**
 * Schema for UpdateObjectResponse
 */
export const updateObjectResponseSchema = z.object({
    objectId: z.string(),
    updatedAt: z.number().int().positive(),
});

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validates data against a Zod schema and returns typed result
 *
 * @param data - Data to validate (typically from API response)
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 *
 * @example
 * ```typescript
 * const response = await fetch('/v1/spaces');
 * const data = await response.json();
 * const validated = validateResponse(data, listSpacesResponseSchema);
 * // validated is now typed as ListSpacesResponse
 * ```
 */
export function validateResponse<T>(data: unknown, schema: z.ZodSchema<T>): T {
    const result = schema.safeParse(data);

    if (!result.success) {
        // Extract detailed error information from Zod
        const errors = result.error.issues
            .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
            .join('; ');

        throw new ValidationError(
            'API response validation failed',
            errors,
            result.error as Error
        );
    }

    return result.data;
}
