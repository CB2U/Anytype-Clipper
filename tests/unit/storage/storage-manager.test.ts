
import { StorageManager } from '../../../src/lib/storage/storage-manager';
import { StorageSchemaValidator } from '../../../src/lib/storage/schema';
import { DEFAULTS } from '../../../src/lib/storage/defaults';

describe('StorageManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset Singleton
        (StorageManager as any).instance = undefined;
    });

    it('should be a singleton', () => {
        const instance1 = StorageManager.getInstance();
        const instance2 = StorageManager.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should get value from storage', async () => {
        (chrome.storage.local.get as jest.Mock).mockImplementation((k, cb) => {
            // jest-chrome mocks usually return promise if no callback, but implementation might use callback or promise.
            // In setup.ts, mockImplementation returns Promise.
            return Promise.resolve({ settings: { theme: 'dark' } });
        });

        const manager = StorageManager.getInstance();
        const value = await manager.get('settings');
        expect(value).toEqual({ theme: 'dark' });
    });

    it('should return default if value undefined', async () => {
        (chrome.storage.local.get as jest.Mock).mockResolvedValue({});
        const manager = StorageManager.getInstance();
        const value = await manager.get('settings');
        expect(value).toEqual(DEFAULTS.settings);
    });

    it('should set value in storage', async () => {
        const manager = StorageManager.getInstance();
        const settings = { ...DEFAULTS.settings, theme: 'light' as const };

        await manager.set('settings', settings);

        expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings }, expect.any(Function));
    });

    it('should validate value before setting', async () => {
        const manager = StorageManager.getInstance();
        // Invalid settings (missing required fields or wrong type)
        const invalidSettings = { theme: 123 } as any;

        // Mock schema validation failure
        // We rely on actual Zod schema behavior. 
        // If 'theme' MUST be 'light'|'dark'|'auto', 123 will fail.

        await expect(manager.set('settings', invalidSettings)).rejects.toThrow();
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('should handle sequential writes', async () => {
        const manager = StorageManager.getInstance();

        // Mock set with delay
        (chrome.storage.local.set as jest.Mock).mockImplementation((obj, cb) => {
            setTimeout(() => {
                if (cb) cb();
            }, 10);
        });

        const p1 = manager.set('settings', DEFAULTS.settings);
        const p2 = manager.set('auth', { apiKey: 'key', isAuthenticated: true });

        await Promise.all([p1, p2]);
        expect(chrome.storage.local.set).toHaveBeenCalledTimes(2);
    });

    it('should check quota and warn if high', async () => {
        const manager = StorageManager.getInstance();
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

        // 4.5MB used (limit 5MB) -> 90%
        (chrome.storage.local.getBytesInUse as jest.Mock).mockResolvedValue(4.5 * 1024 * 1024);

        await manager.checkQuota();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Storage usage is high'));
        consoleSpy.mockRestore();
    });
});
