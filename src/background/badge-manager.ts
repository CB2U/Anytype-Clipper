import { QueueManager } from './queue-manager';
import { QueueStatus } from '../types/queue';

/**
 * Manages the extension icon badge counter.
 */
export class BadgeManager {
    private static instance: BadgeManager;
    private queueManager: QueueManager;

    private constructor(queueManager: QueueManager) {
        this.queueManager = queueManager;
    }

    public static getInstance(queueManager?: QueueManager): BadgeManager {
        if (!BadgeManager.instance) {
            const qm = queueManager || QueueManager.getInstance();
            BadgeManager.instance = new BadgeManager(qm);
        }
        return BadgeManager.instance;
    }

    /**
     * Updates the badge counter based on the current queue state.
     */
    public async updateBadge(): Promise<void> {
        try {
            const items = await this.queueManager.getAll();
            const pendingItems = items.filter(
                item => item.status === QueueStatus.Queued || item.status === QueueStatus.Sending
            );
            const failedItems = items.filter(item => item.status === QueueStatus.Failed);

            const count = pendingItems.length;

            if (count > 0) {
                await chrome.action.setBadgeText({ text: count.toString() });

                // Color: Red if there are failed items, otherwise default blue
                if (failedItems.length > 0) {
                    await chrome.action.setBadgeBackgroundColor({ color: '#EF4444' }); // Red
                } else {
                    await chrome.action.setBadgeBackgroundColor({ color: '#3375E9' }); // Anytype Blue
                }
            } else {
                // If no pending items, check if we should still show badge for failed items
                if (failedItems.length > 0) {
                    await chrome.action.setBadgeText({ text: '!' });
                    await chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
                } else {
                    await chrome.action.setBadgeText({ text: '' });
                }
            }
        } catch (error) {
            console.error('[BadgeManager] Failed to update badge:', error);
        }
    }

    /**
     * Initializes the badge manager and sets up listeners for queue changes.
     */
    public init(): void {
        // We don't have a direct "onQueueChanged" event in QueueManager yet, 
        // but Epic 5.0 mentioned it. 
        // Looking at QueueManager implementation, it uses StorageManager.
        // We can listen to storage changes for the queue key.

        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.queue) {
                this.updateBadge();
            }
        });

        // Initial update
        this.updateBadge();
    }
}
