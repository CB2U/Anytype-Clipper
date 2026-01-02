import { PageMetadata } from '../../types/metadata';
import { OpenGraphExtractor } from './opengraph-extractor';
import { TwitterCardExtractor } from './twitter-card-extractor';
import { SchemaOrgExtractor } from './schema-org-extractor';
import { ReadingTimeCalculator } from './reading-time-calculator';
import { LanguageDetector } from './language-detector';
import { FaviconExtractor } from './favicon-extractor';
import { decodeHtml } from '../utils/html-decoder';

/**
 * Main orchestrator for metadata extraction.
 * Implements a fallback chain: Open Graph -> Twitter Card -> Schema.org -> Standard Meta Tags.
 */
export class MetadataExtractor {
    private ogExtractor = new OpenGraphExtractor();
    private twitterExtractor = new TwitterCardExtractor();
    private schemaExtractor = new SchemaOrgExtractor();
    private readingTimeCalculator = new ReadingTimeCalculator();
    private languageDetector = new LanguageDetector();
    private faviconExtractor = new FaviconExtractor();

    /**
     * Extracts all metadata from a document.
     * 
     * @param document - The HTML document to analyze
     * @param url - The URL of the page
     * @param content - Optional article content for reading time calculation
     * @returns Complete page metadata
     */
    public async extract(document: Document, url: string, content?: string): Promise<PageMetadata> {
        const baseUrl = this.getCanonicalUrl(document) || url;

        const og = this.ogExtractor.extract(document, baseUrl);
        const twitter = this.twitterExtractor.extract(document, baseUrl);
        const schema = this.schemaExtractor.extract(document, baseUrl);
        const standard = this.extractStandardMeta(document);

        // Determine the primary source for source tracking
        let source: 'opengraph' | 'twitter' | 'schema.org' | 'standard' | 'fallback' = 'fallback';
        if (og.title) source = 'opengraph';
        else if (twitter.title) source = 'twitter';
        else if (schema.headline) source = 'schema.org';
        else if (standard.title) source = 'standard';

        const metadata: PageMetadata = {
            title: og.title || twitter.title || schema.headline || standard.title || document.title || 'Untitled',
            description: og.description || twitter.description || schema.description || standard.description,
            image: og.image || twitter.image || schema.image || standard.image,
            author: og.author || twitter.creator || schema.author || standard.author,
            publishedDate: og.published_time || schema.datePublished || standard.publishedDate,
            modifiedDate: og.modified_time || schema.dateModified,
            siteName: og.site_name || twitter.site || schema.publisher || standard.siteName,
            canonicalUrl: og.url || baseUrl,
            url,
            language: this.languageDetector.detect(document),
            favicon: this.faviconExtractor.extract(document, baseUrl) || undefined,
            readingTime: content ? this.readingTimeCalculator.calculate(content) : undefined,
            extractedAt: new Date().toISOString(),
            source
        };

        return metadata;
    }

    /**
     * Extracts standard meta tags as a final fallback.
     */
    private extractStandardMeta(document: Document): any {
        const getMeta = (names: string[]) => {
            for (const name of names) {
                const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                const content = meta?.getAttribute('content');
                if (content) return decodeHtml(content.trim());
            }
            return undefined;
        };

        return {
            title: getMeta(['title']),
            description: getMeta(['description']),
            author: getMeta(['author', 'creator', 'publisher']),
            publishedDate: getMeta(['date', 'pubdate', 'publish-date', 'dc.date']),
            siteName: getMeta(['application-name', 'og:site_name']),
            image: getMeta(['thumbnail', 'image']),
        };
    }

    /**
     * Gets the canonical URL of the page.
     */
    private getCanonicalUrl(document: Document): string | null {
        const link = document.querySelector('link[rel="canonical"]');
        return link?.getAttribute('href') || null;
    }
}
