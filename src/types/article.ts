import { Readability } from '@mozilla/readability';

/**
 * Result of an article extraction attempt
 */
export interface ArticleExtractionResult {
    /** Whether the extraction was successful (even if partial) */
    success: boolean;

    /** Quality assessment of the extraction */
    quality: ExtractionQuality;

    /** The extracted article content, or null if failed */
    article: ExtractedArticle | null;

    /** Performance and stats metadata */
    metadata: {
        /** Time taken to extract in milliseconds */
        extractionTime: number;
        /** Time taken to convert to Markdown in milliseconds */
        conversionTime?: number;
        /** Word count of the extracted text */
        wordCount: number;
    };

    /** Error message if extraction failed */
    error?: string;
}

/**
 * Result of HTML to Markdown conversion
 */
export interface MarkdownConversionResult {
    /** Whether the conversion was successful */
    success: boolean;
    /** The converted Markdown content, or null if failed */
    markdown: string | null;
    /** Performance and stats metadata */
    metadata: {
        /** Time taken to convert in milliseconds */
        conversionTime: number;
        /** Character count of the Markdown text */
        characterCount: number;
    };
    /** Error message if conversion failed */
    error?: string;
}

/**
 * Quality level of the extraction
 */
export enum ExtractionQuality {
    /** High quality extraction with clean content */
    SUCCESS = 'success',
    /** Content extracted but may have issues or be incomplete */
    PARTIAL = 'partial',
    /** Extraction failed completely */
    FAILURE = 'failure',
}

/**
 * Base Readability article type derived from the library's return type
 */
export type ReadabilityArticle = NonNullable<ReturnType<InstanceType<typeof Readability>['parse']>>;

/**
 * Extended article type with Clipper specific fields
 */
export interface ExtractedArticle extends ReadabilityArticle {
    /** Converted Markdown content */
    markdown: string;
}
