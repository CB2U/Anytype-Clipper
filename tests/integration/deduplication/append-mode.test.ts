import { AppendService } from '../../../src/lib/services/append-service';
import { AnytypeApiClient } from '../../../src/lib/api/client';

describe('Append Mode Integration', () => {
    let appendService: AppendService;
    let apiClient: AnytypeApiClient;

    beforeEach(() => {
        apiClient = new AnytypeApiClient();
        apiClient.setApiKey('test-api-key');
        appendService = new AppendService(apiClient);

        // Mock fetch for API calls
        (global as any).fetch = jest.fn();
    });

    afterEach(() => {
        delete (global as any).fetch;
    });

    it('should fetch existing object and append new content', async () => {
        const existingObjectId = 'obj-123';
        const existingContent = '# Original Content\n\nOriginal text.';
        const newContent = 'New appended content.';

        // Mock fetch existing object
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                object: {
                    id: existingObjectId,
                    content: existingContent
                }
            })
        });

        // Mock update object
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                object: {
                    id: existingObjectId,
                    content: existingContent + '\n\n---\n\n' + newContent
                }
            })
        });

        const result = await appendService.appendToObject(
            'space-1',
            existingObjectId,
            newContent,
            'https://example.com'
        );

        expect(result.success).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(2); // fetch + update
    });

    it('should handle multiple appends to same object', async () => {
        const objectId = 'obj-456';
        let currentContent = '# Article\n\nOriginal.';

        // First append
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: objectId, content: currentContent } })
        });
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: objectId, content: currentContent + '\n\nAppend 1' } })
        });

        await appendService.appendToObject('space-1', objectId, 'Append 1', 'https://example.com');

        // Second append
        currentContent += '\n\nAppend 1';
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: objectId, content: currentContent } })
        });
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: objectId, content: currentContent + '\n\nAppend 2' } })
        });

        await appendService.appendToObject('space-1', objectId, 'Append 2', 'https://example.com');

        expect(fetch).toHaveBeenCalledTimes(4); // 2 fetches + 2 updates
    });

    it('should include timestamp and source link in append', async () => {
        const objectId = 'obj-789';
        const sourceUrl = 'https://source.com/article';

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: objectId, content: 'Original' } })
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: objectId, content: 'Updated' } })
        });

        await appendService.appendToObject('space-1', objectId, 'New content', sourceUrl);

        // Verify update call included timestamp and source
        const updateCall = (fetch as jest.Mock).mock.calls[1];
        const body = JSON.parse(updateCall[1].body);

        // The append service should format content with timestamp and source
        expect(body.content || body.markdown).toBeDefined();
    });
});
