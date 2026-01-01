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
    AnytypeObject
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
        const { title, description, tags, ...otherParams } = params;

        // Combine description and tags into the body
        let bodyContent = String(description || '');
        if (Array.isArray(tags) && tags.length > 0) {
            bodyContent += `\n\nTags: ${tags.join(', ')}`;
        }

        // Map internal keys to Anytype relation keys
        // ONLY include properties that are confirmed standard
        const propertyMapping: Record<string, string> = {
            'source_url': 'source'
        };

        const propertiesArray = Object.entries(otherParams)
            .filter(([key]) => key in propertyMapping)
            .map(([key, value]) => ({
                key: propertyMapping[key],
                text: String(value ?? '')
            }));

        const requestBody: CreateObjectRequest = {
            spaceId,
            name: String(title || 'Untitled Bookmark'),
            body: bodyContent.trim(),
            type_key: 'bookmark',
            properties: propertiesArray
        };

        const response = await this.post<CreateObjectResponse>(`/v1/spaces/${spaceId}/objects`, requestBody);

        return {
            id: response.objectId,
            name: requestBody.name,
            type_key: requestBody.type_key,
            properties: params,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
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

        // Add body for POST/PUT requests
        if (body !== undefined && (method === 'POST' || method === 'PUT')) {
            requestOptions.body = JSON.stringify(body);
        }

        try {
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

                // Handle network errors
                throw new NetworkError(
                    `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    error instanceof Error ? error : undefined
                );
            }
        } catch (error) {
            // Re-throw if already an ApiError
            if (error instanceof ApiError) {
                throw error;
            }

            // Wrap any other errors as NetworkError
            throw new NetworkError(
                `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error : undefined
            );
        }
    }
}
