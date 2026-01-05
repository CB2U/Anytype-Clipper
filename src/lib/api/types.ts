/**
 * TypeScript interfaces for Anytype API
 *
 * Defines request and response types for all Anytype API endpoints used by the extension.
 * These interfaces match the Anytype API v1.x specification.
 */

// ============================================================================
// Authentication Endpoints
// ============================================================================

/**
 * Request body for POST /v1/auth/challenges
 * No body required - endpoint generates a new challenge code
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreateChallengeRequest {
    /** Name of the application requesting access */
    app_name: string;
}

/**
 * Response from POST /v1/auth/challenges
 */
export interface CreateChallengeResponse {
    /** Unique identifier for this challenge */
    challengeId: string;
    /** Unix timestamp when this challenge expires */
    expiresAt: number;
    // API might return snake_case
    challenge_id?: string;
    expires_at?: number;
}

/**
 * Request body for POST /v1/auth/api_keys
 */
export interface CreateApiKeyRequest {
    /** Challenge ID from CreateChallengeResponse */
    challengeId: string;
    /** 4-digit code entered by user in Anytype Desktop */
    code: string;
}

/**
 * Response from POST /v1/auth/api_keys
 */
export interface CreateApiKeyResponse {
    /** API key to use for authenticated requests */
    apiKey: string;
    /** Optional: Unix timestamp when this API key expires (if Anytype implements expiration) */
    expiresAt?: number;
    // API might return snake_case
    api_key?: string;
    expires_at?: number;
}

// ============================================================================
// Spaces Endpoints
// ============================================================================

/**
 * Response from GET /v1/spaces
 */
export interface ListSpacesResponse {
    /** Array of available spaces */
    spaces: Space[];
}

/**
 * Represents an Anytype Space
 */
export interface Space {
    /** Unique identifier for this space */
    id: string;
    /** Display name of the space */
    name: string;
    /** Optional emoji icon for the space */
    iconEmoji?: string;
    /** Optional image URL for the space icon */
    iconImage?: string;
}

// ============================================================================
// Objects Endpoints
// ============================================================================

/**
 * Parameters for creating an object (helper interface)
 */
export interface CreateObjectParams {
    /** Text content/body of the object (treated as description or note body) */
    description?: string;
    /** Title of the object */
    title?: string;
    /** Source URL */
    source_url?: string;
    /** Domain name */
    domain?: string;
    /** Array of tags */
    tags?: string[];
    /** Any other custom fields */
    [key: string]: unknown;
}

/**
 * Request body for POST /v1/objects/create
 */
export interface CreateObjectRequest {
    /** Object title */
    name: string;
    /** Object content (Markdown) */
    body?: string;
    /** ID of the object type (e.g., "bookmark", "page") */
    type_key: string;
    /** Source URL for bookmarks (used for deduplication) */
    source?: string;
    /** Object properties - Array of key-value pairs (flattened value) */
    properties?: {
        key: string;
        text?: string;
        // Add other value types as needed
        [k: string]: unknown;
    }[];
}

/**
 * Response from POST /v1/objects/create
 */
export interface CreateObjectResponse {
    object: {
        id: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

/**
 * Request body for POST /v1/objects/search
 */
export interface SearchObjectsRequest {
    /** ID of the space to search in */
    spaceId: string;
    /** Optional: Search query string */
    query?: string;
    /** Optional: Additional filters (structure depends on Anytype API) */
    filters?: Record<string, unknown>;
    /** Optional: Maximum number of results to return */
    limit?: number;
}

/**
 * Response from POST /v1/objects/search
 */
export interface SearchObjectsResponse {
    /** Array of matching objects */
    objects: AnytypeObject[];
    /** Total number of matching objects (may be more than returned if limit applied) */
    total: number;
}

/**
 * Represents an Anytype object returned from search
 */
export interface AnytypeObject {
    /** Unique identifier for this object */
    id: string;
    /** Object title */
    name: string;
    /** ID of the object type */
    type_key: string;
    /** Object properties - flexible structure depends on object type */
    properties: Record<string, unknown>;
    /** Unix timestamp when this object was created */
    createdAt: number;
    /** Unix timestamp when this object was last updated */
    updatedAt: number;
}

/**
 * Request body for PUT /v1/objects/{id}
 */
export interface UpdateObjectRequest {
    /** Object properties to update - flexible structure depends on object type */
    properties: Record<string, unknown>;
}

/**
 * Response from PUT /v1/objects/{id}
 */
export interface UpdateObjectResponse {
    /** Unique identifier for the updated object */
    objectId: string;
    /** Unix timestamp when this object was last updated */
    updatedAt: number;
}
// ============================================================================
// Properties Endpoints
// ============================================================================

/**
 * Represents a Property (Relation) in Anytype
 */
export interface Property {
    /** Unique identifier for this property (used as propertyId in other endpoints) */
    id: string;
    /** Human-readable name of the property (e.g., "Tag", "Source") */
    name: string;
    /** Format of the property (e.g., "multi-select", "text", "tag") */
    format: string;
}

/**
 * Response from GET /v1/spaces/:spaceId/properties
 */
export interface ListPropertiesResponse {
    /** Array of properties available in the space */
    data: Property[];
}

// ============================================================================
// Tags Endpoints
// ============================================================================

/**
 * Represents a Tag in Anytype
 */
export interface Tag {
    id: string;
    name: string;
    color: string;
}

/**
 * Request for listing tags
 */
export interface ListTagsOptions {
    offset?: number;
    limit?: number;
    filters?: Record<string, string>;
}

/**
 * Response from GET /v1/spaces/:spaceId/properties/:propertyId/tags
 */
export interface ListTagsResponse {
    data: Tag[];
    pagination: {
        has_more: boolean;
        limit: number;
        offset: number;
        total: number;
    };
}

/**
 * Request body for POST /v1/spaces/:spaceId/properties/:propertyId/tags
 */
export interface CreateTagRequestData {
    /** Anytype Desktop API seems to require capitalized field names for tags */
    Name: string;
    Color: string;
}

/**
 * Response from POST /v1/spaces/:spaceId/properties/:propertyId/tags
 */
export interface CreateTagResponse {
    tag: Tag;
}
