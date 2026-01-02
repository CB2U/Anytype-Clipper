import { extractArticle } from '../../src/lib/extractors/article-extractor';
import { extractWithFallback } from '../../src/lib/extractors/fallback-extractor';
import { ExtractionQuality, ExtractionLevel } from '../../src/types/article';

// Mock Fallback Extractor
jest.mock('../../src/lib/extractors/fallback-extractor', () => ({
    extractWithFallback: jest.fn()
}));

describe('Article Extractor Wrapper', () => {
    const mockExtractWithFallback = extractWithFallback as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should map successful fallback result to article result', async () => {
        mockExtractWithFallback.mockResolvedValue({
            success: true,
            level: ExtractionLevel.SIMPLIFIED_DOM,
            quality: ExtractionQuality.PARTIAL,
            content: {
                html: '<p>Content</p>',
                markdown: '# Content',
                title: 'Title',
                metadata: {
                    description: 'Desc',
                    author: 'Auth',
                    siteName: 'Site',
                    language: 'en',
                    publishedDate: '2023-01-01',
                    wordCount: 100
                }
            },
            performance: {
                totalTime: 50,
                levelTimes: { [ExtractionLevel.READABILITY]: 10, [ExtractionLevel.SIMPLIFIED_DOM]: 40 }
            }
        });

        const result = await extractArticle();

        expect(result.success).toBe(true);
        expect(result.level).toBe(ExtractionLevel.SIMPLIFIED_DOM);
        expect(result.quality).toBe(ExtractionQuality.PARTIAL);
        expect(result.article).toEqual({
            title: 'Title',
            content: '<p>Content</p>',
            textContent: '',
            length: 14,
            excerpt: 'Desc',
            byline: 'Auth',
            dir: '', // Default from document.dir
            siteName: 'Site',
            lang: 'en',
            publishedTime: '2023-01-01',
            markdown: '# Content'
        });
        expect(result.metadata.levelTimes[ExtractionLevel.SIMPLIFIED_DOM]).toBe(40);
        expect(result.metadata.extractionTime).toBe(50);
    });

    test('should map failure result correctly', async () => {
        mockExtractWithFallback.mockResolvedValue({
            success: false,
            level: ExtractionLevel.SMART_BOOKMARK, // If L4 fails technically it returns success/fallback but if it threw error
            quality: ExtractionQuality.FAILURE,
            content: { html: null, markdown: null, title: '', metadata: {} },
            performance: { totalTime: 10, levelTimes: {} },
            error: 'Failed completely'
        });

        const result = await extractArticle();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed completely');
        expect(result.article).toBeNull();
    });

    test('should handle exceptions', async () => {
        mockExtractWithFallback.mockRejectedValue(new Error('Critical error'));

        const result = await extractArticle();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Critical error');
        expect(result.quality).toBe(ExtractionQuality.FAILURE);
    });
});
