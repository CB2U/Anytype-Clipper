// Content script entry point
// Will be extended with text selection and page extraction in Epic 3.1
console.log('Anytype Clipper content script loaded');

import { extractArticle } from '../lib/extractors/article-extractor';

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === 'CMD_EXTRACT_ARTICLE') {
        console.log('[Content Script] Received extract article request');

        // Use setTimeout to ensure async response works in all browser contexts
        // and to not block the listener return
        extractArticle(document)
            .then(result => {
                console.log('[Content Script] Extraction complete:', result.quality);
                sendResponse(result);
            })
            .catch(error => {
                console.error('[Content Script] Extraction failed:', error);
                sendResponse({
                    success: false,
                    error: String(error)
                });
            });

        return true; // Keep channel open for async response
    }
    // Explicitly return undefined for other messages
    return undefined;
});
