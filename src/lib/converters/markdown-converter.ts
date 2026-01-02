import TurndownService from 'turndown';
import { MarkdownConversionResult } from '../../types/article';

/**
 * Configure Turndown service with specific options for Anytype compatibility
 */
const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
});

// Custom rule for code blocks with language detection
turndownService.addRule('fencedCodeBlock', {
    filter: ['pre'],
    replacement: function (_content, node) {
        const codeElement = node.querySelector('code');
        let language = '';

        if (codeElement) {
            // Try to find language class in code element
            const classes = codeElement.getAttribute('class') || '';
            const match = classes.match(/language-(\S+)/);
            if (match) {
                language = match[1];
            }
            // If not found, try the pre element itself (sometimes used)
            if (!language) {
                const preClasses = node.getAttribute('class') || '';
                const matchPre = preClasses.match(/language-(\S+)/);
                if (matchPre) {
                    language = matchPre[1];
                }
            }

            return '\n\n```' + language + '\n' + codeElement.textContent + '\n```\n\n';
        }

        // Fallback for pre without code (should be rare)
        return '\n\n```\n' + node.textContent + '\n```\n\n';
    }
});

// Rule for inline code to ensure it uses backticks
turndownService.addRule('inlineCode', {
    filter: ['code'],
    replacement: function (content) {
        if (!content.trim()) return '';
        // Escape backticks inside code
        if (content.includes('`')) {
            // If code contains backtick, use double backticks
            return '`` ' + content + ' ``';
        }
        return '`' + content + '`';
    }
});

/**
 * Convert HTML string to Markdown
 * 
 * @param html - HTML string to convert
 * @param timeoutMs - Timeout in milliseconds (default: 2000)
 * @returns Promise resolving to conversion result
 */
export async function convertToMarkdown(
    html: string,
    timeoutMs: number = 2000
): Promise<MarkdownConversionResult> {
    const startTime = performance.now();

    if (!html || typeof html !== 'string') {
        const endTime = performance.now();
        return {
            success: false,
            markdown: null,
            metadata: {
                conversionTime: endTime - startTime,
                characterCount: 0
            },
            error: 'Invalid or empty HTML input'
        };
    }

    try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Markdown conversion timed out')), timeoutMs);
        });

        // Create conversion promise
        const conversionPromise = new Promise<string>((resolve, reject) => {
            try {
                // Turndown is synchronous, but we wrap it to allow racing with timeout
                // and to prevent it from blocking main thread too long if we yield
                const result = turndownService.turndown(html);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });

        // Race them
        const markdown = await Promise.race([conversionPromise, timeoutPromise]);

        const endTime = performance.now();
        return {
            success: true,
            markdown,
            metadata: {
                conversionTime: endTime - startTime,
                characterCount: markdown.length
            }
        };

    } catch (error) {
        const endTime = performance.now();
        return {
            success: false,
            markdown: null,
            metadata: {
                conversionTime: endTime - startTime,
                characterCount: 0
            },
            error: error instanceof Error ? error.message : 'Unknown conversion error'
        };
    }
}
