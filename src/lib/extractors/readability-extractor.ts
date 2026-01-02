import { Readability } from '@mozilla/readability';
import { ArticleExtractionResult, ExtractionQuality, ExtractionLevel } from '../../types/article';
import { convertToMarkdown } from '../converters/markdown-converter';

/**
 * Extract article content from the current document using Mozilla Readability
 * 
 * @param doc - Optional document to extract from (defaults to window.document)
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to extraction result
 */
export async function extractReadability(
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
                        level: ExtractionLevel.READABILITY,
                        quality: ExtractionQuality.FAILURE,
                        article: null,
                        metadata: {
                            extractionTime,
                            wordCount: 0,
                            levelTimes: { [ExtractionLevel.READABILITY]: extractionTime }
                        },
                        error: 'Readability returned null (no article found)'
                    });
                    return;
                }

                const textContent = article.textContent || '';
                const articleContent = article.content || '';

                // Convert to Markdown
                convertToMarkdown(articleContent, 2000).then(conversionResult => {
                    // Determine quality
                    const quality = textContent.length > 200
                        ? ExtractionQuality.SUCCESS
                        : ExtractionQuality.PARTIAL;

                    // Estimate word count
                    const wordCount = textContent.split(/\s+/).filter((w: string) => w.length > 0).length;

                    // Use Markdown if successful, otherwise fallback to text
                    const markdown = conversionResult.success && conversionResult.markdown
                        ? conversionResult.markdown
                        : textContent;

                    resolve({
                        success: true,
                        level: ExtractionLevel.READABILITY,
                        quality,
                        article: {
                            ...article,
                            markdown
                        },
                        metadata: {
                            extractionTime,
                            conversionTime: conversionResult.metadata.conversionTime,
                            wordCount,
                            levelTimes: { [ExtractionLevel.READABILITY]: extractionTime }
                        }
                    });
                }).catch(err => {
                    // Fallback if something goes wrong in the promise chain
                    resolve({
                        success: false,
                        level: ExtractionLevel.READABILITY,
                        quality: ExtractionQuality.FAILURE,
                        article: null,
                        metadata: {
                            extractionTime: 0,
                            wordCount: 0,
                            levelTimes: { [ExtractionLevel.READABILITY]: 0 }
                        },
                        error: 'Markdown conversion error: ' + String(err)
                    });
                });

            } catch (error) {
                const endTime = performance.now();
                resolve({
                    success: false,
                    level: ExtractionLevel.READABILITY,
                    quality: ExtractionQuality.FAILURE,
                    article: null,
                    metadata: {
                        extractionTime: endTime - startTime,
                        wordCount: 0,
                        levelTimes: { [ExtractionLevel.READABILITY]: endTime - startTime }
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
            level: ExtractionLevel.READABILITY,
            quality: ExtractionQuality.FAILURE,
            article: null,
            metadata: {
                extractionTime: endTime - startTime,
                wordCount: 0,
                levelTimes: { [ExtractionLevel.READABILITY]: endTime - startTime }
            },
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
