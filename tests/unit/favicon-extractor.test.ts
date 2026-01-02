import { FaviconExtractor } from '../../src/lib/extractors/favicon-extractor';

describe('FaviconExtractor', () => {
    let extractor: FaviconExtractor;
    const baseUrl = 'https://example.com';

    beforeEach(() => {
        extractor = new FaviconExtractor();
        document.head.innerHTML = '';
    });

    it('should extract favicon from rel="icon"', () => {
        document.head.innerHTML = '<link rel="icon" href="/fav.png">';
        expect(extractor.extract(document, baseUrl)).toBe('https://example.com/fav.png');
    });

    it('should prioritize apple-touch-icon', () => {
        document.head.innerHTML = `
            <link rel="icon" href="/small.png">
            <link rel="apple-touch-icon" href="/large.png">
        `;
        expect(extractor.extract(document, baseUrl)).toBe('https://example.com/large.png');
    });

    it('should prioritize larger sizes', () => {
        document.head.innerHTML = `
            <link rel="icon" href="/16x16.png" sizes="16x16">
            <link rel="icon" href="/32x32.png" sizes="32x32">
            <link rel="icon" href="/64x64.png" sizes="64x64">
        `;
        expect(extractor.extract(document, baseUrl)).toBe('https://example.com/64x64.png');
    });

    it('should fallback to /favicon.ico if no links found', () => {
        expect(extractor.extract(document, baseUrl)).toBe('https://example.com/favicon.ico');
    });

    it('should normalize relative URLs', () => {
        document.head.innerHTML = '<link rel="icon" href="images/fav.ico">';
        expect(extractor.extract(document, baseUrl)).toBe('https://example.com/images/fav.ico');
    });

    it('should handle complex rel values', () => {
        document.head.innerHTML = '<link rel="shortcut icon" href="/fav.ico">';
        expect(extractor.extract(document, baseUrl)).toBe('https://example.com/fav.ico');
    });
});
