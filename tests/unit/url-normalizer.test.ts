import { normalizeUrl, cleanUrlForDeduplication } from '../../src/lib/utils/url-normalizer';

describe('URL Normalizer', () => {
    const baseUrl = 'https://example.com/blog/article-1';

    describe('normalizeUrl', () => {
        it('should handle absolute URLs', () => {
            expect(normalizeUrl('https://google.com', baseUrl)).toBe('https://google.com');
            expect(normalizeUrl('http://test.org/path', baseUrl)).toBe('http://test.org/path');
        });

        it('should handle protocol-relative URLs', () => {
            expect(normalizeUrl('//cdn.example.com/image.jpg', baseUrl)).toBe('https://cdn.example.com/image.jpg');
        });

        it('should handle root-relative URLs', () => {
            expect(normalizeUrl('/images/logo.png', baseUrl)).toBe('https://example.com/images/logo.png');
        });

        it('should handle relative URLs', () => {
            expect(normalizeUrl('next-page', baseUrl)).toBe('https://example.com/blog/next-page');
            expect(normalizeUrl('./image.jpg', baseUrl)).toBe('https://example.com/blog/image.jpg');
            expect(normalizeUrl('../index.html', baseUrl)).toBe('https://example.com/index.html');
        });

        it('should return null for invalid URLs', () => {
            expect(normalizeUrl('', baseUrl)).toBeNull();
            expect(normalizeUrl(null, baseUrl)).toBeNull();
            expect(normalizeUrl('   ', baseUrl)).toBeNull();
        });

        it('should handle data URLs', () => {
            const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
            expect(normalizeUrl(dataUrl, baseUrl)).toBe(dataUrl);
        });
    });

    describe('cleanUrlForDeduplication', () => {
        it('should lowercase hostname', () => {
            expect(cleanUrlForDeduplication('HTTPS://EXAMPLE.COM/Path')).toBe('https://example.com/Path');
        });

        it('should strip common tracking parameters', () => {
            const url = 'https://example.com/article?utm_source=twitter&utm_medium=social&fbclid=123&keep=me';
            expect(cleanUrlForDeduplication(url)).toBe('https://example.com/article?keep=me');
        });

        it('should remove trailing slash from pathname', () => {
            expect(cleanUrlForDeduplication('https://example.com/path/')).toBe('https://example.com/path');
            expect(cleanUrlForDeduplication('https://example.com/')).toBe('https://example.com/');
        });

        it('should sort query parameters', () => {
            expect(cleanUrlForDeduplication('https://example.com/q?b=2&a=1')).toBe('https://example.com/q?a=1&b=2');
        });

        it('should remove www prefix', () => {
            expect(cleanUrlForDeduplication('https://www.example.com')).toBe('https://example.com/');
            expect(cleanUrlForDeduplication('https://WWW.EXAMPLE.COM/path')).toBe('https://example.com/path');
        });

        it('should strip fragments', () => {
            expect(cleanUrlForDeduplication('https://example.com/page#section-1')).toBe('https://example.com/page');
        });
        it('should return null for javascript: URLs', () => {
            expect(normalizeUrl('javascript:alert(1)', baseUrl)).toBeNull();
            expect(normalizeUrl('vbscript:msgbox', baseUrl)).toBeNull();
        });

        it('should handle unicode domains (punycode)', () => {
            // Basic check - URL constructor usually handles this or we expect utf-8
            // Our normalizer returns absolute URLs as-is if they start with http/https
            expect(normalizeUrl('https://中文.com', baseUrl)).toBe('https://中文.com');
        });
    });
});
