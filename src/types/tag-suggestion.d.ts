/**
 * Type definitions for tag suggestion system
 */

export interface TagSuggestion {
    tag: string;
    source: 'domain' | 'meta' | 'content';
}

export interface SuggestTagsResult {
    suggestions: string[];
    sources: Record<string, 'domain' | 'meta' | 'content'>;
}
