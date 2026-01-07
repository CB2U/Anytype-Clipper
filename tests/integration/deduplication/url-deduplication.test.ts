
import { DeduplicationService } from '../../../src/lib/services/deduplication-service';
import { cleanUrlForDeduplication } from '../../../src/lib/utils/url-normalizer';

describe('URL Deduplication Integration', () => {
    let deduplicationService: DeduplicationService;

    beforeEach(() => {
        // Mock chrome extension storage
        const mockStorage: Record<string, any> = {};
        (global as any).chrome = {
            storage: {
                local: {
                    get: jest.fn((keys, callback) => {
                        const res: any = {};
                        if (callback) callback(res);
                        return Promise.resolve(res);
                    }),
                    set: jest.fn((data, callback) => {
                        if (callback) callback();
                        return Promise.resolve();
                    })
                },
                onChanged: { addListener: jest.fn() }
            },
            runtime: { lastError: null },
            alarms: { create: jest.fn(), onAlarm: { addListener: jest.fn() } }
        };

        // Reset singletons
        (DeduplicationService as any).instance = undefined;
        deduplicationService = DeduplicationService.getInstance('http://localhost:31009');

        // Mock fetch for API calls
        (global as any).fetch = jest.fn();
    });

    afterEach(() => {
        delete (global as any).fetch;
        delete (global as any).chrome;
    });

    it('should normalize URL and detect duplicate', async () => {
        const originalUrl = 'https://example.com/article';
        const normalizedUrl = cleanUrlForDeduplication(originalUrl);

        // Mock API search response with duplicate
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                data: [{
                    id: 'existing-obj-1',
                    name: 'Existing Article',
                    properties: [
                        { key: 'source', url: normalizedUrl },
                        { key: 'created_date', date: Date.now() }
                    ]
                }]
            })
        });

        const result = await deduplicationService.searchByUrl(originalUrl, 'space-1', 'test-api-key');

        expect(result.found).toBe(true);
        expect(result.object?.id).toBe('existing-obj-1');
    });

    it('should return no duplicate when not found', async () => {
        const url = 'https://new-site.com/article';

        // Mock API search response with no results
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ data: [] })
        });

        const result = await deduplicationService.searchByUrl(url, 'space-1', 'test-api-key');

        expect(result.found).toBe(false);
        expect(result.object).toBeUndefined();
    });
});
