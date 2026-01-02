import { QueueManager } from './queue-manager';
import { QueueItem, QueueStatus, BookmarkPayload, HighlightPayload, ArticlePayload } from '../types/queue';
import { AnytypeApiClient } from '../lib/api/client';
import { CreateObjectParams } from '../lib/api/types';

/**
 * RetryScheduler manages automated retry logic for queued captures.
 * It uses exponential backoff and chrome.alarms for reliable background processing.
 */
export class RetryScheduler {
    private static instance: RetryScheduler;
    private queueManager: QueueManager;
    private apiClient: AnytypeApiClient;

    public static readonly MAX_RETRY_ATTEMPTS = 10;
    public static readonly BACKOFF_INTERVALS = [1000, 5000, 30000, 300000]; // 1s, 5s, 30s, 5m

    private constructor(queueManager: QueueManager, apiClient: AnytypeApiClient) {
        this.queueManager = queueManager;
        this.apiClient = apiClient;
    }

    /**
     * Returns the singleton instance of RetryScheduler.
     */
    public static getInstance(queueManager: QueueManager, apiClient: AnytypeApiClient): RetryScheduler {
        if (!RetryScheduler.instance) {
            RetryScheduler.instance = new RetryScheduler(queueManager, apiClient);
        }
        return RetryScheduler.instance;
    }

    /**
     * Calculates the exponential backoff delay based on retry count.
     * @param retryCount Number of previous retry attempts.
     * @returns Delay in milliseconds.
     */
    public calculateBackoff(retryCount: number): number {
        if (retryCount <= 0) return RetryScheduler.BACKOFF_INTERVALS[0];
        if (retryCount >= RetryScheduler.BACKOFF_INTERVALS.length) {
            return RetryScheduler.BACKOFF_INTERVALS[RetryScheduler.BACKOFF_INTERVALS.length - 1];
        }
        return RetryScheduler.BACKOFF_INTERVALS[retryCount];
    }

    /**
   * Schedules a retry attempt for a queue item.
   * @param queueItem The item to retry.
   */
    public async scheduleRetry(queueItem: QueueItem): Promise<void> {
        const delayMs = this.calculateBackoff(queueItem.retryCount);
        const alarmName = `retry-${queueItem.id}`;

        console.debug(`[RetryScheduler] Scheduling retry for item ${queueItem.id} (attempt ${queueItem.retryCount + 1}/${RetryScheduler.MAX_RETRY_ATTEMPTS}, delay: ${delayMs}ms)`);

        // chrome.alarms.create delayInMinutes must be >= 0
        // For very short delays, we use 0 which triggers as soon as possible (usually ~1s or less depending on browser)
        const delayInMinutes = delayMs / 60000;

        try {
            await chrome.alarms.create(alarmName, {
                delayInMinutes: delayInMinutes,
            });
        } catch (error) {
            console.error(`[RetryScheduler] Failed to schedule alarm for item ${queueItem.id}:`, error);
        }
    }

    /**
   * Processes a retry attempt when an alarm triggers.
   * @param queueItemId ID of the queue item to process.
   */
    public async processRetry(queueItemId: string): Promise<void> {
        const item = await this.queueManager.get(queueItemId);

        if (!item) {
            console.warn(`[RetryScheduler] Item ${queueItemId} not found for retry processing.`);
            await chrome.alarms.clear(`retry-${queueItemId}`);
            return;
        }

        if (item.status !== QueueStatus.Queued) {
            console.debug(`[RetryScheduler] Item ${queueItemId} is not in 'queued' status (current: ${item.status}). Skipping.`);
            await chrome.alarms.clear(`retry-${queueItemId}`);
            return;
        }

        if (item.retryCount >= RetryScheduler.MAX_RETRY_ATTEMPTS) {
            console.error(`[RetryScheduler] Item ${queueItemId} exceeded max retry attempts (${RetryScheduler.MAX_RETRY_ATTEMPTS}). Marking as failed.`);
            await this.queueManager.markFailed(queueItemId, 'Max retry attempts exceeded');
            await chrome.alarms.clear(`retry-${queueItemId}`);
            return;
        }

        try {
            // Update status to 'sending' and increment retry count
            await this.queueManager.updateStatus(queueItemId, QueueStatus.Sending);
            const newRetryCount = item.retryCount + 1;
            await this.queueManager.updateRetryCount(queueItemId, newRetryCount);

            console.debug(`[RetryScheduler] Retrying item ${queueItemId} (attempt ${newRetryCount}/${RetryScheduler.MAX_RETRY_ATTEMPTS})`);

            // Map payload to API params based on type
            let result;
            let spaceId;
            const params: CreateObjectParams = {
                title: '',
            };

            if (item.type === 'bookmark') {
                const payload = item.payload as BookmarkPayload;
                spaceId = payload.spaceId;
                params.title = payload.title;
                params.description = payload.notes || '';
                params.type_key = 'bookmark';
                params.source = payload.url;
            } else if (item.type === 'highlight') {
                const payload = item.payload as HighlightPayload;
                spaceId = payload.spaceId;
                params.title = payload.pageTitle;
                params.type_key = 'highlight';
                params.quote = payload.quote;
                params.contextBefore = payload.contextBefore;
                params.contextAfter = payload.contextAfter;
                params.source = payload.url;
            } else if (item.type === 'article') {
                const payload = item.payload as ArticlePayload;
                spaceId = payload.spaceId;
                params.title = payload.title;
                params.description = payload.content;
                params.type_key = 'article';
                params.source = payload.url;
            } else {
                throw new Error(`Unsupported item type for retry: ${item.type}`);
            }

            // Attempt to send via API client
            if (spaceId) {
                result = await this.apiClient.createObject(spaceId, params);
            } else {
                throw new Error('Missing spaceId in payload');
            }

            if (result) {
                console.info(`[RetryScheduler] Retry succeeded for item ${queueItemId}`);
                await this.queueManager.markSent(queueItemId);
                await chrome.alarms.clear(`retry-${queueItemId}`);
            } else {
                throw new Error('API returned empty result');
            }
        } catch (error) {
            const sanitizedError = this.sanitizeErrorMessage(error);
            console.error(`[RetryScheduler] Retry failed for item ${queueItemId}: ${sanitizedError}`);

            // Revert status to 'queued' and schedule next retry
            await this.queueManager.updateStatus(queueItemId, QueueStatus.Queued);
            await this.queueManager.updateErrorMessage(queueItemId, sanitizedError);

            if (item.retryCount + 1 >= RetryScheduler.MAX_RETRY_ATTEMPTS) {
                await this.queueManager.markFailed(queueItemId, sanitizedError);
                await chrome.alarms.clear(`retry-${queueItemId}`);
            } else {
                // Re-schedule next retry
                const updatedItem = await this.queueManager.get(queueItemId);
                if (updatedItem) {
                    await this.scheduleRetry(updatedItem);
                }
            }
        }
    }

    /**
   * Cleans an error message to remove sensitive information like API keys or tokens.
   * @param error The error object or message to sanitize.
   * @returns A sanitized string representation of the error.
   */
    public sanitizeErrorMessage(error: any): string {
        let message = '';
        if (typeof error === 'string') {
            message = error;
        } else if (error instanceof Error) {
            message = error.message;
        } else {
            try {
                message = JSON.stringify(error);
            } catch (e) {
                message = String(error);
            }
        }

        // Sanitize API keys and tokens using regex
        // Patterns: api-key, apiKey, token=..., bearer ...
        const sanitized = message
            .replace(/api[_-]?key[=:]\s*[\w-]+/gi, 'apiKey=***')
            .replace(/token[=:]\s*[\w-]+/gi, 'token=***')
            .replace(/bearer\s+[\w.-]+/gi, 'Bearer ***')
            .replace(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g, '***@***.***'); // Simple email mask

        // Truncate if too long (max 500 chars)
        if (sanitized.length > 500) {
            return sanitized.substring(0, 497) + '...';
        }

        return sanitized;
    }

    /**
   * Manually retries a failed queue item.
   * Resets retry count, sets status back to 'queued', and schedules an immediate attempt.
   * @param queueItemId ID of the item to retry.
   */
    public async manualRetry(queueItemId: string): Promise<void> {
        const item = await this.queueManager.get(queueItemId);

        if (!item) {
            console.warn(`[RetryScheduler] Item ${queueItemId} not found for manual retry.`);
            return;
        }

        console.debug(`[RetryScheduler] Manually retrying item ${queueItemId}. Resetting retry count.`);

        await this.queueManager.updateRetryCount(queueItemId, 0);
        await this.queueManager.updateStatus(queueItemId, QueueStatus.Queued);

        // Clear any existing alarm and schedule immediate retry
        const alarmName = `retry-${queueItemId}`;
        await chrome.alarms.clear(alarmName);

        const updatedItem = await this.queueManager.get(queueItemId);
        if (updatedItem) {
            await this.scheduleRetry(updatedItem);
        }
    }

    /**
     * Deletes a failed queue item and cancels any pending retries.
     * @param queueItemId ID of the item to delete.
     */
    public async deleteFailed(queueItemId: string): Promise<void> {
        console.debug(`[RetryScheduler] Deleting failed item ${queueItemId}.`);

        // Cancel any pending alarm
        const alarmName = `retry-${queueItemId}`;
        await chrome.alarms.clear(alarmName);

        // Remove from queue
        await this.queueManager.delete(queueItemId);
    }

    /**
   * Resumes retry processing for all pending items on startup.
   */
    public async resumeRetries(): Promise<void> {
        console.debug('[RetryScheduler] Resuming retries for pending items...');
        try {
            const pendingItems = await this.queueManager.getPending();

            for (const item of pendingItems) {
                if (item.retryCount < RetryScheduler.MAX_RETRY_ATTEMPTS) {
                    await this.scheduleRetry(item);
                } else {
                    await this.queueManager.markFailed(item.id, 'Max retry attempts exceeded (resumed)');
                    await chrome.alarms.clear(`retry-${item.id}`);
                }
            }

            console.debug(`[RetryScheduler] Resumed retries for ${pendingItems.length} items.`);
        } catch (error) {
            console.error('[RetryScheduler] Failed to resume retries:', error);
        }
    }
}
