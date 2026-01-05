/**
 * URL normalization utilities for Anytype Clipper.
 */

/**
 * Normalizes a URL by resolving relative paths and handling protocol-relative URLs.
 * 
 * @param url - The URL to normalize (may be relative, protocol-relative, or absolute)
 * @param baseUrl - The base URL of the page (usually window.location.href)
 * @returns The normalized absolute URL, or null if the URL is invalid
 */
export function normalizeUrl(url: string | null | undefined, baseUrl: string): string | null {
    if (!url || !url.trim()) {
        return null;
    }

    const trimmedUrl = url.trim();

    try {
        // 1. Handle absolute URLs already
        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('data:')) {
            return trimmedUrl;
        }

        // Security: Block javascript: / vbscript:
        if (/^(javascript|vbscript):/i.test(trimmedUrl)) {
            return null;
        }

        // 2. Handle protocol-relative URLs (//example.com)
        if (trimmedUrl.startsWith('//')) {
            const base = new URL(baseUrl);
            return `${base.protocol}${trimmedUrl}`;
        }

        // 3. Handle root-relative URLs (/path) and relative URLs (path)
        const absoluteUrl = new URL(trimmedUrl, baseUrl).href;
        return absoluteUrl;
    } catch (error) {
        console.warn(`[URL Normalizer] Failed to normalize URL: ${trimmedUrl} with base: ${baseUrl}`, error);
        return null;
    }
}

/**
 * Strips tracking parameters and normalizes a URL for deduplication.
 * 
 * @param url - The URL to clean
 * @returns Normalized URL for comparison
 */
export function cleanUrlForDeduplication(url: string): string {
    try {
        const u = new URL(url);

        // Lowercase hostname
        u.hostname = u.hostname.toLowerCase();

        // Remove www prefix for normalization
        if (u.hostname.startsWith('www.')) {
            u.hostname = u.hostname.substring(4);
        }

        // Remove trailing slash from pathname
        if (u.pathname.endsWith('/') && u.pathname.length > 1) {
            u.pathname = u.pathname.slice(0, -1);
        }

        // Remove common tracking parameters
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'msclkid', 'mc_cid', 'mc_eid'
        ];

        trackingParams.forEach(param => u.searchParams.delete(param));

        // Sort remaining query parameters for consistent matching
        u.searchParams.sort();

        // Remove fragment (hash) unless it's part of the identity (common in single page apps)
        // For simple deduplication, we usually strip it.
        u.hash = '';

        return u.href;
    } catch (e) {
        return url.toLowerCase().trim();
    }
}
