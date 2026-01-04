import { BadgeManager } from '../../src/background/badge-manager';
import { QueueManager } from '../../src/background/queue-manager';
import { QueueStatus } from '../../src/types/queue';

// Mock chrome API
const mockSetBadgeText = jest.fn().mockResolvedValue(undefined);
const mockSetBadgeBackgroundColor = jest.fn().mockResolvedValue(undefined);
(global as any).chrome = {
    action: {
        setBadgeText: mockSetBadgeText,
        setBadgeBackgroundColor: mockSetBadgeBackgroundColor,
    },
    storage: {
        onChanged: {
            addListener: jest.fn(),
        }
    }
};

describe('BadgeManager', () => {
    let badgeManager: BadgeManager;
    let mockQueueManager: jest.Mocked<QueueManager>;

    beforeEach(() => {
        mockQueueManager = {
            getAll: jest.fn(),
        } as any;
        badgeManager = BadgeManager.getInstance(mockQueueManager);
        mockSetBadgeText.mockClear();
        mockSetBadgeBackgroundColor.mockClear();
    });

    afterEach(() => {
        // Reset singleton for next test
        (BadgeManager as any).instance = undefined;
    });

    it('should set badge text to count of pending items', async () => {
        mockQueueManager.getAll.mockResolvedValue([
            { id: '1', status: QueueStatus.Queued } as any,
            { id: '2', status: QueueStatus.Sending } as any,
            { id: '3', status: QueueStatus.Sent } as any,
        ]);

        await badgeManager.updateBadge();

        expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '2' });
        expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#3375E9' });
    });

    it('should set badge to red if there are failed items', async () => {
        mockQueueManager.getAll.mockResolvedValue([
            { id: '1', status: QueueStatus.Failed } as any,
            { id: '2', status: QueueStatus.Queued } as any,
        ]);

        await badgeManager.updateBadge();

        expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '1' });
        expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#EF4444' });
    });

    it('should show "!" if only failed items exist', async () => {
        mockQueueManager.getAll.mockResolvedValue([
            { id: '1', status: QueueStatus.Failed } as any,
        ]);

        await badgeManager.updateBadge();

        expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '!' });
        expect(mockSetBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#EF4444' });
    });

    it('should clear badge when queue is empty', async () => {
        mockQueueManager.getAll.mockResolvedValue([]);

        await badgeManager.updateBadge();

        expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '' });
    });
});
