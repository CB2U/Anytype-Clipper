import { ArticleExtractionResult, ExtractionQuality, ExtractionLevel, ExtractedArticle } from '../../types/article';
import { extractWithFallback } from './fallback-extractor';

/**
 * Extract article content from the current document using the Fallback Chain (Epic 4.2).
 * 
 * @param doc - Optional document to extract from (defaults to window.document)
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to extraction result
 */
export async function extractArticle(
    doc: Document = document
): Promise<ArticleExtractionResult> {
    try {
        // extractWithFallback handles its own timeouts internally for each level
        const result = await extractWithFallback(doc);

        // Map FallbackExtractionResult to ArticleExtractionResult
        const article: ExtractedArticle | null = result.success ? {
            title: result.content.title,
            content: result.content.html || '',
            textContent: '', // Fallback result might not compute exact text content
            length: (result.content.html || '').length,
            excerpt: result.content.metadata.description || '',
            byline: result.content.metadata.author || '',
            dir: doc.dir,
            siteName: result.content.metadata.siteName || '',
            lang: result.content.metadata.language || '',
            publishedTime: result.content.metadata.publishedDate || '',
            markdown: result.content.markdown || '',
        } : null;

        return {
            success: result.success,
            level: result.level,
            quality: result.quality,
            article,
            metadata: {
                extractionTime: result.performance.totalTime,
                wordCount: result.content.metadata.wordCount || 0,
                levelTimes: result.performance.levelTimes
            },
            error: result.error
        };

    } catch (error) {
        return {
            success: false,
            level: ExtractionLevel.READABILITY, // Default error level
            quality: ExtractionQuality.FAILURE,
            article: null,
            metadata: {
                extractionTime: 0,
                wordCount: 0,
                levelTimes: {}
            },
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
