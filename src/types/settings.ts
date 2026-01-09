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
 * Icon types for Object Types
 */
export interface EmojiIcon {
    format: 'emoji';
    emoji: string;  // Unicode emoji
}

export interface FileIcon {
    format: 'file';
    file: string;   // File ID
}

export interface NamedIcon {
    format: 'icon';
    icon: string;   // Icon name from predefined set
}

export type Icon = EmojiIcon | FileIcon | NamedIcon | null;

/**
 * Type layout options from Anytype API
 */
export type TypeLayout = 'basic' | 'profile' | 'action' | 'note' | 'bookmark' | 'set' | 'collection' | 'participant';

/**
 * Object Type information from Anytype API
 */
export interface ObjectTypeInfo {
    id: string;              // Unique type ID across spaces
    key: string;             // Type key (e.g., "page", "bookmark", "research_paper")
    name: string;            // Display name (e.g., "Page", "Bookmark", "Research Paper")
    plural_name: string;     // Plural display name (e.g., "Pages", "Bookmarks")
    icon: Icon;              // Icon (emoji, file, or named icon)
    layout: TypeLayout;      // Layout type
    archived: boolean;       // Whether the type is archived/deleted
    object: string;          // Data model (always "type")
}

/**
 * Settings Schema Version 2
 * Adds Object Type configuration support
 */
export interface SettingsV2 extends Omit<SettingsV1, 'version'> {
    version: 2;

    /**
     * Object Type configuration
     */
    objectTypes: {
        /**
         * Default Object Type key per capture mode
         * Uses the 'key' field from ObjectTypeInfo (e.g., "page", "bookmark")
         */
        defaults: {
            article: string;      // Default: "page"
            highlight: string;    // Default: "note"
            bookmark: string;     // Default: "bookmark"
        };
        /**
         * Last-used Object Type key per capture mode
         * null means no last-used type (use default)
         */
        lastUsed: {
            article: string | null;
            highlight: string | null;
            bookmark: string | null;
        };
        /**
         * Cached Object Types list for offline use
         * Filtered to exclude archived types
         */
        cached: ObjectTypeInfo[];
        /**
         * Last fetch timestamp (milliseconds since epoch)
         */
        lastFetchedAt: number;
    };
}

/**
 * Current settings type (alias for latest version)
 */
export type Settings = SettingsV2;

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
