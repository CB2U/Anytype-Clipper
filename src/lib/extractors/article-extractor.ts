import { ArticleExtractionResult, ExtractionQuality, ExtractionLevel, ExtractedArticle } from '../../types/article';
import { extractWithFallback } from './fallback-extractor';
import { StorageManager } from '../storage/storage-manager';
import { ImageHandler } from './image-handler';
import { PageMetadata } from '../../types/metadata';



export interface ExtractionOptions {
    includeJSONForDataTables?: boolean;
}

/**
 * Extract article content from the current document using the Fallback Chain (Epic 4.2).
 * 
 * @param doc - Optional document to extract from (defaults to window.document)
 * @param options - Extraction options
 * @returns Promise resolving to extraction result
 */
export async function extractArticle(
    doc: Document = document,
    options: ExtractionOptions = {}
): Promise<ArticleExtractionResult> {
    try {
        // extractWithFallback handles its own timeouts internally for each level
        const result = await extractWithFallback(doc, options);

        let markdown = result.content.markdown || '';
        let html = result.content.html || '';

        let images: import('../../types/image').ProcessedImage[] = [];

        // Epic 4.3: Process images if extraction was successful and we have content
        if (result.success && (html || markdown)) {
            try {
                const settings = await StorageManager.getInstance().getImageHandlingSettings();

                // Use metadata if available, or empty object casted (ImageHandler is robust)
                const metadata = (result.content.metadata || {}) as PageMetadata;

                images = await ImageHandler.processImages(html, metadata, settings);

                // Replace images in Markdown
                // Note: unique images. originalUrl -> dataUrl
                for (const img of images) {
                    if (img.embedType === 'base64' && img.dataUrl) {
                        // Global replace of the URL
                        // using split/join is safer than regex for URLs with special chars
                        markdown = markdown.split(img.originalUrl).join(img.dataUrl);

                        // We could also update HTML if needed, but we primarily use Markdown
                        // html = html.split(img.originalUrl).join(img.dataUrl); 
                    }
                }
            } catch (imageError) {
                console.warn('Image processing failed, continuing with original images:', imageError);
                // Continue with original markdown
            }
        }

        // Map FallbackExtractionResult to ArticleExtractionResult
        const article: ExtractedArticle | null = result.success ? {
            title: result.content.title,
            content: html,
            textContent: '', // Fallback result might not compute exact text content
            length: html.length,
            excerpt: result.content.metadata.description || '',
            byline: result.content.metadata.author || '',
            dir: doc.dir,
            siteName: result.content.metadata.siteName || '',
            lang: result.content.metadata.language || '',
            publishedTime: result.content.metadata.publishedDate || '',
            markdown: markdown,
        } : null;

        return {
            success: result.success,
            level: result.level,
            quality: result.quality,
            article,
            metadata: {
                extractionTime: result.performance.totalTime,
                wordCount: result.content.metadata.wordCount || 0,
                levelTimes: result.performance.levelTimes,
                imageCount: images ? images.length : 0,
                embeddedImageCount: images ? images.filter(img => img.embedType === 'base64').length : 0
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
