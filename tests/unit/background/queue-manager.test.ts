import { QueueManager } from '../../../src/background/queue-manager';
import { StorageManager } from '../../../src/lib/storage/storage-manager';
import { QueueStatus, QueueItem } from '../../../src/types/queue';

// Mock StorageManager
jest.mock('../../../src/lib/storage/storage-manager');

describe('QueueManager', () => {
    let queueManager: QueueManager;
    let mockStorage: jest.Mocked<StorageManager>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockStorage = {
            getQueue: jest.fn().mockResolvedValue([]),
            setQueue: jest.fn().mockResolvedValue(undefined),
            getVault: jest.fn().mockResolvedValue(undefined),
            setVault: jest.fn().mockResolvedValue(undefined),
            removeVault: jest.fn().mockResolvedValue(undefined),
        } as unknown as jest.Mocked<StorageManager>;

        // Reset singleton
        (QueueManager as any).instance = undefined;
        queueManager = QueueManager.getInstance(mockStorage);
    });

    describe('Core Operations', () => {
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

        it('should enforce FIFO eviction and cleanup vault for evicted item', async () => {
            // Fill queue with 1000 items
            const fullQueue: QueueItem[] = Array.from({ length: 1000 }, (_, i) => ({
                id: `item-${i}`,
                type: 'bookmark',
                payload: {} as any,
                status: QueueStatus.Queued,
                timestamps: { created: i },
                retryCount: 0,
                vaultKeys: [`vault:item-${i}:content`]
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

            // Expect setQueue with new list (shifted)
            const savedQueue = mockStorage.setQueue.mock.calls[0][0];
            expect(savedQueue.length).toBe(1000);
            expect(savedQueue[0].id).toBe('item-1');
            expect(savedQueue[999].id).toBe('new-item');

            // Expect cleanupVault for item-0
            expect(mockStorage.removeVault).toHaveBeenCalledWith('vault:item-0:content');
        });

        it('should delete an item and cleanup vault', async () => {
            const queue = [{
                ...mockItem,
                vaultKeys: ['vault:test-1:content']
            }];
            mockStorage.getQueue.mockResolvedValue(queue);

            await queueManager.delete('test-1');

            expect(mockStorage.removeVault).toHaveBeenCalledWith('vault:test-1:content');
            expect(mockStorage.setQueue).toHaveBeenCalledWith([]);
        });

        it('should clear all items', async () => {
            await queueManager.clear();
            expect(mockStorage.setQueue).toHaveBeenCalledWith([]);
        });
    });

    describe('Vault Offloading', () => {
        it('should offload large content to vault', async () => {
            const largeContent = 'A'.repeat(51201); // Threshold is 51200
            const item: QueueItem = {
                id: 'large-1',
                type: 'article',
                payload: { content: largeContent } as any,
                status: QueueStatus.Queued,
                timestamps: { created: 1000 },
                retryCount: 0
            };

            await queueManager.add(item);

            expect(mockStorage.setVault).toHaveBeenCalledWith(
                'vault:large-1:content',
                largeContent
            );

            const savedQueue = mockStorage.setQueue.mock.calls[0][0];
            const savedItem = savedQueue[0];
            expect((savedItem.payload as any).content).toBe('__vault__');
            expect(savedItem.vaultKeys).toContain('vault:large-1:content');
        });

        it('should offload large metadata content to vault', async () => {
            const largeContent = 'B'.repeat(51201);
            const item: QueueItem = {
                id: 'meta-1',
                type: 'bookmark',
                payload: { metadata: { content: largeContent } } as any,
                status: QueueStatus.Queued,
                timestamps: { created: 1000 },
                retryCount: 0
            };

            await queueManager.add(item);

            expect(mockStorage.setVault).toHaveBeenCalledWith(
                'vault:meta-1:meta_content',
                largeContent
            );
        });

        it('should hydrate items from vault', async () => {
            const item: QueueItem = {
                id: 'h-1',
                type: 'article',
                payload: { content: '__vault__' } as any,
                status: QueueStatus.Queued,
                timestamps: { created: 1000 },
                retryCount: 0,
                vaultKeys: ['vault:h-1:content']
            };

            mockStorage.getVault.mockResolvedValue('Original Content');

            const hydrated = await queueManager.hydrate(item);

            expect(mockStorage.getVault).toHaveBeenCalledWith('vault:h-1:content');
            expect((hydrated.payload as any).content).toBe('Original Content');
            // Original item should not be mutated in memory/storage unless explicitly saved
            expect((item.payload as any).content).toBe('__vault__');
        });
    });

    describe('Queue Retrieval', () => {
        it('should get next queued item', async () => {
            const items = [
                { id: '1', status: QueueStatus.Sent } as any,
                { id: '2', status: QueueStatus.Queued } as any
            ];
            mockStorage.getQueue.mockResolvedValue(items);
            const next = await queueManager.getNext();
            expect(next?.id).toBe('2');
        });

        it('should get pending items', async () => {
            const items = [
                { id: '1', status: QueueStatus.Sent } as any,
                { id: '2', status: QueueStatus.Queued } as any
            ];
            mockStorage.getQueue.mockResolvedValue(items);
            const pending = await queueManager.getPending();
            expect(pending.length).toBe(1);
            expect(pending[0].id).toBe('2');
        });

        it('should get all items', async () => {
            mockStorage.getQueue.mockResolvedValue([{ id: '1' }] as any);
            const all = await queueManager.getAll();
            expect(all.length).toBe(1);
        });

        it('should get item by id', async () => {
            mockStorage.getQueue.mockResolvedValue([{ id: '1' }] as any);
            const item = await queueManager.get('1');
            expect(item?.id).toBe('1');
            const missing = await queueManager.get('2');
            expect(missing).toBeNull();
        });
    });

    describe('Status & Recovery', () => {
        beforeEach(() => {
            mockStorage.getQueue.mockResolvedValue([{
                id: '1', status: QueueStatus.Queued, timestamps: { created: 1 }, retryCount: 0
            }] as any);
        });

        it('should update status', async () => {
            await queueManager.updateStatus('1', QueueStatus.Sending);
            expect(mockStorage.setQueue).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ status: QueueStatus.Sending })])
            );
        });

        it('should update retry count', async () => {
            await queueManager.updateRetryCount('1', 5);
            expect(mockStorage.setQueue).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ retryCount: 5 })])
            );
        });

        it('should update error message', async () => {
            await queueManager.updateErrorMessage('1', 'New Error');
            expect(mockStorage.setQueue).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ error: 'New Error' })])
            );
        });

        it('should reset sending to queued', async () => {
            mockStorage.getQueue.mockResolvedValue([
                { id: '1', status: QueueStatus.Sending } as any,
                { id: '2', status: QueueStatus.Queued } as any
            ]);
            const count = await queueManager.resetSendingToQueued();
            expect(count).toBe(1);
            expect(mockStorage.setQueue).toHaveBeenCalled();
        });
    });

    describe('shouldQueue', () => {
        it('should identify queueable errors', () => {
            expect(QueueManager.shouldQueue({ name: 'NetworkError' })).toBe(true);
            expect(QueueManager.shouldQueue({ status: 503 })).toBe(true);
            expect(QueueManager.shouldQueue(new Error('Failed to fetch'))).toBe(true);
            expect(QueueManager.shouldQueue({ status: 400 })).toBe(false);
        });
        it('should return false for null error', () => {
            expect(QueueManager.shouldQueue(null)).toBe(false);
            expect(QueueManager.shouldQueue({})).toBe(false);
        });

        it('should handle error with matching constructor name', () => {
            class NetworkError extends Error {
                constructor(msg: string) {
                    super(msg);
                    this.name = 'NetworkError';
                }
            }
            expect(QueueManager.shouldQueue(new NetworkError('fail'))).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle delete with invalid id', async () => {
            mockStorage.getQueue.mockResolvedValue([]);
            await queueManager.delete('invalid');
            expect(mockStorage.setQueue).not.toHaveBeenCalled();
        });

        it('should handle updateStatus with invalid id', async () => {
            mockStorage.getQueue.mockResolvedValue([]);
            await queueManager.updateStatus('invalid', QueueStatus.Sending);
            expect(mockStorage.setQueue).not.toHaveBeenCalled();
        });

        it('should handle markFailed with invalid id', async () => {
            mockStorage.getQueue.mockResolvedValue([]);
            await queueManager.markFailed('invalid', 'error');
            expect(mockStorage.setQueue).not.toHaveBeenCalled();
        });

        it('should handle hydrate with no vault keys', async () => {
            const item: QueueItem = {
                id: '1',
                type: 'bookmark',
                payload: {} as any,
                status: QueueStatus.Queued,
                timestamps: { created: 1 },
                retryCount: 0
            };
            const hydrated = await queueManager.hydrate(item);
            expect(hydrated).toBe(item);
            expect(mockStorage.getVault).not.toHaveBeenCalled();
        });

        it('should handle hydrate with empty vault keys', async () => {
            const item: QueueItem = {
                id: '1',
                type: 'bookmark',
                payload: {} as any,
                status: QueueStatus.Queued,
                timestamps: { created: 1 },
                retryCount: 0,
                vaultKeys: []
            };
            const hydrated = await queueManager.hydrate(item);
            expect(hydrated).toBe(item);
            expect(mockStorage.getVault).not.toHaveBeenCalled();
        });

        it('should update retry count with invalid ID', async () => {
            mockStorage.getQueue.mockResolvedValue([]);
            await queueManager.updateRetryCount('invalid', 1);
            expect(mockStorage.setQueue).not.toHaveBeenCalled();
        });

        it('should update error message with invalid ID', async () => {
            mockStorage.getQueue.mockResolvedValue([]);
            await queueManager.updateErrorMessage('invalid', 'err');
            expect(mockStorage.setQueue).not.toHaveBeenCalled();
        });
    });
});
