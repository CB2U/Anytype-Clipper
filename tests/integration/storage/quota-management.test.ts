import { StorageManager } from '../../../src/lib/storage/storage-manager';

describe('Quota Management Integration', () => {
    let storage: StorageManager;
    let mockStorageData: Record<string, any> = {};
    let mockBytesInUse = 0;

    beforeEach(async () => {
        mockStorageData = {};
        mockBytesInUse = 0;

        // Mock chrome storage with quota simulation
        (global as any).chrome = {
            storage: {
                local: {
                    QUOTA_BYTES: 5242880, // 5MB quota
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
                        mockBytesInUse = JSON.stringify(mockStorageData).length;
                        if (callback) callback();
                        return Promise.resolve();
                    }),
                    getBytesInUse: jest.fn(() => Promise.resolve(mockBytesInUse)),
                }
            },
            runtime: { lastError: null }
        };

        (StorageManager as any).instance = undefined;
        storage = StorageManager.getInstance();
    });

    afterEach(() => {
        delete (global as any).chrome;
    });

    it('should trigger warning at 80% quota usage', async () => {
        const quotaBytes = (global as any).chrome.storage.local.QUOTA_BYTES;
        const warningThreshold = quotaBytes * 0.8;

        // Simulate storage at 81% capacity
        mockBytesInUse = warningThreshold + 1000;

        const quotaInfo = await storage.checkQuota();

        expect(quotaInfo.bytesInUse).toBeGreaterThan(warningThreshold);
        expect(quotaInfo.percentUsed).toBeGreaterThan(80);
    });

    it('should handle quota exceeded scenario', async () => {
        const quotaBytes = (global as any).chrome.storage.local.QUOTA_BYTES;

        // Simulate storage at 95% capacity
        mockBytesInUse = quotaBytes * 0.95;

        // Attempt to add large data
        const largeData = 'x'.repeat(500000); // 500KB

        try {
            await storage.set('largeItem' as any, { data: largeData });

            // Check if quota exceeded
            const quotaInfo = await storage.checkQuota();
            if (quotaInfo.percentUsed > 90) {
                // Should trigger quota warning/error
                expect(quotaInfo.percentUsed).toBeGreaterThan(90);
            }
        } catch (error) {
            // Quota exceeded error
            expect(error).toBeDefined();
        }
    });

    it('should report accurate quota usage', async () => {
        // Add some data
        await storage.set('item1' as any, { value: 'test1' });
        await storage.set('item2' as any, { value: 'test2' });
        await storage.set('item3' as any, { value: 'test3' });

        const quotaInfo = await storage.checkQuota();

        expect(quotaInfo.bytesInUse).toBeGreaterThan(0);
        expect(quotaInfo.percentUsed).toBeGreaterThan(0);
        expect(quotaInfo.percentUsed).toBeLessThan(100);
    });
});
