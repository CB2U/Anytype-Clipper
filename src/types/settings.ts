/**
 * Settings Schema v1 for Anytype Clipper Extension
 * 
 * This file defines the comprehensive settings structure for the extension.
 * Settings are versioned to support future migrations.
 */

/**
 * Image embedding strategy
 */
export type ImageStrategy = 'always' | 'smart' | 'never';

/**
 * Content type for default Space configuration
 */
export type ContentType = 'bookmark' | 'highlight' | 'article' | 'note' | 'task';

/**
 * Settings Schema Version 1
 */
export interface SettingsV1 {
    version: 1;

    /**
     * Default Space per content type
     * null means "no default" - user must select Space in popup
     */
    defaultSpaces: {
        bookmark: string | null;
        highlight: string | null;
        article: string | null;
        note: string | null;
        task: string | null;
    };

    /**
     * Retry behavior configuration
     */
    retry: {
        maxAttempts: number;  // 1-20, default: 10
        backoffIntervals: number[];  // Calculated from maxAttempts [1s, 5s, 30s, 5m]
    };

    /**
     * Deduplication settings
     */
    deduplication: {
        enabled: boolean;  // default: true
    };

    /**
     * API configuration
     */
    api: {
        port: number;  // 1-65535, default: 31009
    };

    /**
     * Image handling preferences
     */
    images: {
        strategy: ImageStrategy;  // default: 'smart'
    };

    /**
     * Privacy settings
     */
    privacy: {
        mode: boolean;  // default: false - when true, disables URL history tracking
    };
}

/**
 * Current settings type (alias for latest version)
 */
export type Settings = SettingsV1;

/**
 * Validation helper types
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Cached Spaces structure for offline access
 */
export interface CachedSpace {
    id: string;
    name: string;
    icon?: string;
}

export interface CachedSpaces {
    spaces: CachedSpace[];
    lastFetched: number;  // timestamp
}
