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

export const ImageHandlingSettingsSchema = z.object({
    preference: z.enum(['always', 'smart', 'never']),
    sizeThreshold: z.number().int().positive(),
    maxEmbeddedImages: z.number().int().positive(),
    webpQuality: z.number().int().min(0).max(100),
    fetchTimeout: z.number().int().positive(),
});

// Root schema including metadata
export const StorageSchemaValidator = z.object({
    _version: z.number().int(),
    settings: AppSettingsSchema,
    imageHandlingSettings: ImageHandlingSettingsSchema.optional(), // Optional for backward compat / initial load
    auth: AuthDataSchema,
    tagCache: z.record(z.string(), TagCacheEntrySchema).optional(),
    tagPropertyMappings: z.record(z.string(), z.record(z.string(), z.string())).optional(),
    metadataPropertyMappings: z.record(z.string(), z.record(z.string(), z.string())).optional(),
});

// Infer TypeScript types from Zod schemas
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type AuthData = z.infer<typeof AuthDataSchema>;
export type ImageHandlingSettings = z.infer<typeof ImageHandlingSettingsSchema>;
export type StorageSchema = z.infer<typeof StorageSchemaValidator>;

// Keys type helper
export type StorageKey = keyof StorageSchema;
