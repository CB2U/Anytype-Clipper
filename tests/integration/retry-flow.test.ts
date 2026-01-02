import { RetryScheduler } from '../../src/background/retry-scheduler';
import { QueueManager } from '../../src/background/queue-manager';
import { AnytypeApiClient } from '../../src/lib/api/client';
import { QueueStatus } from '../../src/types/queue';
import { StorageManager } from '../../src/lib/storage/storage-manager';

describe('Retry Flow Integration', () => {
    let scheduler: RetryScheduler;
    let queueManager: QueueManager;
    let apiClient: AnytypeApiClient;
    let storageManager: StorageManager;

    beforeEach(async () => {
        // Mock chrome.storage.local
        const storage: Record<string, any> = {};
        (global as any).chrome = {
            storage: {
                local: {
                    get: jest.fn((key) => Promise.resolve({ [key]: storage[key] })),
                    set: jest.fn((data) => {
                        Object.assign(storage, data);
                        return Promise.resolve();
                    }),
                    remove: jest.fn((key) => {
                        delete storage[key];
                        return Promise.resolve();
                    }),
                },
            },
            alarms: {
                create: jest.fn().mockResolvedValue(undefined),
                clear: jest.fn().mockResolvedValue(true),
            },
        };

        storageManager = StorageManager.getInstance();
        queueManager = QueueManager.getInstance(storageManager);
        apiClient = new AnytypeApiClient();

        // Mock API client's internal call (fetch)
        (global as any).fetch = jest.fn();

        // Reset singleton
        // @ts-ignore
        RetryScheduler['instance'] = undefined;
        scheduler = RetryScheduler.getInstance(queueManager, apiClient);
    });

    it('should successfully retry a bookmark capture after failure', async () => {
        const queueItem = {
            id: 'item-1',
            type: 'bookmark',
            payload: { spaceId: 'space-1', title: 'Test', url: 'http://test.com', tags: [], metadata: {} },
            status: QueueStatus.Queued,
            retryCount: 0,
            timestamps: { created: Date.now(), lastAttempt: Date.now() }
        };

        await queueManager.add(queueItem as any);

        // First attempt fails
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 503,
            text: () => Promise.resolve('Service Unavailable'),
        });

        await scheduler.processRetry('item-1');

        let item = await queueManager.get('item-1');
        expect(item?.status).toBe(QueueStatus.Queued);
        expect(item?.retryCount).toBe(1);
        expect(chrome.alarms.create).toHaveBeenCalled();

        // Second attempt succeeds
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: 'obj-1' } }),
        });

        await scheduler.processRetry('item-1');

        item = await queueManager.get('item-1');
        expect(item?.status).toBe(QueueStatus.Sent);
        expect(item?.retryCount).toBe(2);
    });

    it('should mark as failed after 10 attempts', async () => {
        const queueItem = {
            id: 'item-failed',
            type: 'bookmark',
            payload: { spaceId: 'space-1', title: 'Test', url: 'http://test.com', tags: [], metadata: {} },
            status: QueueStatus.Queued,
            retryCount: 9,
            timestamps: { created: Date.now(), lastAttempt: Date.now() }
        };

        await queueManager.add(queueItem as any);

        (fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 503,
            text: () => Promise.resolve('Service Unavailable'),
        });

        await scheduler.processRetry('item-failed');

        const item = await queueManager.get('item-failed');
        expect(item?.status).toBe(QueueStatus.Failed);
        expect(item?.retryCount).toBe(10);
    });

    it('should resume retries on startup', async () => {
        const queueItem = {
            id: 'item-resumed',
            type: 'bookmark',
            payload: { spaceId: 'space-1', title: 'Test', url: 'http://test.com', tags: [], metadata: {} },
            status: QueueStatus.Queued,
            retryCount: 2,
            timestamps: { created: Date.now(), lastAttempt: Date.now() }
        };

        await queueManager.add(queueItem as any);

        await scheduler.resumeRetries();

        expect(chrome.alarms.create).toHaveBeenCalled();
        const call = (chrome.alarms.create as jest.Mock).mock.calls[0];
        expect(call[0]).toBe('retry-item-resumed');
    });
});
