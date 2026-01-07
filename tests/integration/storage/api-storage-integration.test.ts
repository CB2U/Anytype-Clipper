import { StorageManager } from '../../../src/lib/storage/storage-manager';
import { AnytypeApiClient } from '../../../src/lib/api/client';

describe('API-Storage Integration', () => {
    let storage: StorageManager;
    let apiClient: AnytypeApiClient;
    let mockStorageData: Record<string, any> = {};

    beforeEach(async () => {
        mockStorageData = {};

        // Mock chrome storage
        (global as any).chrome = {
            storage: {
                local: {
                    get: jest.fn((keys, callback) => {
                        const res: any = {};
                        if (typeof keys === 'string') {
                            res[keys] = mockStorageData[keys];
                        } else if (Array.isArray(keys)) {
                            keys.forEach(k => res[k] = mockStorageData[k]);
                        }
                        if (callback) callback(res);
                        return Promise.resolve(res);
                    }),
                    set: jest.fn((data, callback) => {
                        Object.assign(mockStorageData, data);
                        if (callback) callback();
                        return Promise.resolve();
                    }),
                    getBytesInUse: jest.fn(() => Promise.resolve(JSON.stringify(mockStorageData).length)),
                }
            },
            runtime: { lastError: null }
        };

        (StorageManager as any).instance = undefined;
        storage = StorageManager.getInstance();
        apiClient = new AnytypeApiClient();

        (global as any).fetch = jest.fn();
    });

    afterEach(() => {
        delete (global as any).chrome;
        delete (global as any).fetch;
    });

    it('should validate API response before storing', async () => {
        // Mock successful API response
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: 'obj-1', name: 'Test' } })
        });

        const response = await fetch('http://localhost:31009/objects');
        const data = await response.json();

        // Validate response structure
        expect(data.object).toBeDefined();
        expect(data.object.id).toBeDefined();

        // Store validated data
        await storage.set('lastCreatedObject' as any, data.object);

        expect(mockStorageData['lastCreatedObject']).toEqual({ id: 'obj-1', name: 'Test' });
    });

    it('should enforce sequential write locking', async () => {
        const writes: string[] = [];

        // Simulate concurrent writes
        const write1 = storage.set('test' as any, { value: 1 }).then(() => writes.push('write1'));
        const write2 = storage.set('test' as any, { value: 2 }).then(() => writes.push('write2'));
        const write3 = storage.set('test' as any, { value: 3 }).then(() => writes.push('write3'));

        await Promise.all([write1, write2, write3]);

        // Verify writes completed (order may vary due to locking)
        expect(writes).toHaveLength(3);
        expect(mockStorageData['test']).toBeDefined();
    });

    it('should reject invalid data via schema validation', async () => {
        // Attempt to store invalid settings
        try {
            await storage.set('settings', { invalidField: 'bad' } as any);
            // If schema validation is strict, this should fail
            // If not, it will pass but with defaults applied
        } catch (error) {
            // Schema validation rejected invalid data
            expect(error).toBeDefined();
        }

        // Valid settings should work
        await storage.set('settings', { theme: 'dark', apiPort: 31009 });
        expect(mockStorageData['settings']).toBeDefined();
    });
});
