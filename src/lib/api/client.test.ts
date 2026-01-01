
import { AnytypeApiClient } from './client';

describe('AnytypeApiClient Tags', () => {
    let client: AnytypeApiClient;
    let originalFetch: typeof fetch;

    beforeEach(() => {
        client = new AnytypeApiClient();
        client.setApiKey('test-api-key');
        originalFetch = global.fetch;
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe('listTags', () => {
        it('should construct correct URL and options', async () => {
            const mockResponse = {
                data: [{ id: '1', name: 'tag1', color: '#ff0000' }],
                pagination: {
                    has_more: false,
                    limit: 50,
                    offset: 0,
                    total: 1
                }
            };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await client.listTags('space-1', 'prop-1', { limit: 10, offset: 5 });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/v1/spaces/space-1/properties/prop-1/tags?offset=5&limit=10'),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'X-Anytype-Api-Key': 'test-api-key'
                    })
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('createTag', () => {
        it('should send correct body and return tag', async () => {
            const mockResponse = {
                tag: { id: '2', name: 'new-tag', color: '#00ff00' }
            };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await client.createTag('space-1', 'prop-1', { Name: 'new-tag', Color: '#00ff00' });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/v1/spaces/space-1/properties/prop-1/tags'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ Name: 'new-tag', Color: '#00ff00' })
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('listProperties', () => {
        it('should construct correct URL', async () => {
            const mockResponse = {
                data: [{ id: 'p1', name: 'Tag', format: 'tag' }]
            };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await client.listProperties('space-1');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/v1/spaces/space-1/properties'),
                expect.objectContaining({
                    method: 'GET'
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });
});
