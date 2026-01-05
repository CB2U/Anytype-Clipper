
import { AppendService } from '../../../src/lib/services/append-service';
import { AppendMetadata } from '../../../src/types/append';

describe('AppendService', () => {
    let service: AppendService;
    let fetchSpy: jest.SpyInstance;

    const mockMetadata: AppendMetadata = {
        url: 'https://example.com',
        pageTitle: 'Test Page',
        timestamp: '2025-01-01T12:00:00.000Z',
        captureType: 'bookmark'
    };

    beforeEach(() => {
        service = new AppendService('http://test-api', 1000);
        global.fetch = jest.fn();
        fetchSpy = global.fetch as jest.Mock;
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should format content correctly for bookmarks', () => {
        const content = 'Some content';
        const formatted = service.formatAppendedContent(content, mockMetadata);

        expect(formatted).toContain(`## ${mockMetadata.timestamp} - ${mockMetadata.pageTitle}`);
        expect(formatted).toContain(`**Source:** [${mockMetadata.url}](${mockMetadata.url})`);
        expect(formatted).toContain(content);
        expect(formatted).not.toContain('> ' + content); // No blockquote
    });

    it('should format content correctly for highlights', () => {
        const metadata: AppendMetadata = { ...mockMetadata, captureType: 'highlight' };
        const content = 'Highlighted text';
        const formatted = service.formatAppendedContent(content, metadata);

        expect(formatted).toContain(`> ${content}`);
    });

    it('should append content successfully', async () => {
        // Mock GET existing content
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ object: { markdown: 'Existing content' } }),
        } as Response);

        // Mock PATCH update
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        } as Response);

        const result = await service.appendToObject('space1', 'obj1', 'New content', mockMetadata, 'apikey');

        expect(result.success).toBe(true);
        expect(result.objectId).toBe('obj1');

        // Verify GET call
        expect(fetchSpy).toHaveBeenNthCalledWith(1,
            'http://test-api/v1/spaces/space1/objects/obj1?format=md',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer apikey'
                })
            })
        );

        // Verify PATCH call
        expect(fetchSpy).toHaveBeenNthCalledWith(2,
            'http://test-api/v1/spaces/space1/objects/obj1',
            expect.objectContaining({
                method: 'PATCH',
                body: expect.stringContaining('Existing content\\n\\n---\\n\\n##'),
            })
        );
    });

    it('should handle fetch failure', async () => {
        fetchSpy.mockResolvedValueOnce({
            ok: false,
            status: 404,
            text: async () => 'Not Found',
        } as Response);

        const result = await service.appendToObject('space1', 'obj1', 'Content', mockMetadata, 'apikey');

        expect(result.success).toBe(false);
        expect(result.error).toContain('API error (404)');
    });

    it('should handle update failure', async () => {
        // Mock GET success
        fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ object: { markdown: 'Content' } }),
        } as Response);

        // Mock PATCH failure
        fetchSpy.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => 'Server Error',
        } as Response);

        const result = await service.appendToObject('space1', 'obj1', 'Content', mockMetadata, 'apikey');

        expect(result.success).toBe(false);
        expect(result.error).toContain('API error (500)');
    });

    it('should handle fetch timeout', async () => {
        const abortError = new Error('AbortError');
        abortError.name = 'AbortError';

        fetchSpy.mockRejectedValue(abortError);

        const result = await service.appendToObject('space1', 'obj1', 'Content', mockMetadata, 'apikey');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Fetch timeout');
    });
});
