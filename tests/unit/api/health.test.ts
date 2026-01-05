/**
 * Unit tests for Health Check (T6)
 */
import { checkHealth } from '../../../src/lib/api/health';

describe('Health Check', () => {
    let mockFetch: jest.Mock;

    beforeEach(() => {
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('should return true when API is reachable (200 OK)', async () => {
        mockFetch.mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({})
        });

        const result = await checkHealth();
        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:31009/v1/spaces',
            expect.objectContaining({ method: 'GET' })
        );
    });

    it('should return true when API is reachable but returns error (401)', async () => {
        // Even 401 means the service is running
        mockFetch.mockResolvedValueOnce({
            status: 401,
            ok: false
        });

        const result = await checkHealth();
        expect(result).toBe(true);
    });

    it('should return false when port is invalid', async () => {
        expect(await checkHealth(80)).toBe(false); // Too low
        expect(await checkHealth(70000)).toBe(false); // Too high
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return false on network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network Error'));

        const result = await checkHealth();
        expect(result).toBe(false);
    });

    it('should return false on timeout', async () => {
        // Mock a fetch that rejects on abort
        mockFetch.mockImplementation((url, options) => {
            const signal = options.signal;
            return new Promise((resolve, reject) => {
                if (signal.aborted) {
                    reject(new DOMException('Aborted', 'AbortError'));
                    return;
                }
                signal.addEventListener('abort', () => {
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            });
        });

        const promise = checkHealth(31009, 100);

        // Fast-forward time to trigger timeout
        jest.advanceTimersByTime(150);

        const result = await promise;
        expect(result).toBe(false);
    });

    it('should use custom port', async () => {
        mockFetch.mockResolvedValueOnce({ status: 200 });

        await checkHealth(12345);

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:12345/v1/spaces',
            expect.any(Object)
        );
    });
});
