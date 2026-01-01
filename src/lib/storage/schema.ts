import { z } from 'zod';

// Define Zod schemas for runtime validation
export const AppSettingsSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']),
    apiPort: z.number().int().positive(),
    defaultSpaceId: z.string().optional(),
});

export const AuthDataSchema = z.object({
    apiKey: z.string().optional(),
    isAuthenticated: z.boolean(),
    challengeId: z.string().optional(),
});

export const TagCacheEntrySchema = z.object({
    tags: z.array(z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
    })),
    timestamp: z.number(),
    propertyId: z.string(),
});

// Root schema including metadata
export const StorageSchemaValidator = z.object({
    _version: z.number().int(),
    settings: AppSettingsSchema,
    auth: AuthDataSchema,
    tagCache: z.record(z.string(), TagCacheEntrySchema).optional(),
    tagPropertyMappings: z.record(z.string(), z.record(z.string(), z.string())).optional(),
});

// Infer TypeScript types from Zod schemas
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type AuthData = z.infer<typeof AuthDataSchema>;
export type StorageSchema = z.infer<typeof StorageSchemaValidator>;

// Keys type helper
export type StorageKey = keyof StorageSchema;
