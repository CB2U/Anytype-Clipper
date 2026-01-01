/**
 * Tag Management Types
 */

export interface Tag {
    id: string;
    name: string;
    color: string; // Hex color code
}

export interface ListTagsRequest {
    spaceId: string;
    propertyId: string;
    offset?: number;
    limit?: number;
    filters?: Record<string, any>;
}

export interface ListTagsResponse {
    links: any;
    tags: Tag[];
    total: number;
    offset: number;
    limit: number;
}

export interface CreateTagRequest {
    spaceId: string;
    propertyId: string;
    name: string;
    color?: string;
}

export interface CreateTagResponse {
    tag: Tag;
}

export interface TagCacheEntry {
    tags: Tag[];
    timestamp: number;
    propertyId: string;
}
