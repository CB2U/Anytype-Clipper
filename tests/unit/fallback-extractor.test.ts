import { jest } from '@jest/globals';
import {
    extractWithFallback,
    extractSimplifiedDOM,
    extractFullPageClean,
    createSmartBookmark
} from '../../src/lib/extractors/fallback-extractor';
import { extractReadability } from '../../src/lib/extractors/readability-extractor';
import { ExtractionLevel, ExtractionQuality } from '../../src/types/article';

// Mock dependencies
jest.mock('../../src/lib/extractors/readability-extractor');
jest.mock('../../src/lib/converters/markdown-converter', () => ({
    convertToMarkdown: jest.fn().mockResolvedValue({
        success: true,
        markdown: '# Mock Markdown',
        metadata: { conversionTime: 10 }
    })
}));

// Mock MetadataExtractor (internal usage in createSmartBookmark)
jest.mock('../../src/lib/extractors/metadata-extractor', () => {
    return {
        MetadataExtractor: jest.fn().mockImplementation(() => ({
            extract: jest.fn().mockResolvedValue({
                title: 'Mock Title',
                url: 'http://example.com'
            })
        }))
    };
});

describe('Fallback Extractor', () => {
    const mockReadability = extractReadability as jest.MockedFunction<typeof extractReadability>;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset DOM
        document.body.innerHTML = '';
        document.head.innerHTML = '<title>Test Page</title>';
    });

    describe('Level 2: Simplified DOM', () => {
        it('extracts from <article> tag', () => {
            document.body.innerHTML = `
                <div>
                    <article>
                        <h1>Article Title</h1>
                        <p>${'word '.repeat(100)}</p>
                    </article>
                    <aside>Sidebar</aside>
                </div>
            `;
            const result = extractSimplifiedDOM();
            expect(result).not.toBeNull();
            expect(result).toContain('<h1>Article Title</h1>');
        });

        it('extracts high density text block when no article tag', () => {
            document.body.innerHTML = `
                <div>
                    <nav>Menu link item link item</nav>
                    <main>
                        <p>${'content '.repeat(200)}</p>
                    </main>
                    <footer>Copyright info</footer>
                </div>
            `;
            const result = extractSimplifiedDOM();
            expect(result).not.toBeNull();
            expect(result).toContain('content content');
        });

        it('returns null if content is too short', () => {
            document.body.innerHTML = '<article><p>Short content</p></article>';
            const result = extractSimplifiedDOM();
            expect(result).toBeNull();
        });
    });

    describe('Level 3: Full Page Clean', () => {
        it('removes scripts, styles, and ads', () => {
            document.body.innerHTML = `
                <div class="header">Header</div>
                <script>console.log("bad")</script>
                <div class="ad-banner">Buy now!</div>
                <div class="content">
                    <p>${'real content '.repeat(60)}</p>
                </div>
                <div class="footer">Footer</div>
            `;
            const result = extractFullPageClean();
            expect(result).not.toBeNull();
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('ad-banner');
            expect(result).toContain('real content');
        });

        it('returns null if cleaned word count is too low', () => {
            document.body.innerHTML = `
                <div class="ad">Ad</div>
                <p>Verify small content</p>
            `;
            const result = extractFullPageClean();
            expect(result).toBeNull();
        });
    });

    describe('Orchestration: extractWithFallback', () => {
        it('returns Level 1 if Readability succeeds', async () => {
            mockReadability.mockResolvedValueOnce({
                success: true,
                level: ExtractionLevel.READABILITY,
                quality: ExtractionQuality.SUCCESS,
                article: {
                    title: 'L1 Title', content: '<p>L1</p>', textContent: 'L1', length: 10,
                    markdown: 'L1', excerpt: '', byline: '', dir: '', siteName: '', lang: '', publishedTime: ''
                },
                metadata: { extractionTime: 10, wordCount: 100, levelTimes: {} }
            });

            const result = await extractWithFallback();
            expect(result.level).toBe(ExtractionLevel.READABILITY);
            expect(result.quality).toBe(ExtractionQuality.SUCCESS);
            expect(mockReadability).toHaveBeenCalled();
        });

        it('falls back to Level 2 if Level 1 fails', async () => {
            // L1 fails
            mockReadability.mockResolvedValueOnce({
                success: false, level: ExtractionLevel.READABILITY, quality: ExtractionQuality.FAILURE,
                article: null, metadata: { extractionTime: 0, wordCount: 0, levelTimes: {} }
            });

            // Setup L2 success (article tag)
            document.body.innerHTML = `<article><p>${'content '.repeat(100)}</p></article>`;

            const result = await extractWithFallback();
            expect(result.level).toBe(ExtractionLevel.SIMPLIFIED_DOM);
            expect(result.quality).toBe(ExtractionQuality.PARTIAL);
        });

        it('falls back to Level 3 if Level 2 fails (no density matches)', async () => {
            // L1 fails
            mockReadability.mockResolvedValueOnce({
                success: false, level: ExtractionLevel.READABILITY, quality: ExtractionQuality.FAILURE,
                article: null, metadata: { extractionTime: 0, wordCount: 0, levelTimes: {} }
            });

            // L2 fails (short content for density) but enough for L3 (>50 words but <100 for L2 density check potentially differently handled?) 
            // Actually L2 requires article tag OR density >= 0.3 AND wordCount >= 100.
            // L3 requires wordCount >= 50.
            // So 60 words: L2 fails (too short for density/article if not article), L3 succeeds.
            document.body.innerHTML = `<div><p>${'content '.repeat(60)}</p></div>`;

            const result = await extractWithFallback();
            expect(result.level).toBe(ExtractionLevel.FULL_PAGE_CLEAN);
            expect(result.quality).toBe(ExtractionQuality.PARTIAL);
        });

        it('falls back to Level 4 (Smart Bookmark) if all else fails', async () => {
            // L1 fails
            mockReadability.mockResolvedValueOnce({ success: false } as any);
            // L2/L3 fail (empty body)
            document.body.innerHTML = '';

            const result = await extractWithFallback();
            expect(result.level).toBe(ExtractionLevel.SMART_BOOKMARK);
            expect(result.quality).toBe(ExtractionQuality.FALLBACK);
            expect(result.content.metadata.extractionFailed).toBe(true);
        });
    });
});
