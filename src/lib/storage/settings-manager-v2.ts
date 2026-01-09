/**
 * Settings Manager for Anytype Clipper Extension
 * 
 * Centralized settings management with validation, migration, and defaults.
 * Follows the Settings Schema v1 defined in types/settings.d.ts
 */


import {
    Settings,
    SettingsV1,
    SettingsV2,
    ValidationResult,
    CachedSpaces,
    ObjectTypeInfo,
} from '../../types/settings';
import {
    DEFAULT_SETTINGS,
    SETTINGS_CONSTANTS,
    DEFAULT_OBJECT_TYPES,
} from '../../types/settings-constants';

/**
 * Load settings from storage
 * Returns default settings if not found or corrupted
 */
export async function loadSettings(): Promise<Settings> {
    try {
        const result = await chrome.storage.local.get('settings');
        const stored = result.settings;

        if (!stored) {
            // First run - return defaults
            return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }

        // Validate and migrate if needed
        const validated = validateSettings(stored);
        if (!validated.valid) {
            console.warn('[SettingsManager] Invalid settings found, using defaults:', validated.errors);
            return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }

        // Migrate if needed (future versions)
        const migrated = migrateSettings(stored);

        return migrated;
    } catch (error) {
        console.error('[SettingsManager] Error loading settings:', error);
        return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
}

/**
 * Save settings to storage
 * Validates before saving
 */
export async function saveSettings(settings: Settings): Promise<void> {
    // Validate before saving
    const validation = validateSettings(settings);
    if (!validation.valid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
    }

    await chrome.storage.local.set({ settings });
}

/**
 * Get default settings
 */
export function getDefaultSettings(): Settings {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

/**
 * Validate settings schema
 */
export function validateSettings(settings: any): ValidationResult {
    const errors: string[] = [];

    // Check version - accept both v1 and v2
    if (typeof settings.version !== 'number' || (settings.version !== 1 && settings.version !== 2)) {
        errors.push('Invalid or missing version');
    }

    // Validate defaultSpaces
    if (!settings.defaultSpaces || typeof settings.defaultSpaces !== 'object') {
        errors.push('Missing or invalid defaultSpaces');
    } else {
        const types = ['bookmark', 'highlight', 'article', 'note', 'task'];
        for (const type of types) {
            const value = settings.defaultSpaces[type];
            if (value !== null && typeof value !== 'string') {
                errors.push(`Invalid defaultSpaces.${type}: must be string or null`);
            }
        }
    }

    // Validate retry
    if (!settings.retry || typeof settings.retry !== 'object') {
        errors.push('Missing or invalid retry');
    } else {
        const { maxAttempts, backoffIntervals } = settings.retry;

        if (!validateMaxAttempts(maxAttempts)) {
            errors.push(`Invalid retry.maxAttempts: must be between ${SETTINGS_CONSTANTS.MAX_ATTEMPTS_MIN} and ${SETTINGS_CONSTANTS.MAX_ATTEMPTS_MAX}`);
        }

        if (!Array.isArray(backoffIntervals)) {
            errors.push('Invalid retry.backoffIntervals: must be array');
        }
    }

    // Validate deduplication
    if (!settings.deduplication || typeof settings.deduplication !== 'object') {
        errors.push('Missing or invalid deduplication');
    } else if (typeof settings.deduplication.enabled !== 'boolean') {
        errors.push('Invalid deduplication.enabled: must be boolean');
    }

    // Validate api
    if (!settings.api || typeof settings.api !== 'object') {
        errors.push('Missing or invalid api');
    } else if (!validatePort(settings.api.port)) {
        errors.push(`Invalid api.port: must be between ${SETTINGS_CONSTANTS.PORT_MIN} and ${SETTINGS_CONSTANTS.PORT_MAX}`);
    }

    // Validate images
    if (!settings.images || typeof settings.images !== 'object') {
        errors.push('Missing or invalid images');
    } else if (!validateImageStrategy(settings.images.strategy)) {
        errors.push('Invalid images.strategy: must be "always", "smart", or "never"');
    }

    // Validate privacy
    if (!settings.privacy || typeof settings.privacy !== 'object') {
        errors.push('Missing or invalid privacy');
    } else if (typeof settings.privacy.mode !== 'boolean') {
        errors.push('Invalid privacy.mode: must be boolean');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Migrate settings from older versions
 */
export function migrateSettings(settings: any): Settings {
    // Check version and migrate if needed
    if (settings.version === 1) {
        console.log('[SettingsManager] Migrating settings from v1 to v2');
        return migrateV1toV2(settings as SettingsV1);
    }

    if (settings.version === 2) {
        return settings as SettingsV2;
    }

    // Unknown version - return defaults
    console.warn('[SettingsManager] Unknown settings version, using defaults');
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

/**
 * Migrate settings from v1 to v2
 * Adds Object Type configuration with built-in defaults
 */
export function migrateV1toV2(v1Settings: SettingsV1): SettingsV2 {
    try {
        const v2Settings: SettingsV2 = {
            ...v1Settings,
            version: 2,
            objectTypes: {
                defaults: {
                    article: DEFAULT_OBJECT_TYPES.article,
                    highlight: DEFAULT_OBJECT_TYPES.highlight,
                    bookmark: DEFAULT_OBJECT_TYPES.bookmark,
                },
                lastUsed: {
                    article: null,
                    highlight: null,
                    bookmark: null,
                },
                cached: [],
                lastFetchedAt: 0,
            },
        };

        console.log('[SettingsManager] Successfully migrated settings to v2');
        return v2Settings;
    } catch (error) {
        console.error('[SettingsManager] Error during v1->v2 migration:', error);
        // Fallback to defaults on migration error
        return getDefaultSettingsV2();
    }
}

/**
 * Validate port number
 */
export function validatePort(port: any): boolean {
    return (
        typeof port === 'number' &&
        Number.isInteger(port) &&
        port >= SETTINGS_CONSTANTS.PORT_MIN &&
        port <= SETTINGS_CONSTANTS.PORT_MAX
    );
}

/**
 * Validate max retry attempts
 */
export function validateMaxAttempts(attempts: any): boolean {
    return (
        typeof attempts === 'number' &&
        Number.isInteger(attempts) &&
        attempts >= SETTINGS_CONSTANTS.MAX_ATTEMPTS_MIN &&
        attempts <= SETTINGS_CONSTANTS.MAX_ATTEMPTS_MAX
    );
}

/**
 * Validate image strategy
 */
export function validateImageStrategy(strategy: any): boolean {
    return strategy === 'always' || strategy === 'smart' || strategy === 'never';
}

/**
 * Calculate backoff intervals from max attempts
 * Uses exponential backoff: 1s, 5s, 30s, 5m pattern
 */
export function calculateBackoffIntervals(maxAttempts: number): number[] {
    const base = [1000, 5000, 30000, 300000]; // 1s, 5s, 30s, 5m

    if (maxAttempts <= base.length) {
        return base.slice(0, maxAttempts);
    }

    // For more attempts, repeat the last interval
    const intervals = [...base];
    for (let i = base.length; i < maxAttempts; i++) {
        intervals.push(300000); // 5m
    }

    return intervals;
}

/**
 * Load cached Spaces from storage
 */
export async function loadCachedSpaces(): Promise<CachedSpaces | null> {
    try {
        const result = await chrome.storage.local.get('cachedSpaces');
        const cachedStatus = result.cachedSpaces;
        if (cachedStatus && typeof cachedStatus === 'object' && 'spaces' in cachedStatus) {
            return cachedStatus as CachedSpaces;
        }
        return null;
    } catch (error) {
        console.error('[SettingsManager] Error loading cached Spaces:', error);
        return null;
    }
}

/**
 * Save cached Spaces to storage
 */
export async function saveCachedSpaces(cachedSpaces: CachedSpaces): Promise<void> {
    await chrome.storage.local.set({ cachedSpaces });
}

/**
 * Get default settings v2
 */
export function getDefaultSettingsV2(): SettingsV2 {
    const v1Defaults = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as SettingsV1;
    return migrateV1toV2(v1Defaults);
}

// ============================================================================
// Object Type Management Methods
// ============================================================================

/**
 * Get default Object Type key for a capture mode
 * Returns the configured default or last-used Object Type
 * 
 * @param mode - Capture mode (article, highlight, bookmark)
 * @returns Object Type key (e.g., "page", "note", "bookmark")
 */
export async function getDefaultObjectType(mode: 'article' | 'highlight' | 'bookmark'): Promise<string> {
    const settings = await loadSettings();

    // Defensive check: if objectTypes field is missing, use built-in defaults
    if (!settings.objectTypes || !settings.objectTypes.defaults || !settings.objectTypes.lastUsed) {
        console.warn('[SettingsManager] objectTypes field missing, using built-in defaults');
        return DEFAULT_OBJECT_TYPES[mode];
    }

    // Debug logging
    console.log(`[SettingsManager] getDefaultObjectType(${mode}):`, {
        lastUsed: settings.objectTypes.lastUsed[mode],
        default: settings.objectTypes.defaults[mode],
        builtInDefault: DEFAULT_OBJECT_TYPES[mode]
    });

    // IMPORTANT: We no longer use lastUsed because it can be polluted with incorrect values
    // from previous bugs. Always use the configured default instead.
    // Users can still override on a per-save basis using the "Override default" checkbox.

    // Use configured default
    const defaultType = settings.objectTypes.defaults[mode];
    if (defaultType && typeof defaultType === 'string' && defaultType.length > 0) {
        console.log(`[SettingsManager] Returning default: ${defaultType}`);
        return defaultType;
    }

    // Final fallback to built-in defaults
    console.warn(`[SettingsManager] Invalid default for mode ${mode}, using built-in default`);
    return DEFAULT_OBJECT_TYPES[mode];
}

/**
 * Set default Object Type key for a capture mode
 * 
 * @param mode - Capture mode (article, highlight, bookmark)
 * @param typeKey - Object Type key to set as default
 */
export async function setDefaultObjectType(
    mode: 'article' | 'highlight' | 'bookmark',
    typeKey: string
): Promise<void> {
    if (!typeKey || typeof typeKey !== 'string') {
        throw new Error(`Invalid Object Type key: ${typeKey}`);
    }

    const settings = await loadSettings();
    settings.objectTypes.defaults[mode] = typeKey;
    await saveSettings(settings);
}

/**
 * Get last-used Object Type key for a capture mode
 * 
 * @param mode - Capture mode (article, highlight, bookmark)
 * @returns Object Type key or null if never used
 */
export async function getLastUsedObjectType(mode: 'article' | 'highlight' | 'bookmark'): Promise<string | null> {
    const settings = await loadSettings();
    return settings.objectTypes.lastUsed[mode];
}

/**
 * Update last-used Object Type key for a capture mode
 * This is called when a user saves a capture with a specific Object Type
 * 
 * @param mode - Capture mode (article, highlight, bookmark)
 * @param typeKey - Object Type key that was used
 */
export async function updateLastUsedObjectType(
    mode: 'article' | 'highlight' | 'bookmark',
    typeKey: string
): Promise<void> {
    if (!typeKey || typeof typeKey !== 'string') {
        throw new Error(`Invalid Object Type key: ${typeKey}`);
    }

    const settings = await loadSettings();
    settings.objectTypes.lastUsed[mode] = typeKey;
    await saveSettings(settings);
}

/**
 * Get cached Object Types
 * 
 * @returns Cached Object Types array (may be empty)
 */
export async function getCachedObjectTypes(): Promise<ObjectTypeInfo[]> {
    const settings = await loadSettings();
    return settings.objectTypes.cached;
}

/**
 * Set cached Object Types
 * Filters out archived types before caching
 * 
 * @param types - Object Types to cache
 */
export async function setCachedObjectTypes(types: ObjectTypeInfo[]): Promise<void> {
    if (!Array.isArray(types)) {
        throw new Error('Object Types must be an array');
    }

    const settings = await loadSettings();
    // Filter out archived types
    settings.objectTypes.cached = types.filter(type => !type.archived);
    settings.objectTypes.lastFetchedAt = Date.now();
    await saveSettings(settings);
}

/**
 * Check if Object Types cache is stale (older than 24 hours)
 * 
 * @returns true if cache is stale or empty, false otherwise
 */
export async function isCacheStale(): Promise<boolean> {
    const settings = await loadSettings();
    const { cached, lastFetchedAt } = settings.objectTypes;

    // Cache is stale if empty
    if (cached.length === 0) {
        return true;
    }

    // Cache is stale if older than 24 hours
    const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    const age = now - lastFetchedAt;

    return age > CACHE_EXPIRY_MS;
}
