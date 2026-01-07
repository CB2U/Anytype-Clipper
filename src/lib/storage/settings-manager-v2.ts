/**
 * Settings Manager for Anytype Clipper Extension
 * 
 * Centralized settings management with validation, migration, and defaults.
 * Follows the Settings Schema v1 defined in types/settings.d.ts
 */


import {
    Settings,
    SettingsV1,
    ValidationResult,
    CachedSpaces,
} from '../../types/settings';
import { DEFAULT_SETTINGS, SETTINGS_CONSTANTS } from '../../types/settings-constants';

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

    // Check version
    if (typeof settings.version !== 'number' || settings.version !== 1) {
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
 * Currently only v1 exists, so this is a stub for future migrations
 */
export function migrateSettings(settings: any): Settings {
    // Check version and migrate if needed
    if (settings.version === 1) {
        return settings as SettingsV1;
    }

    // Future: handle v1 -> v2 migration
    // if (settings.version === 1) {
    //   return migrateV1toV2(settings);
    // }

    // Unknown version - return defaults
    console.warn('[SettingsManager] Unknown settings version, using defaults');
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
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
