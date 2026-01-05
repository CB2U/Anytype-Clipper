/**
 * Enhanced Unit tests for AnytypeApiClient (T7)
 */
import { AnytypeApiClient } from '../../../src/lib/api/client';
import { ApiError, NetworkError } from '../../../src/lib/api/errors';

describe('AnytypeApiClient', () => {
    let client: AnytypeApiClient;
    let originalFetch: typeof fetch;

    beforeEach(() => {
        client = new AnytypeApiClient();
        originalFetch = global.fetch;
        global.fetch = jest.fn();
        jest.useFakeTimers();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        it('should use default port 31009', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ spaces: [] }) });
            await client.getSpaces();
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('http://localhost:31009'),
                expect.any(Object)
            );
        });

        it('should use custom port', async () => {
            const customClient = new AnytypeApiClient(12345);
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ spaces: [] }) });
            await customClient.getSpaces();
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('http://localhost:12345'),
                expect.any(Object)
            );
        });

        it('should throw error for invalid port', () => {
            expect(() => new AnytypeApiClient(10)).toThrow('Invalid port');
            expect(() => new AnytypeApiClient(70000)).toThrow('Invalid port');
        });
    });

    describe('Authentication', () => {
        it('should include API key in headers if set', async () => {
            client.setApiKey('my-secret-key');
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ spaces: [] }) });

            await client.getSpaces();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-Anytype-Api-Key': 'my-secret-key',
                        'Authorization': 'Bearer my-secret-key'
                    })
                })
            );
        });

        it('should not include API key if not set', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ spaces: [] }) });
            await client.getSpaces();

            const calls = (global.fetch as jest.Mock).mock.calls[0];
            const headers = calls[1].headers;
            expect(headers['X-Anytype-Api-Key']).toBeUndefined();
        });

        it('should create challenge', async () => {
            const mockResponse = {
                challengeId: '123',
                code: 'ABC',
                expiresAt: 1000
            };
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await client.createChallenge();
            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/challenges'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('should normalize snake_case challenge response', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ challenge_id: '123', expires_at: 1000 })
            });
            const result = await client.createChallenge();
            expect(result.challengeId).toBe('123');
            expect(result.expiresAt).toBe(1000);
        });
    });

    describe('Error Handling', () => {
        it('should throw NetworkError on fetch failure', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error('Connection failed'));

            await expect(client.getSpaces()).rejects.toThrow(NetworkError);
        });

        it('should throw ApiError on non-200 response', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 401,
                text: async () => 'Unauthorized'
            });

            await expect(client.getSpaces()).rejects.toThrow(ApiError);
            await expect(client.getSpaces()).rejects.toThrow('HTTP 401: Unauthorized');
        });

        it('should throw NetworkError on timeout', async () => {
            // Mock fetch that rejects on abort
            (global.fetch as jest.Mock).mockImplementation((url, options) => {
                const signal = options.signal;
                return new Promise((resolve, reject) => {
                    if (signal.aborted) {
                        const err = new Error('The user aborted a request.');
                        err.name = 'AbortError';
                        reject(err);
                        return;
                    }
                    signal.addEventListener('abort', () => {
                        const err = new Error('The user aborted a request.');
                        err.name = 'AbortError';
                        reject(err);
                    });
                });
            });

            const promise = client.get<void>('/test', undefined, 100);
            jest.advanceTimersByTime(200);

            await expect(promise).rejects.toThrow(/Request timeout/);
        });
    });

    describe('HTTP Methods', () => {
        it('should perform PUT request', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ id: 'updated' }) });
            await client.put('/v1/objects/1', { title: 'Updated' });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/v1/objects/1'),
                expect.objectContaining({ method: 'PUT', body: JSON.stringify({ title: 'Updated' }) })
            );
        });

        it('should perform PATCH request', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ id: 'patched' }) });
            await client.patch('/v1/objects/1', { title: 'Patched' });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/v1/objects/1'),
                expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ title: 'Patched' }) })
            );
        });

        it('should perform DELETE request', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
            await client.delete('/v1/objects/1');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/v1/objects/1'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    describe('Advanced Error Handling', () => {
        it('should wrap unknown errors as NetworkError', async () => {
            (global.fetch as jest.Mock).mockImplementation(() => {
                throw 'Unknown literal error';
            });

            await expect(client.getSpaces()).rejects.toThrow(NetworkError);
            await expect(client.getSpaces()).rejects.toThrow('Request failed: Unknown error');
        });

        it('should re-throw ApiError', async () => {
            const apiError = new ApiError(400, 'Bad Request');
            (global.fetch as jest.Mock).mockImplementation(() => {
                throw apiError;
            });

            await expect(client.getSpaces()).rejects.toThrow(ApiError);
        });
    });

    describe('Object Management', () => {
        it('should get spaces with normal array response', async () => {
            const mockSpaces = [{ id: '1', name: 'Personal' }];
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockSpaces
            });

            const result = await client.getSpaces();
            expect(result.spaces).toEqual(mockSpaces);
        });

        it('should get spaces with wrapper object response', async () => {
            const mockSpaces = [{ id: '1', name: 'Personal' }];
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ spaces: mockSpaces })
            });

            const result = await client.getSpaces();
            expect(result.spaces).toEqual(mockSpaces);
        });

        it('should create object', async () => {
            const params = { title: 'New Note', description: 'Desc' };
            const mockResponse = { object: { id: 'obj-1' } };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await client.createObject('space-1', params);

            expect(result.id).toBe('obj-1');
            expect(result.name).toBe('New Note');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/spaces/space-1/objects'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"New Note"')
                })
            );
        });

        it('should format highlight body correctly', async () => {
            const params = {
                title: 'Highlight',
                quote: 'Selected text',
                contextBefore: 'Before ',
                contextAfter: ' After'
            };
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ object: {} }) });

            await client.createObject('space-1', params);

            const call = (global.fetch as jest.Mock).mock.calls[0];
            const body = JSON.parse(call[1].body);

            expect(body.body).toContain('> Selected text');
            expect(body.body).toContain('*Context: ...Before  **Selected text**  After...*');
        });

        it('should normalize endpoint without leading slash', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ spaces: [] }) });
            await client.get<void>('v1/test'); // No leading slash
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/v1/test'),
                expect.anything()
            );
        });
    });

    describe('API Keys', () => {
        it('should create API key', async () => {
            const mockResponse = {
                apiKey: 'key-123',
                expiresAt: 2000
            };
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const result = await client.createApiKey({ challengeId: '123', code: 'ABC' });

            expect(result.apiKey).toBe('key-123');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/api_keys'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ challenge_id: '123', code: 'ABC' })
                })
            );
        });

        it('should normalize snake_case API key response', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ api_key: 'key-snake', expires_at: 3000 })
            });

            const result = await client.createApiKey({ challengeId: '456', code: 'DEF' });
            expect(result.apiKey).toBe('key-snake');
            expect(result.expiresAt).toBe(3000);
        });
    });

    describe('Properties & Tags', () => {
        it('should list properties', async () => {
            const mockProps = { data: [{ id: 'p1', name: 'Status' }] };
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProps });

            const result = await client.listProperties('space-1');
            expect(result).toEqual(mockProps);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/spaces/space-1/properties'),
                expect.anything()
            );
        });

        it('should list tags', async () => {
            const mockResponse = { data: [] };
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockResponse });

            await client.listTags('s1', 'p1');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/properties/p1/tags'),
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('should list tags with options', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

            await client.listTags('s1', 'p1', { offset: 10, limit: 5, filters: { name: 'foo' } });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('offset=10'),
                expect.anything()
            );
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('limit=5'),
                expect.anything()
            );
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('name=foo'),
                expect.anything()
            );
        });

        it('should create tag', async () => {
            const mockResponse = { tag: { id: 't1' } };
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockResponse });

            await client.createTag('s1', 'p1', { Name: 'foo', Color: 'red' });
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/properties/p1/tags'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    describe('Object Management', () => {
        // ... (existing tests)

        it('should update object properties', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ id: 'obj-1' }) });

            await client.updateObject('s1', 'obj-1', { status: 'done' });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/spaces/s1/objects/obj-1'),
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify({ properties: { status: 'done' } })
                })
            );
        });
    });

    describe('Response Validation', () => {
        it('should throw error for invalid spaces response format', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => 'invalid-string'
            });

            await expect(client.getSpaces()).rejects.toThrow('Invalid response format');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unexpected spaces response'), 'invalid-string');
            consoleSpy.mockRestore();
        });
    });
});
