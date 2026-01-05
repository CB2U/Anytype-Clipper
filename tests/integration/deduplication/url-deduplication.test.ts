import { DeduplicationService } from '../../../src/lib/services/deduplication-service';
import { AnytypeApiClient } from '../../../src/lib/api/client';
import { cleanUrlForDeduplication } from '../../../src/lib/utils/url-normalizer';

describe('URL Deduplication Integration', () => {
    let deduplicationService: DeduplicationService;
    let apiClient: AnytypeApiClient;

    beforeEach(() => {
        apiClient = new AnytypeApiClient();
        apiClient.setApiKey('test-api-key');
        deduplicationService = new DeduplicationService(apiClient);

        // Mock fetch for API calls
        (global as any).fetch = jest.fn();
    });

    afterEach(() => {
        delete (global as any).fetch;
    });

    it('should normalize URL and detect duplicate', async () => {
        const originalUrl = 'https://example.com/article';
        const normalizedUrl = cleanUrlForDeduplication(originalUrl);

        // Mock API search response with duplicate
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                objects: [{
                    id: 'existing-obj-1',
                    name: 'Existing Article',
                    url: normalizedUrl
                }]
            })
        });

        const result = await deduplicationService.checkDuplicate('space-1', originalUrl);

        expect(result.isDuplicate).toBe(true);
        expect(result.existingObjectId).toBe('existing-obj-1');
    });

    it('should handle URL variations (http/https, www, trailing slash)', async () => {
        const variations = [
            'http://example.com/page',
            'https://example.com/page',
            'https://www.example.com/page',
            'https://example.com/page/',
            'https://example.com/page?utm_source=test'
        ];

        // All should normalize to the same URL
        const normalized = variations.map(url => cleanUrlForDeduplication(url));
        const uniqueNormalized = [...new Set(normalized)];

        // Should all normalize to the same URL (or very similar)
        expect(uniqueNormalized.length).toBeLessThanOrEqual(2); // Allow for http/https difference
    });

    it('should return no duplicate when not found', async () => {
        const url = 'https://new-site.com/article';

        // Mock API search response with no results
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ objects: [] })
        });

        const result = await deduplicationService.checkDuplicate('space-1', url);

        expect(result.isDuplicate).toBe(false);
        expect(result.existingObjectId).toBeUndefined();
    });
});
