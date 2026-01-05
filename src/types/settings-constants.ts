/**
 * Settings constants and defaults
 * Implementation file for settings.d.ts declarations
 */

import { SettingsV1 } from './settings';

/**
 * Validation constants
 */
export const SETTINGS_CONSTANTS = {
    PORT_MIN: 1,
    PORT_MAX: 65535,
    PORT_DEFAULT: 31009,
    MAX_ATTEMPTS_MIN: 1,
    MAX_ATTEMPTS_MAX: 20,
    MAX_ATTEMPTS_DEFAULT: 10,
    BACKOFF_INTERVALS_DEFAULT: [1000, 5000, 30000, 300000] as const, // 1s, 5s, 30s, 5m
} as const;

/**
 * Default settings (v1)
 */
export const DEFAULT_SETTINGS: SettingsV1 = {
    version: 1,
    defaultSpaces: {
        bookmark: null,
        highlight: null,
        article: null,
        note: null,
        task: null,
    },
    retry: {
        maxAttempts: SETTINGS_CONSTANTS.MAX_ATTEMPTS_DEFAULT,
        backoffIntervals: [...SETTINGS_CONSTANTS.BACKOFF_INTERVALS_DEFAULT],
    },
    deduplication: {
        enabled: true,
    },
    api: {
        port: SETTINGS_CONSTANTS.PORT_DEFAULT,
    },
    images: {
        strategy: 'smart',
    },
    privacy: {
        mode: false,
    },
};
