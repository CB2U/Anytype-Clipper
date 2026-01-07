
import { AppendService } from '../../../src/lib/services/append-service';
import { AppendMetadata } from '../../../src/types/append';

describe('Append Mode Integration', () => {
    let appendService: AppendService;

    beforeEach(() => {
        // Mock chrome extension storage
        const mockStorage: Record<string, any> = {};
        (global as any).chrome = {
            storage: {
                local: {
                    get: jest.fn((keys, callback) => {
                        const res: any = {};
                        if (typeof keys === 'string') {
                            res[keys] = mockStorage[keys];
                        } else if (Array.isArray(keys)) {
                            keys.forEach(k => res[k] = mockStorage[k]);
                        }
                        if (callback) callback(res);
                        return Promise.resolve(res);
                    }),
                    set: jest.fn((data, callback) => {
                        Object.assign(mockStorage, data);
                        if (callback) callback();
                        return Promise.resolve();
                    })
                },
                onChanged: { addListener: jest.fn() }
            },
            runtime: { lastError: null },
            alarms: { create: jest.fn(), onAlarm: { addListener: jest.fn() } }
        };

        appendService = AppendService.getInstance('http://localhost:31009');

        // Mock fetch for API calls
        (global as any).fetch = jest.fn();
    });

    afterEach(() => {
        delete (global as any).fetch;
        delete (global as any).chrome;
    });

    it('should fetch existing object and append new content', async () => {
        const existingObjectId = 'obj-123';
        const existingContent = '# Original Content\n\nOriginal text.';
        const newContent = 'New appended content.';
        const metadata: AppendMetadata = {
            timestamp: '2024-01-01',
            pageTitle: 'Test Page',
            url: 'https://example.com',
            captureType: 'article'
        };

        // Mock fetch existing object
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                object: {
                    id: existingObjectId,
                    markdown: existingContent
                }
            })
        });

        // Mock update object
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                object: {
                    id: existingObjectId,
                    markdown: existingContent + '\n\n' + newContent
                }
            })
        });

        const result = await appendService.appendToObject(
            'space-1',
            existingObjectId,
            newContent,
            metadata,
            'test-api-key'
        );

        expect(result.success).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(2); // fetch + update
    });

    it('should handle multiple appends to same object', async () => {
        const objectId = 'obj-456';
        let currentContent = '# Article\n\nOriginal.';
        const metadata: AppendMetadata = {
            timestamp: '2024-01-01',
            pageTitle: 'Test Page',
            url: 'https://example.com',
            captureType: 'article'
        };

        // First append
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: objectId, markdown: currentContent } })
        });
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: objectId, markdown: 'Updated 1' } })
        });

        await appendService.appendToObject('space-1', objectId, 'Append 1', metadata, 'key');

        // Second append
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: objectId, markdown: 'Updated 1' } })
        });
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ object: { id: objectId, markdown: 'Updated 2' } })
        });

        await appendService.appendToObject('space-1', objectId, 'Append 2', metadata, 'key');

        expect(fetch).toHaveBeenCalledTimes(4); // 2 fetches + 2 updates
    });
});
