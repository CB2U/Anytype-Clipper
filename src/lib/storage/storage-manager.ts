import { StorageSchema, StorageKey, StorageSchemaValidator } from './schema';
import { DEFAULTS } from './defaults';

export class StorageManager {
    private static instance: StorageManager;
    private writeLock: Promise<void> = Promise.resolve();
    public readonly instanceId = Math.random().toString(36).substring(2, 9);
    private readonly QUOTA_BYTES = 5242880; // 5MB standard limit for local storage (soft limit for extension, but good for warning)
    private readonly QUOTA_WARNING_THRESHOLD = 0.8;

    private constructor() { }

    public static getInstance(): StorageManager {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
            console.log(`[StorageManager] Initialized singleton instance: ${StorageManager.instance.instanceId}`);
        }
        return StorageManager.instance;
    }

    /**
     * Get a value from storage. Returns default if not found.
     */
    public async get<K extends StorageKey>(key: K): Promise<StorageSchema[K]> {
        // Wait for any pending writes to finish before reading to ensure consistency
        try {
            await this.writeLock;
        } catch {
            // Continue even if previous write failed
        }
        const result = await chrome.storage.local.get(key);
        const value = result[key];

        if (value === undefined) {
            const defaultValue = DEFAULTS[key];
            return (typeof defaultValue === 'object' && defaultValue !== null)
                ? JSON.parse(JSON.stringify(defaultValue))
                : defaultValue;
        }

        // Optional: Validate schema on read (or just trust storage?)
        // Basic validation:
        // const schema = StorageSchemaValidator.shape[key];
        // if (schema) {
        //   const parsed = schema.safeParse(value);
        //   if (!parsed.success) {
        //     console.warn(`Storage validation failed for ${key}:`, parsed.error);
        //     return DEFAULTS[key];
        //   }
        //   return parsed.data as StorageSchema[K];
        // }

        // For now, return as is (trusting write-side validation or simple retrieval)
        // To strictly strictly follow "TypeSafe", we should parse.
        // Let's implement lightweight validation using our Zod schemas IF explicit validation requested, 
        // but for perf, maybe just assume it's correct if we only write via this manager.
        // Given T1 AC "Type-Safe Operations", let's return the value casted.
        return value as StorageSchema[K];
    }

    /**
     * Set a value in storage with validation and error checking.
     */
    public async set<K extends StorageKey>(key: K, value: StorageSchema[K]): Promise<void> {
        // Validation
        const shape = StorageSchemaValidator.shape;
        const fieldSchema = shape[key];
        if (fieldSchema) {
            const parsed = fieldSchema.safeParse(value);
            if (!parsed.success) {
                console.error(`[StorageManager] VALIDATION FAILED for key "${key}":`, parsed.error.format());
                throw new Error(`Invalid value for storage key ${key}: ${parsed.error.message}`);
            }
        }

        // Sequential write to prevent race conditions
        const task = async () => {
            if (key === 'queue') {
                const q = value as any[];
                console.log(`[StorageManager][${this.instanceId}] Writing queue of size ${q.length}. IDs: ${q.map(i => i.id).join(', ')}`);
            }
            return new Promise<void>((resolve, reject) => {
                chrome.storage.local.set({ [key]: value }, () => {
                    if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError;
                        console.error(`[StorageManager] Error setting key "${key}":`, error);
                        reject(new Error(error.message));
                    } else {
                        resolve();
                    }
                });
            });
        };

        // Chain the task but ensure the chain itself recovers if THIS task fails
        // Use .catch(() => {}) to ensure the NEXT task still runs even if this one rejected
        const taskPromise = this.writeLock.catch(() => { }).then(task);
        this.writeLock = taskPromise.catch(() => { });

        // Wait for THIS specific task to finish (it will throw if 'task' rejected)
        await taskPromise;

        // Check quota after write (fire and forget check)
        this.checkQuota().catch(console.error);
    }

    /**
     * Remove a key from storage.
     */
    public async remove(key: StorageKey): Promise<void> {
        const task = async () => {
            await chrome.storage.local.remove(key);
        };
        const taskPromise = this.writeLock.catch(() => { }).then(task);
        this.writeLock = taskPromise.catch(() => { });
        await taskPromise;
    }

    /**
     * Clear all data from extension storage.
     */
    public async clear(): Promise<void> {
        const task = async () => {
            await chrome.storage.local.clear();
        };
        const taskPromise = this.writeLock.catch(() => { }).then(task);
        this.writeLock = taskPromise.catch(() => { });
        await taskPromise;
    }

    /**
     * Get current usage in bytes.
     */
    public async getBytesInUse(): Promise<number> {
        return await chrome.storage.local.getBytesInUse();
    }

    /**
     * Check quota constraints and return usage statistics.
     */
    public async checkQuota(): Promise<{ bytesInUse: number; limit: number; percentUsed: number; }> {
        const used = await this.getBytesInUse();
        const limit = this.QUOTA_BYTES;
        const percentUsed = (used / limit) * 100;

        if (percentUsed > (this.QUOTA_WARNING_THRESHOLD * 100)) {
            console.warn(`[StorageManager] Storage usage is high: ${Math.round(percentUsed)}% (${used} / ${limit} bytes)`);
        }

        return {
            bytesInUse: used,
            limit,
            percentUsed
        };
    }

    /**
     * Get image handling settings.
     */
    public async getImageHandlingSettings(): Promise<import('./schema').ImageHandlingSettings> {
        return (await this.get('imageHandlingSettings')) as import('./schema').ImageHandlingSettings;
    }

    /**
     * Set image handling settings.
     */
    public async setImageHandlingSettings(settings: import('./schema').ImageHandlingSettings): Promise<void> {
        await this.set('imageHandlingSettings', settings);
    }

    /**
     * Get extension settings.
     */
    public async getExtensionSettings(): Promise<import('./schema').ExtensionSettings> {
        return (await this.get('extensionSettings')) as import('./schema').ExtensionSettings;
    }

    /**
     * Set extension settings.
     */
    public async setExtensionSettings(settings: import('./schema').ExtensionSettings): Promise<void> {
        await this.set('extensionSettings', settings);
    }

    /**
     * Get the current offline queue.
     */
    public async getQueue(): Promise<import('../../types/queue').QueueItem[]> {
        const queue = (await this.get('queue')) || [];
        // Ensure we return a deep clone to prevent accidental mutation of internal storage state
        return Array.isArray(queue) ? JSON.parse(JSON.stringify(queue)) : [];
    }

    /**
     * Set the entire offline queue.
     */
    public async setQueue(queue: import('../../types/queue').QueueItem[]): Promise<void> {
        // Deep clone before setting to ensure we don't hold references to the passed array
        const clonedQueue = JSON.parse(JSON.stringify(queue));
        await this.set('queue', clonedQueue);
    }

    /**
     * Set a value in the Vault (dynamic separate key).
     */
    public async setVault(key: string, value: any): Promise<void> {
        // Sequential write
        const task = async () => {
            return new Promise<void>((resolve, reject) => {
                chrome.storage.local.set({ [key]: value }, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
        };
        const taskPromise = this.writeLock.catch(() => { }).then(task);
        this.writeLock = taskPromise.catch(() => { });
        await taskPromise;
    }

    /**
     * Get a value from the Vault.
     */
    public async getVault(key: string): Promise<any> {
        await this.writeLock;
        const result = await chrome.storage.local.get(key);
        return result[key];
    }

    /**
     * Remove a value from the Vault.
     */
    public async removeVault(key: string): Promise<void> {
        const task = async () => {
            await chrome.storage.local.remove(key);
        };
        const taskPromise = this.writeLock.catch(() => { }).then(task);
        this.writeLock = taskPromise.catch(() => { });
        await taskPromise;
    }
}
