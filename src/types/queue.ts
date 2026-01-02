import { PageMetadata } from './metadata';

/**
 * Status of a queue item
 */
export enum QueueStatus {
    /** Item is waiting to be processed */
    Queued = 'queued',
    /** Item is currently being sent to the API */
    Sending = 'sending',
    /** Item was successfully sent */
    Sent = 'sent',
    /** Item failed to send after retries */
    Failed = 'failed'
}

/**
 * Payload for a bookmark capture
 */
export interface BookmarkPayload {
    spaceId: string;
    url: string;
    title: string;
    tags: string[];
    notes?: string;
    metadata: PageMetadata;
}

/**
 * Payload for a highlight capture
 */
export interface HighlightPayload {
    spaceId: string;
    quote: string;
    contextBefore?: string;
    contextAfter?: string;
    url: string;
    pageTitle: string;
    tags: string[];
}

/**
 * Payload for an article capture
 */
export interface ArticlePayload {
    spaceId: string;
    url: string;
    title: string;
    content: string; // Markdown or plain text content
    tags: string[];
    metadata: PageMetadata;
}

/**
 * Combined type for all capture payloads
 */
export type CapturePayload = BookmarkPayload | HighlightPayload | ArticlePayload;

/**
 * Represents an item in the offline queue
 */
export interface QueueItem {
    /** Unique identifier (UUID) */
    id: string;
    /** Type of capture */
    type: 'bookmark' | 'highlight' | 'article';
    /** The capture data */
    payload: CapturePayload;
    /** Current status */
    status: QueueStatus;
    /** Timestamps for lifecycle tracking */
    timestamps: {
        /** When it was added to the queue */
        created: number;
        /** When the last attempt occurred */
        lastAttempt?: number;
        /** When it was completed (sent or failed) */
        completed?: number;
    };
    /** Number of retry attempts made */
    retryCount: number;
    /** Error message from the last attempt */
    error?: string;
}
