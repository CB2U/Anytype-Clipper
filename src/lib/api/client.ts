/**
 * HTTP client for Anytype API
 *
 * Provides type-safe methods for communicating with the local Anytype Desktop API.
 * All requests target localhost only for security.
 */

import { ApiError, NetworkError, classifyHttpError } from './errors';
import {
    CreateChallengeResponse,
    CreateApiKeyRequest,
    CreateApiKeyResponse,
    ListSpacesResponse,
    CreateObjectParams,
    CreateObjectRequest,
    CreateObjectResponse,
    UpdateObjectResponse,
    AnytypeObject,
    ListTagsResponse,
    ListTagsOptions,
    CreateTagRequestData,
    CreateTagResponse,
    ListPropertiesResponse,
} from './types';

/**
 * HTTP client for Anytype API
 *
 * Handles all communication with the local Anytype Desktop application.
 * Enforces localhost-only communication and provides type-safe request/response handling.
 *
 * @example
 * ```typescript
 * const client = new AnytypeApiClient(31009);
 * const spaces = await client.get<ListSpacesResponse>('/v1/spaces');
 * ```
 */
export class AnytypeApiClient {
    private readonly baseUrl: string;
    private readonly defaultTimeout: number = 10000; // 10 seconds
    private apiKey?: string;

    /**
     * Creates a new Anytype API client
     *
     * @param port - Port number for Anytype API (default: 31009)
     * @throws Error if port is invalid (must be 1024-65535)
     */
    constructor(port: number = 31009) {
        // Validate port range
        if (port < 1024 || port > 65535) {
            throw new Error(`Invalid port ${port}. Port must be between 1024 and 65535.`);
        }

        this.baseUrl = `http://localhost:${port}`;
    }

    /**
     * Sets the API key to use for authenticated requests
     * @param key - The API key
     */
    public setApiKey(key: string) {
        this.apiKey = key;
    }

    /**
     * Creates an authentication challenge
     * 
     * @returns Challenge ID and code to display to user
     */
    async createChallenge(): Promise<CreateChallengeResponse> {
        const response = await this.post<CreateChallengeResponse>('/v1/auth/challenges', {
            app_name: 'Anytype Clipper'
        });

        // Normalize snake_case to camelCase if needed
        return {
            ...response,
            challengeId: response.challengeId || response.challenge_id || '',
            expiresAt: response.expiresAt || response.expires_at || 0,
        };
    }

    /**
     * Creates an API key using an approved challenge
     * 
     * @param request - Challenge ID and code
     * @returns New API key
     */
    async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
        // Map camelCase to snake_case for the API
        const body = {
            challenge_id: request.challengeId,
            code: request.code
        };

        const response = await this.post<CreateApiKeyResponse>('/v1/auth/api_keys', body);

        // Normalize
        return {
            ...response,
            apiKey: response.apiKey || response.api_key || '',
            expiresAt: response.expiresAt || response.expires_at || 0,
        };
    }

    /**
     * Gets list of available spaces
     * Used for session validation and space selection
     * 
     * @returns List of spaces
     */
    async getSpaces(): Promise<ListSpacesResponse> {
        const response = await this.get<unknown>('/v1/spaces');

        // Handle variable response schemas
        if (Array.isArray(response)) {
            return { spaces: response as any[] };
        }

        if (typeof response === 'object' && response !== null) {
            if ('spaces' in response && Array.isArray((response as any).spaces)) {
                return response as ListSpacesResponse;
            }
            if ('data' in response && Array.isArray((response as any).data)) {
                return { spaces: (response as any).data };
            }
        }

        console.warn('Unexpected spaces response format:', response);
        throw new Error('Invalid response format from Anytype API');
    }

    /**
     * Creates a new object in a specific space
     * 
     * @param spaceId - ID of the space to create object in
     * @param params - Object parameters (title, description, etc.)
     * @returns Created object response
     */
    async createObject(spaceId: string, params: CreateObjectParams): Promise<AnytypeObject> {
        // Map params to top-level fields and properties
        const { title, description, type_key = 'bookmark' } = params;

        // Build body content (excluding tags - they'll be handled as a proper relation)
        let bodyContent = '';

        if (params.quote) {
            bodyContent += `> ${params.quote}\n\n`;
            if (params.contextBefore || params.contextAfter) {
                bodyContent += `*Context: ...${params.contextBefore || ''} **${params.quote}** ${params.contextAfter || ''}...*\n\n`;
            }
        }

        if (description) {
            bodyContent += `${description}\n\n`;
        }

        // NOTE: Tags are NOT added to body. They should be handled by the caller
        // using TagService to get tag IDs and then updating the object with the tag relation.


        const typeKeyStr = String(type_key || 'bookmark');
        const requestBody: CreateObjectRequest = {
            name: String(title || `Untitled ${typeKeyStr.charAt(0).toUpperCase() + typeKeyStr.slice(1)}`),
            body: bodyContent.trim(),
            type_key: typeKeyStr,
            source: params.source  // Add source URL for deduplication
        };

        const response = await this.post<CreateObjectResponse>(`/v1/spaces/${spaceId}/objects`, requestBody);

        return {
            id: response.object?.id,
            name: requestBody.name,
            type_key: requestBody.type_key,
            properties: params,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    /**
     * Lists existing tags for a specific property in a space
     * 
     * @param spaceId - ID of the space
     * @param propertyId - ID of the property (relation)
     * @param options - Pagination and filter options
     * @returns List of tags
     */
    async listTags(spaceId: string, propertyId: string, options?: ListTagsOptions): Promise<ListTagsResponse> {
        let endpoint = `/v1/spaces/${spaceId}/properties/${propertyId}/tags`;

        if (options) {
            const params = new URLSearchParams();
            if (options.offset !== undefined) params.append('offset', options.offset.toString());
            if (options.limit !== undefined) params.append('limit', options.limit.toString());
            if (options.filters) {
                Object.entries(options.filters).forEach(([key, value]) => {
                    params.append(key, value);
                });
            }
            const queryString = params.toString();
            if (queryString) {
                endpoint += `?${queryString}`;
            }
        }

        return this.get<ListTagsResponse>(endpoint);
    }

    /**
     * Lists available properties in a space
     * 
     * @param spaceId - ID of the space
     * @returns List of properties
     */
    async listProperties(spaceId: string): Promise<ListPropertiesResponse> {
        return this.get<ListPropertiesResponse>(`/v1/spaces/${spaceId}/properties`);
    }

    /**
     * Creates a new tag for a specific property in a space
     * 
     * @param spaceId - ID of the space
     * @param propertyId - ID of the property (relation)
     * @param data - Tag data (name, color)
     * @returns Created tag
     */
    async createTag(spaceId: string, propertyId: string, data: CreateTagRequestData): Promise<CreateTagResponse> {
        return this.post<CreateTagResponse>(`/v1/spaces/${spaceId}/properties/${propertyId}/tags`, data);
    }

    /**
     * Updates an existing object's properties
     * 
     * @param spaceId - ID of the space
     * @param objectId - ID of the object to update
     * @param properties - Properties to update (key-value pairs)
     * @returns Updated object response
     */
    async updateObject(spaceId: string, objectId: string, properties: any): Promise<UpdateObjectResponse> {
        return this.patch<UpdateObjectResponse>(`/v1/spaces/${spaceId}/objects/${objectId}`, { properties });
    }

    /**
     * Performs a GET request
     *
     * @param endpoint - API endpoint (e.g., '/v1/spaces')
     * @param headers - Optional request headers
     * @param timeout - Optional timeout in milliseconds (default: 10000)
     * @returns Response data
     * @throws AuthError, NetworkError, or ApiError
     */
    async get<T>(
        endpoint: string,
        headers?: Record<string, string>,
        timeout?: number
    ): Promise<T> {
        return this.request<T>('GET', endpoint, undefined, headers, timeout);
    }

    /**
     * Performs a POST request
     *
     * @param endpoint - API endpoint (e.g., '/v1/objects/create')
     * @param body - Request body (will be JSON serialized)
     * @param headers - Optional request headers
     * @param timeout - Optional timeout in milliseconds (default: 10000)
     * @returns Response data
     * @throws AuthError, NetworkError, or ApiError
     */
    async post<T>(
        endpoint: string,
        body?: unknown,
        headers?: Record<string, string>,
        timeout?: number
    ): Promise<T> {
        return this.request<T>('POST', endpoint, body, headers, timeout);
    }

    /**
     * Performs a PUT request
     *
     * @param endpoint - API endpoint (e.g., '/v1/objects/{id}')
     * @param body - Request body (will be JSON serialized)
     * @param headers - Optional request headers
     * @param timeout - Optional timeout in milliseconds (default: 10000)
     * @returns Response data
     * @throws AuthError, NetworkError, or ApiError
     */
    async put<T>(
        endpoint: string,
        body?: unknown,
        headers?: Record<string, string>,
        timeout?: number
    ): Promise<T> {
        return this.request<T>('PUT', endpoint, body, headers, timeout);
    }

    /**
     * Performs a PATCH request
     *
     * @param endpoint - API endpoint (e.g., '/v1/objects/{id}')
     * @param body - Request body (will be JSON serialized)
     * @param headers - Optional request headers
     * @param timeout - Optional timeout in milliseconds (default: 10000)
     * @returns Response data
     * @throws AuthError, NetworkError, or ApiError
     */
    async patch<T>(
        endpoint: string,
        body?: unknown,
        headers?: Record<string, string>,
        timeout?: number
    ): Promise<T> {
        return this.request<T>('PATCH', endpoint, body, headers, timeout);
    }

    /**
     * Performs a DELETE request
     *
     * @param endpoint - API endpoint (e.g., '/v1/objects/{id}')
     * @param headers - Optional request headers
     * @param timeout - Optional timeout in milliseconds (default: 10000)
     * @returns Response data
     * @throws AuthError, NetworkError, or ApiError
     */
    async delete<T>(
        endpoint: string,
        headers?: Record<string, string>,
        timeout?: number
    ): Promise<T> {
        return this.request<T>('DELETE', endpoint, undefined, headers, timeout);
    }

    /**
     * Builds full URL from endpoint
     *
     * @param endpoint - API endpoint
     * @returns Full URL (localhost only)
     */
    private buildUrl(endpoint: string): string {
        // Ensure endpoint starts with /
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${this.baseUrl}${normalizedEndpoint}`;
    }

    /**
     * Performs HTTP request with timeout and error handling
     *
     * @param method - HTTP method
     * @param endpoint - API endpoint
     * @param body - Optional request body
     * @param headers - Optional request headers
     * @param timeout - Optional timeout in milliseconds
     * @returns Response data
     * @throws AuthError, NetworkError, or ApiError
     */
    private async request<T>(
        method: string,
        endpoint: string,
        body?: unknown,
        headers?: Record<string, string>,
        timeout?: number
    ): Promise<T> {
        const url = this.buildUrl(endpoint);
        const timeoutMs = timeout ?? this.defaultTimeout;

        // Build request options
        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { 'X-Anytype-Api-Key': this.apiKey, 'Authorization': `Bearer ${this.apiKey}` } : {}),
            ...headers,
        };

        const requestOptions: RequestInit = {
            method,
            headers: requestHeaders,
        };

        // Add body for POST/PUT/PATCH requests
        if (body !== undefined && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            requestOptions.body = JSON.stringify(body);
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...requestOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Handle HTTP errors
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw classifyHttpError(
                    response.status,
                    `HTTP ${response.status}: ${errorText}`,
                    new Error(errorText)
                );
            }

            // Parse JSON response
            const data = await response.json();
            return data as T;
        } catch (error) {
            clearTimeout(timeoutId);

            // Re-throw if already an ApiError
            if (error instanceof ApiError) {
                throw error;
            }

            // Handle abort (timeout)
            if (error instanceof Error && error.name === 'AbortError') {
                throw new NetworkError(
                    `Request timeout after ${timeoutMs}ms`,
                    error
                );
            }

            // Handle network errors or other runtime errors
            throw new NetworkError(
                `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error : undefined
            );
        }
    }
}
