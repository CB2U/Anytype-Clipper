/**
 * AppendService - Service for appending content to existing Anytype objects
 * 
 * This service implements a fetch-modify-update approach to append new content
 * to existing objects since the Anytype API doesn't have a native append endpoint.
 */

import type { AppendMetadata, AppendResult } from '../../types/append';

/**
 * AppendService class for appending content to existing objects
 */
export class AppendService {
    private static instance: AppendService;
    private readonly apiBaseUrl: string;
    private readonly timeout: number;

    /**
     * Creates a new AppendService instance
     * @param apiBaseUrl - Base URL for Anytype API (e.g., "http://localhost:31009")
     * @param timeout - Request timeout in milliseconds (default: 5000ms)
     */
    private constructor(apiBaseUrl: string = 'http://localhost:31009', timeout: number = 5000) {
        this.apiBaseUrl = apiBaseUrl;
        this.timeout = timeout;
    }

    /**
     * Gets the singleton instance of AppendService
     */
    public static getInstance(apiBaseUrl?: string, timeout?: number): AppendService {
        if (!AppendService.instance) {
            AppendService.instance = new AppendService(apiBaseUrl, timeout);
        }
        return AppendService.instance;
    }

    /**
     * Append content to existing object using fetch-modify-update approach
     * @param spaceId - Anytype space ID
     * @param objectId - Object to append to
     * @param content - New content to append
     * @param metadata - Source metadata (URL, title, timestamp)
     * @returns Updated object or error
     */
    async appendToObject(
        spaceId: string,
        objectId: string,
        content: string,
        metadata: AppendMetadata,
        apiKey: string
    ): Promise<AppendResult> {
        try {
            console.log(`[AppendService] Appending to object ${objectId} in space ${spaceId}`);
            console.log(`[AppendService] Metadata:`, metadata);

            // Step 1: Fetch existing object content
            const existingContent = await this.fetchObjectContent(spaceId, objectId, apiKey);
            console.log(`[AppendService] Fetched existing content (${existingContent.length} chars)`);

            // Step 2: Format new content with timestamp and source
            const formattedContent = this.formatAppendedContent(content, metadata);
            console.log(`[AppendService] Formatted new content (${formattedContent.length} chars)`);

            // Step 3: Concatenate existing + new content
            const updatedContent = existingContent + '\n\n' + formattedContent;
            console.log(`[AppendService] Updated content (${updatedContent.length} chars)`);

            // Step 4: Update object via PATCH API
            const updateResult = await this.updateObjectContent(spaceId, objectId, updatedContent, apiKey);
            console.log(`[AppendService] Update result:`, updateResult);

            return {
                success: true,
                objectId: objectId
            };

        } catch (error: any) {
            const sanitizedError = error.message || 'Unknown error';
            console.error(`[AppendService] Append failed: ${sanitizedError}`);
            console.error('[AppendService] Full error:', error);

            return {
                success: false,
                error: sanitizedError
            };
        }
    }

    /**
     * Format appended content with timestamp and source link
     * @param content - Content to append
     * @param metadata - Source metadata
     * @returns Formatted markdown section
     */
    formatAppendedContent(content: string, metadata: AppendMetadata): string {
        const { timestamp, pageTitle, url, captureType } = metadata;

        // Format timestamp as ISO 8601
        const formattedTimestamp = timestamp;

        // Build formatted section
        let formatted = '---\n\n';
        formatted += `## ${formattedTimestamp} - ${pageTitle}\n\n`;
        formatted += `**Source:** [${url}](${url})\n\n`;

        // Format content based on capture type
        if (captureType === 'highlight') {
            // For highlights, wrap in blockquote
            formatted += `> ${content}\n`;
        } else {
            // For bookmarks/articles, use as-is
            formatted += `${content}\n`;
        }

        return formatted;
    }

    /**
     * Fetch existing object content via GET API
     * @param spaceId - Anytype space ID
     * @param objectId - Object ID
     * @param apiKey - API key for authentication
     * @returns Object markdown content
     */
    private async fetchObjectContent(
        spaceId: string,
        objectId: string,
        apiKey: string
    ): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const apiUrl = `${this.apiBaseUrl}/v1/spaces/${spaceId}/objects/${objectId}?format=md`;
            console.log(`[AppendService] Fetching object: ${apiUrl}`);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Anytype-Version': '2025-11-08'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            console.log(`[AppendService] Fetched object data:`, data);

            // Extract markdown content from response
            const markdown = data.object?.markdown || '';
            return markdown;

        } catch (fetchError: any) {
            clearTimeout(timeoutId);

            if (fetchError.name === 'AbortError') {
                throw new Error('Fetch timeout');
            }

            throw fetchError;
        }
    }

    /**
     * Update object content via PATCH API
     * @param spaceId - Anytype space ID
     * @param objectId - Object ID
     * @param markdown - Updated markdown content
     * @param apiKey - API key for authentication
     * @returns Update result
     */
    private async updateObjectContent(
        spaceId: string,
        objectId: string,
        markdown: string,
        apiKey: string
    ): Promise<any> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const apiUrl = `${this.apiBaseUrl}/v1/spaces/${spaceId}/objects/${objectId}`;
            console.log(`[AppendService] Updating object: ${apiUrl}`);

            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'Anytype-Version': '2025-11-08'
                },
                body: JSON.stringify({ markdown }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            return data;

        } catch (fetchError: any) {
            clearTimeout(timeoutId);

            if (fetchError.name === 'AbortError') {
                throw new Error('Update timeout');
            }

            throw fetchError;
        }
    }
}

export const appendService = AppendService.getInstance();
