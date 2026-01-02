import 'expect-puppeteer';
import { JSDOM } from 'jsdom';
import { extractArticle } from '../../src/lib/extractors/article-extractor';
import { StorageManager } from '../../src/lib/storage/storage-manager';
import { DEFAULT_IMAGE_SETTINGS } from '../../src/lib/storage/defaults';

declare const page: any;

describe('Article With Images Integration', () => {

    // Mock chrome.storage.local
    beforeAll(() => {
        global.chrome = {
            storage: {
                local: {
                    get: jest.fn().mockImplementation((keys) => {
                        // Return default settings
                        return Promise.resolve({
                            imageHandlingSettings: DEFAULT_IMAGE_SETTINGS
                        });
                    }),
                    set: jest.fn(),
                    getBytesInUse: jest.fn().mockResolvedValue(0)
                }
            }
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
            expect(md).toContain('data:image/webp;base64');
            expect(md).toContain('alt="Test Image"'); // Turndown format might vary
            // Turndown defaults: ![Test Image](data:...)
            // But existing code might produce HTML in MD if configured so?
            // MD converter config uses 'inlined' style.
            // Expect: ![Test Image](data:image/webp;base64,...)
            expect(md).toMatch(/!\[Test Image\]\(data:image\/webp;base64/);
        }
    });
});
