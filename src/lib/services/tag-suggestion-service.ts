/**
 * Tag Suggestion Service
 * 
 * Generates tag suggestions from multiple sources:
 * - Domain-based tags (github.com → #development)
 * - Meta keywords from page
 * - Content keywords from article text
 */

import { getDomainTags } from '../utils/domain-tag-mappings';
import type { PageMetadata } from '../../types/metadata';
import type { TagSuggestion, SuggestTagsResult } from '../../types/tag-suggestion';

/**
 * Common English stop words to filter out from keyword extraction
 */
const STOP_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'having',
    'may', 'should', 'am', 'being', 'might', 'must', 'shall', 'can', 'could', 'ought'
]);

export class TagSuggestionService {
    /**
     * Generate tag suggestions from multiple sources
     * 
     * @param metadata - Page metadata containing title, content, keywords
     * @param url - Page URL for domain matching
     * @returns Suggested tags (max 5, prioritized)
     */
    async suggestTags(metadata: PageMetadata, url: string): Promise<SuggestTagsResult> {
        const startTime = Date.now();
        const suggestions: TagSuggestion[] = [];

        try {
            // 1. Get domain-based tags (highest priority)
            const domainTags = this.getDomainTags(url);
            domainTags.forEach(tag => {
                suggestions.push({ tag, source: 'domain' });
            });

            // 2. Extract meta keywords (medium priority)
            const metaKeywords = this.extractMetaKeywords(metadata);
            metaKeywords.forEach(tag => {
                suggestions.push({ tag, source: 'meta' });
            });

            // 3. Extract content keywords (lowest priority)
            const contentKeywords = await this.extractContentKeywords(metadata);
            contentKeywords.forEach(tag => {
                suggestions.push({ tag, source: 'content' });
            });

            // 4. Deduplicate and limit to top 5
            const result = this.deduplicateAndLimit(suggestions);

            const duration = Date.now() - startTime;
            console.log(`[TagSuggestion] Generated ${result.suggestions.length} suggestions in ${duration}ms`);
            console.log('[TagSuggestion] Suggestions:', result.suggestions);
            console.log('[TagSuggestion] Sources:', result.sources);

            return result;
        } catch (error) {
            console.error('[TagSuggestion] Error generating suggestions:', error);
            return {
                suggestions: [],
                sources: {}
            };
        }
    }

    /**
     * Get domain-based tag suggestions
     */
    getDomainTags(url: string): string[] {
        return getDomainTags(url);
    }

    /**
     * Extract keywords from meta tags
     */
    extractMetaKeywords(metadata: PageMetadata): string[] {
        if (!metadata.keywords || metadata.keywords.length === 0) {
            return [];
        }

        // metadata.keywords is already an array of strings
        const keywords = metadata.keywords
            .map((k: string) => k.trim().toLowerCase())
            .filter((k: string) => k.length > 0 && k.length <= 30) // Filter out empty and too-long keywords
            .filter((k: string) => !STOP_WORDS.has(k)); // Filter stop words

        console.log('[TagSuggestion] Meta keywords:', keywords);
        return keywords;
    }

    /**
     * Extract keywords from article content using frequency analysis
     */
    async extractContentKeywords(metadata: PageMetadata): Promise<string[]> {
        const startTime = Date.now();

        try {
            // Combine title and content for analysis
            const title = metadata.title || '';
            const content = metadata.textContent || metadata.content || '';

            if (!title && !content) {
                return [];
            }

            // Extract words from text
            const text = `${title} ${title} ${title} ${content}`; // Triple-weight title
            const words = text
                .toLowerCase()
                .replace(/[^\w\s]/g, ' ') // Remove punctuation
                .split(/\s+/)
                .filter(word => word.length > 3) // Min 4 characters
                .filter(word => word.length <= 20) // Max 20 characters
                .filter(word => !STOP_WORDS.has(word)) // Filter stop words
                .filter(word => !/^\d+$/.test(word)); // Filter pure numbers

            // Count word frequency
            const frequency: Record<string, number> = {};
            words.forEach(word => {
                frequency[word] = (frequency[word] || 0) + 1;
            });

            // Sort by frequency and get top 5
            const sortedWords = Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([word]) => word);

            const duration = Date.now() - startTime;
            console.log(`[TagSuggestion] Extracted ${sortedWords.length} content keywords in ${duration}ms`);
            console.log('[TagSuggestion] Content keywords:', sortedWords);

            return sortedWords;
        } catch (error) {
            console.error('[TagSuggestion] Error extracting content keywords:', error);
            return [];
        }
    }

    /**
     * Deduplicate suggestions and limit to top 5
     * Priority: domain > meta > content
     */
    private deduplicateAndLimit(suggestions: TagSuggestion[]): SuggestTagsResult {
        const seen = new Set<string>();
        const result: string[] = [];
        const sources: Record<string, 'domain' | 'meta' | 'content'> = {};

        // Process in priority order (domain, meta, content)
        const priorityOrder: Array<'domain' | 'meta' | 'content'> = ['domain', 'meta', 'content'];

        for (const source of priorityOrder) {
            for (const suggestion of suggestions) {
                if (suggestion.source !== source) continue;
                if (result.length >= 5) break;

                const normalizedTag = suggestion.tag.toLowerCase().trim();
                if (!seen.has(normalizedTag) && normalizedTag.length > 0) {
                    seen.add(normalizedTag);
                    result.push(normalizedTag);
                    sources[normalizedTag] = suggestion.source;
                }
            }
            if (result.length >= 5) break;
        }

        return { suggestions: result, sources };
    }
}
