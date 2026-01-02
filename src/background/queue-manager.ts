import { StorageManager } from '../lib/storage/storage-manager';
import { QueueItem, QueueStatus } from '../types/queue';

/**
 * Manages the offline queue for capture requests.
 * Handles persistence, FIFO eviction, and sequential processing.
 */
export class QueueManager {
    private static instance: QueueManager;
    private storage: StorageManager;
    private readonly MAX_QUEUE_SIZE = 1000;

    private constructor(storage: StorageManager) {
        this.storage = storage;
    }

    /**
     * Determines if an error is "queueable" (e.g., network failure, API unreachable).
     */
    public static shouldQueue(error: any): boolean {
        // Import classes dynamically to avoid circular dependencies if needed, 
        // or just check properties/names.
        const errorName = error?.name || error?.constructor?.name;
        const status = error?.status;

        // Queue on:
        // 1. Network errors (offline, DNS, refused, timeout)
        // 2. 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
        // 3. 401 Unauthorized (Auth flow says queue during re-auth)
        if (errorName === 'NetworkError') return true;
        if (status === 401 || status === 502 || status === 503 || status === 504) return true;

        // Check for common fetch errors if not wrapped
        const message = error?.message?.toLowerCase() || '';
        if (message.includes('failed to fetch') || message.includes('networkerror')) return true;

        return false;
    }

    /**
     * Get singleton instance of QueueManager
     */
    public static getInstance(storage?: StorageManager): QueueManager {
        if (!QueueManager.instance) {
            const storageInstance = storage || StorageManager.getInstance();
            QueueManager.instance = new QueueManager(storageInstance);
        }
        return QueueManager.instance;
    }

    /**
     * Add an item to the queue. 
     * Handles FIFO eviction if the queue exceeds MAX_QUEUE_SIZE.
     */
    public async add(item: QueueItem): Promise<void> {
        const queue = await this.storage.getQueue();

        // FIFO eviction if queue is full
        if (queue.length >= this.MAX_QUEUE_SIZE) {
            // FIFO: oldest is at index 0
            const evicted = queue.shift();
            if (evicted) {
                console.debug(`[QueueManager] Evicted oldest item (id: ${evicted.id}, status: ${evicted.status}) due to queue limit.`);
            }
        }

        queue.push(item);
        await this.storage.setQueue(queue);
        console.debug(`[QueueManager] Added item to queue (id: ${item.id}, type: ${item.type})`);
    }

    /**
     * Get the next item to process in FIFO order.
     */
    public async getNext(): Promise<QueueItem | null> {
        const queue = await this.storage.getQueue();
        const pending = queue.find(item => item.status === QueueStatus.Queued);
        return pending || null;
    }

    /**
     * Get all items in the queue.
     */
    public async getAll(): Promise<QueueItem[]> {
        return await this.storage.getQueue();
    }

    /**
     * Get only pending (queued) items.
     */
    public async getPending(): Promise<QueueItem[]> {
        const queue = await this.storage.getQueue();
        return queue.filter(item => item.status === QueueStatus.Queued);
    }

    /**
     * Delete an item from the queue by ID.
     */
    public async delete(id: string): Promise<void> {
        await this.storage.deleteQueueItem(id);
        console.debug(`[QueueManager] Deleted item from queue (id: ${id})`);
    }

    /**
     * Update the status of a queue item.
     */
    public async updateStatus(id: string, status: QueueStatus): Promise<void> {
        const queue = await this.storage.getQueue();
        const index = queue.findIndex(item => item.id === id);

        if (index !== -1) {
            const item = queue[index];
            item.status = status;
            item.timestamps.lastAttempt = Date.now();

            if (status === QueueStatus.Sent || status === QueueStatus.Failed) {
                item.timestamps.completed = Date.now();
            }

            await this.storage.setQueue(queue);
            console.debug(`[QueueManager] Updated item status (id: ${id}, status: ${status})`);
        }
    }

    /**
     * Mark an item as successfully sent.
     */
    public async markSent(id: string): Promise<void> {
        await this.updateStatus(id, QueueStatus.Sent);
    }

    /**
     * Mark an item as failed.
     */
    public async markFailed(id: string, error: string): Promise<void> {
        const queue = await this.storage.getQueue();
        const index = queue.findIndex(item => item.id === id);

        if (index !== -1) {
            const item = queue[index];
            item.status = QueueStatus.Failed;
            item.error = error;
            item.timestamps.lastAttempt = Date.now();
            item.timestamps.completed = Date.now();

            await this.storage.setQueue(queue);
            console.debug(`[QueueManager] Marked item as failed (id: ${id}, error: ${error})`);
        }
    }

    /**
     * Get a specific queue item by ID.
     */
    public async get(id: string): Promise<QueueItem | null> {
        const queue = await this.storage.getQueue();
        return queue.find(item => item.id === id) || null;
    }

    /**
     * Update the retry count of a queue item.
     */
    public async updateRetryCount(id: string, count: number): Promise<void> {
        const queue = await this.storage.getQueue();
        const index = queue.findIndex(item => item.id === id);

        if (index !== -1) {
            queue[index].retryCount = count;
            queue[index].timestamps.lastAttempt = Date.now();
            await this.storage.setQueue(queue);
            console.debug(`[QueueManager] Updated retry count (id: ${id}, count: ${count})`);
        }
    }

    /**
     * Update the error message of a queue item without marking as failed.
     */
    public async updateErrorMessage(id: string, error: string): Promise<void> {
        const queue = await this.storage.getQueue();
        const index = queue.findIndex(item => item.id === id);

        if (index !== -1) {
            queue[index].error = error;
            await this.storage.setQueue(queue);
            console.debug(`[QueueManager] Updated error message (id: ${id})`);
        }
    }

    /**
     * Resets all items with "sending" status back to "queued".
     * Used for recovery on service worker startup.
     */
    public async resetSendingToQueued(): Promise<number> {
        const queue = await this.storage.getQueue();
        const sendingItems = queue.filter(item => item.status === QueueStatus.Sending);

        if (sendingItems.length > 0) {
            for (const item of sendingItems) {
                item.status = QueueStatus.Queued;
                item.timestamps.lastAttempt = Date.now();
            }
            await this.storage.setQueue(queue);
            console.info(`[QueueManager] Reset ${sendingItems.length} items from 'sending' to 'queued'.`);
        }

        return sendingItems.length;
    }

    /**
     * Clear the entire queue.
     */
    public async clear(): Promise<void> {
        await this.storage.setQueue([]);
        console.debug('[QueueManager] Queue cleared.');
    }
}
