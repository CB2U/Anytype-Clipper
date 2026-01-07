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
    private readonly VAULT_THRESHOLD = 51200; // 50KB - offload fields larger than this
    private taskQueue: Promise<any> = Promise.resolve();
    public readonly instanceId = Math.random().toString(36).substring(2, 9);

    // In-memory cache to ensure consistent read-after-write even if storage is latent
    private cachedQueue: QueueItem[] | null = null;

    private constructor(storage: StorageManager) {
        this.storage = storage;

        // Listen for storage changes to keep cache in sync with other contexts (e.g. Popup deletes)
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.queue) {
                console.log(`[QueueManager][${this.instanceId}] Storage changed externally, invalidating cache.`);
                this.cachedQueue = null;
            }
        });
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
            console.log(`[QueueManager] Initialized singleton instance: ${QueueManager.instance.instanceId}`);
        }
        return QueueManager.instance;
    }

    /**
     * Ensures the in-memory cache is populated from storage.
     */
    private async ensureQueue(): Promise<QueueItem[]> {
        if (this.cachedQueue === null) {
            this.cachedQueue = await this.storage.getQueue();
            console.log(`[QueueManager][${this.instanceId}] Cache populated from storage. Size: ${this.cachedQueue.length}`);
        }
        return this.cachedQueue;
    }

    /**
     * Executes a task sequentially to prevent race conditions on storage.
     */
    private async enqueueTask<T>(task: () => Promise<T>): Promise<T> {
        // Chain the task but ensure the chain itself recovers if THIS task fails
        // Use .catch(() => {}) to ensure the NEXT task still runs even if this one rejected
        const taskPromise = this.taskQueue.catch(() => { }).then(task);
        this.taskQueue = taskPromise.catch(() => { });

        // Return the promise for the current task, allowing the caller to await its completion or handle its rejection
        return taskPromise;
    }

    /**
     * Add an item to the queue. 
     * Handles FIFO eviction if the queue exceeds MAX_QUEUE_SIZE.
     */
    public async add(item: QueueItem): Promise<void> {
        return this.enqueueTask(async () => {
            const queue = await this.ensureQueue();
            console.log(`[QueueManager][${this.instanceId}] ADD START: ${item.id}. Current queue IDs: ${queue.map(i => i.id).join(', ')}`);

            // Offload large fields to Vault to keep main queue key small
            const vaultKeys: string[] = [];
            const payload = item.payload as any;

            if (payload.content && typeof payload.content === 'string' && payload.content.length > this.VAULT_THRESHOLD) {
                const vaultKey = `vault:${item.id}:content`;
                console.log(`[QueueManager][${this.instanceId}] Offloading large content (${payload.content.length} chars) to vault: ${vaultKey}`);
                await this.storage.setVault(vaultKey, payload.content);
                payload.content = '__vault__'; // Placeholder
                vaultKeys.push(vaultKey);
            }

            // Also check metadata.content (Redundancy check)
            if (payload.metadata?.content && typeof payload.metadata.content === 'string' && payload.metadata.content.length > this.VAULT_THRESHOLD) {
                const vaultKey = `vault:${item.id}:meta_content`;
                console.log(`[QueueManager][${this.instanceId}] Offloading large meta_content (${payload.metadata.content.length} chars) to vault: ${vaultKey}`);
                await this.storage.setVault(vaultKey, payload.metadata.content);
                payload.metadata.content = '__vault__'; // Placeholder
                vaultKeys.push(vaultKey);
            }

            if (vaultKeys.length > 0) {
                item.vaultKeys = vaultKeys;
            }

            // FIFO eviction if queue is full
            if (queue.length >= this.MAX_QUEUE_SIZE) {
                const evicted = queue.shift();
                if (evicted) {
                    console.warn(`[QueueManager][${this.instanceId}] Queue full. Evicted: ${evicted.id}`);
                    await this.cleanupVault(evicted);
                }
            }

            queue.push(item);
            await this.storage.setQueue(queue);
            console.log(`[QueueManager][${this.instanceId}] ADD SUCCESS: ${item.id}. New queue IDs: ${queue.map(i => i.id).join(', ')}`);
        });
    }

    /**
     * Hydrates an item by fetching any offloaded data from the Vault.
     */
    public async hydrate(item: QueueItem): Promise<QueueItem> {
        if (!item.vaultKeys || item.vaultKeys.length === 0) return item;

        // Clone to avoid modifying the cached/stored item directly if not intended
        const hydrated = JSON.parse(JSON.stringify(item));
        const payload = hydrated.payload as any;

        for (const key of item.vaultKeys) {
            const data = await this.storage.getVault(key);
            if (key.endsWith(':content')) {
                payload.content = data;
            } else if (key.endsWith(':meta_content')) {
                if (payload.metadata) payload.metadata.content = data;
            }
        }

        return hydrated;
    }

    /**
     * Cleans up any Vault entries associated with an item.
     */
    private async cleanupVault(item: QueueItem): Promise<void> {
        if (item.vaultKeys && item.vaultKeys.length > 0) {
            for (const key of item.vaultKeys) {
                await this.storage.removeVault(key);
            }
        }
    }

    /**
     * Get the next item to process in FIFO order.
     */
    public async getNext(): Promise<QueueItem | null> {
        const queue = await this.ensureQueue();
        const pending = queue.find(item => item.status === QueueStatus.Queued);
        return pending || null;
    }

    /**
     * Get all items in the queue.
     */
    public async getAll(): Promise<QueueItem[]> {
        return await this.ensureQueue();
    }

    /**
     * Get only pending (queued) items.
     */
    public async getPending(): Promise<QueueItem[]> {
        const queue = await this.ensureQueue();
        return queue.filter(item => item.status === QueueStatus.Queued);
    }

    /**
     * Delete an item from the queue by ID.
     */
    public async delete(id: string): Promise<void> {
        return this.enqueueTask(async () => {
            const queue = await this.ensureQueue();
            const index = queue.findIndex(item => item.id === id);

            if (index !== -1) {
                const item = queue[index];
                await this.cleanupVault(item);

                const filtered = queue.filter(it => it.id !== id);
                this.cachedQueue = filtered; // Update cache
                await this.storage.setQueue(filtered);
                console.log(`[QueueManager][${this.instanceId}] Deleted item ${id}. New size: ${filtered.length}`);
            }
        });
    }

    /**
     * Update the status of a queue item.
     */
    public async updateStatus(id: string, status: QueueStatus): Promise<void> {
        return this.enqueueTask(async () => {
            const queue = await this.ensureQueue();
            const index = queue.findIndex(item => item.id === id);

            if (index !== -1) {
                const item = queue[index];
                const oldStatus = item.status;
                item.status = status;
                item.timestamps.lastAttempt = Date.now();

                if (status === QueueStatus.Sent || status === QueueStatus.Failed) {
                    item.timestamps.completed = Date.now();
                }

                await this.storage.setQueue(queue);
                this.cachedQueue = queue; // Update cache
                console.log(`[QueueManager][${this.instanceId}] Updated ${id}: ${oldStatus} -> ${status}. Size: ${queue.length}`);
            }
        });
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
        return this.enqueueTask(async () => {
            const queue = await this.ensureQueue();
            const index = queue.findIndex(item => item.id === id);

            if (index !== -1) {
                const item = queue[index];
                item.status = QueueStatus.Failed;
                item.error = error;
                item.timestamps.lastAttempt = Date.now();
                item.timestamps.completed = Date.now();

                await this.storage.setQueue(queue);
                this.cachedQueue = queue; // Update cache
                console.debug(`[QueueManager][${this.instanceId}] Marked item as failed (id: ${id})`);
            }
        });
    }

    /**
     * Get a specific queue item by ID.
     */
    public async get(id: string): Promise<QueueItem | null> {
        const queue = await this.ensureQueue();
        return queue.find(item => item.id === id) || null;
    }

    /**
     * Update the retry count of a queue item.
     */
    public async updateRetryCount(id: string, count: number): Promise<void> {
        return this.enqueueTask(async () => {
            const queue = await this.ensureQueue();
            const index = queue.findIndex(item => item.id === id);

            if (index !== -1) {
                queue[index].retryCount = count;
                queue[index].timestamps.lastAttempt = Date.now();
                await this.storage.setQueue(queue);
                this.cachedQueue = queue; // Update cache
                console.debug(`[QueueManager] Updated retry count (id: ${id}, count: ${count})`);
            }
        });
    }

    /**
     * Update the error message of a queue item without marking as failed.
     */
    public async updateErrorMessage(id: string, error: string): Promise<void> {
        return this.enqueueTask(async () => {
            const queue = await this.ensureQueue();
            const index = queue.findIndex(item => item.id === id);

            if (index !== -1) {
                queue[index].error = error;
                await this.storage.setQueue(queue);
                this.cachedQueue = queue; // Update cache
                console.debug(`[QueueManager][${this.instanceId}] Updated error message (id: ${id})`);
            }
        });
    }

    /**
     * Resets all items with "sending" status back to "queued".
     * Used for recovery on service worker startup.
     */
    public async resetSendingToQueued(): Promise<number> {
        return this.enqueueTask(async () => {
            const queue = await this.storage.getQueue();
            const sendingItems = queue.filter(item => item.status === QueueStatus.Sending);

            if (sendingItems.length > 0) {
                for (const item of sendingItems) {
                    item.status = QueueStatus.Queued;
                    if (!item.timestamps) {
                        item.timestamps = { created: Date.now() };
                    }
                    item.timestamps.lastAttempt = Date.now();
                }
                await this.storage.setQueue(queue);
                console.info(`[QueueManager] Reset ${sendingItems.length} items from 'sending' to 'queued'.`);
            }

            return sendingItems.length;
        });
    }

    /**
     * Clear the entire queue.
     */
    public async clear(): Promise<void> {
        return this.enqueueTask(async () => {
            await this.storage.setQueue([]);
            console.debug('[QueueManager] Queue cleared.');
        });
    }
}
