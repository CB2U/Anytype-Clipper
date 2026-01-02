import { Readability } from '@mozilla/readability';

/**
 * Extraction level in the fallback chain
 */
export enum ExtractionLevel {
    READABILITY = 1,
    SIMPLIFIED_DOM = 2,
    FULL_PAGE_CLEAN = 3,
    SMART_BOOKMARK = 4,
}

/**
 * Result of an article extraction attempt
 */
export interface ArticleExtractionResult {
    /** Whether the extraction was successful (even if partial/fallback) */
    success: boolean;

    /** Level of extraction used */
    level: ExtractionLevel;

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
        /** Time taken for each extraction level */
        levelTimes: Partial<Record<ExtractionLevel, number>>;
        /** Total number of images processed */
        imageCount?: number;
        /** Number of images embedded as Data URLs */
        embeddedImageCount?: number;
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
    /** Fallback to smart bookmark when extraction fails */
    FALLBACK = 'fallback',
    /** Extraction failed completely (unexpected error) */
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
