/**
 * Utility for detecting the page language.
 */
export class LanguageDetector {
    /**
     * Detects the language of a document.
     * 
     * @param document - The HTML document to analyze
     * @returns Normalized ISO 639-1 language code (e.g., "en"), or "unknown"
     */
    public detect(document: Document): string {
        // 1. Check <html lang="...">
        let lang: string | null | undefined = document.documentElement.getAttribute('lang') ||
            document.documentElement.getAttribute('xml:lang');

        // 2. Check <meta http-equiv="content-language">
        if (!lang) {
            const metaLang = document.querySelector('meta[http-equiv="content-language"]');
            lang = metaLang?.getAttribute('content') || undefined;
        }

        // 3. Check <meta name="language">
        if (!lang) {
            const metaLangName = document.querySelector('meta[name="language"]');
            lang = metaLangName?.getAttribute('content') || undefined;
        }

        if (!lang) {
            return 'unknown';
        }

        return this.normalizeLanguageCode(lang);
    }

    /**
     * Normalizes a language code to ISO 639-1 (two letters).
     * e.g., "en-US" -> "en", "FR" -> "fr"
     * 
     * @param lang - The language code to normalize
     * @returns Two-letter language code
     */
    private normalizeLanguageCode(lang: string): string {
        const trimmed = lang.trim().toLowerCase();

        // Handle en-US, pt-BR, etc.
        const code = trimmed.split(/[-_]/)[0];

        // Basic validation: should be 2 characters (ISO 639-1)
        // Note: Some languages use 3 characters, but most use 2.
        if (code.length >= 2 && code.length <= 3) {
            return code;
        }

        return 'unknown';
    }
}
