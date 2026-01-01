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

// Root schema including metadata
export const StorageSchemaValidator = z.object({
    _version: z.number().int(),
    settings: AppSettingsSchema,
    auth: AuthDataSchema,
    // Future extensions
});

// Infer TypeScript types from Zod schemas
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type AuthData = z.infer<typeof AuthDataSchema>;
export type StorageSchema = z.infer<typeof StorageSchemaValidator>;

// Keys type helper
export type StorageKey = keyof StorageSchema;
