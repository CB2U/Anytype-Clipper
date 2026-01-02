import { QueueManager } from '../../src/background/queue-manager';
import { StorageManager } from '../../src/lib/storage/storage-manager';
import { QueueStatus, QueueItem } from '../../src/types/queue';

describe('Queue Persistence Integration', () => {
    let storage: StorageManager;
    let queueManager: QueueManager;
    let mockStorageData: Record<string, any> = {};

    beforeEach(async () => {
        mockStorageData = {};

        // Mock chrome extension storage
        (global as any).chrome = {
            storage: {
                local: {
                    get: jest.fn((keys) => {
                        const res: any = {};
                        if (typeof keys === 'string') {
                            res[keys] = mockStorageData[keys];
                        } else if (Array.isArray(keys)) {
                            keys.forEach(k => res[k] = mockStorageData[k]);
                        } else if (keys === null || keys === undefined) {
                            return Promise.resolve({ ...mockStorageData });
                        }
                        return Promise.resolve(res);
                    }),
                    set: jest.fn((data) => {
                        Object.assign(mockStorageData, data);
                        return Promise.resolve();
                    }),
                    getBytesInUse: jest.fn(() => Promise.resolve(JSON.stringify(mockStorageData).length)), // Rough estimate
                    remove: jest.fn((keys) => {
                        if (typeof keys === 'string') delete mockStorageData[keys];
                        else if (Array.isArray(keys)) keys.forEach(k => delete mockStorageData[k]);
                        return Promise.resolve();
                    }),
                    clear: jest.fn(() => {
                        mockStorageData = {};
                        return Promise.resolve();
                    })
                }
            },
            runtime: {
                lastError: null
            }
        };

        // Reset singletons
        (StorageManager as any).instance = undefined;
        (QueueManager as any).instance = undefined;

        storage = StorageManager.getInstance();
        queueManager = QueueManager.getInstance(storage);

        // Ensure queue is initialized to empty array in mock storage via DEFAULTS
        // StorageManager does this on first set or if not present
        await storage.set('queue', []);
    });

    afterEach(() => {
        delete (global as any).chrome;
    });

    it('should persist new items to chrome.storage.local', async () => {
        const item: QueueItem = {
            id: 'item-1',
            type: 'bookmark',
            payload: { spaceId: 's1', url: 'https://a.com', title: 'A', tags: [], metadata: {} as any },
            status: QueueStatus.Queued,
            timestamps: { created: Date.now() },
            retryCount: 0
        };

        await queueManager.add(item);

        // Verify it exists in the mock storage object
        expect(mockStorageData['queue']).toHaveLength(1);
        expect(mockStorageData['queue'][0].id).toBe('item-1');
    });

    it('should recover queue items after a simulated reload', async () => {
        // 1. Manually seed the storage data (simulating previously saved data)
        const oldItems: QueueItem[] = [
            {
                id: 'old-1',
                type: 'article',
                payload: {} as any,
                status: QueueStatus.Queued,
                timestamps: { created: 100 },
                retryCount: 0
            }
        ];
        mockStorageData['queue'] = oldItems;

        // 2. Clear instances to simulate reload
        (StorageManager as any).instance = undefined;
        (QueueManager as any).instance = undefined;

        const newStorage = StorageManager.getInstance();
        const newQueueManager = QueueManager.getInstance(newStorage);

        // 3. Verify it recovers the item
        const items = await newQueueManager.getAll();
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe('old-1');
    });

    it('should handle updates and deletions correctly across persistence', async () => {
        const item: QueueItem = {
            id: 'item-2',
            type: 'bookmark',
            payload: {} as any,
            status: QueueStatus.Queued,
            timestamps: { created: 200 },
            retryCount: 0
        };
        await queueManager.add(item);

        // Update status
        await queueManager.updateStatus('item-2', QueueStatus.Sending);
        expect(mockStorageData['queue'][0].status).toBe(QueueStatus.Sending);

        // Delete item
        await queueManager.delete('item-2');
        expect(mockStorageData['queue']).toHaveLength(0);
    });
});
