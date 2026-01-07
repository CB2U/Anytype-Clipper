import 'expect-puppeteer';
import { JSDOM } from 'jsdom';
import { extractArticle } from '../../../src/lib/extractors/article-extractor';
import { StorageManager } from '../../../src/lib/storage/storage-manager';
import { DEFAULT_IMAGE_SETTINGS } from '../../../src/lib/storage/defaults';

declare const page: any;

describe('Article With Images Integration', () => {

    // Mock chrome.storage.local
    beforeAll(() => {
        const mockStorage: { [key: string]: any } = {
            imageHandlingSettings: DEFAULT_IMAGE_SETTINGS
        };

        global.chrome = {
            storage: {
                local: {
                    get: jest.fn((keys, callback) => {
                        const res: any = {};
                        if (typeof keys === 'string') {
                            res[keys] = mockStorage[keys];
                        } else if (Array.isArray(keys)) {
                            keys.forEach(k => res[k] = mockStorage[k]);
                        } else if (keys === undefined || keys === null || Object.keys(keys).length === 0) {
                            // If keys is empty or undefined, return all
                            Object.assign(res, mockStorage);
                        } else if (typeof keys === 'object') { // Handle object with default values
                            for (const key in keys) {
                                res[key] = mockStorage[key] !== undefined ? mockStorage[key] : keys[key];
                            }
                        }
                        if (callback) callback(res);
                        return Promise.resolve(res);
                    }),
                    set: jest.fn((data, callback) => {
                        Object.assign(mockStorage, data);
                        if (callback) callback();
                        return Promise.resolve();
                    }),
                    getBytesInUse: jest.fn().mockResolvedValue(0)
                },
                onChanged: { addListener: jest.fn() } // This is already chrome.storage.onChanged
            },
            runtime: { lastError: null },
            alarms: { create: jest.fn(), onAlarm: { addListener: jest.fn() } }
        } as any;

        // Mock fetch for image downloading (ImageOptimizer)
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
        });

        // Mock Canvas stuff for ImageOptimizer using JSDOM canvas if available or mock
        // JSDOM has canvas support via 'canvas' package usually, or we mock it globally
        global.createImageBitmap = jest.fn().mockResolvedValue({
            width: 100,
            height: 100,
            close: jest.fn()
        });
        global.OffscreenCanvas = class {
            constructor() { }
            getContext() { return { drawImage: jest.fn() }; }
            convertToBlob() {
                return Promise.resolve({
                    arrayBuffer: () => Promise.resolve(new ArrayBuffer(50)),
                    type: 'image/webp'
                });
            }
        } as any;
    });

    async function extractFromPage() {
        const html = await page.content();
        const dom = new JSDOM(html, { url: 'http://localhost/test-page' });
        // @ts-ignore
        global.document = dom.window.document;
        // @ts-ignore
        global.window = dom.window;
        global.DOMParser = dom.window.DOMParser;

        return extractArticle(dom.window.document);
    }

    test('Should embed images in Markdown', async () => {
        const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Image Test</title></head>
        <body>
            <article>
                <h1>Image Test Article</h1>
                <p>Here is an image:</p>
                <img src="http://example.com/image.jpg" alt="Test Image">
                <p>End of article.</p>
            </article>
        </body>
        </html>
        `;

        await page.setContent(html);

        const result = await extractFromPage();

        expect(result.success).toBe(true);
        expect(result.article).not.toBeNull();
        if (result.article) {
            const md = result.article.markdown;
            // Check that image URL is replaced with data URL
            // Turndown defaults: ![Test Image](data:...)
            // But existing code might produce HTML in MD if configured so?
            // MD converter config uses 'inlined' style.
            // Expect: ![Test Image](data:image/webp;base64,...)
            expect(md).toMatch(/!\[Test Image\]\(data:image\/webp;base64/);
        }
    });
});
