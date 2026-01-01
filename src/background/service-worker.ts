// Service worker entry point for Anytype Clipper Extension
console.log('Anytype Clipper service worker loaded');

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Anytype Clipper installed');
  } else if (details.reason === 'update') {
    console.log('Anytype Clipper updated');
  }
});

import { AnytypeApiClient } from '../lib/api/client';
import { ExtensionMessage, MessageResponse } from '../types/messages';

// Initialize API Client
const apiClient = new AnytypeApiClient();

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
          const result = await apiClient.getSpaces();
          sendResponse({ success: true, data: result.spaces });
          break;
        }

        case 'CMD_CAPTURE_BOOKMARK': {
          const { spaceId, params } = message.payload;
          const result = await apiClient.createObject(spaceId, params);
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

