import { MetadataExtractor } from '../../src/lib/extractors/metadata-extractor';

describe('MetadataExtractor', () => {
    let extractor: MetadataExtractor;
    const url = 'https://example.com/page';

    beforeEach(() => {
        extractor = new MetadataExtractor();
        document.head.innerHTML = '';
        document.title = 'Default Title';
    });

    it('should prioritize Open Graph over other sources', async () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:title');
        meta.setAttribute('content', 'OG Title');
        document.head.appendChild(meta);

        const metadata = await extractor.extract(document, url);
        expect(metadata.title).toBe('OG Title');
    });

    it('should fallback to Twitter Cards if OG is missing', async () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'twitter:title');
        meta.setAttribute('content', 'Twitter Title');
        document.head.appendChild(meta);

        const metadata = await extractor.extract(document, url);
        expect(metadata.title).toBe('Twitter Title');
    });

    it('should fallback to Schema.org if OG and Twitter are missing', async () => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({ "@type": "Article", "headline": "Schema Title" });
        document.head.appendChild(script);

        const metadata = await extractor.extract(document, url);
        expect(metadata.title).toBe('Schema Title');
    });

    it('should fallback to standard meta tags and document.title', async () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        meta.setAttribute('content', 'Meta Description');
        document.head.appendChild(meta);

        document.title = 'Document Title';

        const metadata = await extractor.extract(document, url);
        expect(metadata.title).toBe('Document Title');
        expect(metadata.description).toBe('Meta Description');
    });

    it('should calculate reading time if content is provided', async () => {
        const content = 'Word '.repeat(400); // 400 words
        const metadata = await extractor.extract(document, url, content);
        expect(metadata.readingTime).toBe(2); // 400 / 200 = 2
    });

    it('should extract canonical URL and use it as base', async () => {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = 'https://example.com/canonical/';
        document.head.appendChild(link);

        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:image');
        meta.setAttribute('content', 'image.jpg');
        document.head.appendChild(meta);

        const metadata = await extractor.extract(document, url);
        expect(metadata.canonicalUrl).toBe('https://example.com/canonical/');
        expect(metadata.image).toBe('https://example.com/canonical/image.jpg');
    });

    it('should detect language and favicon', async () => {
        document.documentElement.setAttribute('lang', 'fr');
        document.head.innerHTML = '<link rel="icon" href="/favicon.png">';

        const metadata = await extractor.extract(document, url);
        expect(metadata.language).toBe('fr');
        expect(metadata.favicon).toBe('https://example.com/favicon.png');
    });
});
