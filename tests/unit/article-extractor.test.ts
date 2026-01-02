import { extractArticle } from '../../src/lib/extractors/article-extractor';
import { ExtractionQuality } from '../../src/types/article';
import { Readability } from '@mozilla/readability';
import { convertToMarkdown } from '../../src/lib/converters/markdown-converter';

// Mock Readability
jest.mock('@mozilla/readability', () => {
    return {
        Readability: jest.fn().mockImplementation(() => {
            return {
                parse: jest.fn()
            };
        })
    };
});

// Mock Markdown Converter
jest.mock('../../src/lib/converters/markdown-converter', () => ({
    convertToMarkdown: jest.fn()
}));

describe('Article Extractor', () => {
    let mockParse: jest.Mock;
    const mockConvertToMarkdown = convertToMarkdown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockParse = (Readability as any).mock.instances[0]?.parse || jest.fn();
        (Readability as unknown as jest.Mock).mockImplementation(() => ({
            parse: mockParse
        }));

        // Default successful conversion
        mockConvertToMarkdown.mockResolvedValue({
            success: true,
            markdown: '# Markdown Content',
            metadata: { conversionTime: 10, characterCount: 50 }
        });
    });

    // Helper to create a mock document
    const createMockDoc = (content: string = '') => {
        const doc = document.implementation.createHTMLDocument('Test Page');
        doc.body.innerHTML = content;
        return doc;
    };

    test('should successfully extract article with content and markdown', async () => {
        const mockArticle = {
            title: 'Test Article',
            content: '<p>Some content</p>',
            textContent: 'Some content with more than just a few words.',
            length: 100,
            excerpt: 'Excerpt',
            byline: 'Author',
            dir: 'ltr',
            siteName: 'Site',
            lang: 'en'
        };
        mockParse.mockReturnValue(mockArticle);

        const doc = createMockDoc('<div>Some content</div>');
        const result = await extractArticle(doc);

        expect(result.success).toBe(true);
        expect(result.article).toEqual({
            ...mockArticle,
            markdown: '# Markdown Content'
        });
        expect(result.metadata.wordCount).toBeGreaterThan(0);
        expect(result.metadata.conversionTime).toBe(10);
        expect(result.error).toBeUndefined();
        expect(mockConvertToMarkdown).toHaveBeenCalledWith('<p>Some content</p>', 2000);
    });

    test('should use textContent as fallback when markdown conversion fails', async () => {
        const mockArticle = {
            title: 'Test Article',
            content: '<p>Content</p>',
            textContent: 'Plain text content',
        };
        mockParse.mockReturnValue(mockArticle);

        mockConvertToMarkdown.mockResolvedValue({
            success: false,
            markdown: null,
            metadata: { conversionTime: 5, characterCount: 0 },
            error: 'Conversion failed'
        });

        const doc = createMockDoc();
        const result = await extractArticle(doc);

        expect(result.success).toBe(true);
        expect(result.article?.markdown).toBe('Plain text content');
        expect(result.metadata.conversionTime).toBe(5);
    });

    test('should return failure quality when extraction returns null', async () => {
        mockParse.mockReturnValue(null);

        const doc = createMockDoc('');
        const result = await extractArticle(doc);

        expect(result.success).toBe(false);
        expect(result.quality).toBe(ExtractionQuality.FAILURE);
        expect(result.article).toBeNull();
        expect(result.error).toBe('Readability returned null (no article found)');
        expect(mockConvertToMarkdown).not.toHaveBeenCalled();
    });

    test('should calculate word count correctly', async () => {
        mockParse.mockReturnValue({
            textContent: 'One two three four five',
            content: '<p>One two three four five</p>',
            length: 50
        });

        const doc = createMockDoc();
        const result = await extractArticle(doc);

        expect(result.metadata.wordCount).toBe(5);
    });

    test('should track extraction time', async () => {
        mockParse.mockReturnValue({ textContent: 'Content' });

        const doc = createMockDoc();
        const result = await extractArticle(doc);

        expect(result.metadata.extractionTime).toBeGreaterThanOrEqual(0);
    });
});
