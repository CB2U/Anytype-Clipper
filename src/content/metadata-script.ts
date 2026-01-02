import { MetadataExtractor } from '../lib/extractors/metadata-extractor';


/**
 * Content script to extract metadata from the current page.
 * Listens for requests from the background script.
 */

const metadataExtractor = new MetadataExtractor();


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

    return undefined; // Let other listeners handle other messages
});

console.log('[Anytype Clipper] Metadata extraction script loaded');
