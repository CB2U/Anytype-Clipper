import TurndownService from 'turndown';

/**
 * Utility for converting HTML content to Markdown.
 * Uses Turndown library for reliable conversion.
 */
export class MarkdownConverter {
    private turndown: TurndownService;

    constructor() {
        this.turndown = new TurndownService({
            headingStyle: 'atx',
            hr: '---',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced',
            emDelimiter: '*'
        });

        // Add rules if needed (e.g., stripping script/style tags)
        this.turndown.remove(['script', 'style', 'iframe', 'noscript']);
    }

    /**
     * Converts HTML string to Markdown.
     * 
     * @param html - The HTML string to convert
     * @returns Converted Markdown string
     */
    public convert(html: string): string {
        if (!html) return '';

        try {
            return this.turndown.turndown(html);
        } catch (error) {
            console.error('[MarkdownConverter] Conversion failed:', error);
            // Fallback to stripping tags if Turndown fails
            return html.replace(/<[^>]*>/g, '').trim();
        }
    }
}
