import TurndownService from 'turndown';
import { MarkdownConversionResult } from '../../types/article';
import { TableClassifier } from '../extractors/table-classifier';
import { TableConverter } from '../extractors/table-converter';
import { TableType } from '../../types/table';

/**
 * Configure Turndown service with specific options for Anytype compatibility
 */
/**
 * Convert HTML string to Markdown
 * 
 * @param html - HTML string to convert
 * @param options - Conversion options
 * @returns Promise resolving to conversion result
 */
export async function convertToMarkdown(
    html: string,
    options: {
        timeoutMs?: number,
        includeJSONForDataTables?: boolean
    } = {}
): Promise<MarkdownConversionResult> {
    const { timeoutMs = 2000, includeJSONForDataTables = false } = options;
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
        // Instantiate Turndown service per-call to support dynamic rules based on options
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

        // Add rules
        turndownService.addRule('tables', {
            filter: 'table',
            replacement: function (_content, node) {
                const table = node as HTMLTableElement;
                try {
                    // Use a temporary property to prevent recursion if Turndown somehow re-enters
                    if ((node as any)._processing) return _content;
                    (node as any)._processing = true;

                    const result = TableClassifier.classify(table);
                    let output: string;

                    switch (result.type) {
                        case TableType.Simple:
                            output = '\n\n' + TableConverter.toMarkdown(table) + '\n\n';
                            break;
                        case TableType.Complex:
                            output = '\n\n' + TableConverter.toHTML(table) + '\n\n';
                            break;
                        case TableType.Data:
                            output = '\n\n' + TableConverter.toMarkdown(table) + '\n\n';
                            if (includeJSONForDataTables) {
                                const json = TableConverter.toJSON(table);
                                output += `\n\n**Data Table:**\n\n\`\`\`json\n${json}\n\`\`\`\n\n`;
                            }
                            break;
                        default:
                            output = '\n\n' + TableConverter.toHTML(table) + '\n\n';
                    }

                    delete (node as any)._processing;
                    return output;
                } catch (error) {
                    console.error('Table conversion failed:', error);
                    return '\n\n' + (table.outerHTML || '') + '\n\n';
                }
            }
        });

        turndownService.addRule('fencedCodeBlock', {
            filter: ['pre'],
            replacement: function (_content, node) {
                const codeElement = node.querySelector('code');
                let language = '';
                if (codeElement) {
                    const classes = codeElement.getAttribute('class') || '';
                    const match = classes.match(/language-(\S+)/);
                    if (match) language = match[1];
                    if (!language) {
                        const preClasses = node.getAttribute('class') || '';
                        const matchPre = preClasses.match(/language-(\S+)/);
                        if (matchPre) language = matchPre[1];
                    }
                    return '\n\n```' + language + '\n' + codeElement.textContent + '\n```\n\n';
                }
                return '\n\n```\n' + node.textContent + '\n```\n\n';
            }
        });

        turndownService.addRule('inlineCode', {
            filter: ['code'],
            replacement: function (content) {
                if (!content.trim()) return '';
                if (content.includes('`')) return '`` ' + content + ' ``';
                return '`' + content + '`';
            }
        });

        // Create timeout promise
        let timeoutId: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Markdown conversion timed out')), timeoutMs);
        });

        // Create conversion promise
        const conversionPromise = (async () => {
            try {
                const result = turndownService.turndown(html);
                return result;
            } finally {
                if (timeoutId) clearTimeout(timeoutId);
            }
        })();

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
