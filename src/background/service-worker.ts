// Service worker entry point for Anytype Clipper Extension
console.log('Anytype Clipper service worker loaded');

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Anytype Clipper installed');
  } else if (details.reason === 'update') {
    console.log('Anytype Clipper updated');
  }

  // Register context menu for text selection
  chrome.contextMenus.create({
    id: 'send-selection-to-anytype',
    title: 'Send selection to Anytype',
    contexts: ['selection']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error creating context menu:', chrome.runtime.lastError);
    } else {
      console.log('Context menu registered successfully');
    }
  });
});

import { AnytypeApiClient } from '../lib/api/client';
import { BookmarkCaptureService } from '../lib/capture/bookmark-capture-service';
import { ExtensionMessage, MessageResponse, HighlightCapturedMessage } from '../types/messages';

// Initialize API Client and Services
const apiClient = new AnytypeApiClient();
const bookmarkCaptureService = BookmarkCaptureService.getInstance();

// Function to sync auth state from storage
async function syncAuthState() {
  const data = await chrome.storage.local.get('auth');
  const authData = (data as any).auth;
  if (authData && authData.apiKey) {
    console.log('Service Worker: Restoring API Key');
    apiClient.setApiKey(authData.apiKey);
  } else {
    console.log('Service Worker: Clearing API Key');
    apiClient.setApiKey('');
  }
}

// Initial sync
syncAuthState();

// Listen for storage changes to keep API key in sync (e.g. login/logout)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.auth) {
    syncAuthState();
  }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'send-selection-to-anytype' && tab?.id) {
    console.log('[Service Worker] Injecting highlight capture script');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Inline highlight capture logic
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
            console.warn('[Highlight Capture] No valid selection');
            return;
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

          // Send message to background
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
        }
      });
      console.log('[Service Worker] Script injected successfully');
    } catch (error) {
      console.error('[Service Worker] Script injection failed:', error);
    }
  }
});

// Update handleAsync to include CMD_HIGHLIGHT_CAPTURED
const handleHighlightCaptured = async (payload: HighlightCapturedMessage['payload']) => {
  console.log('Highlight captured in background:', payload.quote);
  // Store the payload for the popup to retrieve
  await chrome.storage.local.set({ lastHighlight: payload });

  // Try to open the popup automatically (may not work on all platforms)
  try {
    if ((chrome.action as any).openPopup) {
      await (chrome.action as any).openPopup();
    }
  } catch (e) {
    console.log('Optional: openPopup failed (expected on non-Chrome browsers)', e);
  }
};

const handleExtractMetadata = async () => {
  // 1. Get current active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  if (!activeTab?.id) throw new Error('No active tab found');

  // 2. Send message to content script
  console.log('[Service Worker] Requesting metadata from content script in tab', activeTab.id);
  const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'CMD_EXTRACT_METADATA' });

  if (!response || !response.success) {
    throw new Error(response?.error || 'Failed to extract metadata from page');
  }

  return response.data;
};

const handleExtractArticle = async () => {
  const startTime = performance.now();

  // 1. Get current active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  if (!activeTab?.id) throw new Error('No active tab found');

  // 2. Send message to content script
  console.log('[Service Worker] Requesting article from content script in tab', activeTab.id);

  try {
    const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'CMD_EXTRACT_ARTICLE' });
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`[Performance] Article extraction took ${duration.toFixed(2)}ms`);

    if (!response || !response.success) {
      const errorMsg = response?.error || 'Failed to extract article from page';
      console.error('[Service Worker] Extraction failed:', errorMsg);

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Article Extraction Failed',
        message: 'Could not extract article content. Using fallback...'
      });

      throw new Error(errorMsg);
    }

    // Success handling
    const quality = response.quality || 'unknown';
    const wordCount = response.metadata?.wordCount || 0;

    // Store result
    await chrome.storage.local.set({
      lastArticleExtraction: {
        ...response,
        timestamp: new Date().toISOString()
      }
    });

    // Show notification for success quality
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Article Extracted',
      message: `Successfully captured article with Markdown formatting (${wordCount} words). Quality: ${quality}`
    });

    return response.data || response; // Return full response or data depending on structure
  } catch (err) {
    // Handle communication errors (e.g. content script not loaded)
    console.error('[Service Worker] Communication error:', err);
    throw err;
  }
};

// Message handling
chrome.runtime.onMessage.addListener((
  message: ExtensionMessage,
  _sender,
  sendResponse: (response: MessageResponse) => void
) => {
  console.log('Received message:', message.type);

  const handleAsync = async () => {
    try {
      switch (message.type) {
        case 'CMD_GET_SPACES': {
          console.log('Fetching spaces...');
          try {
            const result = await apiClient.getSpaces();
            console.log('Spaces fetched successfully:', result);
            sendResponse({ success: true, data: result.spaces });
          } catch (e) {
            console.error('API Error in CMD_GET_SPACES:', e);
            throw e; // Let the catch block below handle formatting
          }
          break;
        }

        case 'CMD_CAPTURE_BOOKMARK': {
          const { spaceId, metadata, userNote, tags, type_key, isHighlightCapture, quote } = message.payload;
          console.log('[Service Worker] Capturing object with metadata...');

          const result = await bookmarkCaptureService.captureBookmark(
            spaceId,
            metadata,
            userNote,
            tags,
            type_key,
            isHighlightCapture,
            quote
          );

          sendResponse({ success: true, data: result });
          break;
        }

        case 'CMD_EXTRACT_METADATA': {
          const metadata = await handleExtractMetadata();
          sendResponse({ success: true, data: metadata });
          break;
        }

        case 'CMD_EXTRACT_ARTICLE': {
          const articleData = await handleExtractArticle();
          sendResponse({ success: true, data: articleData });
          break;
        }

        case 'CMD_CHECK_AUTH': {
          // Simple check by trying to get spaces
          // If it fails with 401, client throws AuthError
          await apiClient.getSpaces();
          sendResponse({ success: true });
          break;
        }

        case 'CMD_HIGHLIGHT_CAPTURED': {
          await handleHighlightCaptured(message.payload);
          sendResponse({ success: true });
          break;
        }

        default:
          console.warn('Unknown message type:', (message as any).type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  handleAsync();
  return true; // Keep channel open for async response
});

