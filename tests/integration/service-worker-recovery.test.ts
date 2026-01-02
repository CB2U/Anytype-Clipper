import { QueueManager } from '../../src/background/queue-manager';
import { StorageManager } from '../../src/lib/storage/storage-manager';
import { QueueStatus, QueueItem } from '../../src/types/queue';
import { RetryScheduler } from '../../src/background/retry-scheduler';

// Mock chrome APIs
const mockStorageData: Record<string, any> = {};

(global as any).chrome = {
    storage: {
        local: {
            get: jest.fn((keys) => {
                const res: any = {};
                if (typeof keys === 'string') {
                    res[keys] = mockStorageData[keys];
                } else if (Array.isArray(keys)) {
                    keys.forEach(k => res[k] = mockStorageData[k]);
                }
                return Promise.resolve(res);
            }),
            set: jest.fn((data) => {
                Object.assign(mockStorageData, data);
                return Promise.resolve();
            }),
            onChanged: { addListener: jest.fn() },
        },
        onChanged: { addListener: jest.fn() },
    },
    runtime: {
        onInstalled: { addListener: jest.fn() },
        onMessage: { addListener: jest.fn() },
        lastError: null
    },
    contextMenus: {
        create: jest.fn(),
        onClicked: { addListener: jest.fn() },
    },
    alarms: {
        onAlarm: { addListener: jest.fn() },
        create: jest.fn(),
    },
    action: {
        openPopup: jest.fn(),
    },
    notifications: {
        create: jest.fn(),
        onButtonClicked: { addListener: jest.fn() },
    },
    tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
        get: jest.fn(),
    },
    scripting: {
        executeScript: jest.fn(),
    }
};

// Mock RetryScheduler
jest.mock('../../src/background/retry-scheduler', () => ({
    RetryScheduler: {
        getInstance: jest.fn().mockReturnValue({
            resumeRetries: jest.fn().mockResolvedValue(undefined),
            processRetry: jest.fn().mockResolvedValue(undefined),
        }),
    },
}));

describe('Service Worker Recovery Integration', () => {
    let storage: StorageManager;
    let queueManager: QueueManager;
    let retryScheduler: RetryScheduler;

    beforeEach(async () => {
        // Clear mock storage
        for (const key in mockStorageData) delete mockStorageData[key];

        // Reset singletons
        (StorageManager as any).instance = undefined;
        (QueueManager as any).instance = undefined;
        (RetryScheduler as any).instance = undefined;

        storage = StorageManager.getInstance();
        queueManager = QueueManager.getInstance(storage);
        // We don't initialize RetryScheduler yet because it might start logic
    });

    it('should reset "sending" items to "queued" during initialization', async () => {
        // 1. Seed storage with a "sending" item
        const stuckItem: QueueItem = {
            id: 'stuck-1',
            type: 'bookmark',
            payload: { spaceId: 's1', url: 'https://a.com', title: 'A', tags: [], metadata: {} as any },
            status: QueueStatus.Sending,
            timestamps: { created: 1000, lastAttempt: 1000 },
            retryCount: 0
        };
        mockStorageData['queue'] = [stuckItem];

        // 2. Import service worker (triggers initialize())
        // We use require to avoid issues with top-level imports and side effects
        // But we need to make sure we don't import it multiple times in same process 
        // if we want to reset its state. 
        // Actually, let's just test the initialize function logic by re-running it 
        // if we can, or just verify the side effects on the queue manager.

        // Let's use a trick: export the initialize function if we were allowed to modify code, 
        // but we already modified it. It's not exported.
        // So we'll use jest.isolateModules to re-import it.

        jest.isolateModules(() => {
            require('../../src/background/service-worker');
        });

        // 3. Wait for async initialization to complete
        // Since initialize() is called but not awaited at top level, 
        // we might need a small delay or to wait for the storage call.
        await new Promise(resolve => setTimeout(resolve, 100));

        // 4. Verify status in storage
        const queue = mockStorageData['queue'];
        expect(queue).toHaveLength(1);
        expect(queue[0].status).toBe(QueueStatus.Queued);
        expect(queue[0].id).toBe('stuck-1');
    });

    it('should handle multiple stuck items', async () => {
        const stuckItems: QueueItem[] = [
            { id: 'stuck-1', status: QueueStatus.Sending, timestamps: { created: 1000 } } as any,
            { id: 'stuck-2', status: QueueStatus.Sending, timestamps: { created: 1100 } } as any,
            { id: 'normal-1', status: QueueStatus.Queued, timestamps: { created: 1200 } } as any,
        ];
        mockStorageData['queue'] = stuckItems;

        jest.isolateModules(() => {
            require('../../src/background/service-worker');
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        const queue = mockStorageData['queue'];
        expect(queue.filter((i: any) => i.status === QueueStatus.Queued)).toHaveLength(3);
    });
});
