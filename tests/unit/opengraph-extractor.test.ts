import { OpenGraphExtractor } from '../../src/lib/extractors/opengraph-extractor';

describe('OpenGraphExtractor', () => {
    let extractor: OpenGraphExtractor;
    const baseUrl = 'https://example.com/page';

    beforeEach(() => {
        extractor = new OpenGraphExtractor();
        document.head.innerHTML = '';
    });

    it('should extract basic OG properties', () => {
        document.head.innerHTML = `
            <meta property="og:title" content="Test Title">
            <meta property="og:description" content="Test Description">
            <meta property="og:image" content="https://example.com/image.jpg">
            <meta property="og:url" content="https://example.com/page">
            <meta property="og:site_name" content="Test Site">
            <meta property="og:type" content="article">
        `;

        const metadata = extractor.extract(document, baseUrl);

        expect(metadata.title).toBe('Test Title');
        expect(metadata.description).toBe('Test Description');
        expect(metadata.image).toBe('https://example.com/image.jpg');
        expect(metadata.url).toBe('https://example.com/page');
        expect(metadata.site_name).toBe('Test Site');
        expect(metadata.type).toBe('article');
    });

    it('should extract article-specific properties', () => {
        document.head.innerHTML = `
            <meta property="article:author" content="Jane Doe">
            <meta property="article:published_time" content="2026-01-01T10:00:00Z">
            <meta property="article:modified_time" content="2026-01-02T12:00:00Z">
            <meta property="article:section" content="Technology">
            <meta property="article:tag" content="AI">
            <meta property="article:tag" content="Clipper">
        `;

        const metadata = extractor.extract(document, baseUrl);

        expect(metadata.author).toBe('Jane Doe');
        expect(metadata.published_time).toBe('2026-01-01T10:00:00.000Z');
        expect(metadata.modified_time).toBe('2026-01-02T12:00:00.000Z');
        expect(metadata.section).toBe('Technology');
        expect(metadata.tag).toEqual(['AI', 'Clipper']);
    });

    it('should normalize relative URLs', () => {
        document.head.innerHTML = `
            <meta property="og:image" content="/images/thumb.png">
        `;

        const metadata = extractor.extract(document, baseUrl);
        expect(metadata.image).toBe('https://example.com/images/thumb.png');
    });

    it('should decode HTML entities', () => {
        document.head.innerHTML = `
            <meta property="og:title" content="Fish &amp; Chips">
        `;

        const metadata = extractor.extract(document, baseUrl);
        expect(metadata.title).toBe('Fish & Chips');
    });

    it('should return undefined for missing properties', () => {
        const metadata = extractor.extract(document, baseUrl);
        expect(metadata.title).toBeUndefined();
        expect(metadata.image).toBeUndefined();
    });

    it('should respect meta tags with name attribute as fallback', () => {
        document.head.innerHTML = `
            <meta name="og:title" content="Fallback Title">
        `;

        const metadata = extractor.extract(document, baseUrl);
        expect(metadata.title).toBe('Fallback Title');
    });
});
