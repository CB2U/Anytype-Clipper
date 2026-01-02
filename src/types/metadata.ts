/**
 * Metadata extraction types for Anytype Clipper.
 */

/**
 * Common metadata extracted from a web page.
 */
export interface PageMetadata {
    /** Page title (og:title, twitter:title, or <title>) */
    title: string;
    /** Page description (og:description, twitter:description, or meta description) */
    description?: string;
    /** Content author (article:author, meta author, or Schema.org) */
    author?: string;
    /** Publication date in ISO 8601 format */
    publishedDate?: string;
    /** Modified date in ISO 8601 format */
    modifiedDate?: string;
    /** Featured image URL (og:image, twitter:image, or Schema.org) */
    image?: string;
    /** Best available favicon URL */
    favicon?: string;
    /** Content language (ISO 639-1 code) */
    language?: string;
    /** Current URL of the page */
    url: string;
    /** Canonical URL of the page */
    canonicalUrl?: string;
    /** Site name (og:site_name or domain) */
    siteName?: string;
    /** Estimated reading time in minutes */
    readingTime?: number;
    /** Article section/category */
    section?: string;
    /** Extracted keywords or tags */
    keywords?: string[];
    /** Full article HTML content (extracted by Readability) */
    content?: string;
    /** Plain text article content */
    textContent?: string;
    /** Timestamp of extraction in ISO 8601 format */
    extractedAt: string;
    /** Source of the extraction for debugging */
    source: 'opengraph' | 'twitter' | 'schema.org' | 'standard' | 'fallback';
    /** Extraction level (1-4) */
    extractionLevel?: number;
    /** Extraction quality */
    extractionQuality?: string;
    /** Extraction time in milliseconds */
    extractionTime?: number;
    /** Whether extraction failed */
    extractionFailed?: boolean;
    /** Additional note (e.g. failure reason) */
    note?: string;
}

/**
 * Open Graph metadata tags.
 */
export interface OpenGraphMetadata {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    site_name?: string;
    type?: string;
    author?: string;
    published_time?: string;
    modified_time?: string;
    section?: string;
    tag?: string[];
}

/**
 * Twitter Card metadata tags.
 */
export interface TwitterCardMetadata {
    card?: string;
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
}

/**
 * Schema.org Article metadata.
 */
export interface SchemaOrgMetadata {
    headline?: string;
    description?: string;
    author?: string;
    datePublished?: string;
    dateModified?: string;
    image?: string;
    publisher?: string;
    section?: string;
}

/**
 * Standard meta tags (fallback).
 */
export interface StandardMetadata {
    title?: string;
    description?: string;
    author?: string;
    keywords?: string[];
}
