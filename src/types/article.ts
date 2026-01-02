import { ParseResult } from '@mozilla/readability';

/**
 * Result of an article extraction attempt
 */
export interface ArticleExtractionResult {
    /** Whether the extraction was successful (even if partial) */
    success: boolean;

    /** Quality assessment of the extraction */
    quality: ExtractionQuality;

    /** The extracted article content, or null if failed */
    article: ReadabilityArticle | null;

    /** Performance and stats metadata */
    metadata: {
        /** Time taken to extract in milliseconds */
        extractionTime: number;
        /** Word count of the extracted text */
        wordCount: number;
    };

    /** Error message if extraction failed */
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
 * Extended article type based on Readability's output
 */
export type ReadabilityArticle = ParseResult;
