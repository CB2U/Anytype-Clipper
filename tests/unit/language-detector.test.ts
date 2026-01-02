import { LanguageDetector } from '../../src/lib/extractors/language-detector';

describe('LanguageDetector', () => {
    let detector: LanguageDetector;

    beforeEach(() => {
        detector = new LanguageDetector();
        document.documentElement.removeAttribute('lang');
        document.documentElement.removeAttribute('xml:lang');
        document.head.innerHTML = '';
    });

    it('should detect language from html lang attribute', () => {
        document.documentElement.setAttribute('lang', 'en');
        expect(detector.detect(document)).toBe('en');
    });

    it('should normalize complex language codes', () => {
        document.documentElement.setAttribute('lang', 'en-US');
        expect(detector.detect(document)).toBe('en');

        document.documentElement.setAttribute('lang', 'pt_BR');
        expect(detector.detect(document)).toBe('pt');
    });

    it('should handle uppercase language codes', () => {
        document.documentElement.setAttribute('lang', 'FR');
        expect(detector.detect(document)).toBe('fr');
    });

    it('should handle xml:lang attribute', () => {
        document.documentElement.setAttribute('xml:lang', 'de');
        expect(detector.detect(document)).toBe('de');
    });

    it('should detect language from meta tags', () => {
        document.head.innerHTML = '<meta http-equiv="content-language" content="es">';
        expect(detector.detect(document)).toBe('es');

        document.head.innerHTML = '<meta name="language" content="it">';
        expect(detector.detect(document)).toBe('it');
    });

    it('should return unknown for missing language', () => {
        expect(detector.detect(document)).toBe('unknown');
    });

    it('should handle invalid codes gracefully', () => {
        document.documentElement.setAttribute('lang', '1');
        expect(detector.detect(document)).toBe('unknown');

        document.documentElement.setAttribute('lang', 'invalid-long-code');
        expect(detector.detect(document)).toBe('unknown');
    });
});
