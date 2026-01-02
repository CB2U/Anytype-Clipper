import { BookmarkCaptureService } from '../../src/lib/capture/bookmark-capture-service';
import { StorageManager } from '../../src/lib/storage/storage-manager';
import { PageMetadata } from '../../src/types/metadata';

// Mock API Client
jest.mock('../../src/lib/api/client', () => {
    return {
        AnytypeApiClient: jest.fn().mockImplementation(() => ({
            setApiKey: jest.fn(),
            createObject: jest.fn().mockResolvedValue({ id: 'new-article-id' }),
            updateObject: jest.fn().mockResolvedValue({ objectId: 'new-article-id' }),
            listProperties: jest.fn().mockResolvedValue({ data: [] })
        }))
    };
});

describe('Article Metadata Integration', () => {
    let bookmarkService: BookmarkCaptureService;
    let storage: StorageManager;

    beforeEach(async () => {
        // Mock chrome extension storage
        const mockStorage: Record<string, any> = {};
        (global as any).chrome = {
            storage: {
                local: {
                    get: jest.fn((keys) => {
                        const res: any = {};
                        if (typeof keys === 'string') {
                            res[keys] = mockStorage[keys];
                        } else if (Array.isArray(keys)) {
                            keys.forEach(k => res[k] = mockStorage[k]);
                        }
                        return Promise.resolve(res);
                    }),
                    set: jest.fn((data) => {
                        Object.assign(mockStorage, data);
                        return Promise.resolve();
                    })
                }
            }
        };

        storage = StorageManager.getInstance();
        await storage.set('auth', { apiKey: 'test-key', isAuthenticated: true });

        bookmarkService = BookmarkCaptureService.getInstance();
    });

    it('should capture article with content and metadata', async () => {
        const spaceId = 'space-1';
        const metadata: PageMetadata = {
            title: 'Article Title',
            description: 'Article Excerpt',
            url: 'https://example.com/article',
            canonicalUrl: 'https://example.com/article',
            content: '# Article Content\n\nFull article text here.',
            textContent: 'Full article text here.',
            readingTime: 2,
            extractedAt: new Date().toISOString(),
            source: 'opengraph',
            keywords: []
        };

        const result = await bookmarkService.captureBookmark(
            spaceId,
            metadata,
            'User Note',
            ['article'],
            'article'
        );

        expect(result.id).toBe('new-article-id');

        // Check if API client was called correctly with article type and content (Markdown)
        const apiClient = (bookmarkService as any).apiClient;
        expect(apiClient.createObject).toHaveBeenCalledWith(spaceId, expect.objectContaining({
            title: 'Article Title',
            type_key: 'article',
            description: expect.stringContaining('# Article Content')
        }));
    });
});
