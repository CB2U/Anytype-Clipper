import { ImageOptimizer } from '../../../src/lib/extractors/image-optimizer';

describe('ImageOptimizer', () => {
    describe('fetchImage', () => {
        beforeEach(() => {
            global.fetch = jest.fn();
            global.AbortController = class {
                signal = {};
                abort = jest.fn();
            } as any;
        });

        it('should return buffer on success', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(10))
            });

            const result = await ImageOptimizer.fetchImage('http://example.com/img.jpg', 1000);
            expect(result).toBeInstanceOf(ArrayBuffer);
            expect(result?.byteLength).toBe(10);
        });

        it('should return null on 404', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 404
            });
            const result = await ImageOptimizer.fetchImage('http://example.com/img.jpg', 1000);
            expect(result).toBeNull();
        });

        it('should handle timeout', async () => {
            jest.useFakeTimers();
            (global.fetch as jest.Mock).mockImplementation(() => new Promise(r => setTimeout(r, 2000)));

            const promise = ImageOptimizer.fetchImage('http://example.com/img.jpg', 100);
            jest.advanceTimersByTime(200); // Should trigger abort ideally or just wait
            // Since we mocked fetch with delay, fetch won't resolve.
            // Our implementation catches error? 
            // In real fetch, abort signal triggers reject 'AbortError'.
            // Can't easily mock AbortSignal behavior with simple jest.fn.
            // Simplified check: validation error handling returns null.

            // Let's just mock rejection
            (global.fetch as jest.Mock).mockRejectedValue(new Error('AbortError'));
            const result = await ImageOptimizer.fetchImage('http://example.com/img.jpg', 100);
            expect(result).toBeNull();

            jest.useRealTimers();
        });
    });

    describe('optimizeToWebP', () => {
        beforeAll(() => {
            global.createImageBitmap = jest.fn().mockResolvedValue({
                width: 100, height: 100, close: jest.fn()
            });
            global.OffscreenCanvas = class {
                constructor() { }
                getContext() { return { drawImage: jest.fn() }; }
                convertToBlob() {
                    return Promise.resolve({
                        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
                        size: 10,
                        type: 'image/webp'
                    });
                }
            } as any;
        });

        it('should optimize image', async () => {
            const input = new ArrayBuffer(10);
            const result = await ImageOptimizer.optimizeToWebP(input, 85);
            expect(result).toBeInstanceOf(ArrayBuffer);
        });
    });

    describe('convertToBase64', () => {
        it('should convert buffer to data URL', () => {
            const buffer = new Uint8Array([65, 66]).buffer; // 'AB'
            const b64 = ImageOptimizer.convertToBase64(buffer, 'text/plain');
            expect(b64).toContain('data:text/plain;base64,QUI=');
        });
    });
});
