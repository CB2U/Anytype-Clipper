/**
 * HTML entity decoding utilities for Anytype Clipper.
 */

/**
 * Decodes HTML entities in a string.
 * Supports named entities (&amp;), decimal (&#123;), and hex (&#x7B;).
 * 
 * @param text - The text containing HTML entities
 * @returns Decoded text
 */
export function decodeHtml(text: string | null | undefined): string {
    if (!text) {
        return '';
    }

    // Use a robust regex-based replacement for common entities
    // This works consistently in both browser and node/jest environments
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
        '&#39;': "'",
    };

    let result = text.replace(/&[a-z0-9]+;/gi, (match) => {
        return entities[match.toLowerCase()] || match;
    });

    // Handle numeric entities
    result = result.replace(/&#([0-9]+);/g, (_, dec) => {
        return String.fromCharCode(parseInt(dec, 10));
    });

    result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });

    return result;
}

/**
 * Strips HTML tags from a string and decodes entities.
 * Useful for extracting plain text from HTML-rich metadata fields.
 * 
 * @param html - HTML string
 * @returns Plain text string
 */
export function stripHtml(html: string | null | undefined): string {
    if (!html) return '';

    // Remove tags
    const doc = html.replace(/<[^>]*>/g, ' ');

    // Decode entities and collapse whitespace
    return decodeHtml(doc)
        .replace(/\s+/g, ' ')
        .trim();
}
