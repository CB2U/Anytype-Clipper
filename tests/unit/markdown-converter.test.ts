import { convertToMarkdown } from '../../src/lib/converters/markdown-converter';

describe('Markdown Converter', () => {

    // reset/setup if needed

    test('Test 1: Successful conversion returns Markdown', async () => {
        const html = '<h1>Hello</h1><p>World</p>';
        const result = await convertToMarkdown(html);
        expect(result.success).toBe(true);
        expect(result.markdown).toContain('# Hello');
        expect(result.markdown).toContain('World');
        expect(result.error).toBeUndefined();
    });

    test('Test 2: Headings converted to # syntax', async () => {
        const html = '<h1>H1</h1><h2>H2</h2><h3>H3</h3>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toContain('# H1');
        expect(result.markdown).toContain('## H2');
        expect(result.markdown).toContain('### H3');
    });

    test('Test 3: Ordered lists converted to numbered lists', async () => {
        const html = '<ol><li>Item 1</li><li>Item 2</li></ol>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toMatch(/1\.\s+Item 1/);
        expect(result.markdown).toMatch(/2\.\s+Item 2/);
    });

    test('Test 4: Unordered lists converted to bullet lists', async () => {
        const html = '<ul><li>Item A</li><li>Item B</li></ul>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toMatch(/-\s+Item A/);
        expect(result.markdown).toMatch(/-\s+Item B/);
    });

    test('Test 5: Nested lists indented correctly', async () => {
        const html = '<ul><li>Item 1<ul><li>Nested</li></ul></li></ul>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toMatch(/-\s+Item 1/);
        expect(result.markdown).toMatch(/\s+-\s+Nested/);
    });

    test('Test 6: Code blocks with language class → fenced blocks with language', async () => {
        const html = '<pre><code class="language-javascript">console.log("hi");</code></pre>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toContain('```javascript');
        expect(result.markdown).toContain('console.log("hi");');
        expect(result.markdown).toContain('```');
    });

    test('Test 7: Code blocks without language class → fenced blocks without language', async () => {
        const html = '<pre><code>plain text</code></pre>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toContain('```');
        expect(result.markdown).not.toContain('```language');
        expect(result.markdown).toContain('plain text');
    });

    test('Test 8: Blockquotes converted to > syntax', async () => {
        const html = '<blockquote>Quote</blockquote>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toContain('> Quote');
    });

    test('Test 9: Nested blockquotes use >> syntax', async () => {
        const html = '<blockquote>Outer<blockquote>Inner</blockquote></blockquote>';
        const result = await convertToMarkdown(html);
        // Turndown might output > Outer\n>\n> > Inner or similar
        expect(result.markdown).toContain('> Outer');
        expect(result.markdown).toContain('> > Inner');
    });

    test('Test 10: Links converted to [text](url) format', async () => {
        const html = '<a href="https://example.com">Link</a>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toBe('[Link](https://example.com)');
    });

    test('Test 11: Strong/bold converted to ** syntax', async () => {
        const html = '<strong>Bold</strong>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toBe('**Bold**');
    });

    test('Test 12: Em/italic converted to * syntax', async () => {
        const html = '<em>Italic</em>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toBe('*Italic*');
    });

    test('Test 13: Nested structures preserved correctly', async () => {
        const html = '<blockquote><p>Quote with <strong>bold</strong></p></blockquote>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toContain('> Quote with **bold**');
    });

    test('Test 14: Empty input handled gracefully', async () => {
        const result = await convertToMarkdown('');
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    test('Test 15: Conversion time tracked', async () => {
        const html = '<p>Test</p>';
        const result = await convertToMarkdown(html);
        expect(result.metadata.conversionTime).toBeGreaterThanOrEqual(0);
        expect(result.metadata.characterCount).toBeGreaterThan(0);
    });
    test('Test 16: Unicode characters preserved', async () => {
        const html = '<p>Hello 🌍 中文</p>';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toContain('Hello 🌍 中文');
    });

    test('Test 17: Malformed HTML handled gracefully', async () => {
        const html = '<div><p>Unclosed standard tags';
        const result = await convertToMarkdown(html);
        expect(result.markdown).toContain('Unclosed standard tags');
    });
});
