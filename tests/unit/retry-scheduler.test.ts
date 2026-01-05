import { RetryScheduler } from '../../src/background/retry-scheduler';
import { QueueManager } from '../../src/background/queue-manager';
import { AnytypeApiClient } from '../../src/lib/api/client';
import { QueueStatus } from '../../src/types/queue';

describe('RetryScheduler', () => {
    let scheduler: RetryScheduler;
    let mockQueueManager: jest.Mocked<QueueManager>;
    let mockApiClient: jest.Mocked<AnytypeApiClient>;

    beforeEach(() => {
        mockQueueManager = {
            get: jest.fn(),
            updateStatus: jest.fn(),
            updateRetryCount: jest.fn(),
            updateErrorMessage: jest.fn(),
            markSent: jest.fn(),
            markFailed: jest.fn(),
            hydrate: jest.fn((item) => Promise.resolve(item)),
            delete: jest.fn(),
        } as any;
        mockApiClient = {
            createObject: jest.fn(),
        } as any;
        // @ts-ignore - singleton
        RetryScheduler['instance'] = undefined;
        scheduler = RetryScheduler.getInstance(mockQueueManager, mockApiClient);
    });

    describe('calculateBackoff', () => {
        it('should return 1s for the first retry (attempt 0 or 1)', () => {
            expect(scheduler.calculateBackoff(0)).toBe(1000);
            expect(scheduler.calculateBackoff(1)).toBe(5000); // Wait, BACKOFF_INTERVALS[1] is 5s. 
            // T2 goal says: Attempt 1: 1s, Attempt 2: 5s.
            // So calculateBackoff(0) is 1s, calculateBackoff(1) is 5s.
        });

        it('should return 30s for the third retry (attempt 2)', () => {
            expect(scheduler.calculateBackoff(2)).toBe(30000);
        });

        it('should return 5m for the fourth retry and beyond (attempt 3+)', () => {
            expect(scheduler.calculateBackoff(3)).toBe(300000);
            expect(scheduler.calculateBackoff(4)).toBe(300000);
            expect(scheduler.calculateBackoff(10)).toBe(300000);
        });

        it('should handle negative numbers by returning the first interval', () => {
            expect(scheduler.calculateBackoff(-1)).toBe(1000);
        });
    });

    describe('scheduleRetry', () => {
        beforeEach(() => {
            // Mock chrome.alarms
            (global as any).chrome = {
                alarms: {
                    create: jest.fn().mockResolvedValue(undefined),
                },
            };
        });

        it('should create an alarm with the correct name and delay', async () => {
            const mockItem = {
                id: 'test-id',
                retryCount: 0,
            } as any;

            await scheduler.scheduleRetry(mockItem);

            expect(chrome.alarms.create).toHaveBeenCalledWith('retry-test-id', {
                delayInMinutes: 1000 / 60000,
            });
        });

        it('should use the correct delay for subsequent retries', async () => {
            const mockItem = {
                id: 'test-id',
                retryCount: 2, // 3rd attempt, 30s
            } as any;

            await scheduler.scheduleRetry(mockItem);

            expect(chrome.alarms.create).toHaveBeenCalledWith('retry-test-id', {
                delayInMinutes: 30000 / 60000,
            });
        });
    });

    describe('sanitizeErrorMessage', () => {
        it('should remove API keys', () => {
            const error = 'Failed with apiKey=secret-123';
            expect(scheduler.sanitizeErrorMessage(error)).toBe('Failed with apiKey=***');
        });

        it('should remove bearer tokens', () => {
            const error = 'Error: Bearer abc-123-def';
            expect(scheduler.sanitizeErrorMessage(error)).toBe('Error: Bearer ***');
        });

        it('should remove emails', () => {
            const error = 'User test@example.com failed';
            expect(scheduler.sanitizeErrorMessage(error)).toBe('User ***@***.*** failed');
        });

        it('should truncate long messages', () => {
            const longMessage = 'a'.repeat(600);
            const sanitized = scheduler.sanitizeErrorMessage(longMessage);
            expect(sanitized.length).toBe(500);
            expect(sanitized.endsWith('...')).toBe(true);
        });
    });

    describe('processRetry', () => {
        beforeEach(() => {
            (global as any).chrome = {
                alarms: {
                    create: jest.fn().mockResolvedValue(undefined),
                    clear: jest.fn().mockResolvedValue(true),
                },
            };
        });

        it('should mark item as sent on success', async () => {
            const mockItem = {
                id: 'item-1',
                status: QueueStatus.Queued,
                retryCount: 0,
                type: 'bookmark',
                payload: { spaceId: 'space-1', title: 'Test', notes: 'Notes', url: 'http://test.com' },
            };
            mockQueueManager.get.mockResolvedValue(mockItem as any);
            mockApiClient.createObject.mockResolvedValue({ id: 'obj-1' } as any);

            await scheduler.processRetry('item-1');

            expect(mockQueueManager.updateStatus).toHaveBeenCalledWith('item-1', QueueStatus.Sending);
            expect(mockQueueManager.markSent).toHaveBeenCalledWith('item-1');
            expect(chrome.alarms.clear).toHaveBeenCalledWith('retry-item-1');
        });

        it('should handle API failure by re-scheduling retry', async () => {
            const mockItem = {
                id: 'item-1',
                status: QueueStatus.Queued,
                retryCount: 0,
                type: 'bookmark',
                payload: { spaceId: 'space-1', title: 'Test', notes: 'Notes', url: 'http://test.com' },
            };
            mockQueueManager.get.mockResolvedValue(mockItem as any);
            mockApiClient.createObject.mockRejectedValue(new Error('API Error'));

            await scheduler.processRetry('item-1');

            expect(mockQueueManager.updateStatus).toHaveBeenCalledWith('item-1', QueueStatus.Queued);
            expect(mockQueueManager.updateErrorMessage).toHaveBeenCalledWith('item-1', 'API Error');
            // scheduleRetry is called interally. We can't easily check unless we spy on it or check side effects.
            // But we know it calls chrome.alarms.create
            expect(chrome.alarms.create).toHaveBeenCalled();
        });

        it('should mark as failed if max retries reached', async () => {
            const mockItem = {
                id: 'item-1',
                status: QueueStatus.Queued,
                retryCount: 10,
                type: 'bookmark',
                payload: { spaceId: 'space-1', title: 'Test', url: 'http://test.com' },
            };
            mockQueueManager.get.mockResolvedValue(mockItem as any);

            await scheduler.processRetry('item-1');

            expect(mockQueueManager.markFailed).toHaveBeenCalledWith('item-1', expect.stringContaining('Max retry attempts exceeded'));
            expect(chrome.alarms.clear).toHaveBeenCalledWith('retry-item-1');
        });
    });

    describe('manualRetry', () => {
        it('should reset retry count and schedule retry', async () => {
            const mockItem = { id: 'item-1', retryCount: 5, status: QueueStatus.Failed };
            mockQueueManager.get.mockResolvedValueOnce(mockItem as any).mockResolvedValueOnce({ ...mockItem, retryCount: 0, status: QueueStatus.Queued } as any);

            await scheduler.manualRetry('item-1');

            expect(mockQueueManager.updateRetryCount).toHaveBeenCalledWith('item-1', 0);
            expect(mockQueueManager.updateStatus).toHaveBeenCalledWith('item-1', QueueStatus.Queued);
            expect(chrome.alarms.clear).toHaveBeenCalledWith('retry-item-1');
            expect(chrome.alarms.create).toHaveBeenCalled();
        });
    });

    describe('deleteFailed', () => {
        it('should clear alarm and delete item', async () => {
            await scheduler.deleteFailed('item-1');

            expect(chrome.alarms.clear).toHaveBeenCalledWith('retry-item-1');
            expect(mockQueueManager.delete).toHaveBeenCalledWith('item-1');
        });
    });
});
