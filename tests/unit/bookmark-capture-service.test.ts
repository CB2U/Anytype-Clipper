
import { BookmarkCaptureService } from '../../src/lib/capture/bookmark-capture-service';
import { AnytypeApiClient } from '../../src/lib/api/client';
import { TagService } from '../../src/lib/tags/tag-service';
import { StorageManager } from '../../src/lib/storage/storage-manager';
import { PageMetadata } from '../../src/types/metadata';

// Mock dependencies
jest.mock('../../src/lib/api/client');
jest.mock('../../src/lib/tags/tag-service');
jest.mock('../../src/lib/storage/storage-manager');

describe('BookmarkCaptureService', () => {
    let service: BookmarkCaptureService;
    let mockApiClient: jest.Mocked<AnytypeApiClient>;
    let mockTagService: jest.Mocked<TagService>;
    let mockStorageManager: jest.Mocked<StorageManager>;

    const mockMetadata: PageMetadata = {
        title: 'Test Page',
        canonicalUrl: 'https://example.com',
        description: 'Test Description',
        content: '# Full Article Content\n\nThis is the full article.',
        textContent: 'Full Article Content This is the full article.',
        siteName: 'Example Site',
        extractedAt: new Date().toISOString(),
        source: 'standard',
        url: 'https://example.com'
    };

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup mock implementations
        mockApiClient = new AnytypeApiClient() as jest.Mocked<AnytypeApiClient>;
        mockTagService = {
            resolvePropertyId: jest.fn(),
            getTags: jest.fn(),
            createTag: jest.fn()
        } as unknown as jest.Mocked<TagService>;

        mockStorageManager = {
            get: jest.fn().mockResolvedValue({ apiKey: 'test-api-key' })
        } as unknown as jest.Mocked<StorageManager>;

        // Setup static getInstance methods for mocks
        (TagService.getInstance as jest.Mock).mockReturnValue(mockTagService);
        (StorageManager.getInstance as jest.Mock).mockReturnValue(mockStorageManager);

        // Mock createObject to return a success result
        mockApiClient.createObject.mockResolvedValue({
            id: 'new-object-id',
            name: 'Test Object',
            type_key: 'note',
            properties: {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        // Mock prepareProperties to return empty array by default
        // The service uses prepareProperties privately, but we can inspect the result 
        // via the mockApiClient.createObject call arguments instead.

        // Get instance of service (which will use the mocks)
        // Reset the singleton instance for testing
        (BookmarkCaptureService as any).instance = undefined;
        service = BookmarkCaptureService.getInstance();
        // Force inject mocks just to be safe, though usage of getInstance in constructor handles it
        (service as any).apiClient = mockApiClient;
        (service as any).tagService = mockTagService;
        (service as any).storage = mockStorageManager;
    });

    describe('captureBookmark - Highlight Logic', () => {
        it('should use quote as description when isHighlightCapture is true', async () => {
            const quote = 'This is a selected quote.';

            await service.captureBookmark(
                'space-123',
                mockMetadata,
                undefined, // userNote
                [], // tags
                'note', // typeKey
                true, // isHighlightCapture
                quote
            );

            expect(mockApiClient.createObject).toHaveBeenCalledWith(
                'space-123',
                expect.objectContaining({
                    description: quote,
                    type_key: 'note'
                })
            );

            // Verify it did NOT use the article content
            expect(mockApiClient.createObject).not.toHaveBeenCalledWith(
                'space-123',
                expect.objectContaining({
                    description: mockMetadata.content
                })
            );
        });

        it('should use metadata.content when isHighlightCapture is false (Article mode)', async () => {
            await service.captureBookmark(
                'space-123',
                mockMetadata,
                undefined,
                [],
                'note', // typeKey
                false, // isHighlightCapture
                undefined
            );

            expect(mockApiClient.createObject).toHaveBeenCalledWith(
                'space-123',
                expect.objectContaining({
                    description: mockMetadata.content,
                    type_key: 'note'
                })
            );
        });

        it('should use metadata.content when isHighlightCapture is true but quote is missing (Fallback)', async () => {
            // This is an edge case, but good to verify safety
            await service.captureBookmark(
                'space-123',
                mockMetadata,
                undefined,
                [],
                'note',
                true,
                undefined // Missing quote
            );

            expect(mockApiClient.createObject).toHaveBeenCalledWith(
                'space-123',
                expect.objectContaining({
                    description: mockMetadata.content
                })
            );
        });

        it('should prioritize quote over metadata.content for highlights', async () => {
            const quote = 'Priority Quote';
            const hugeContent = 'A'.repeat(5000);
            const metadataWithHugeContent = { ...mockMetadata, content: hugeContent };

            await service.captureBookmark(
                'space-123',
                metadataWithHugeContent,
                undefined,
                [],
                'note',
                true,
                quote
            );

            expect(mockApiClient.createObject).toHaveBeenCalledWith(
                'space-123',
                expect.objectContaining({
                    description: quote
                })
            );
        });
    });
});
