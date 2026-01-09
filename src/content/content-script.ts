// Content script entry point
// Will be extended with text selection and page extraction in Epic 3.1
console.log('Anytype Clipper content script loaded');

import { extractArticle } from '../lib/extractors/article-extractor';
import { StorageManager } from '../lib/storage/storage-manager';

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === 'CMD_EXTRACT_ARTICLE') {
        console.log('[Content Script] Received extract article request');

        // Use setTimeout to ensure async response works in all browser contexts
        // and to not block the listener return

        // Fetch settings first
        StorageManager.getInstance().getExtensionSettings()
            .then(settings => {
                const includeJSONForDataTables = settings.includeJSONForDataTables || false;
                return extractArticle(document, { includeJSONForDataTables });
            })
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

    if (request.type === 'CAPTURE_HIGHLIGHT') {
        console.log('[Content Script] Received capture highlight request');

        try {
            // Get current selection
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
                console.warn('[Content Script] No valid selection');
                sendResponse({ success: false, error: 'No text selected' });
                return false;
            }

            const quote = selection.toString();
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const fullText = container.textContent || '';

            // Extract context
            const offset = fullText.indexOf(quote);
            let contextBefore = '';
            let contextAfter = '';

            if (offset !== -1) {
                contextBefore = fullText.substring(Math.max(0, offset - 50), offset).trim();
                contextAfter = fullText.substring(offset + quote.length, Math.min(fullText.length, offset + quote.length + 50)).trim();
            }

            // Send message to background with highlight data
            chrome.runtime.sendMessage({
                type: 'CMD_HIGHLIGHT_CAPTURED',
                payload: {
                    quote,
                    contextBefore,
                    contextAfter,
                    url: window.location.href,
                    pageTitle: document.title,
                    timestamp: new Date().toISOString(),
                }
            });

            sendResponse({ success: true });
        } catch (error) {
            console.error('[Content Script] Highlight capture failed:', error);
            sendResponse({ success: false, error: String(error) });
        }

        return false; // Synchronous response
    }

    // Explicitly return undefined for other messages
    return undefined;
});
