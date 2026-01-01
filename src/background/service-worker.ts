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
import { TagService } from '../lib/tags/tag-service';
import { ExtensionMessage, MessageResponse, HighlightCapturedMessage } from '../types/messages';

// Initialize API Client and Tag Service
const apiClient = new AnytypeApiClient();
const tagService = TagService.getInstance();

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
          const { spaceId, params } = message.payload;

          // 1. Create the object first (without tags)
          // We remove tags from create params to keep it clean, though client ignores them anyway
          const createParams = { ...params };
          delete createParams.tags;

          const result = await apiClient.createObject(spaceId, createParams);

          // 2. Resolve and assign tags if present
          const tagNames = (params.tags || []) as string[];
          const objectType = (params.type_key || 'bookmark') as string;

          if (Array.isArray(tagNames) && tagNames.length > 0 && result.id) {
            try {
              // Discover the tag property ID for this space
              const tagPropertyId = await (tagService as any)['resolvePropertyId'](spaceId, objectType);

              // Get all existing tags for this space
              const existingTags = await tagService.getTags(spaceId, objectType);

              const tagIds: string[] = [];
              for (const tagName of tagNames) {
                if (typeof tagName !== 'string') continue;

                const existingTag = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                if (existingTag) {
                  tagIds.push(existingTag.id);
                } else {
                  // Create new tag
                  const newTag = await tagService.createTag(spaceId, objectType, tagName);
                  tagIds.push(newTag.id);
                }
              }

              if (tagPropertyId && tagIds.length > 0) {
                const properties = [
                  {
                    key: tagPropertyId,
                    objects: tagIds
                  }
                ];

                console.log(`[CMD_CAPTURE_BOOKMARK] Updating object ${result.id} with properties:`, properties);

                await apiClient.updateObject(spaceId, result.id, properties);

                console.log(`[CMD_CAPTURE_BOOKMARK] Tags assigned successfully`);
              }

            } catch (tagError) {
              console.error('[CMD_CAPTURE_BOOKMARK] Tag assignment failed:', tagError);
            }
          }

          sendResponse({ success: true, data: result });
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

