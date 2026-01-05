/**
 * Unit tests for URL Normalizer (T8)
 */
import { normalizeUrl, cleanUrlForDeduplication } from '../../../src/lib/utils/url-normalizer';

describe('URL Normalizer', () => {
    describe('normalizeUrl', () => {
        const baseUrl = 'https://example.com/blog/article';

        it('should return null for empty or null URLs', () => {
            expect(normalizeUrl(null, baseUrl)).toBeNull();
            expect(normalizeUrl(undefined, baseUrl)).toBeNull();
            expect(normalizeUrl('', baseUrl)).toBeNull();
            expect(normalizeUrl('   ', baseUrl)).toBeNull();
        });

        it('should return absolute URLs as-is', () => {
            expect(normalizeUrl('https://google.com', baseUrl)).toBe('https://google.com');
            expect(normalizeUrl('http://insecure.com', baseUrl)).toBe('http://insecure.com');
            expect(normalizeUrl('data:image/png;base64,...', baseUrl)).toBe('data:image/png;base64,...');
        });

        it('should resolve protocol-relative URLs', () => {
            expect(normalizeUrl('//cdn.example.com/lib.js', baseUrl)).toBe('https://cdn.example.com/lib.js');
        });

        it('should resolve root-relative URLs', () => {
            expect(normalizeUrl('/about', baseUrl)).toBe('https://example.com/about');
            expect(normalizeUrl('/images/logo.png', baseUrl)).toBe('https://example.com/images/logo.png');
        });

        it('should resolve relative URLs', () => {
            // Base is https://example.com/blog/article
            // "link" relative to "article" -> https://example.com/blog/link? No, standard URL resolution treats 'article' as resource if no trailing slash.
            // URL('link', 'https://example.com/blog/article') -> 'https://example.com/blog/link'
            expect(normalizeUrl('link', baseUrl)).toBe('https://example.com/blog/link');

            // "other" relative to "https://example.com/blog/" (trailing slash) -> "https://example.com/blog/other"
            expect(normalizeUrl('other', 'https://example.com/blog/')).toBe('https://example.com/blog/other');
        });

        it('should resolve parent-relative URLs', () => {
            expect(normalizeUrl('../home', baseUrl)).toBe('https://example.com/home');
        });

        it('should handle invalid base URL gracefully', () => {
            // If base URL is invalid, new URL() might throw. 
            // The implementation catches errors and returns null.
            // But actually, new URL(relative, invalid) throws.
            // normalizeUrl catches this.

            // Suppress console.warn during test
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            expect(normalizeUrl('/path', 'invalid-url')).toBeNull();
            warnSpy.mockRestore();
        });
    });

    describe('cleanUrlForDeduplication', () => {
        it('should normalize hostname', () => {
            expect(cleanUrlForDeduplication('HTTPS://Example.COM/Path')).toBe('https://example.com/Path');
        });

        it('should remove www prefix', () => {
            expect(cleanUrlForDeduplication('https://www.example.com/')).toBe('https://example.com/');
        });

        it('should remove trailing slash from path', () => {
            expect(cleanUrlForDeduplication('https://example.com/path/')).toBe('https://example.com/path');
            expect(cleanUrlForDeduplication('https://example.com/')).toBe('https://example.com/');
            // Root slash is preserved by URL object
        });

        it('should valid remove trailing slash logic', () => {
            // If input is https://example.com/path/, pathname is /path/
            // slices to /path
            // href becomes https://example.com/path

            // If input is https://example.com, pathname is /
            // condition u.pathname.length > 1 fails.
            // href remains https://example.com/
        });

        it('should remove tracking parameters', () => {
            const url = 'https://example.com?utm_source=twitter&utm_medium=social&q=search';
            expect(cleanUrlForDeduplication(url)).toBe('https://example.com/?q=search');
        });

        it('should sort query parameters', () => {
            const url = 'https://example.com?b=2&a=1';
            expect(cleanUrlForDeduplication(url)).toBe('https://example.com/?a=1&b=2');
        });

        it('should remove hash', () => {
            expect(cleanUrlForDeduplication('https://example.com#section')).toBe('https://example.com/');
        });

        it('should return lowercase trim for invalid URLs', () => {
            expect(cleanUrlForDeduplication('  INVALID URL  ')).toBe('invalid url');
        });
    });
});
