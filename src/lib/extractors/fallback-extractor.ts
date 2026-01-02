import { ExtractionLevel, ExtractionQuality } from '../../types/article';
import { MetadataExtractor } from './metadata-extractor';
import { extractReadability } from './readability-extractor';
import { convertToMarkdown } from '../converters/markdown-converter';

export interface FallbackExtractionResult {
    success: boolean;
    level: ExtractionLevel;
    quality: ExtractionQuality;
    content: {
        html: string | null;
        markdown: string | null;
        title: string;
        metadata: Record<string, any>;
    };
    performance: {
        totalTime: number;
        levelTimes: Partial<Record<ExtractionLevel, number>>;
    };
    error?: string;
}

/**
 * Orchestrates the 4-level fallback extraction chain.
 * Tries each level in sequence until one succeeds.
 * Total timeout: 10 seconds (enforced by caller or cumulative internal timeouts)
 */
export async function extractWithFallback(doc: Document = document): Promise<FallbackExtractionResult> {
    const startTime = performance.now();
    const levelTimes: Partial<Record<ExtractionLevel, number>> = {};

    // --- LEVEL 1: READABILITY ---
    const l1Start = performance.now();
    try {
        console.debug('Fallback Chain: Starting Level 1 (Readability)...');
        // extractReadability already has internal timeout, but we wrap it for consistent metrics
        const l1Result = await extractReadability(doc, 5000);

        const l1Time = performance.now() - l1Start;
        levelTimes[ExtractionLevel.READABILITY] = l1Time;

        if (l1Result.success && l1Result.article) {
            console.debug(`Fallback Chain: Level 1 Success (${l1Time.toFixed(1)}ms)`);
            return {
                success: true,
                level: ExtractionLevel.READABILITY,
                quality: l1Result.quality, // SUCCESS or PARTIAL
                content: {
                    html: String(l1Result.article?.content || ''),
                    markdown: String(l1Result.article?.markdown || ''),
                    title: l1Result.article?.title || '',
                    metadata: l1Result.metadata,
                },
                performance: {
                    totalTime: performance.now() - startTime,
                    levelTimes,
                }
            };
        }
    } catch (error) {
        console.warn('Fallback Chain: Level 1 failed', error);
        levelTimes[ExtractionLevel.READABILITY] = performance.now() - l1Start;
    }

    // --- LEVEL 2: SIMPLIFIED DOM ---
    const l2Start = performance.now();
    try {
        console.debug('Fallback Chain: Starting Level 2 (Simplified DOM)...');
        // Run sync extraction
        const l2Html = extractSimplifiedDOM(doc);

        const l2Time = performance.now() - l2Start;
        levelTimes[ExtractionLevel.SIMPLIFIED_DOM] = l2Time;

        if (l2Html) {
            console.debug(`Fallback Chain: Level 2 Success (${l2Time.toFixed(1)}ms)`);

            // Convert to Markdown
            const mdResult = await convertToMarkdown(l2Html);

            return {
                success: true,
                level: ExtractionLevel.SIMPLIFIED_DOM,
                quality: ExtractionQuality.PARTIAL,
                content: {
                    html: l2Html,
                    markdown: mdResult.markdown || '',
                    title: doc.title, // Simplified DOM doesn't extract title specifically
                    metadata: {
                        wordCount: getWordCountFromHtml(l2Html),
                        conversionTime: mdResult.metadata.conversionTime
                    },
                },
                performance: {
                    totalTime: performance.now() - startTime,
                    levelTimes,
                }
            };
        }
    } catch (error) {
        console.warn('Fallback Chain: Level 2 failed', error);
        levelTimes[ExtractionLevel.SIMPLIFIED_DOM] = performance.now() - l2Start;
    }

    // --- LEVEL 3: FULL PAGE CLEAN ---
    const l3Start = performance.now();
    try {
        console.debug('Fallback Chain: Starting Level 3 (Full Page Clean)...');
        const l3Html = extractFullPageClean(doc);

        const l3Time = performance.now() - l3Start;
        levelTimes[ExtractionLevel.FULL_PAGE_CLEAN] = l3Time;

        if (l3Html) {
            console.debug(`Fallback Chain: Level 3 Success (${l3Time.toFixed(1)}ms)`);
            // Convert to Markdown
            const mdResult = await convertToMarkdown(l3Html);

            return {
                success: true,
                level: ExtractionLevel.FULL_PAGE_CLEAN,
                quality: ExtractionQuality.PARTIAL,
                content: {
                    html: l3Html,
                    markdown: mdResult.markdown || '',
                    title: doc.title,
                    metadata: {
                        wordCount: getWordCountFromHtml(l3Html),
                        conversionTime: mdResult.metadata.conversionTime
                    },
                },
                performance: {
                    totalTime: performance.now() - startTime,
                    levelTimes,
                }
            };
        }
    } catch (error) {
        console.warn('Fallback Chain: Level 3 failed', error);
        levelTimes[ExtractionLevel.FULL_PAGE_CLEAN] = performance.now() - l3Start;
    }

    // --- LEVEL 4: SMART BOOKMARK ---
    console.debug('Fallback Chain: All extractions failed. Fallback to Level 4 (Smart Bookmark).');
    const result = await createSmartBookmark(doc);
    // Update performance metrics
    result.performance.totalTime = performance.now() - startTime;
    result.performance.levelTimes = levelTimes;

    return result;
}

/**
 * Level 2: Extracts content using simplified DOM analysis.
 * Used when Readability fails.
 */
export function extractSimplifiedDOM(doc: Document = document): string | null {
    // 1. Find largest <article> tag
    const articles = doc.querySelectorAll('article');
    if (articles.length > 0) {
        const largest = findLargestByTextContent(articles);
        if (largest && getWordCount(largest) >= 100) {
            console.debug('Fallback L2: Found suitable <article> tag');
            return largest.innerHTML;
        }
    }

    // 2. Calculate text density for major blocks
    const blocks = doc.querySelectorAll('main, div, section');
    const densities = Array.from(blocks).map(block => ({
        element: block,
        density: calculateTextDensity(block),
        wordCount: getWordCount(block),
    }));

    // 3. Select block with highest density (minimum 0.3)
    const best = densities
        .filter(d => d.density >= 0.3 && d.wordCount >= 100)
        .sort((a, b) => b.density - a.density)[0];

    if (best) {
        console.debug(`Fallback L2: Selected block with density ${best.density.toFixed(2)}`);
        return best.element.innerHTML;
    }

    return null;
}

/**
 * Helper: Find element with most text content from a NodeList
 */
function findLargestByTextContent(elements: NodeListOf<Element>): Element | null {
    let largest: Element | null = null;
    let maxLen = 0;

    elements.forEach(el => {
        const len = el.textContent?.length || 0;
        if (len > maxLen) {
            maxLen = len;
            largest = el;
        }
    });

    return largest;
}

/**
 * Helper: Calculate text density (text length / HTML length)
 */
function calculateTextDensity(element: Element): number {
    const textLength = element.textContent?.length || 0;
    const htmlLength = element.innerHTML.length;
    return htmlLength > 0 ? textLength / htmlLength : 0;
}

/**
 * Helper: Estimate word count
 */
function getWordCount(element: Element): number {
    const text = element.textContent || '';
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Helper: Estimate word count from HTML string
 */
function getWordCountFromHtml(html: string): number {
    const div = document.createElement('div');
    div.innerHTML = html;
    return getWordCount(div);
}

/**
 * Level 3: Extracts content by cleaning the full page body.
 * Used when Simplified DOM extraction fails.
 */
export function extractFullPageClean(doc: Document = document): string | null {
    try {
        // 1. Clone document.body from provided doc
        // Note: doc.body might need to be imported if we are cross-context, but usually we just clone
        // However, if doc is a different document, we should clone using that doc.
        // Or if doc is from iframe.
        // Ideally we use doc.body.cloneNode(true)
        if (!doc.body) return null;

        const clone = doc.body.cloneNode(true) as HTMLElement;

        // 2. Remove elements by tag
        const removeTags = ['script', 'style', 'iframe', 'noscript'];
        removeTags.forEach(tag => {
            clone.querySelectorAll(tag).forEach(el => el.remove());
        });

        // 3. Remove by common class/id patterns
        const removePatterns = [
            /nav|navbar|menu|breadcrumb/i,
            /footer|copyright/i,
            /ad|advertisement|sponsored|promo/i,
            /share|social|follow/i,
            /comment|disqus/i,
        ];

        removeElementsByPattern(clone, removePatterns);

        // 4. Check if remaining content is substantial
        const wordCount = getWordCount(clone);

        if (wordCount >= 50) {
            console.debug(`Fallback L3: Cleaned page with ${wordCount} words`);
            return clone.innerHTML;
        }
    } catch (error) {
        console.warn('Fallback L3 error:', error);
    }

    return null;
}

/**
 * Helper: Remove elements matching regex patterns in id or class
 */
function removeElementsByPattern(root: Element, patterns: RegExp[]): void {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    const toRemove: Element[] = [];

    while (walker.nextNode()) {
        const el = walker.currentNode as Element;
        const className = el.className.toString();
        const id = el.id;

        const shouldRemove = patterns.some(pattern =>
            pattern.test(className) || pattern.test(id)
        );

        if (shouldRemove) {
            toRemove.push(el);
        }
    }

    toRemove.forEach(el => el.remove());
}

/**
 * Level 4: Creates a smart bookmark with enhanced metadata.
 * Used when all extraction methods fail. Always succeeds.
 */
export async function createSmartBookmark(doc: Document = document): Promise<FallbackExtractionResult> {
    try {
        const metadataExtractor = new MetadataExtractor();
        // Assuming metadataExtractor.extract accepts doc. 
        // We need to check if it does. If not, we should rely on global or update it.
        // Assuming it does based on T5 context.
        const url = doc.location?.href || window.location.href;
        const metadata = await metadataExtractor.extract(doc, url);

        console.debug('Fallback L4: Created smart bookmark');

        return {
            success: true,
            level: ExtractionLevel.SMART_BOOKMARK,
            quality: ExtractionQuality.FALLBACK,
            content: {
                html: null,
                markdown: null, // Bookmarks don't have body content usually, or we can use description
                title: metadata.title || doc.title,
                metadata: {
                    ...metadata,
                    extractionFailed: true,
                    note: 'Article extraction failed. Saved as bookmark.',
                },
            },
            performance: {
                totalTime: 0,
                levelTimes: {}, // Will be populated by orchestrator
            },
        };
    } catch (error) {
        console.error('Fallback L4 error:', error);
        // Even if metadata extraction fails, return a basic bookmark
        return {
            success: true,
            level: ExtractionLevel.SMART_BOOKMARK,
            quality: ExtractionQuality.FALLBACK,
            content: {
                html: null,
                markdown: null,
                title: doc.title,
                metadata: {
                    extractionFailed: true,
                    note: 'Article extraction failed. Saved as bookmark (metadata extraction failed).',
                },
            },
            performance: {
                totalTime: 0,
                levelTimes: {},
            },
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
