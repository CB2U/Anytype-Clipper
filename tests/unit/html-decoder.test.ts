import { decodeHtml, stripHtml } from '../../src/lib/utils/html-decoder';

describe('HTML Decoder', () => {
    describe('decodeHtml', () => {
        it('should decode major named entities', () => {
            expect(decodeHtml('Fish &amp; Chips')).toBe('Fish & Chips');
            expect(decodeHtml('&lt;script&gt;')).toBe('<script>');
            expect(decodeHtml('John&apos;s &quot;Quote&quot;')).toBe("John's \"Quote\"");
        });

        it('should handle uppercase named entities', () => {
            expect(decodeHtml('FISH &AMP; CHIPS')).toBe('FISH & CHIPS');
        });

        it('should decode decimal numeric entities', () => {
            expect(decodeHtml('&#60;test&#62;')).toBe('<test>');
        });

        it('should decode hex numeric entities', () => {
            expect(decodeHtml('&#x3c;test&#x3e;')).toBe('<test>');
        });

        it('should handle missing or empty strings', () => {
            expect(decodeHtml('')).toBe('');
            expect(decodeHtml(null)).toBe('');
            expect(decodeHtml(undefined)).toBe('');
        });

        it('should leave unknown entities as is', () => {
            expect(decodeHtml('&unknown;')).toBe('&unknown;');
        });
    });

    describe('stripHtml', () => {
        it('should remove HTML tags', () => {
            expect(stripHtml('<div>Hello <b>World</b></div>')).toBe('Hello World');
        });

        it('should decode entities after stripping tags', () => {
            expect(stripHtml('<div>Fish &amp; Chips</div>')).toBe('Fish & Chips');
        });

        it('should collapse multiple spaces', () => {
            expect(stripHtml('First line<br>   Second   line')).toBe('First line Second line');
        });
    });
});
