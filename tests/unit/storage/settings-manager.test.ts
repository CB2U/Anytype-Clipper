/**
 * Unit tests for SettingsManager (T5)
 */
import * as SettingsManager from '../../../src/lib/storage/settings-manager-v2';
import { DEFAULT_SETTINGS } from '../../../src/types/settings-constants';

// Mock types/constants if needed, but we can import them directly since they are just data

// Mock chrome.storage.local
const mockGet = jest.fn();
const mockSet = jest.fn();

Object.defineProperty(global, 'chrome', {
    value: {
        storage: {
            local: {
                get: mockGet,
                set: mockSet,
            },
        },
    },
    writable: true,
});

describe('SettingsManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loadSettings', () => {
        it('should return settings from storage', async () => {
            const mockSettings = { ...DEFAULT_SETTINGS, theme: 'dark' };
            mockGet.mockResolvedValue({ settings: mockSettings });

            const result = await SettingsManager.loadSettings();

            expect(result).toEqual(mockSettings);
            expect(mockGet).toHaveBeenCalledWith('settings');
        });

        it('should return defaults if storage is empty', async () => {
            mockGet.mockResolvedValue({});

            const result = await SettingsManager.loadSettings();

            expect(result).toEqual(DEFAULT_SETTINGS);
        });

        it('should return defaults if storage has invalid settings', async () => {
            // Invalid because version is string, not number
            mockGet.mockResolvedValue({ settings: { version: '1' } });

            const result = await SettingsManager.loadSettings();

            expect(result).toEqual(DEFAULT_SETTINGS);
        });
    });

    describe('saveSettings', () => {
        it('should validate and save settings to storage', async () => {
            const newSettings = { ...DEFAULT_SETTINGS, theme: 'dark' as const };

            await SettingsManager.saveSettings(newSettings);

            expect(mockSet).toHaveBeenCalledWith({ settings: newSettings });
        });

        it('should throw error for invalid settings', async () => {
            // @ts-ignore - testing runtime validation
            const invalidSettings = { ...DEFAULT_SETTINGS, api: { port: 999999 } };

            await expect(SettingsManager.saveSettings(invalidSettings)).rejects.toThrow('Invalid settings');
        });
    });

    describe('validateSettings', () => {
        it('should validate valid settings', () => {
            const result = SettingsManager.validateSettings(DEFAULT_SETTINGS);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail on missing keys', () => {
            const result = SettingsManager.validateSettings({});
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid or missing version');
        });
    });

    describe('calculateBackoffIntervals', () => {
        it('should calculate intervals for small max attempts', () => {
            const intervals = SettingsManager.calculateBackoffIntervals(2);
            expect(intervals).toEqual([1000, 5000]);
        });

        it('should cap intervals at 5 minutes for large max attempts', () => {
            const intervals = SettingsManager.calculateBackoffIntervals(6);
            // 1s, 5s, 30s, 5m, 5m, 5m
            expect(intervals).toEqual([1000, 5000, 30000, 300000, 300000, 300000]);
        });
    });

    describe('Cached Spaces', () => {
        it('should load cached spaces', async () => {
            const mockSpaces = { spaces: [], lastFetched: 123 };
            mockGet.mockResolvedValue({ cachedSpaces: mockSpaces });

            const result = await SettingsManager.loadCachedSpaces();

            expect(result).toEqual(mockSpaces);
            expect(mockGet).toHaveBeenCalledWith('cachedSpaces');
        });

        it('should return null if no cached spaces', async () => {
            mockGet.mockResolvedValue({});

            const result = await SettingsManager.loadCachedSpaces();

            expect(result).toBeNull();
        });

        it('should save cached spaces', async () => {
            const mockSpaces = { spaces: [], lastFetched: 123 };
            await SettingsManager.saveCachedSpaces(mockSpaces);

            expect(mockSet).toHaveBeenCalledWith({ cachedSpaces: mockSpaces });
        });
    });
});
