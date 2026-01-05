/**
 * Unit tests for StorageManager
 * 
 * Tests for T4: Add Storage Manager Tests
 * Target: >80% coverage for src/lib/storage/storage-manager.ts
 */

import { StorageManager } from '../../../src/lib/storage/storage-manager';
import { DEFAULTS } from '../../../src/lib/storage/defaults';

describe('StorageManager', () => {
    let storage: StorageManager;

    beforeEach(() => {
        // Reset singleton for each test
        // @ts-expect-error - accessing private static for testing
        StorageManager.instance = undefined;
        storage = StorageManager.getInstance();
        jest.clearAllMocks();
    });

    describe('getInstance', () => {
        it('should return a singleton instance', () => {
            const instance1 = StorageManager.getInstance();
            const instance2 = StorageManager.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should have a unique instanceId', () => {
            expect(storage.instanceId).toBeDefined();
            expect(typeof storage.instanceId).toBe('string');
            expect(storage.instanceId.length).toBeGreaterThan(0);
        });
    });

    describe('get', () => {
        it('should return default value when key not found', async () => {
            const result = await storage.get('auth');
            expect(result).toEqual(DEFAULTS.auth);
        });

        it('should return stored value when present', async () => {
            // Set mock storage value
            (chrome.storage.local.get as jest.Mock).mockImplementationOnce((key, callback) => {
                const result = { [key as string]: { isAuthenticated: true, apiKey: 'test-api-key' } };
                if (callback) callback(result);
                return Promise.resolve(result);
            });

            const result = await storage.get('auth');
            expect(result).toEqual({ isAuthenticated: true, apiKey: 'test-api-key' });
        });

        it('should deep clone default objects', async () => {
            // For object defaults, should return a clone
            const result1 = await storage.get('extensionSettings');
            const result2 = await storage.get('extensionSettings');

            expect(result1).toEqual(result2);
            // Should be different objects (deep cloned)
            expect(result1).not.toBe(result2);
        });

        it('should wait for pending writes before reading', async () => {
            // Create a delayed write
            let writeComplete = false;
            (chrome.storage.local.set as jest.Mock).mockImplementationOnce((_items: any, callback: any) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        writeComplete = true;
                        if (callback) callback();
                        resolve(undefined);
                    }, 50);
                });
            });

            // Start a write
            const writePromise = storage.set('auth', { isAuthenticated: true, apiKey: 'new-value' });

            // Immediately read - should wait for write
            const readPromise = storage.get('auth');

            await Promise.all([writePromise, readPromise]);

            expect(writeComplete).toBe(true);
        });
    });

    describe('set', () => {
        it('should set value in chrome storage', async () => {
            const authData = { isAuthenticated: true, apiKey: 'test-key' };
            await storage.set('auth', authData);

            expect(chrome.storage.local.set).toHaveBeenCalledWith(
                { auth: authData },
                expect.any(Function)
            );
        });

        it('should validate value before storing', async () => {
            // Setting an invalid value should throw
            // @ts-expect-error - intentionally testing invalid type
            await expect(storage.set('queue', 'not-an-array')).rejects.toThrow();
        });

        it('should check quota after write', async () => {
            (chrome.storage.local.getBytesInUse as jest.Mock).mockResolvedValue(1000);

            await storage.set('auth', { isAuthenticated: true, apiKey: 'test-key' });

            // Should call getBytesInUse for quota check
            expect(chrome.storage.local.getBytesInUse).toHaveBeenCalled();
        });

        it('should handle storage errors', async () => {
            (chrome.storage.local.set as jest.Mock).mockImplementationOnce((_items: any, callback: any) => {
                // Simulate chrome.runtime.lastError
                Object.defineProperty(chrome.runtime, 'lastError', {
                    value: { message: 'Storage quota exceeded' },
                    configurable: true,
                });
                if (callback) callback();
                return Promise.resolve();
            });

            await expect(storage.set('auth', { isAuthenticated: true, apiKey: 'test-key' })).rejects.toThrow('Storage quota exceeded');

            // Clean up lastError
            Object.defineProperty(chrome.runtime, 'lastError', {
                value: undefined,
                configurable: true,
            });
        });

        it('should serialize queue operations', async () => {
            const callOrder: number[] = [];
            let callCount = 0;

            // Mock 3 times for the 3 scheduled calls
            const mockFn = (chrome.storage.local.set as jest.Mock);
            const implementation = (_items: any, callback: any) => {
                const currentCall = ++callCount;
                return new Promise(resolve => {
                    setTimeout(() => {
                        callOrder.push(currentCall);
                        if (callback) callback();
                        resolve(undefined);
                    }, 10 * (3 - currentCall)); // Stagger timing to test serialization
                });
            };

            mockFn.mockImplementationOnce(implementation)
                .mockImplementationOnce(implementation)
                .mockImplementationOnce(implementation);

            // Fire multiple writes rapidly
            await Promise.all([
                storage.set('auth', { isAuthenticated: true, apiKey: 'value1' }),
                storage.set('auth', { isAuthenticated: true, apiKey: 'value2' }),
                storage.set('auth', { isAuthenticated: true, apiKey: 'value3' }),
            ]);

            // Should be called in order (1, 2, 3)
            expect(callOrder).toEqual([1, 2, 3]);
        });
    });

    describe('remove', () => {
        it('should remove key from storage', async () => {
            await storage.remove('auth');

            expect(chrome.storage.local.remove).toHaveBeenCalledWith('auth');
        });
    });

    describe('clear', () => {
        it('should clear all storage', async () => {
            await storage.clear();

            expect(chrome.storage.local.clear).toHaveBeenCalled();
        });
    });

    describe('getBytesInUse', () => {
        it('should return bytes in use', async () => {
            (chrome.storage.local.getBytesInUse as jest.Mock).mockResolvedValue(12345);

            const result = await storage.getBytesInUse();

            expect(result).toBe(12345);
        });
    });

    describe('checkQuota', () => {
        it('should warn when usage exceeds 80%', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            // 85% usage (4.25MB of 5MB)
            (chrome.storage.local.getBytesInUse as jest.Mock).mockResolvedValue(4456448);

            await storage.checkQuota();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Storage usage is high')
            );

            consoleSpy.mockRestore();
        });

        it('should not warn when usage is under 80%', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            // 50% usage
            (chrome.storage.local.getBytesInUse as jest.Mock).mockResolvedValue(2621440);

            await storage.checkQuota();

            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('getQueue', () => {
        it('should return empty array when no queue', async () => {
            const result = await storage.getQueue();
            expect(result).toEqual([]);
        });

        it('should return deep clone of queue', async () => {
            const mockQueue = [{
                id: '1',
                status: 'queued',
                type: 'bookmark',
                payload: {},
                timestamps: { created: Date.now() },
                retryCount: 0
            }];
            (chrome.storage.local.get as jest.Mock).mockImplementationOnce((key, callback) => {
                const result = { [key as string]: mockQueue };
                if (callback) callback(result);
                return Promise.resolve(result);
            });

            const result = await storage.getQueue();

            expect(result).toEqual(mockQueue);
            expect(result).not.toBe(mockQueue); // Should be a clone
        });
    });

    describe('setQueue', () => {
        it('should set queue in storage', async () => {
            const queue: any[] = [{
                id: '1',
                type: 'bookmark',
                payload: {},
                status: 'queued',
                retryCount: 0,
                timestamps: { created: Date.now() }
            }];

            await storage.setQueue(queue as any);

            expect(chrome.storage.local.set).toHaveBeenCalled();
        });
    });

    describe('vault operations', () => {
        describe('setVault', () => {
            it('should set value with custom key', async () => {
                await storage.setVault('vault:custom-key', { data: 'test' });

                expect(chrome.storage.local.set).toHaveBeenCalledWith(
                    { 'vault:custom-key': { data: 'test' } },
                    expect.any(Function)
                );
            });
        });

        describe('getVault', () => {
            it('should get value with custom key', async () => {
                (chrome.storage.local.get as jest.Mock).mockImplementationOnce((key, callback) => {
                    const result = { [key as string]: { data: 'vault-data' } };
                    if (callback) callback(result);
                    return Promise.resolve(result);
                });

                const result = await storage.getVault('vault:custom-key');

                expect(result).toEqual({ data: 'vault-data' });
            });

            it('should return undefined for non-existent vault key', async () => {
                const result = await storage.getVault('vault:non-existent');
                expect(result).toBeUndefined();
            });
        });

        describe('removeVault', () => {
            it('should remove vault key from storage', async () => {
                await storage.removeVault('vault:custom-key');

                expect(chrome.storage.local.remove).toHaveBeenCalledWith('vault:custom-key');
            });
        });
    });

    describe('getImageHandlingSettings', () => {
        it('should return image handling settings', async () => {
            const result = await storage.getImageHandlingSettings();
            expect(result).toBeDefined();
            expect(result.preference).toBeDefined();
        });
    });

    describe('setImageHandlingSettings', () => {
        it('should set image handling settings', async () => {
            const settings = {
                preference: 'smart' as const,
                sizeThreshold: 500000,
                maxEmbeddedImages: 20,
                fetchTimeout: 5000,
                webpQuality: 85,
            };

            await storage.setImageHandlingSettings(settings);

            expect(chrome.storage.local.set).toHaveBeenCalled();
        });
    });

    describe('getExtensionSettings', () => {
        it('should return extension settings', async () => {
            const result = await storage.getExtensionSettings();
            expect(result).toBeDefined();
        });
    });

    describe('setExtensionSettings', () => {
        it('should set extension settings', async () => {
            const settings = {
                debug: true,
                errorReportingEnabled: true,
                includeJSONForDataTables: false,
            };

            await storage.setExtensionSettings(settings);

            expect(chrome.storage.local.set).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle null values gracefully', async () => {
            (chrome.storage.local.get as jest.Mock).mockImplementationOnce((_key, callback) => {
                const result = {};
                if (callback) callback(result);
                return Promise.resolve(result);
            });

            const result = await storage.get('queue');
            expect(result).toEqual([]);
        });

        it('should handle concurrent operations', async () => {
            // Run multiple operations concurrently
            const operations = [
                storage.set('auth', { isAuthenticated: true }),
                storage.get('auth'),
                storage.set('auth', { isAuthenticated: false }),
                storage.get('auth'),
            ];

            await expect(Promise.all(operations)).resolves.toBeDefined();
        });
    });
});
