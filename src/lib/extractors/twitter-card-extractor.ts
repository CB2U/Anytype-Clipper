import { TwitterCardMetadata } from '../../types/metadata';
import { normalizeUrl } from '../utils/url-normalizer';
import { decodeHtml } from '../utils/html-decoder';

/**
 * Extractor for Twitter Card metadata tags.
 */
export class TwitterCardExtractor {
    /**
     * Extracts Twitter Card metadata from a document.
     * 
     * @param document - The HTML document to parse
     * @param baseUrl - The base URL of the page
     * @returns Extracted Twitter Card metadata
     */
    public extract(document: Document, baseUrl: string): TwitterCardMetadata {
        return {
            card: this.getMetaName(document, 'twitter:card'),
            site: this.getMetaName(document, 'twitter:site'),
            creator: this.getMetaName(document, 'twitter:creator'),
            title: this.getMetaName(document, 'twitter:title'),
            description: this.getMetaName(document, 'twitter:description'),
            image: normalizeUrl(this.getMetaName(document, 'twitter:image'), baseUrl) || undefined,
        };
    }

    /**
     * Gets the content of a meta tag with a specific name or property attribute.
     * 
     * @param document - The HTML document
     * @param name - The name attribute value (e.g., 'twitter:title')
     * @returns The content attribute value, decoded and trimmed, or null if not found
     */
    private getMetaName(document: Document, name: string): string | undefined {
        // Twitter cards sometimes use property attribute instead of name
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        const content = meta?.getAttribute('content');
        return content ? decodeHtml(content.trim()) : undefined;
    }
}
