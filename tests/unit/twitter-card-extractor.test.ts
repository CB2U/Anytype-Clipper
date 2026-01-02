import { TwitterCardExtractor } from '../../src/lib/extractors/twitter-card-extractor';

describe('TwitterCardExtractor', () => {
    let extractor: TwitterCardExtractor;
    const baseUrl = 'https://example.com/page';

    beforeEach(() => {
        extractor = new TwitterCardExtractor();
        document.head.innerHTML = '';
    });

    it('should extract twitter card properties', () => {
        document.head.innerHTML = `
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:site" content="@anytype">
            <meta name="twitter:creator" content="@janedoe">
            <meta name="twitter:title" content="Twitter Title">
            <meta name="twitter:description" content="Twitter Description">
            <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
        `;

        const metadata = extractor.extract(document, baseUrl);

        expect(metadata.card).toBe('summary_large_image');
        expect(metadata.site).toBe('@anytype');
        expect(metadata.creator).toBe('@janedoe');
        expect(metadata.title).toBe('Twitter Title');
        expect(metadata.description).toBe('Twitter Description');
        expect(metadata.image).toBe('https://example.com/twitter-image.jpg');
    });

    it('should normalize relative URLs', () => {
        document.head.innerHTML = `
            <meta name="twitter:image" content="twitter-thumb.png">
        `;

        const metadata = extractor.extract(document, baseUrl);
        expect(metadata.image).toBe('https://example.com/twitter-thumb.png');
    });

    it('should handle property attribute instead of name', () => {
        document.head.innerHTML = `
            <meta property="twitter:title" content="Property Title">
        `;

        const metadata = extractor.extract(document, baseUrl);
        expect(metadata.title).toBe('Property Title');
    });

    it('should return undefined for missing properties', () => {
        const metadata = extractor.extract(document, baseUrl);
        expect(metadata.card).toBeUndefined();
    });
});
