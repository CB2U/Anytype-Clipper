import { normalizeUrl } from '../utils/url-normalizer';

/**
 * Utility for extracting site favicon URLs.
 */
export class FaviconExtractor {
    /**
     * Extracts the best possible favicon URL from a document.
     * 
     * @param document - The HTML document to analyze
     * @param baseUrl - The base URL for normalizing relative paths
     * @returns Absolute URL of the favicon, or null if not found
     */
    public extract(document: Document, baseUrl: string): string | null {
        const links = Array.from(document.querySelectorAll('link[rel*="icon"]')) as HTMLLinkElement[];

        if (links.length === 0) {
            // Fallback to /favicon.ico if nothing found in HTML
            return normalizeUrl('/favicon.ico', baseUrl);
        }

        const bestLink = this.findBestFavicon(links);
        const href = bestLink.getAttribute('href');

        return normalizeUrl(href, baseUrl);
    }

    /**
     * Finds the "best" favicon from a list of link elements.
     * Prioritizes apple-touch-icon, then larger sizes, then standard icon.
     */
    private findBestFavicon(links: HTMLLinkElement[]): HTMLLinkElement {
        // 1. Prefer apple-touch-icon (usually high quality)
        const appleIcon = links.find(l => l.rel.toLowerCase().includes('apple-touch-icon'));
        if (appleIcon) return appleIcon;

        // 2. Look for explicit sizes (e.g., 32x32, 64x64) and pick the largest
        const sizedLinks = links.filter(l => l.hasAttribute('sizes') && /^\d+x\d+$/i.test(l.getAttribute('sizes') || ''));
        if (sizedLinks.length > 0) {
            return sizedLinks.reduce((best, current) => {
                const bestSize = this.parseSize(best.getAttribute('sizes') || '');
                const currentSize = this.parseSize(current.getAttribute('sizes') || '');
                return currentSize > bestSize ? current : best;
            });
        }

        // 3. Fallback to the first icon found (usually 'shortcut icon' or 'icon')
        return links[0];
    }

    /**
     * Parses a size string like "64x64" into a number (area).
     */
    private parseSize(sizeStr: string): number {
        const match = sizeStr.match(/^(\d+)x(\d+)$/i);
        if (!match) return 0;
        return parseInt(match[1], 10) * parseInt(match[2], 10);
    }
}
