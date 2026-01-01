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
    CreateApiKeyResponse
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
     * Creates an authentication challenge
     * 
     * @returns Challenge ID and code to display to user
     */
    async createChallenge(): Promise<CreateChallengeResponse> {
        return this.post<CreateChallengeResponse>('/v1/auth/challenges', {
            app_name: 'Anytype Clipper'
        });
    }

    /**
     * Creates an API key using an approved challenge
     * 
     * @param request - Challenge ID and code
     * @returns New API key
     */
    async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
        return this.post<CreateApiKeyResponse>('/v1/auth/api_keys', request);
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
