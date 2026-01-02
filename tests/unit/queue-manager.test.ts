import { QueueManager } from '../../src/background/queue-manager';
import { StorageManager } from '../../src/lib/storage/storage-manager';
import { QueueStatus, QueueItem } from '../../src/types/queue';

// Mock StorageManager
jest.mock('../../src/lib/storage/storage-manager');

describe('QueueManager - Basic Operations', () => {
    let queueManager: QueueManager;
    let mockStorage: jest.Mocked<StorageManager>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockStorage = {
            getQueue: jest.fn().mockResolvedValue([]),
            setQueue: jest.fn().mockResolvedValue(undefined),
            addQueueItem: jest.fn().mockResolvedValue(undefined),
            updateQueueItem: jest.fn().mockResolvedValue(undefined),
            deleteQueueItem: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<StorageManager>;

        // Reset singleton
        (QueueManager as any).instance = undefined;
        queueManager = QueueManager.getInstance(mockStorage);
    });

    describe('add()', () => {
        const mockItem: QueueItem = {
            id: 'test-1',
            type: 'bookmark',
            payload: { spaceId: 's1', url: 'https://a.com', title: 'A', tags: [], metadata: {} as any },
            status: QueueStatus.Queued,
            timestamps: { created: 1000 },
            retryCount: 0
        };

        it('should add an item to the queue', async () => {
            await queueManager.add(mockItem);
            expect(mockStorage.getQueue).toHaveBeenCalled();
            expect(mockStorage.setQueue).toHaveBeenCalledWith([mockItem]);
        });

        it('should enforce FIFO eviction when queue is full (1000 items)', async () => {
            // Fill queue with 1000 items
            const fullQueue: QueueItem[] = Array.from({ length: 1000 }, (_, i) => ({
                id: `item-${i}`,
                type: 'bookmark',
                payload: {} as any,
                status: QueueStatus.Queued,
                timestamps: { created: i },
                retryCount: 0
            }));

            mockStorage.getQueue.mockResolvedValueOnce([...fullQueue]);

            const newItem: QueueItem = {
                id: 'new-item',
                type: 'article',
                payload: {} as any,
                status: QueueStatus.Queued,
                timestamps: { created: 2000 },
                retryCount: 0
            };

            await queueManager.add(newItem);

            expect(mockStorage.setQueue).toHaveBeenCalledWith(
                expect.arrayContaining([newItem])
            );

            const savedQueue = mockStorage.setQueue.mock.calls[0][0];
            expect(savedQueue.length).toBe(1000);
            expect(savedQueue[0].id).toBe('item-1'); // Oldest (item-0) should be gone
            expect(savedQueue[999].id).toBe('new-item');
        });
    });

    describe('getNext()', () => {
        it('should return the first queued item', async () => {
            const items: QueueItem[] = [
                { id: '1', status: QueueStatus.Sent, timestamps: { created: 1 } } as any,
                { id: '2', status: QueueStatus.Queued, timestamps: { created: 2 } } as any,
                { id: '3', status: QueueStatus.Queued, timestamps: { created: 3 } } as any,
            ];
            mockStorage.getQueue.mockResolvedValue(items);

            const next = await queueManager.getNext();
            expect(next?.id).toBe('2');
        });

        it('should return null if no queued items', async () => {
            const items: QueueItem[] = [
                { id: '1', status: QueueStatus.Sent } as any,
            ];
            mockStorage.getQueue.mockResolvedValue(items);

            const next = await queueManager.getNext();
            expect(next).toBeNull();
        });
    });

    describe('shouldQueue()', () => {
        it('should return true for NetworkError', () => {
            const error = { name: 'NetworkError' };
            expect(QueueManager.shouldQueue(error)).toBe(true);
        });

        it('should return true for status 401, 502, 503, 504', () => {
            expect(QueueManager.shouldQueue({ status: 401 })).toBe(true);
            expect(QueueManager.shouldQueue({ status: 502 })).toBe(true);
            expect(QueueManager.shouldQueue({ status: 503 })).toBe(true);
            expect(QueueManager.shouldQueue({ status: 504 })).toBe(true);
        });

        it('should return true for "Failed to fetch" messages', () => {
            expect(QueueManager.shouldQueue(new Error('Failed to fetch'))).toBe(true);
        });

        it('should return false for 400 Bad Request', () => {
            expect(QueueManager.shouldQueue({ status: 400 })).toBe(false);
        });
    });

    describe('Status Operations', () => {
        const mockItem: QueueItem = {
            id: 'test-1',
            type: 'bookmark',
            payload: {} as any,
            status: QueueStatus.Queued,
            timestamps: { created: 1000 },
            retryCount: 0
        };

        beforeEach(() => {
            mockStorage.getQueue.mockResolvedValue([mockItem]);
        });

        it('should update status and lastAttempt timestamp', async () => {
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);

            await queueManager.updateStatus('test-1', QueueStatus.Sending);

            expect(mockStorage.setQueue).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 'test-1',
                    status: QueueStatus.Sending,
                    timestamps: expect.objectContaining({
                        lastAttempt: now
                    })
                })
            ]);
        });

        it('should mark as sent and set completed timestamp', async () => {
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);

            await queueManager.markSent('test-1');

            expect(mockStorage.setQueue).toHaveBeenCalledWith([
                expect.objectContaining({
                    status: QueueStatus.Sent,
                    timestamps: expect.objectContaining({
                        completed: now
                    })
                })
            ]);
        });
        it('should mark as failed and store error message', async () => {
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);
            const error = 'Connection refused';

            await queueManager.markFailed('test-1', error);

            expect(mockStorage.setQueue).toHaveBeenCalledWith([
                expect.objectContaining({
                    status: QueueStatus.Failed,
                    error: error,
                    timestamps: expect.objectContaining({
                        completed: now
                    })
                })
            ]);
        });
    });

    describe('resetSendingToQueued()', () => {
        it('should reset all sending items to queued', async () => {
            const items: QueueItem[] = [
                { id: '1', status: QueueStatus.Sending, timestamps: { created: 1 } } as any,
                { id: '2', status: QueueStatus.Queued, timestamps: { created: 2 } } as any,
                { id: '3', status: QueueStatus.Sending, timestamps: { created: 3 } } as any,
            ];
            mockStorage.getQueue.mockResolvedValue(items);

            const count = await queueManager.resetSendingToQueued();

            expect(count).toBe(2);
            expect(mockStorage.setQueue).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ id: '1', status: QueueStatus.Queued }),
                    expect.objectContaining({ id: '3', status: QueueStatus.Queued }),
                    expect.objectContaining({ id: '2', status: QueueStatus.Queued }),
                ])
            );
        });

        it('should return 0 if no sending items', async () => {
            const items: QueueItem[] = [
                { id: '1', status: QueueStatus.Queued } as any,
                { id: '2', status: QueueStatus.Sent } as any,
            ];
            mockStorage.getQueue.mockResolvedValue(items);

            const count = await queueManager.resetSendingToQueued();

            expect(count).toBe(0);
            expect(mockStorage.setQueue).not.toHaveBeenCalled();
        });
    });
});
