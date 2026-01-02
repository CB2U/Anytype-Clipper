import { MetadataExtractor } from '../lib/extractors/metadata-extractor';
import { ArticleExtractor } from '../lib/extractors/article-extractor';
import { MarkdownConverter } from '../lib/utils/markdown-converter';

/**
 * Content script to extract metadata from the current page.
 * Listens for requests from the background script.
 */

const metadataExtractor = new MetadataExtractor();
const articleExtractor = new ArticleExtractor();
const markdownConverter = new MarkdownConverter();

// Handle messages from the background script/popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'CMD_EXTRACT_METADATA') {
        console.log('[Anytype Clipper] Extracting metadata...');

        metadataExtractor.extract(window.document, window.location.href)
            .then(metadata => {
                console.log('[Anytype Clipper] Metadata extracted:', metadata);
                sendResponse({ success: true, data: metadata });
            })
            .catch(error => {
                console.error('[Anytype Clipper] Metadata extraction failed:', error);
                sendResponse({ success: false, error: String(error) });
            });

        return true;
    }

    if (message.type === 'CMD_EXTRACT_ARTICLE') {
        console.log('[Anytype Clipper] Extracting article content...');

        const article = articleExtractor.extract(window.document);

        if (!article) {
            sendResponse({ success: false, error: 'Could not extract article content' });
            return false;
        }

        // Combine with metadata
        metadataExtractor.extract(window.document, window.location.href, article.textContent)
            .then(metadata => {
                const markdownContent = markdownConverter.convert(article.content);
                const enrichedMetadata = {
                    ...metadata,
                    content: markdownContent || article.content, // Prefer markdown
                    textContent: article.textContent,
                    readingTime: metadata.readingTime || Math.ceil(article.length / 1500), // Fallback reading time
                };
                console.log('[Anytype Clipper] Article extracted:', enrichedMetadata);
                sendResponse({ success: true, data: enrichedMetadata });
            })
            .catch(error => {
                console.error('[Anytype Clipper] Article metadata extraction failed:', error);
                sendResponse({ success: false, error: String(error) });
            });

        return true;
    }

    return false;
});

console.log('[Anytype Clipper] Metadata extraction script loaded');
