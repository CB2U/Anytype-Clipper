import { SchemaOrgExtractor } from '../../src/lib/extractors/schema-org-extractor';

describe('SchemaOrgExtractor', () => {
    let extractor: SchemaOrgExtractor;
    const baseUrl = 'https://example.com/page';

    beforeEach(() => {
        extractor = new SchemaOrgExtractor();
        document.head.innerHTML = '';
    });

    it('should extract Article JSON-LD', () => {
        const json = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            'headline': 'Article Headline',
            'description': 'Article Description',
            'author': {
                '@type': 'Person',
                'name': 'Author Name'
            },
            'datePublished': '2026-01-01T10:00:00Z',
            'dateModified': '2026-01-02T12:00:00Z',
            'image': 'https://example.com/hero.jpg',
            'publisher': {
                '@type': 'Organization',
                'name': 'Publisher Name'
            },
            'articleSection': 'News'
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(json);
        document.head.appendChild(script);

        const metadata = extractor.extract(document, baseUrl);

        expect(metadata.headline).toBe('Article Headline');
        expect(metadata.description).toBe('Article Description');
        expect(metadata.author).toBe('Author Name');
        expect(metadata.datePublished).toBe('2026-01-01T10:00:00.000Z');
        expect(metadata.dateModified).toBe('2026-01-02T12:00:00.000Z');
        expect(metadata.image).toBe('https://example.com/hero.jpg');
        expect(metadata.publisher).toBe('Publisher Name');
        expect(metadata.section).toBe('News');
    });

    it('should handle NewsArticle in a @graph', () => {
        const json = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'WebPage',
                    'name': 'Page Name'
                },
                {
                    '@type': 'NewsArticle',
                    'headline': 'News Headline',
                    'author': 'Journalist'
                }
            ]
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(json);
        document.head.appendChild(script);

        const metadata = extractor.extract(document, baseUrl);
        expect(metadata.headline).toBe('News Headline');
        expect(metadata.author).toBe('Journalist');
    });

    it('should handle multiple authors as array', () => {
        const json = {
            '@type': 'BlogPosting',
            'author': [
                { 'name': 'Alice' },
                { 'name': 'Bob' }
            ]
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(json);
        document.head.appendChild(script);

        const metadata = extractor.extract(document, baseUrl);
        expect(metadata.author).toBe('Alice, Bob');
    });

    it('should handle multiple image formats', () => {
        const json = {
            '@type': 'Article',
            'image': [
                'https://example.com/1.jpg',
                'https://example.com/2.jpg'
            ]
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(json);
        document.head.appendChild(script);

        const metadata = extractor.extract(document, baseUrl);
        expect(metadata.image).toBe('https://example.com/1.jpg');
    });

    it('should gracefully handle malformed JSON', () => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = '{ invalid json }';
        document.head.appendChild(script);

        const metadata = extractor.extract(document, baseUrl);
        expect(metadata).toEqual({});
    });
});
