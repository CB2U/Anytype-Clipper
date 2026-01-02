import { OpenGraphMetadata } from '../../types/metadata';
import { normalizeUrl } from '../utils/url-normalizer';
import { parseDate } from '../utils/date-parser';
import { decodeHtml } from '../utils/html-decoder';

/**
 * Extractor for Open Graph metadata tags.
 */
export class OpenGraphExtractor {
    /**
     * Extracts Open Graph metadata from a document.
     * 
     * @param document - The HTML document to parse
     * @param baseUrl - The base URL of the page for normalizing relative URLs
     * @returns Extracted Open Graph metadata
     */
    public extract(document: Document, baseUrl: string): OpenGraphMetadata {
        return {
            title: this.getMetaProperty(document, 'og:title'),
            description: this.getMetaProperty(document, 'og:description'),
            image: normalizeUrl(this.getMetaProperty(document, 'og:image'), baseUrl) || undefined,
            url: normalizeUrl(this.getMetaProperty(document, 'og:url'), baseUrl) || undefined,
            site_name: this.getMetaProperty(document, 'og:site_name'),
            type: this.getMetaProperty(document, 'og:type'),
            author: this.getMetaProperty(document, 'article:author') || this.getMetaProperty(document, 'og:author'),
            published_time: parseDate(this.getMetaProperty(document, 'article:published_time')) || undefined,
            modified_time: parseDate(this.getMetaProperty(document, 'article:modified_time')) || undefined,
            section: this.getMetaProperty(document, 'article:section'),
            tag: this.getMetaProperties(document, 'article:tag'),
        };
    }

    /**
     * Gets the content of a meta tag with a specific property attribute.
     * 
     * @param document - The HTML document
     * @param property - The property name (e.g., 'og:title')
     * @returns The content attribute value, decoded and trimmed, or null if not found
     */
    private getMetaProperty(document: Document, property: string): string | undefined {
        const meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
        const content = meta?.getAttribute('content');
        return content ? decodeHtml(content.trim()) : undefined;
    }

    /**
     * Gets the content of all meta tags with a specific property attribute.
     * 
     * @param document - The HTML document
     * @param property - The property name
     * @returns Array of content attribute values
     */
    private getMetaProperties(document: Document, property: string): string[] {
        const metas = document.querySelectorAll(`meta[property="${property}"], meta[name="${property}"]`);
        return Array.from(metas)
            .map(meta => meta.getAttribute('content'))
            .filter((content): content is string => !!content)
            .map(content => decodeHtml(content.trim()));
    }
}
