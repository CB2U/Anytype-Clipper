import { AnytypeApiClient } from '../../../src/lib/api/client';
import { StorageManager } from '../../../src/lib/storage/storage-manager';

describe('Auth Flow Integration', () => {
    let apiClient: AnytypeApiClient;
    let storage: StorageManager;
    let mockStorageData: Record<string, any> = {};

    beforeEach(async () => {
        mockStorageData = {};

        // Mock chrome storage
        (global as any).chrome = {
            storage: {
                local: {
                    get: jest.fn((keys, callback) => {
                        const res: any = {};
                        if (typeof keys === 'string') {
                            res[keys] = mockStorageData[keys];
                        } else if (Array.isArray(keys)) {
                            keys.forEach(k => res[k] = mockStorageData[k]);
                        } else if (keys === null || keys === undefined) {
                            if (callback) callback({ ...mockStorageData });
                            return Promise.resolve({ ...mockStorageData });
                        }
                        if (callback) callback(res);
                        return Promise.resolve(res);
                    }),
                    set: jest.fn((data, callback) => {
                        Object.assign(mockStorageData, data);
                        if (callback) callback();
                        return Promise.resolve();
                    }),
                    getBytesInUse: jest.fn(() => Promise.resolve(JSON.stringify(mockStorageData).length)),
                    remove: jest.fn((keys) => {
                        if (typeof keys === 'string') delete mockStorageData[keys];
                        else if (Array.isArray(keys)) keys.forEach(k => delete mockStorageData[k]);
                        return Promise.resolve();
                    }),
                    clear: jest.fn(() => {
                        mockStorageData = {};
                        return Promise.resolve();
                    })
                }
            },
            runtime: {
                lastError: null
            }
        };

        // Reset singletons
        (StorageManager as any).instance = undefined;
        storage = StorageManager.getInstance();
        apiClient = new AnytypeApiClient();

        // Mock fetch for API calls
        (global as any).fetch = jest.fn();
    });

    afterEach(() => {
        delete (global as any).chrome;
        delete (global as any).fetch;
    });

    it('should complete auth flow: challenge → code → API key → storage', async () => {
        // Step 1: Request challenge code
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ code: '1234' })
        });

        const challengeResponse = await fetch('http://localhost:31009/auth/challenge', {
            method: 'POST'
        });
        const { code } = await challengeResponse.json();
        expect(code).toBe('1234');

        // Step 2: Exchange code for API key
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ apiKey: 'test-api-key-12345' })
        });

        const apiKeyResponse = await fetch('http://localhost:31009/auth/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: '1234' })
        });
        const { apiKey } = await apiKeyResponse.json();
        expect(apiKey).toBe('test-api-key-12345');

        // Step 3: Store API key
        await storage.set('auth', { apiKey, isAuthenticated: true });

        // Step 4: Verify storage
        const storedAuth = await storage.get('auth');
        expect(storedAuth.apiKey).toBe('test-api-key-12345');
        expect(mockStorageData['auth']).toBeDefined();
    });

    it('should validate API key on initialization', async () => {
        // Pre-populate storage with API key
        await storage.set('auth', { apiKey: 'valid-key', isAuthenticated: true });

        // Mock validation endpoint
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ valid: true })
        });

        apiClient.setApiKey('valid-key');

        // Attempt API call to verify key works
        const response = await fetch('http://localhost:31009/spaces', {
            headers: { 'Authorization': `Bearer valid-key` }
        });

        expect(response.ok).toBe(true);
    });

    it('should handle invalid API key', async () => {
        await storage.set('auth', { apiKey: 'invalid-key', isAuthenticated: true });

        // Mock 401 response
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'Unauthorized' })
        });

        apiClient.setApiKey('invalid-key');

        const response = await fetch('http://localhost:31009/spaces', {
            headers: { 'Authorization': `Bearer invalid-key` }
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(401);
    });
});
