import { ContentScriptMessage } from './types';
import { extractContext } from './utils';

console.log('[Anytype Clipper] Highlight capture script injected');

function extractHighlight() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return;
    }

    const quote = selection.toString();
    if (!quote.trim()) {
        return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const fullText = container.textContent || '';

    const context = extractContext(quote, fullText);

    const message: ContentScriptMessage = {
        type: 'CAPTURE_HIGHLIGHT',
        data: {
            ...context,
            url: window.location.href,
            pageTitle: document.title,
            timestamp: new Date().toISOString(),
        }
    };

    chrome.runtime.sendMessage(message);
}

extractHighlight();
