import { Readability, isProbablyReaderable } from '@mozilla/readability';

export interface ExtractedArticle {
    title: string;
    content: string;
    textContent: string;
    length: number;
    excerpt: string;
    byline: string;
    dir: string;
    siteName: string;
    lang: string;
    publishedTime: string | null;
}

/**
 * Service for extracting readable article content from a DOM.
 * Uses @mozilla/readability for robust extraction.
 */
export class ArticleExtractor {
    /**
     * Extracts article content from a document.
     * 
     * @param document - The HTML document to extract from
     * @returns Extracted article data or null if extraction fails
     */
    public extract(document: Document): ExtractedArticle | null {
        try {
            // Clone the document to avoid modifying the original
            const docClone = document.cloneNode(true) as Document;

            const reader = new Readability(docClone, {
                charThreshold: 500, // Minimum number of characters to be considered an article
            });

            const article = reader.parse();

            if (!article) {
                return null;
            }

            return {
                title: article.title || '',
                content: article.content || '',
                textContent: article.textContent || '',
                length: article.length || 0,
                excerpt: article.excerpt || '',
                byline: article.byline || '',
                dir: article.dir || '',
                siteName: article.siteName || '',
                lang: article.lang || '',
                publishedTime: article.publishedTime || null,
            };
        } catch (error) {
            console.error('[ArticleExtractor] Extraction failed:', error);
            return null;
        }
    }

    /**
     * Heuristic to check if a document likely contains an article.
     * 
     * @param document - The HTML document to check
     * @returns True if it looks like an article
     */
    public isProbablyArticle(document: Document): boolean {
        return isProbablyReaderable(document);
    }
}
