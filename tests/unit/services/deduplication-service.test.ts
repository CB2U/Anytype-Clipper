
import { DeduplicationService } from '../../../src/lib/services/deduplication-service';

describe('DeduplicationService', () => {
    let service: DeduplicationService;
    let fetchSpy: jest.Mock;

    beforeEach(() => {
        service = new DeduplicationService('http://test-api', 1000);
        global.fetch = jest.fn();
        fetchSpy = global.fetch as jest.Mock;
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should find duplicate object', async () => {
        const mockResponse = {
            data: [{
                id: '123',
                name: 'Test Page',
                properties: [
                    { key: 'source', url: 'https://example.com' },
                    { key: 'createdAt', date: '2025-01-01T12:00:00Z' }
                ]
            }]
        };

        fetchSpy.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockResponse,
        });

        // The input URL
        const inputUrl = 'https://example.com';
        // The expected normalized URL in the request filter (DeduplicationService logic adds slash for root)
        const expectedNormalizedUrl = 'https://example.com/';

        const result = await service.searchByUrl(inputUrl, 'space1', 'apikey');

        expect(result.found).toBe(true);
        expect(result.object).toBeDefined();
        expect(result.object?.id).toBe('123');
        expect(fetchSpy).toHaveBeenCalledWith(
            'http://test-api/v1/spaces/space1/search',
            expect.objectContaining({
                method: 'POST',
                // Look for the normalized URL string in the body
                body: expect.stringContaining(`"url":"${expectedNormalizedUrl}"`),
            })
        );
    });

    it('should return found: false if no match', async () => {
        const mockResponse = {
            data: []
        };

        fetchSpy.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockResponse,
        });

        const result = await service.searchByUrl('https://example.com', 'space1', 'apikey');

        expect(result.found).toBe(false);
        expect(result.object).toBeUndefined();
    });

    it('should handle API error gracefully', async () => {
        fetchSpy.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => 'Server Error',
        });

        const result = await service.searchByUrl('https://example.com', 'space1', 'apikey');

        expect(result.found).toBe(false);
        expect(result.error).toBe('API error: 500');
    });

    it('should handle fetch timeout', async () => {
        const abortError = new Error('AbortError');
        abortError.name = 'AbortError';

        fetchSpy.mockRejectedValue(abortError);

        const result = await service.searchByUrl('https://example.com', 'space1', 'apikey');

        expect(result.found).toBe(false);
        expect(result.error).toBe('Search timeout');
    });

    it('should normalize URL', async () => {
        const mockResponse = {
            data: []
        };
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        // Use URL with tracking params and www to verify normalization logic is integrated
        // https://www.example.com/page?utm_source=foo -> https://example.com/page
        await service.searchByUrl('https://www.example.com/page?utm_source=foo', 'space1', 'apikey');

        // Check the body of the call
        expect(fetchSpy).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining('"url":"https://example.com/page"'),
            })
        );
    });
});
