import { BookmarkCaptureService } from '../../src/lib/capture/bookmark-capture-service';
import { AnytypeApiClient, checkHealth } from '../../src/lib/api';
import { StorageManager } from '../../src/lib/storage/storage-manager';
import { QueueManager } from '../../src/background/queue-manager';
import { QueueStatus } from '../../src/types/queue';

// Mock dependencies
jest.mock('../../src/lib/api');
jest.mock('../../src/lib/storage/storage-manager');
jest.mock('../../src/background/queue-manager');

describe('BookmarkCaptureService - Health Check Integration', () => {
    let service: BookmarkCaptureService;
    let mockApiClient: jest.Mocked<AnytypeApiClient>;
    let mockStorage: jest.Mocked<StorageManager>;
    let mockQueueManager: jest.Mocked<QueueManager>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockApiClient = {
            createObject: jest.fn(),
            updateObject: jest.fn(),
            setApiKey: jest.fn(),
        } as any;
        (AnytypeApiClient as unknown as jest.Mock).mockImplementation(() => mockApiClient);

        mockStorage = {
            get: jest.fn(),
            set: jest.fn(),
        } as any;
        (StorageManager.getInstance as jest.Mock).mockReturnValue(mockStorage);

        mockQueueManager = {
            add: jest.fn(),
        } as any;
        (QueueManager.getInstance as jest.Mock).mockReturnValue(mockQueueManager);

        // Setup storage mock
        mockStorage.get.mockImplementation((key) => {
            if (key === 'auth') return Promise.resolve({ apiKey: 'test-key', isAuthenticated: true });
            if (key === 'settings') return Promise.resolve({ apiPort: 31009, theme: 'system' });
            return Promise.resolve(undefined);
        });

        // Get instance resets the singleton internal state for tests
        (BookmarkCaptureService as any).instance = undefined;
        service = BookmarkCaptureService.getInstance();
    });

    const mockMetadata = {
        title: 'Test Article',
        canonicalUrl: 'https://example.com',
        description: 'Test description',
        content: '# Test Content',
    };

    it('should proceed with API call if Anytype is healthy', async () => {
        (checkHealth as jest.Mock).mockResolvedValue(true);
        mockApiClient.createObject.mockResolvedValue({ id: 'obj-1', name: 'Test', type_key: 'article' } as any);

        const result = await service.captureBookmark('space-1', mockMetadata as any, 'note', [], 'article');

        expect(checkHealth).toHaveBeenCalledWith(31009, 2000);
        expect(mockApiClient.createObject).toHaveBeenCalled();
        expect(result.id).toBe('obj-1');
        expect(mockQueueManager.add).not.toHaveBeenCalled();
    });

    it('should queue immediately if Anytype is unhealthy', async () => {
        (checkHealth as jest.Mock).mockResolvedValue(false);

        const result = await service.captureBookmark('space-1', mockMetadata as any, 'note', [], 'article');

        expect(checkHealth).toHaveBeenCalledWith(31009, 2000);
        expect(mockApiClient.createObject).not.toHaveBeenCalled();
        expect(mockQueueManager.add).toHaveBeenCalled();
        expect(result.queued).toBe(true);
    });

    it('should use custom port from settings', async () => {
        (checkHealth as jest.Mock).mockResolvedValue(true);
        mockApiClient.createObject.mockResolvedValue({ id: 'obj-1', name: 'Test', type_key: 'bookmark' } as any);
        mockStorage.get.mockImplementation((key) => {
            if (key === 'auth') return Promise.resolve({ apiKey: 'test-key', isAuthenticated: true });
            if (key === 'settings') return Promise.resolve({ apiPort: 12345, theme: 'system' });
            return Promise.resolve(undefined);
        });

        await service.captureBookmark('space-1', mockMetadata as any);

        expect(checkHealth).toHaveBeenCalledWith(12345, 2000);
    });

    it('should queue capture if API call fails with queueable error even if health check passed', async () => {
        (checkHealth as jest.Mock).mockResolvedValue(true);
        const networkError = new Error('Failed to fetch');
        mockApiClient.createObject.mockRejectedValue(networkError);
        (QueueManager.shouldQueue as jest.Mock).mockReturnValue(true);

        const result = await service.captureBookmark('space-1', mockMetadata as any);

        expect(mockApiClient.createObject).toHaveBeenCalled();
        expect(mockQueueManager.add).toHaveBeenCalled();
        expect(result.queued).toBe(true);
    });
});
