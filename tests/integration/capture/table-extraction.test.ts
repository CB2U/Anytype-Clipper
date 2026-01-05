
import { convertToMarkdown } from '../../../src/lib/converters/markdown-converter';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadFixture(name: string): string {
    return readFileSync(resolve(__dirname, '../fixtures/tables', name), 'utf-8');
}

describe('Table Extraction Integration', () => {
    it('should extract article with simple table as Markdown', async () => {
        const html = loadFixture('article-with-simple-table.html');
        const result = await convertToMarkdown(html);

        expect(result.success).toBe(true);
        const md = result.markdown || '';

        // Verify Markdown table syntax
        expect(md).toContain('| Header 1 | Header 2 |');
        expect(md).toContain('| --- | --- |'); // Turndown or our converter
        // Our converter uses `---`
        expect(md).not.toContain('<table>'); // Should convert to MD
    });

    it('should preserve complex table as HTML', async () => {
        const html = loadFixture('article-with-complex-table.html');
        const result = await convertToMarkdown(html);

        expect(result.success).toBe(true);
        const md = result.markdown || '';

        // Verify HTML preservation
        expect(md).toContain('<table');
        expect(md).toContain('Merged Header');
        expect(md).toContain('colspan="2"');
    });

    it('should extract data table as JSON/CSV + HTML', async () => {
        const html = loadFixture('article-with-data-table.html');
        const result = await convertToMarkdown(html);

        expect(result.success).toBe(true);
        const md = result.markdown || '';

        // Verify Data Table format
        expect(md).toContain('**Data Table:**');
        expect(md).toContain('```json');
        expect(md).toContain('"Value": "10.5"'); // Check content
        // Output should be JSON then Markdown table
        expect(md).toContain('**Data Table:**');
        expect(md).toContain('```json');

        // Check for Markdown table syntax
        expect(md).toContain('| Value |');
        expect(md).toContain('| --- |');
    });

    it('should handle mixed tables', async () => {
        const html = loadFixture('mixed-tables.html');
        const result = await convertToMarkdown(html);

        const md = result.markdown || '';

        // Simple table -> Markdown
        expect(md).toContain('| A | B |');

        // Complex table -> HTML
        expect(md).toContain('Merged');
        expect(md).toContain('<table');
    });
});
