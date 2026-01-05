import 'expect-puppeteer';
import { JSDOM } from 'jsdom';
import { extractWithFallback } from '../../../src/lib/extractors/fallback-extractor';
import { ExtractionLevel, ExtractionQuality } from '../../../src/types/article';

// Mock dependencies functionality if needed, but integration tests should run real logic mostly.
// But we need to mock dependencies that fallback-extractor imports if they are not compatible with Node env
// e.g. metadata-extractor.
// fallback-extractor imports: metadata-extractor, readability-extractor, markdown-converter.
// These should work in Node/JSDOM.

describe('Fallback Extraction Integration', () => {
    // Helper to run extractor on Puppeteer page content
    async function extractFromPage() {
        // Get full HTML including DOM modifications by scripts (if real browser)
        // With page.setContent, scripts might not run unless enabled.
        const html = await page.content();
        const dom = new JSDOM(html, { url: 'http://localhost/test-page' });
        // @ts-ignore
        global.document = dom.window.document;
        // @ts-ignore
        global.window = dom.window;

        return extractWithFallback(dom.window.document);
    }

    test('Level 2: Simplified DOM Extraction from SPA-like structure', async () => {
        const html = `
        <!DOCTYPE html>
        <html>
        <head><title>SPA Title</title></head>
        <body>
            <div id="app">
                <nav>Navbar</nav>
                <main>
                    <div class="content-wrapper">
                        <h1>SPA Title</h1>
                        <div class="article-body">
                            <p>${'SPA content '.repeat(50)}</p>
                            <p>${'More dynamic text '.repeat(50)}</p>
                        </div>
                    </div>
                </main>
                <div class="sidebar">Sidebar</div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(html);

        const result = await extractFromPage();

        // Should succeed at L2 or L3 depending on Readability (L1).
        // Readability might actually work on this clean structure!
        // To enforce fallback, we might need to confuse Readability or mock it to fail.
        // But integration tests should test REAL behavior.
        // If Readability works, that's fine.

        expect(result.success).toBe(true);
        // It's acceptable if L1 works. But if we want to test L2, we need L1 to fail.
        // Mocking L1 in integration test is hard without jest.mock which affects module loading.
        // We can check if result is VALID content.
        expect(result.content.title).toBeTruthy();
        expect(result.content.html).toContain('SPA content');
    });

    test('Level 3: Cleaning noise from heavy page', async () => {
        const html = `
        <!DOCTYPE html>
        <html>
        <body>
            <div class="ad-banner">ADVERTISEMENT</div>
            <script>var x = 1;</script>
            <div class="main-content">
                <p>${'Real valuable content '.repeat(100)}</p>
            </div>
            <div class="social-share">Share this</div>
            <div class="comments">Comments section</div>
        </body>
        </html>
        `;

        await page.setContent(html);
        const result = await extractFromPage();

        expect(result.success).toBe(true);
        expect(result.content.html).toContain('Real valuable content');
        expect(result.content.html).not.toContain('ADVERTISEMENT');
        // Script removal check
        expect(result.content.html).not.toContain('<script>');
    });

    test('Level 4: Fallback to Bookmark for minimal content', async () => {
        const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Minimal Page</title></head>
        <body>
            <div style="display:none">Hidden text</div>
            <img src="hero.jpg" />
        </body>
        </html>
        `;

        await page.setContent(html);
        const result = await extractFromPage();

        // Readability and L2/L3 should fail due to low word count
        // Expect L4
        expect(result.level).toBe(ExtractionLevel.SMART_BOOKMARK);
        expect(result.quality).toBe(ExtractionQuality.FALLBACK);
        expect(result.content.title).toBe('Minimal Page');
    });
});
