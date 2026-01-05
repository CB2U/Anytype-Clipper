/**
 * DeduplicationService - Searches for existing bookmarks by URL
 * 
 * This service integrates with the Anytype API to detect duplicate bookmarks
 * before creating new objects. It normalizes URLs and searches within a specific
 * Space to find existing objects with matching URLs.
 */

import { cleanUrlForDeduplication } from '../utils/url-normalizer';
import type { DuplicateResult, ExistingObject, UrlSearchRequest, UrlSearchResponse } from '../../types/deduplication';

/**
 * DeduplicationService class for searching existing objects by URL
 */
export class DeduplicationService {
    private readonly apiBaseUrl: string;
    private readonly timeout: number;

    /**
     * Creates a new DeduplicationService instance
     * @param apiBaseUrl - Base URL for Anytype API (e.g., "http://localhost:31009")
     * @param timeout - Search timeout in milliseconds (default: 1000ms)
     */
    constructor(apiBaseUrl: string = 'http://localhost:31009', timeout: number = 1000) {
        this.apiBaseUrl = apiBaseUrl;
        this.timeout = timeout;
    }

    /**
     * Search for existing objects by normalized URL
     * @param url - The URL to search for (will be normalized internally)
     * @param spaceId - The Space ID to search within
     * @param apiKey - API key for authentication
     * @returns Duplicate detection result
     */
    async searchByUrl(url: string, spaceId: string, apiKey: string): Promise<DuplicateResult> {
        try {
            // Normalize URL for consistent matching
            const normalizedUrl = cleanUrlForDeduplication(url);

            console.log(`[Deduplication] Original URL: ${url}`);
            console.log(`[Deduplication] Normalized URL: ${normalizedUrl}`);
            console.log(`[Deduplication] Space ID: ${spaceId}`);
            const startTime = Date.now();

            // Build search request
            const searchRequest: UrlSearchRequest = {
                filters: {
                    operator: 'and',
                    conditions: [{
                        property_key: 'source',
                        url: normalizedUrl,
                        condition: 'eq'
                    }]
                },
                types: ['bookmark'],
                limit: 1
            };

            console.log('[Deduplication] Search request:', JSON.stringify(searchRequest, null, 2));

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            try {
                // Make API request
                const apiUrl = `${this.apiBaseUrl}/v1/spaces/${spaceId}/search`;
                console.log(`[Deduplication] API URL: ${apiUrl}`);

                const response = await fetch(
                    apiUrl,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                            'Anytype-Version': '2025-11-08'
                        },
                        body: JSON.stringify(searchRequest),
                        signal: controller.signal
                    }
                );

                clearTimeout(timeoutId);

                console.log(`[Deduplication] API response status: ${response.status}`);

                // Handle non-200 responses
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[Deduplication] API error (${response.status}): ${errorText}`);

                    // Return not found for graceful degradation
                    return {
                        found: false,
                        error: `API error: ${response.status}`
                    };
                }

                // Parse response
                const data: UrlSearchResponse = await response.json();
                const duration = Date.now() - startTime;

                console.log(`[Deduplication] API response data:`, JSON.stringify(data, null, 2));
                console.log(`[Deduplication] Found ${data.data?.length || 0} results`);
                console.log(`[Deduplication] Search took ${duration}ms`);

                // Debug: Log each result's properties
                if (data.data && data.data.length > 0) {
                    data.data.forEach((obj, idx) => {
                        console.log(`[Deduplication] Result ${idx}:`, {
                            id: obj.id,
                            name: obj.name,
                            properties: obj.properties.map(p => ({ key: p.key, value: p }))
                        });
                    });
                }

                // Check if duplicate found
                if (data.data && data.data.length > 0) {
                    const existingObj = data.data[0];

                    console.log(`[Deduplication] Existing object:`, existingObj);

                    // Extract created date from properties
                    const createdDateProp = existingObj.properties.find(p => p.key === 'created_date' || p.key === 'createdAt');
                    const createdAt = createdDateProp?.date
                        ? new Date(createdDateProp.date).getTime()
                        : Date.now();

                    // Extract source URL from properties
                    const sourceProp = existingObj.properties.find(p => p.key === 'source');
                    const sourceUrl = sourceProp?.url || normalizedUrl;

                    const existingObject: ExistingObject = {
                        id: existingObj.id,
                        title: existingObj.name || 'Untitled',
                        url: sourceUrl,
                        createdAt: createdAt,
                        spaceId: spaceId
                    };

                    console.log(`[Deduplication] Duplicate found: ${existingObject.id} (${duration}ms)`);

                    return {
                        found: true,
                        object: existingObject
                    };
                } else {
                    console.log(`[Deduplication] No duplicate found (${duration}ms)`);

                    return {
                        found: false
                    };
                }

            } catch (fetchError: any) {
                clearTimeout(timeoutId);

                // Handle timeout
                if (fetchError.name === 'AbortError') {
                    console.error('[Deduplication] Search timeout (>1s)');
                    return {
                        found: false,
                        error: 'Search timeout'
                    };
                }

                throw fetchError;
            }

        } catch (error: any) {
            // Log error and return graceful fallback
            const sanitizedError = error.message || 'Unknown error';
            console.error(`[Deduplication] Search failed: ${sanitizedError}`);
            console.error('[Deduplication] Full error:', error);

            return {
                found: false,
                error: sanitizedError
            };
        }
    }
}

/**
 * Singleton instance of DeduplicationService
 * Can be configured with custom API base URL and timeout
 */
export const deduplicationService = new DeduplicationService();
