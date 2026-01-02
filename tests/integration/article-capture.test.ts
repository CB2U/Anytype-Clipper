import 'expect-puppeteer';
import { convertToMarkdown } from '../../src/lib/converters/markdown-converter';

describe('Article Capture Integration', () => {
    beforeAll(async () => {
        // Setup
    });

    test('should render page and convert content to Markdown', async () => {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Test Article</title></head>
        <body>
            <article>
                <h1>Integration Test Article</h1>
                <p>This is test content.</p>
                <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                </ul>
            </article>
        </body>
        </html>
        `;

        await page.setContent(htmlContent);

        // Get content from browser (this tests how browser serializes DOM)
        // We target the article specifically to simulate extractor finding it
        const articleHtml = await page.$eval('article', el => el.innerHTML);

        const result = await convertToMarkdown(articleHtml);

        expect(result.success).toBe(true);
        expect(result.markdown).toContain('# Integration Test Article');
        expect(result.markdown).toContain('This is test content.');
        expect(result.markdown).toMatch(/-\s+Item 1/);
    });

    test('should preserve code block language from browser DOM', async () => {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body>
            <pre><code class="language-python">def hello():\n    print("world")</code></pre>
        </body>
        </html>
        `;

        await page.setContent(htmlContent);
        const bodyHtml = await page.$eval('body', el => el.innerHTML);

        const result = await convertToMarkdown(bodyHtml);

        expect(result.success).toBe(true);
        expect(result.markdown).toContain('```python');
        expect(result.markdown).toContain('def hello():');
    });
});
