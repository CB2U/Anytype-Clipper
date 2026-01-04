/**
 * Unit tests for DeduplicationService
 * Tests duplicate detection logic with mocked API responses
 */

import { DeduplicationService } from '../../src/lib/services/deduplication-service';
import type { DuplicateResult } from '../../src/types/deduplication';

// Mock fetch globally
global.fetch = jest.fn();

describe('DeduplicationService', () => {
    let service: DeduplicationService;
    const mockApiKey = 'test-api-key';
    const mockSpaceId = 'test-space-id';
    const testUrl = 'https://github.com/CB2U/edgereader';

    beforeEach(() => {
        service = new DeduplicationService('http://localhost:31009', 1000);
        jest.clearAllMocks();
    });

    describe('searchByUrl', () => {
        it('should find duplicate when API returns matching object', async () => {
            const mockResponse = {
                data: [{
                    id: 'obj-123',
                    name: 'EdgeReader - Privacy-focused news aggregator',
                    properties: [
                        { key: 'source', url: 'https://github.com/cb2u/edgereader' },
                        { key: 'created_date', date: '2026-01-04T12:00:00Z' }
                    ]
                }]
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            const result: DuplicateResult = await service.searchByUrl(testUrl, mockSpaceId, mockApiKey);

            expect(result.found).toBe(true);
            expect(result.object).toBeDefined();
            expect(result.object?.id).toBe('obj-123');
            expect(result.object?.title).toBe('EdgeReader - Privacy-focused news aggregator');
            expect(result.object?.url).toBe('https://github.com/cb2u/edgereader');
        });

        it('should not find duplicate when API returns empty array', async () => {
            const mockResponse = { data: [] };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            const result = await service.searchByUrl(testUrl, mockSpaceId, mockApiKey);

            expect(result.found).toBe(false);
            expect(result.object).toBeUndefined();
        });

        it('should normalize URL before searching', async () => {
            const mockResponse = { data: [] };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            await service.searchByUrl('https://WWW.GITHUB.COM/CB2U/edgereader/', mockSpaceId, mockApiKey);

            const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);

            // Should normalize to lowercase, remove www, remove trailing slash
            expect(requestBody.filters.conditions[0].url).toBe('https://github.com/CB2U/edgereader');
        });

        it('should make correct API request', async () => {
            const mockResponse = { data: [] };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            await service.searchByUrl(testUrl, mockSpaceId, mockApiKey);

            expect(global.fetch).toHaveBeenCalledWith(
                `http://localhost:31009/v1/spaces/${mockSpaceId}/search`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${mockApiKey}`,
                        'Anytype-Version': '2025-11-08'
                    }
                })
            );

            const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);

            expect(requestBody).toEqual({
                filters: {
                    operator: 'and',
                    conditions: [{
                        property_key: 'source',
                        url: expect.any(String),
                        condition: 'eq'
                    }]
                },
                types: ['bookmark'],
                limit: 1
            });
        });

        it('should handle API error gracefully', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error'
            });

            const result = await service.searchByUrl(testUrl, mockSpaceId, mockApiKey);

            expect(result.found).toBe(false);
            expect(result.error).toBe('API error: 500');
        });

        it('should handle network error gracefully', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            const result = await service.searchByUrl(testUrl, mockSpaceId, mockApiKey);

            expect(result.found).toBe(false);
            expect(result.error).toBe('Network error');
        });

        it('should timeout after 1 second', async () => {
            // Mock a response that never resolves
            (global.fetch as jest.Mock).mockImplementationOnce(
                () => new Promise((resolve, reject) => {
                    // Simulate abort after timeout
                    setTimeout(() => {
                        const error: any = new Error('The operation was aborted');
                        error.name = 'AbortError';
                        reject(error);
                    }, 1100);
                })
            );

            const result = await service.searchByUrl(testUrl, mockSpaceId, mockApiKey);

            expect(result.found).toBe(false);
            expect(result.error).toBe('Search timeout');
        }, 5000); // Increase test timeout to 5s

        it('should handle missing created_date property', async () => {
            const mockResponse = {
                data: [{
                    id: 'obj-123',
                    name: 'Test Object',
                    properties: [
                        { key: 'source', url: testUrl }
                    ]
                }]
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            const result = await service.searchByUrl(testUrl, mockSpaceId, mockApiKey);

            expect(result.found).toBe(true);
            expect(result.object?.createdAt).toBeDefined();
            expect(typeof result.object?.createdAt).toBe('number');
        });

        it('should handle missing source URL property', async () => {
            const mockResponse = {
                data: [{
                    id: 'obj-123',
                    name: 'Test Object',
                    properties: []
                }]
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            const result = await service.searchByUrl(testUrl, mockSpaceId, mockApiKey);

            expect(result.found).toBe(true);
            expect(result.object?.url).toBeDefined();
        });

        it('should handle untitled objects', async () => {
            const mockResponse = {
                data: [{
                    id: 'obj-123',
                    name: '',
                    properties: [
                        { key: 'source', url: testUrl }
                    ]
                }]
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            const result = await service.searchByUrl(testUrl, mockSpaceId, mockApiKey);

            expect(result.found).toBe(true);
            expect(result.object?.title).toBe('Untitled');
        });
    });
});
