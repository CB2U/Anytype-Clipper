import { SchemaOrgMetadata } from '../../types/metadata';
import { normalizeUrl } from '../utils/url-normalizer';
import { parseDate } from '../utils/date-parser';
import { decodeHtml } from '../utils/html-decoder';

/**
 * Extractor for Schema.org JSON-LD metadata.
 */
export class SchemaOrgExtractor {
    /**
     * Extracts Schema.org metadata from a document.
     * 
     * @param document - The HTML document to parse
     * @param baseUrl - The base URL of the page
     * @returns Extracted Schema.org metadata
     */
    public extract(document: Document, baseUrl: string): SchemaOrgMetadata {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        let articleData: SchemaOrgMetadata = {};

        for (const script of Array.from(scripts)) {
            try {
                const json = JSON.parse(script.textContent || '');
                const data = this.findArticleData(json, baseUrl);
                if (data) {
                    // Merge data, preferring the more complete one
                    articleData = { ...articleData, ...data };
                }
            } catch (e) {
                // Ignore malformed JSON-LD
            }
        }

        return articleData;
    }

    /**
     * Recursively searches for Article-like data in a JSON-LD object.
     * 
     * @param json - The JSON-LD object (could be an array or nested object)
     * @param baseUrl - The base URL
     * @returns Extracted metadata or null if not found
     */
    private findArticleData(json: any, baseUrl: string): SchemaOrgMetadata | null {
        if (!json) return null;

        // If it's an array, look through its elements
        if (Array.isArray(json)) {
            let bestResult: SchemaOrgMetadata | null = null;
            let bestPriority = -1;

            for (const item of json) {
                const result = this.findArticleData(item, baseUrl);
                if (result) {
                    // Simple priority: NewsArticle/BlogPosting > Article > WebPage
                    const type = item['@type'];
                    const types = Array.isArray(type) ? type : [type];
                    let priority = 0;
                    if (types.some((t: string) => t === 'NewsArticle' || t === 'BlogPosting')) priority = 3;
                    else if (types.some((t: string) => t === 'Article')) priority = 2;
                    else if (types.some((t: string) => t === 'WebPage')) priority = 1;

                    if (priority > bestPriority) {
                        bestResult = result;
                        bestPriority = priority;
                    }
                }
            }
            return bestResult;
        }

        // Check if this object is an Article, NewsArticle, or BlogPosting
        const type = json['@type'];
        const types = Array.isArray(type) ? type : [type];
        const isArticle = types.some((t: string) => t === 'Article' || t === 'NewsArticle' || t === 'BlogPosting' || t === 'WebPage');

        if (isArticle) {
            return this.mapSchemaToMetadata(json, baseUrl);
        }

        // If it's a Graph, search its elements
        if (json['@graph'] && Array.isArray(json['@graph'])) {
            return this.findArticleData(json['@graph'], baseUrl);
        }

        return null;
    }

    /**
     * Maps a Schema.org object to our internal metadata structure.
     */
    private mapSchemaToMetadata(json: any, baseUrl: string): SchemaOrgMetadata {
        return {
            headline: this.getString(json.headline || json.name),
            description: this.getString(json.description),
            author: this.getAuthor(json.author),
            datePublished: parseDate(this.getString(json.datePublished)) || undefined,
            dateModified: parseDate(this.getString(json.dateModified)) || undefined,
            image: this.getImage(json.image, baseUrl),
            publisher: this.getPublisher(json.publisher),
            section: this.getString(json.articleSection),
        };
    }

    private getString(val: any): string | undefined {
        if (typeof val === 'string') return decodeHtml(val.trim());
        if (Array.isArray(val) && val.length > 0) return this.getString(val[0]);
        return undefined;
    }

    private getAuthor(author: any): string | undefined {
        if (!author) return undefined;
        if (typeof author === 'string') return decodeHtml(author.trim());
        if (Array.isArray(author)) return author.map(a => this.getAuthor(a)).filter(Boolean).join(', ');
        if (author.name) return this.getString(author.name);
        return undefined;
    }

    private getImage(image: any, baseUrl: string): string | undefined {
        if (!image) return undefined;
        let imageUrl: string | undefined;

        if (typeof image === 'string') {
            imageUrl = image;
        } else if (Array.isArray(image) && image.length > 0) {
            imageUrl = typeof image[0] === 'string' ? image[0] : image[0].url;
        } else if (image.url) {
            imageUrl = image.url;
        }

        return normalizeUrl(imageUrl, baseUrl) || undefined;
    }

    private getPublisher(publisher: any): string | undefined {
        if (!publisher) return undefined;
        if (typeof publisher === 'string') return decodeHtml(publisher.trim());
        if (publisher.name) return this.getString(publisher.name);
        return undefined;
    }
}
