import { Readability } from '@mozilla/readability';
import { ArticleExtractionResult, ExtractionQuality } from '../../types/article';

/**
 * Extract article content from the current document using Mozilla Readability
 * 
 * @param doc - Optional document to extract from (defaults to window.document)
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to extraction result
 */
export async function extractArticle(
    doc: Document = document,
    timeoutMs: number = 5000
): Promise<ArticleExtractionResult> {
    const startTime = performance.now();

    try {
        // Clone document to avoid modifying the live page
        // We only need the body and head for Readability
        const clone = doc.cloneNode(true) as Document;

        // Create timeout promise
        let timeoutId: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Extraction timed out')), timeoutMs);
        });

        // Create extraction promise
        const extractionPromise = new Promise<ArticleExtractionResult>((resolve) => {
            try {
                const reader = new Readability(clone);
                const article = reader.parse();
                const endTime = performance.now();
                const extractionTime = endTime - startTime;

                if (!article) {
                    resolve({
                        success: false,
                        quality: ExtractionQuality.FAILURE,
                        article: null,
                        metadata: {
                            extractionTime,
                            wordCount: 0
                        },
                        error: 'Readability returned null (no article found)'
                    });
                    return;
                }

                // Determine quality (simplified logic for now)
                const textContent = article.textContent || '';
                const quality = textContent.length > 200
                    ? ExtractionQuality.SUCCESS
                    : ExtractionQuality.PARTIAL;

                // Estimate word count from plain text
                const wordCount = textContent.split(/\s+/).filter((w: string) => w.length > 0).length;

                resolve({
                    success: true,
                    quality,
                    article,
                    metadata: {
                        extractionTime,
                        wordCount
                    }
                });
            } catch (error) {
                const endTime = performance.now();
                resolve({
                    success: false,
                    quality: ExtractionQuality.FAILURE,
                    article: null,
                    metadata: {
                        extractionTime: endTime - startTime,
                        wordCount: 0
                    },
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        // Race between extraction and timeout
        const result = await Promise.race([extractionPromise, timeoutPromise]);

        // Clear timeout if extraction finished first
        if (timeoutId!) clearTimeout(timeoutId);

        return result;

    } catch (error) {
        // This catches the timeout error or cloning errors
        const endTime = performance.now();
        return {
            success: false,
            quality: ExtractionQuality.FAILURE,
            article: null,
            metadata: {
                extractionTime: endTime - startTime,
                wordCount: 0
            },
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
