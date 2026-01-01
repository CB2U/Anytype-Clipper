
import { TagService } from './tag-service';
import { AnytypeApiClient } from '../api/client';
import { StorageManager } from '../storage/storage-manager';

// Mock dependencies
jest.mock('../api/client');
jest.mock('../storage/storage-manager');

describe('TagService', () => {
    let tagService: TagService;
    let mockApiClient: jest.Mocked<AnytypeApiClient>;
    let mockStorage: jest.Mocked<StorageManager>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockApiClient = {
            setApiKey: jest.fn(),
            listTags: jest.fn(),
            createTag: jest.fn(),
            listProperties: jest.fn(),
        } as any;
        (AnytypeApiClient as jest.Mock).mockImplementation(() => mockApiClient);

        mockStorage = {
            get: jest.fn(),
            set: jest.fn(),
        } as any;
        (StorageManager.getInstance as jest.Mock).mockReturnValue(mockStorage);

        tagService = TagService.getInstance();
        // @ts-ignore - access private field for testing
        tagService['apiClient'] = mockApiClient;
        // @ts-ignore
        tagService['storage'] = mockStorage;
    });

    describe('getTags', () => {
        it('should return cached tags if valid', async () => {
            const mockTags = [{ id: '1', name: 'test', color: 'red' }];
            const now = Date.now();
            (mockStorage.get as jest.Mock).mockImplementation(async (key: string) => {
                if (key === 'tagCache') {
                    return {
                        'space-1': {
                            tags: mockTags,
                            timestamp: now,
                            propertyId: 'tag'
                        }
                    };
                }
                return {};
            });

            const tags = await tagService.getTags('space-1', 'Bookmark');
            expect(tags).toEqual(mockTags);
            expect(mockApiClient.listTags).not.toHaveBeenCalled();
        });

        it('should fetch from API and update cache if miss', async () => {
            const mockTags = [{ id: '2', name: 'new', color: 'blue' }];
            (mockStorage.get as jest.Mock).mockImplementation(async (key: string) => {
                if (key === 'auth') return { apiKey: 'key-123', isAuthenticated: true };
                if (key === 'tagCache') return {};
                return {};
            });
            mockApiClient.listTags.mockResolvedValue({
                data: mockTags,
                pagination: {
                    has_more: false,
                    limit: 50,
                    offset: 0,
                    total: 1
                }
            });

            const tags = await tagService.getTags('space-1', 'Bookmark');

            expect(tags).toEqual(mockTags);
            expect(mockApiClient.listTags).toHaveBeenCalledWith('space-1', 'tag');
            expect(mockStorage.set).toHaveBeenCalledWith('tagCache', expect.objectContaining({
                'space-1': expect.objectContaining({
                    tags: mockTags,
                    propertyId: 'tag'
                })
            }));
        });

        it('should use dynamic discovery if property is not cached', async () => {
            const mockTags = [{ id: '2', name: 'new', color: 'blue' }];
            const mockProperties = {
                data: [
                    { id: 'custom-tag-id', name: 'My Tags', format: 'multi-select' },
                    { id: 'other', name: 'Other', format: 'text' }
                ]
            };

            (mockStorage.get as jest.Mock).mockImplementation(async (key: string) => {
                if (key === 'auth') return { apiKey: 'key-123', isAuthenticated: true };
                return {};
            });
            mockApiClient.listProperties.mockResolvedValue(mockProperties);
            mockApiClient.listTags.mockResolvedValue({
                data: mockTags,
                pagination: { has_more: false, limit: 50, offset: 0, total: 1 }
            });

            const tags = await tagService.getTags('space-1', 'Bookmark');

            expect(mockApiClient.listProperties).toHaveBeenCalledWith('space-1');
            expect(mockApiClient.listTags).toHaveBeenCalledWith('space-1', 'custom-tag-id');
            expect(tags).toEqual(mockTags);

            // Should update mapping
            expect(mockStorage.set).toHaveBeenCalledWith('tagPropertyMappings', expect.objectContaining({
                'space-1': expect.objectContaining({
                    'Bookmark': 'custom-tag-id'
                })
            }));
        });
    });

    describe('createTag', () => {
        it('should call API with default color and invalidate cache', async () => {
            const newTag = { id: '3', name: 'created', color: 'blue' };
            (mockStorage.get as jest.Mock).mockImplementation(async (key: string) => {
                if (key === 'auth') return { apiKey: 'key-123', isAuthenticated: true };
                if (key === 'tagCache') return { 'space-1': {} };
                return {};
            });
            mockApiClient.createTag.mockResolvedValue({ tag: newTag });

            const result = await tagService.createTag('space-1', 'Bookmark', 'created');

            expect(result).toEqual(newTag);
            expect(mockApiClient.createTag).toHaveBeenCalledWith('space-1', 'tag', {
                Name: 'created',
                Color: 'blue'
            });
            expect(mockStorage.set).toHaveBeenCalledWith('tagCache', {});
        });

        it('should fallback to "tags" if "tag" returns 404', async () => {
            const mockTags = [{ id: '4', name: 'fallback', color: 'green' }];
            (mockStorage.get as jest.Mock).mockImplementation(async (key: string) => {
                if (key === 'auth') return { apiKey: 'key-123', isAuthenticated: true };
                return {};
            });

            // Mock listProperties to return empty/irrelevant properties to force fallback path
            mockApiClient.listProperties.mockResolvedValue({ data: [] });

            // First call fails with 404
            mockApiClient.listTags.mockRejectedValueOnce({ status: 404 });
            // Second call (fallback) succeeds
            mockApiClient.listTags.mockResolvedValueOnce({
                data: mockTags,
                pagination: {
                    has_more: false,
                    limit: 50,
                    offset: 0,
                    total: 1
                }
            });

            const tags = await tagService.getTags('space-1', 'Bookmark');

            expect(tags).toEqual(mockTags);
            expect(mockApiClient.listTags).toHaveBeenCalledTimes(2);
            expect(mockApiClient.listTags).toHaveBeenNthCalledWith(1, 'space-1', 'tag');
            expect(mockApiClient.listTags).toHaveBeenNthCalledWith(2, 'space-1', 'tags');

            // Should have updated persistent mapping (space-aware)
            expect(mockStorage.set).toHaveBeenCalledWith('tagPropertyMappings', expect.objectContaining({
                'space-1': expect.objectContaining({
                    'Bookmark': 'tags'
                })
            }));
        });
    });
});
