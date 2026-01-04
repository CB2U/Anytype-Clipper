/**
 * Type definitions for URL deduplication functionality
 */

/**
 * Result of a duplicate detection search
 */
export interface DuplicateResult {
    /** Whether a duplicate was found */
    found: boolean;
    /** The existing object if found */
    object?: ExistingObject;
    /** Error message if search failed */
    error?: string;
}

/**
 * Existing object found during duplicate detection
 */
export interface ExistingObject {
    /** Anytype object ID */
    id: string;
    /** Object title/name */
    title: string;
    /** Source URL */
    url: string;
    /** Creation timestamp (Unix milliseconds) */
    createdAt: number;
    /** Space ID where object exists */
    spaceId: string;
}

/**
 * Anytype API search request for URL filtering
 */
export interface UrlSearchRequest {
    /** Filter expression */
    filters: {
        /** Logical operator */
        operator: 'and' | 'or';
        /** Filter conditions */
        conditions: Array<{
            /** Property key to filter on */
            property_key: string;
            /** URL value to match */
            url: string;
            /** Filter condition */
            condition: 'eq' | 'ne' | 'contains';
        }>;
    };
    /** Object types to search */
    types: string[];
    /** Maximum results to return */
    limit: number;
}

/**
 * Anytype API search response
 */
export interface UrlSearchResponse {
    /** Array of matching objects */
    data: Array<{
        /** Object ID */
        id: string;
        /** Object name */
        name: string;
        /** Object properties */
        properties: Array<{
            /** Property key */
            key: string;
            /** Property value (varies by type) */
            [key: string]: any;
        }>;
    }>;
}
