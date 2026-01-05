/**
 * AppendMetadata - Source metadata for appended content
 */
export interface AppendMetadata {
    url: string;
    pageTitle: string;
    timestamp: string; // ISO 8601 format
    captureType: 'bookmark' | 'article' | 'highlight';
}

/**
 * AppendResult - Result of append operation
 */
export interface AppendResult {
    success: boolean;
    objectId?: string;
    error?: string;
}

/**
 * AppendOptions - Parameters for append operation
 */
export interface AppendOptions {
    spaceId: string;
    objectId: string;
    content: string;
    metadata: AppendMetadata;
}
