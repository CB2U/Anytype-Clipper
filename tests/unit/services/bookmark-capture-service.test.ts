
import { BookmarkCaptureService } from '../../../src/lib/capture/bookmark-capture-service';
import { AnytypeApiClient, checkHealth } from '../../../src/lib/api';
import { StorageManager } from '../../../src/lib/storage/storage-manager';
import { QueueManager } from '../../../src/background/queue-manager';
import { TagService } from '../../../src/lib/tags/tag-service';
import { PageMetadata } from '../../../src/types/metadata';

jest.mock('../../../src/lib/api/client');
jest.mock('../../../src/lib/api/index', () => ({
    ...jest.requireActual('../../../src/lib/api/index'),
    checkHealth: jest.fn(),
    AnytypeApiClient: jest.fn().mockImplementation(() => ({
        setApiKey: jest.fn(),
        createObject: jest.fn(),
        updateObject: jest.fn(),
        listProperties: jest.fn()
    }))
}));
jest.mock('../../../src/lib/storage/storage-manager');
jest.mock('../../../src/background/queue-manager');
jest.mock('../../../src/lib/tags/tag-service');

describe('BookmarkCaptureService', () => {
    let service: BookmarkCaptureService;
    let mockApiClient: any;
    let mockStorage: any;
    let mockQueueManager: any;
    let mockTagService: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mocks
        mockApiClient = {
            setApiKey: jest.fn(),
            createObject: jest.fn().mockResolvedValue({ id: 'obj123' }),
            updateObject: jest.fn().mockResolvedValue({}),
            listProperties: jest.fn().mockResolvedValue({ data: [] })
        };
        (AnytypeApiClient as jest.Mock).mockImplementation(() => mockApiClient);

        mockStorage = {
            get: jest.fn().mockResolvedValue({ apiKey: 'key123' }),
            set: jest.fn().mockResolvedValue(undefined)
        };
        (StorageManager.getInstance as jest.Mock).mockReturnValue(mockStorage);

        mockQueueManager = {
            add: jest.fn().mockResolvedValue(undefined)
        };
        (QueueManager.getInstance as jest.Mock).mockReturnValue(mockQueueManager);
        (QueueManager.shouldQueue as jest.Mock) = jest.fn().mockReturnValue(false);

        mockTagService = {
            resolvePropertyId: jest.fn().mockResolvedValue('tagProp1'),
            getTags: jest.fn().mockResolvedValue([]),
            createTag: jest.fn().mockResolvedValue({ id: 'tag1' })
        };
        (TagService.getInstance as jest.Mock).mockReturnValue(mockTagService);

        (checkHealth as jest.Mock).mockResolvedValue(true);

        // Reset singleton
        (BookmarkCaptureService as any).instance = undefined;
        service = BookmarkCaptureService.getInstance();
    });

    const mockMetadata: PageMetadata = {
        title: 'Test Page',
        url: 'http://example.com',
        canonicalUrl: 'http://example.com',
        description: 'Desc'
    };

    it('should capture bookmark successfully when online', async () => {
        const result = await service.captureBookmark('s1', mockMetadata);

        expect(checkHealth).toHaveBeenCalled();
        expect(mockApiClient.createObject).toHaveBeenCalledWith('s1', expect.objectContaining({
            title: 'Test Page',
            type_key: 'bookmark'
        }));
        expect(result.id).toBe('obj123');
    });

    it('should queue capture if health check fails', async () => {
        (checkHealth as jest.Mock).mockResolvedValue(false);

        const result = await service.captureBookmark('s1', mockMetadata);

        expect(mockQueueManager.add).toHaveBeenCalled();
        expect(mockApiClient.createObject).not.toHaveBeenCalled();
        expect(result.queued).toBe(true);
    });

    it('should queue capture if API fails with queueable error', async () => {
        const networkError = new Error('Network Error');
        mockApiClient.createObject.mockRejectedValue(networkError);
        (QueueManager.shouldQueue as jest.Mock).mockReturnValue(true);

        const result = await service.captureBookmark('s1', mockMetadata);

        expect(mockQueueManager.add).toHaveBeenCalled();
        expect(result.queued).toBe(true);
    });

    it('should throw if API fails with non-queueable error', async () => {
        const badRequest = new Error('Bad Request');
        mockApiClient.createObject.mockRejectedValue(badRequest);
        (QueueManager.shouldQueue as jest.Mock).mockReturnValue(false);

        await expect(service.captureBookmark('s1', mockMetadata))
            .rejects.toThrow('Bad Request');

        expect(mockQueueManager.add).not.toHaveBeenCalled();
    });

    it('should truncate large content for articles', async () => {
        const largeContent = 'a'.repeat(11 * 1024 * 1024); // 11MB
        const meta = { ...mockMetadata, content: largeContent };

        await service.captureBookmark('s1', meta, undefined, [], 'article');

        expect(mockApiClient.createObject).toHaveBeenCalledWith('s1', expect.objectContaining({
            description: expect.stringContaining('Content Truncated')
        }));
    });
});
