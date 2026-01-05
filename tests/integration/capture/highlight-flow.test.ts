import { AnytypeApiClient } from '../../../src/lib/api/client';
import { CreateObjectParams } from '../../../src/lib/api/types';

// Mock fetch
global.fetch = jest.fn();

describe('AnytypeApiClient Integration', () => {
    let client: AnytypeApiClient;

    beforeEach(() => {
        client = new AnytypeApiClient(31009);
        client.setApiKey('test-api-key');
        (global.fetch as jest.Mock).mockClear();
    });

    test('createObject handles highlight type correctly', async () => {
        const spaceId = 'test-space-id';
        const params: CreateObjectParams = {
            type_key: 'highlight',
            title: 'Test Highlight',
            quote: 'This is a quote',
            contextBefore: 'Before',
            contextAfter: 'After',
            url: 'https://example.com',
            tags: ['test']
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ objectId: 'new-obj-id' }),
        });

        await client.createObject(spaceId, params);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/v1/spaces/${spaceId}/objects`),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"type_key":"highlight"')
            })
        );

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.body).toContain('> This is a quote');
        expect(callBody.body).toContain('*Context: ...Before **This is a quote** After...*');
        expect(callBody.name).toBe('Test Highlight');
    });

    test('createObject handles highlight as correctly formatted note', async () => {
        const spaceId = 'test-space-id';
        const params: CreateObjectParams = {
            type_key: 'note',
            title: 'Test Highlight',
            description: 'This is a quote acting as body content',
            source_url: 'https://example.com'
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ objectId: 'new-obj-id' }),
        });

        await client.createObject(spaceId, params);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/v1/spaces/${spaceId}/objects`),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"type_key":"note"')
            })
        );

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.body).toContain('This is a quote acting as body content');
        expect(callBody.name).toBe('Test Highlight');
    });

    test('createObject uses default title for highlight if none provided', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ objectId: 'new-obj-id' }),
        });

        await client.createObject('space', { type_key: 'highlight' });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.name).toBe('Untitled Highlight');
    });
});
