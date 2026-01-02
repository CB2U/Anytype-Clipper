import { MarkdownConverter } from '../../src/lib/utils/markdown-converter';

describe('MarkdownConverter', () => {
    let converter: MarkdownConverter;

    beforeEach(() => {
        converter = new MarkdownConverter();
    });

    it('should convert simple HTML to Markdown', () => {
        const html = '<h1>Title</h1><p>Hello <strong>world</strong>!</p>';
        const markdown = converter.convert(html);
        // Match ATX heading or Setext heading (allowing for either if config is picky)
        expect(markdown).toMatch(/(# Title|Title\n={2,})/);
        expect(markdown).toContain('Hello **world**!');
    });

    it('should convert links correctly', () => {
        const html = '<a href="https://example.com">Link</a>';
        const markdown = converter.convert(html);
        expect(markdown).toBe('[Link](https://example.com)');
    });

    it('should convert lists correctly', () => {
        const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
        const markdown = converter.convert(html);
        expect(markdown).toMatch(/-\s+Item 1/);
        expect(markdown).toMatch(/-\s+Item 2/);
    });

    it('should remove script and style tags', () => {
        const html = '<div>Text<script>alert(1)</script><style>body{color:red}</style></div>';
        const markdown = converter.convert(html);
        expect(markdown).toBe('Text');
    });

    it('should handle empty input', () => {
        expect(converter.convert('')).toBe('');
    });

    it('should fallback to stripping tags if conversion fails', () => {
        // Mock turndown to throw error
        const originalTurndown = (converter as any).turndown.turndown;
        (converter as any).turndown.turndown = () => { throw new Error('Fail'); };

        const html = '<b>Bold</b>';
        const markdown = converter.convert(html);
        expect(markdown).toBe('Bold');

        // Restore
        (converter as any).turndown.turndown = originalTurndown;
    });
});
