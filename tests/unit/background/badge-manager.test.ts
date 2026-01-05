
import { BadgeManager } from '../../../src/background/badge-manager';
import { QueueManager } from '../../../src/background/queue-manager';
import { QueueItem, QueueStatus } from '../../../src/types/queue';

jest.mock('../../../src/background/queue-manager');

describe('BadgeManager', () => {
    let mockQueueManager: jest.Mocked<QueueManager>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock QueueManager instance
        mockQueueManager = {
            getAll: jest.fn().mockResolvedValue([]),
        } as any;

        (QueueManager.getInstance as jest.Mock).mockReturnValue(mockQueueManager);
        (BadgeManager as any).instance = undefined;
    });

    const createItem = (status: QueueStatus): QueueItem => ({
        id: '1',
        url: 'http://example.com',
        status,
        createdAt: Date.now(),
        retryCount: 0,
        data: {} as any
    } as any);

    it('should set blue badge with count for queued items', async () => {
        const manager = BadgeManager.getInstance(mockQueueManager);
        mockQueueManager.getAll.mockResolvedValue([
            createItem(QueueStatus.Queued),
            createItem(QueueStatus.Sending)
        ]);

        await manager.updateBadge();

        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '2' });
        expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#3375E9' }); // Blue
    });

    it('should set red badge with count if there are failed items', async () => {
        const manager = BadgeManager.getInstance(mockQueueManager);
        mockQueueManager.getAll.mockResolvedValue([
            createItem(QueueStatus.Queued),
            createItem(QueueStatus.Failed)
        ]);

        await manager.updateBadge();

        // 1 Queued item is pending. Failed item triggers red color.
        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '1' });
        expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#EF4444' }); // Red
    });

    it('should set "!" and red badge if only failed items', async () => {
        const manager = BadgeManager.getInstance(mockQueueManager);
        mockQueueManager.getAll.mockResolvedValue([
            createItem(QueueStatus.Failed)
        ]);

        await manager.updateBadge();

        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '!' });
        expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#EF4444' });
    });

    it('should clear badge if queue is empty and no failures', async () => {
        const manager = BadgeManager.getInstance(mockQueueManager);
        mockQueueManager.getAll.mockResolvedValue([]);

        await manager.updateBadge();

        expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    it('should update badge on storage change', () => {
        // Manually mock addListener to capture callback
        const addListenerMock = jest.fn();

        // Overwrite the onChanged object or addListener property
        // We need to cast to any to bypass read-only checks if they exist, often works in Jest
        Object.defineProperty(chrome.storage.onChanged, 'addListener', {
            value: addListenerMock,
            writable: true
        });

        const manager = BadgeManager.getInstance(mockQueueManager);
        jest.spyOn(manager, 'updateBadge');
        manager.init();

        expect(addListenerMock).toHaveBeenCalled();
        const callback = addListenerMock.mock.calls[0][0];

        // Simulate storage change
        callback({ queue: { newValue: [] } }, 'local');

        expect(manager.updateBadge).toHaveBeenCalled();
    });
});
