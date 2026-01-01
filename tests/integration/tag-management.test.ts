
import { TagService } from '../../src/lib/tags/tag-service';
import { StorageManager } from '../../src/lib/storage/storage-manager';

/**
 * Integration Test for Tag Management Flow
 * Simulates the interaction between TagService, Storage, and Anytype API.
 */
describe('Tag Management Integration (Simulated)', () => {
    let tagService: TagService;
    let storage: StorageManager;
    let originalFetch: typeof fetch;

    beforeEach(async () => {
        originalFetch = global.fetch;
        global.fetch = jest.fn();

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
                    }),
                    getBytesInUse: jest.fn(() => Promise.resolve(0)),
                    remove: jest.fn((keys) => {
                        if (typeof keys === 'string') delete mockStorage[keys];
                        return Promise.resolve();
                    }),
                    clear: jest.fn(() => {
                        Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
                        return Promise.resolve();
                    })
                }
            }
        };

        storage = StorageManager.getInstance();
        await storage.clear();
        await storage.set('auth', { apiKey: 'test-key', isAuthenticated: true });

        tagService = TagService.getInstance();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        delete (global as any).chrome;
    });

    it('should complete a full tag selection and creation flow with caching', async () => {
        const mockTags = [
            { id: 't1', name: 'JavaScript', color: 'blue' },
            { id: 't2', name: 'Anytype', color: 'purple' }
        ];

        // 1. Initial tag fetch (API call)
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: mockTags,
                pagination: { has_more: false, total: 2, offset: 0, limit: 50 }
            })
        });

        const tags = await tagService.getTags('space-1', 'Bookmark');
        expect(tags).toHaveLength(2);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/v1/spaces/space-1/properties/tag/tags'),
            expect.anything()
        );

        // 2. Subsequent fetch (should hit cache)
        const cachedTags = await tagService.getTags('space-1', 'Bookmark');
        expect(cachedTags).toEqual(tags);
        expect(global.fetch).toHaveBeenCalledTimes(1); // No new API call

        // 3. Create a new tag (API call + cache invalidation)
        const newTag = { id: 't3', name: 'Web', color: 'green' };
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ tag: newTag })
        });

        const createdTag = await tagService.createTag('space-1', 'Bookmark', 'Web');
        expect(createdTag).toEqual(newTag);
        expect(global.fetch).toHaveBeenCalledTimes(2);

        // 4. Fetch after creation (should trigger new API call due to invalidation)
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [...mockTags, newTag],
                pagination: { has_more: false, total: 3, offset: 0, limit: 50 }
            })
        });

        const updatedTags = await tagService.getTags('space-1', 'Bookmark');
        expect(updatedTags).toHaveLength(3);
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(updatedTags).toContainEqual(newTag);
    });

    it('should handle space switches by maintaining separate caches', async () => {
        const space1Tags = [{ id: 's1-t1', name: 'Space1-Tag', color: 'red' }];
        const space2Tags = [{ id: 's2-t1', name: 'Space2-Tag', color: 'blue' }];

        // Mock response for space 1
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: space1Tags,
                pagination: { has_more: false, total: 1, offset: 0, limit: 50 }
            })
        });

        const tags1 = await tagService.getTags('space-1', 'Bookmark');
        expect(tags1).toEqual(space1Tags);

        // Mock response for space 2
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: space2Tags,
                pagination: { has_more: false, total: 1, offset: 0, limit: 50 }
            })
        });

        const tags2 = await tagService.getTags('space-2', 'Bookmark');
        expect(tags2).toEqual(space2Tags);
        expect(tags2).not.toEqual(tags1);

        // Verify space 1 is still cached
        const tags1Cached = await tagService.getTags('space-1', 'Bookmark');
        expect(tags1Cached).toEqual(space1Tags);
        expect(global.fetch).toHaveBeenCalledTimes(2); // Only 2 calls made total
    });
});
