import { QueueManager } from '../../../src/background/queue-manager';
import { StorageManager } from '../../../src/lib/storage/storage-manager';
import { QueueStatus, QueueItem } from '../../../src/types/queue';
import { RetryScheduler } from '../../../src/background/retry-scheduler';

// Mock chrome APIs
const mockStorageData: Record<string, any> = {};

(global as any).chrome = {
    storage: {
        local: {
            get: jest.fn((keys, callback) => {
                const res: any = {};
                if (typeof keys === 'string') {
                    res[keys] = mockStorageData[keys];
                } else if (Array.isArray(keys)) {
                    keys.forEach(k => res[k] = mockStorageData[k]);
                } else if (keys === null || keys === undefined) {
                    Object.assign(res, mockStorageData);
                }
                if (callback) callback(res);
                return Promise.resolve(res);
            }),
            set: jest.fn((data, callback) => {
                Object.assign(mockStorageData, data);
                if (callback) callback();
                return Promise.resolve();
            }),
            remove: jest.fn((keys, callback) => {
                if (typeof keys === 'string') delete mockStorageData[keys];
                else if (Array.isArray(keys)) keys.forEach(k => delete mockStorageData[k]);
                if (callback) callback();
                return Promise.resolve();
            }),
            clear: jest.fn((callback) => {
                Object.keys(mockStorageData).forEach(k => delete mockStorageData[k]);
                if (callback) callback();
                return Promise.resolve();
            })
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
        clear: jest.fn()
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
jest.mock('../../../src/background/retry-scheduler', () => ({
    RetryScheduler: {
        getInstance: jest.fn().mockReturnValue({
            resumeRetries: jest.fn().mockResolvedValue(undefined),
            processRetry: jest.fn().mockResolvedValue(undefined),
            scheduleRetry: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn()
        }),
    },
}));

describe('Service Worker Recovery Integration', () => {
    let storage: StorageManager;
    let queueManager: QueueManager;

    beforeEach(async () => {
        // Clear mock storage
        Object.keys(mockStorageData).forEach(k => delete mockStorageData[k]);
        jest.clearAllMocks();

        // Reset singletons
        (StorageManager as any).instance = undefined;
        (QueueManager as any).instance = undefined;
        // @ts-ignore
        RetryScheduler['instance'] = undefined;

        storage = StorageManager.getInstance();
        queueManager = QueueManager.getInstance(storage);
    });

    afterEach(async () => {
        // Wait for any lingering async tasks (like initialize()) to settle
        await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should reset all "sending" items to "queued" during initialization', async () => {
        // 1. Seed storage with multiple items including "sending" and "queued"
        const items: QueueItem[] = [
            {
                id: 'stuck-1',
                type: 'bookmark',
                payload: { spaceId: 's1', url: 'https://a.com', title: 'A', tags: [], metadata: {} as any },
                status: QueueStatus.Sending,
                timestamps: { created: 1000 },
                retryCount: 0
            },
            {
                id: 'stuck-2',
                type: 'article',
                payload: { spaceId: 's1', url: 'https://b.com', title: 'B', tags: [], content: 'test', metadata: {} as any },
                status: QueueStatus.Sending,
                timestamps: { created: 1100 },
                retryCount: 1
            },
            {
                id: 'normal-1',
                type: 'bookmark',
                payload: { spaceId: 's1', url: 'https://c.com', title: 'C', tags: [], metadata: {} as any },
                status: QueueStatus.Queued,
                timestamps: { created: 1200 },
                retryCount: 0
            },
        ];
        mockStorageData['queue'] = items;

        // 2. Import service worker (triggers initialize())
        jest.isolateModules(() => {
            require('../../../src/background/service-worker');
        });

        // 3. Wait for async initialization to complete
        // We use a generous timeout because initialize() is not awaited
        await new Promise(resolve => setTimeout(resolve, 300));

        // 4. Verify all "sending" items are now "queued"
        const queue = mockStorageData['queue'];
        expect(queue).toHaveLength(3);

        const stuck1 = queue.find((i: any) => i.id === 'stuck-1');
        const stuck2 = queue.find((i: any) => i.id === 'stuck-2');
        const normal1 = queue.find((i: any) => i.id === 'normal-1');

        expect(stuck1.status).toBe(QueueStatus.Queued);
        expect(stuck2.status).toBe(QueueStatus.Queued);
        expect(normal1.status).toBe(QueueStatus.Queued);
    });
});
