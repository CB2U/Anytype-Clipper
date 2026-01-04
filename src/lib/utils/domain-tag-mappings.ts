/**
 * Domain → Tag Mappings for Smart Tagging
 * 
 * Maps website domains to relevant tags that should be suggested
 * when capturing content from those domains.
 */

export interface DomainTagMapping {
    [domain: string]: string[];
}

/**
 * Hardcoded domain → tag mappings
 * Tags are lowercase and without # prefix
 */
export const DOMAIN_TAG_MAPPINGS: DomainTagMapping = {
    // Development & Code
    'github.com': ['development', 'opensource'],
    'gitlab.com': ['development', 'opensource'],
    'stackoverflow.com': ['development', 'programming'],
    'stackexchange.com': ['development', 'programming'],

    // Content & Reading
    'medium.com': ['article', 'reading'],
    'substack.com': ['article', 'newsletter'],
    'dev.to': ['development', 'article'],

    // Video & Media
    'youtube.com': ['video'],
    'vimeo.com': ['video'],

    // Research & Academic
    'arxiv.org': ['research', 'academic'],
    'scholar.google.com': ['research', 'academic'],

    // News & Information
    'news.ycombinator.com': ['news', 'technology'],
    'reddit.com': ['discussion', 'community'],
    'twitter.com': ['social', 'discussion'],
    'x.com': ['social', 'discussion'],
};

/**
 * Get tag suggestions for a given URL
 * Supports subdomain matching (e.g., blog.github.com matches github.com)
 * 
 * @param url - The URL to match
 * @returns Array of suggested tags (lowercase, without # prefix)
 */
export function getDomainTags(url: string): string[] {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        // Try exact match first
        if (DOMAIN_TAG_MAPPINGS[hostname]) {
            return [...DOMAIN_TAG_MAPPINGS[hostname]];
        }

        // Try subdomain matching (e.g., blog.github.com → github.com)
        const parts = hostname.split('.');
        if (parts.length > 2) {
            // Try removing first subdomain
            const baseDomain = parts.slice(-2).join('.');
            if (DOMAIN_TAG_MAPPINGS[baseDomain]) {
                return [...DOMAIN_TAG_MAPPINGS[baseDomain]];
            }
        }

        return [];
    } catch (error) {
        console.error('[DomainTagMappings] Error parsing URL:', error);
        return [];
    }
}

/**
 * Get all supported domains
 * @returns Array of domain names
 */
export function getSupportedDomains(): string[] {
    return Object.keys(DOMAIN_TAG_MAPPINGS);
}

/**
 * Check if a domain is supported
 * @param url - The URL to check
 * @returns True if domain has tag mappings
 */
export function isDomainSupported(url: string): boolean {
    return getDomainTags(url).length > 0;
}
