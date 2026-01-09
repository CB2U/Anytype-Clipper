// Service worker entry point for Anytype Clipper Extension
console.log('Anytype Clipper service worker loaded');

// Import context menu handler
import { registerContextMenus, handleContextMenuClick } from './context-menu-handler';

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Anytype Clipper installed');
  } else if (details.reason === 'update') {
    console.log('Anytype Clipper updated');
  }

  // Register all context menu items
  registerContextMenus();
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleContextMenuClick(info, tab);
});

import { AnytypeApiClient } from '../lib/api/client';
import { BookmarkCaptureService } from '../lib/capture/bookmark-capture-service';
import { ExtensionMessage, MessageResponse, HighlightCapturedMessage } from '../types/messages';
import { ArticleExtractionResult, ExtractionQuality } from '../types/article';
import { QueueManager } from './queue-manager';
import { RetryScheduler } from './retry-scheduler';
import { BadgeManager } from './badge-manager';
import { QueueStatus } from '../types/queue';

// Initialize API Client and Services
const apiClient = new AnytypeApiClient();
const bookmarkCaptureService = BookmarkCaptureService.getInstance();
const queueManager = QueueManager.getInstance();
const retryScheduler = RetryScheduler.getInstance(queueManager, apiClient);
const badgeManager = BadgeManager.getInstance(queueManager);

// Import deduplication service
import { deduplicationService } from '../lib/services/deduplication-service';

// Import append service
import { AppendService } from '../lib/services/append-service';

// Import settings manager functions for Object Types
import {
  setCachedObjectTypes,
  getCachedObjectTypes,
  getDefaultObjectType,
  updateLastUsedObjectType
} from '../lib/storage/settings-manager-v2';


// T8: Register Alarm Listener for retries
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('retry-')) {
    const queueItemId = alarm.name.replace('retry-', '');
    console.debug(`[Service Worker] Alarm triggered: ${alarm.name} for item ${queueItemId}`);
    await retryScheduler.processRetry(queueItemId);
  }
});

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

// Initial sync and resume retries
async function initialize() {
  console.info('[Service Worker] Initializing...');
  await syncAuthState();

  // Recover items stuck in 'sending' state before resuming retries
  try {
    console.info('[Service Worker] Checking for stuck items...');
    const recoveredCount = await queueManager.resetSendingToQueued();
    if (recoveredCount > 0) {
      console.info(`[Service Worker] Recovered ${recoveredCount} stuck items.`);
    }
  } catch (error) {
    console.error('[Service Worker] Recovery failed:', error);
  }

  await retryScheduler.resumeRetries();
}

initialize();
badgeManager.init();

// Listen for storage changes to keep API key in sync (e.g. login/logout)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.auth) {
    syncAuthState();
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

  // 2. Send message to content script with error handling
  try {
    console.log('[Service Worker] Requesting metadata from content script in tab', activeTab.id);
    const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'CMD_EXTRACT_METADATA' });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to extract metadata from page');
    }

    return response.data;
  } catch (err) {
    // Content script not ready or page doesn't support it
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[Service Worker] Metadata extraction failed, using fallback:', errorMsg);

    // Return minimal fallback metadata
    return {
      title: activeTab.title || 'Untitled',
      canonicalUrl: activeTab.url,
      source: 'fallback'
    };
  }
};


// T9: Manual Retry Logic
const retryCountMap = new Map<number, number>(); // tabId -> retryCount


const handleExtractArticle = async (targetTabId?: number) => {
  const startTime = performance.now();

  // 1. Get tab
  let activeTab: chrome.tabs.Tab | undefined;
  if (targetTabId) {
    try {
      activeTab = await chrome.tabs.get(targetTabId);
    } catch {
      // Tab closed or doesn't exist
      console.warn('Retry target tab not found:', targetTabId);
      return;
    }
  } else {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs[0];
  }

  if (!activeTab?.id) throw new Error('No active tab found');
  const tabId = activeTab.id;

  // 2. Send message to content script
  console.log('[Service Worker] Requesting article from content script in tab', tabId);

  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'CMD_EXTRACT_ARTICLE' });
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`[Performance] Article extraction took ${duration.toFixed(2)}ms`);

    if (!response || (!response.success && response.quality === ExtractionQuality.FAILURE)) {
      // Only treat as error if COMPLETELY failed (FAILURE)
      const errorMsg = response?.error || 'Failed to extract article from page';
      console.error('[Service Worker] Extraction failed:', errorMsg);

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '🔴 Extraction Failed',
        message: errorMsg
      });

      throw new Error(errorMsg);
    }

    const result = response as ArticleExtractionResult;

    // Store result
    await chrome.storage.local.set({
      lastArticleExtraction: {
        ...result,
        timestamp: new Date().toISOString()
      }
    });

    // Clear retry count on success
    retryCountMap.delete(tabId);

    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';

    // Check if it's a connection error (content script not ready)
    if (errorMsg.includes('Receiving end does not exist') || errorMsg.includes('Could not establish connection')) {
      console.warn('[Service Worker] Content script not ready, returning fallback metadata');

      // Return minimal fallback - let popup handle gracefully
      return {
        success: true,
        quality: ExtractionQuality.FALLBACK,
        article: null,
        metadata: {
          title: activeTab.title || 'Untitled',
          url: activeTab.url,
          source: 'fallback'
        }
      };
    }

    console.error('[Service Worker] Communication error:', err);
    throw err;
  }
};

// Handle Notification Button Clicks (Retry)
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0 && notificationId.startsWith('extraction:')) {
    const tabId = parseInt(notificationId.split(':')[1], 10);
    if (!isNaN(tabId)) {
      const currentRetry = retryCountMap.get(tabId) || 0;
      if (currentRetry < 3) {
        retryCountMap.set(tabId, currentRetry + 1);
        console.log(`[Service Worker] Retrying extraction for tab ${tabId} (Attempt ${currentRetry + 1})`);

        // Clear previous notification
        chrome.notifications.clear(notificationId);

        await handleExtractArticle(tabId);
      } else {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Retry Limit Reached',
          message: 'Maximum of 3 retries executed.'
        });
      }
    }
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
          console.log('Fetching spaces...');
          try {
            const result = await apiClient.getSpaces();
            console.log('Spaces fetched successfully:', result);
            // Cache spaces for offline use
            await chrome.storage.local.set({ cachedSpaces: result.spaces });
            sendResponse({ success: true, data: result.spaces });
          } catch (e) {
            if (QueueManager.shouldQueue(e)) {
              console.log('[Service Worker] Anytype offline, attempting to load cached spaces...');
              const data = await chrome.storage.local.get('cachedSpaces');
              const cached = data.cachedSpaces;
              if (cached && Array.isArray(cached)) { // Assuming cachedSpaces should be an array
                sendResponse({ success: true, data: cached, cached: true });
                return;
              }
            }
            console.warn('API Error in CMD_GET_SPACES:', e);
            throw e;
          }
          break;
        }

        case 'CMD_GET_OBJECT_TYPES': {
          const { spaceId } = message.payload;
          console.log('[Service Worker] Fetching Object Types for space:', spaceId);
          try {
            const objectTypes = await apiClient.fetchObjectTypes(spaceId);
            console.log('[Service Worker] Object Types fetched successfully:', objectTypes.length);

            // Cache Object Types using settings manager
            await setCachedObjectTypes(objectTypes);

            sendResponse({ success: true, data: objectTypes });
          } catch (e) {
            // On error, try to use cached types
            console.warn('[Service Worker] Object Types fetch failed, using cache:', e);
            const cached = await getCachedObjectTypes();
            if (cached && cached.length > 0) {
              sendResponse({ success: true, data: cached, cached: true });
            } else {
              throw e;
            }
          }
          break;
        }

        case 'CMD_GET_DEFAULT_OBJECT_TYPE': {
          const { mode } = message.payload;
          console.log('[Service Worker] Getting default Object Type for mode:', mode);
          const defaultType = await getDefaultObjectType(mode);
          sendResponse({ success: true, data: defaultType });
          break;
        }

        case 'CMD_UPDATE_LAST_USED_OBJECT_TYPE': {
          const { mode, typeKey } = message.payload;
          console.log('[Service Worker] Updating last-used Object Type:', mode, typeKey);
          await updateLastUsedObjectType(mode, typeKey);
          sendResponse({ success: true });
          break;
        }

        case 'CMD_CAPTURE_BOOKMARK': {
          const { spaceId, metadata, userNote, tags, type_key, isHighlightCapture, quote, skipDeduplication } = message.payload;
          console.log(`[Service Worker] CMD_CAPTURE_BOOKMARK: type=${type_key}, space=${spaceId}, title="${metadata.title}"`);
          console.log(`[Service Worker] Metadata URL: ${metadata.url}, Canonical: ${metadata.canonicalUrl}`);

          // Deduplication check (skip if explicitly requested or if it's a highlight)
          // Now includes both bookmarks AND articles (notes)
          const bookmarkUrl = metadata.url || metadata.canonicalUrl;
          if (!skipDeduplication && !isHighlightCapture && bookmarkUrl) {
            try {
              // Get API key from storage for deduplication search
              const authData = await chrome.storage.local.get('auth');
              const apiKey = (authData as any).auth?.apiKey;

              if (apiKey) {
                console.log('[Service Worker] Checking for duplicate URL...');
                const duplicateResult = await deduplicationService.searchByUrl(
                  bookmarkUrl,
                  spaceId,
                  apiKey
                );

                // If duplicate found, return it to popup for user decision
                if (duplicateResult.found && duplicateResult.object) {
                  console.log(`[Service Worker] Duplicate found: ${duplicateResult.object.id}`);
                  sendResponse({
                    success: true,
                    data: {
                      duplicate: true,
                      existingObject: duplicateResult.object
                    }
                  });
                  return; // Don't proceed with capture
                }

                console.log('[Service Worker] No duplicate found, proceeding with capture');
              } else {
                console.log('[Service Worker] No API key, skipping deduplication');
              }
            } catch (dedupError) {
              // Log error but continue with capture (graceful degradation)
              console.error('[Service Worker] Deduplication check failed:', dedupError);
            }
          } else {
            console.log(`[Service Worker] Skipping deduplication: skip=${skipDeduplication}, highlight=${isHighlightCapture}, url=${bookmarkUrl}`);
          }

          // Proceed with bookmark capture
          const result = await bookmarkCaptureService.captureBookmark(
            spaceId,
            metadata,
            userNote,
            tags,
            type_key,
            isHighlightCapture,
            quote
          );

          console.log(`[Service Worker] Capture result: queued=${result.queued}, id=${result.itemId || 'N/A'}`);
          sendResponse({ success: true, data: result });

          // If queued, trigger immediate scheduling of first retry
          if (result.queued) {
            const item = await queueManager.get(result.itemId);
            if (item) {
              await retryScheduler.scheduleRetry(item);
            }
          }
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

        case 'CMD_GET_QUEUE': {
          const items = await queueManager.getAll();
          sendResponse({ success: true, data: items });
          break;
        }

        case 'CMD_RETRY_QUEUE_ITEM': {
          const { id } = message.payload;
          // Reset retry count and mark as queued
          await queueManager.updateRetryCount(id, 0);
          await queueManager.updateStatus(id, QueueStatus.Queued);
          // Trigger immediate retry
          await retryScheduler.processRetry(id);
          sendResponse({ success: true });
          break;
        }

        case 'CMD_DELETE_QUEUE_ITEM': {
          const { id } = message.payload;
          await queueManager.delete(id);
          sendResponse({ success: true });
          break;
        }

        case 'CMD_DIAGNOSTIC': {
          console.log('[Service Worker] Running Storage Diagnostic...');
          const allData = await chrome.storage.local.get(null) as any;
          const queue = allData.queue || [];
          const vaultKeys = Object.keys(allData).filter(k => k.startsWith('vault:'));

          console.log(`[Diagnostic] Queue size: ${queue.length}`);
          console.log(`[Diagnostic] Queue IDs: ${queue.map((i: any) => i.id).join(', ')}`);
          console.log(`[Diagnostic] Vault entries: ${vaultKeys.length}`);

          sendResponse({
            success: true,
            data: {
              queueLength: queue.length,
              queueIds: queue.map((i: any) => i.id),
              vaultCount: vaultKeys.length,
              storageUsage: JSON.stringify(allData).length // Rough byte count
            }
          });
          break;
        }

        case 'CMD_APPEND_TO_OBJECT': {
          const { spaceId, objectId, content, metadata } = message.payload;
          console.log(`[Service Worker] CMD_APPEND_TO_OBJECT: object=${objectId}, space=${spaceId}`);

          // Get API key from storage
          const authData = await chrome.storage.local.get('auth');
          const apiKey = (authData as any).auth?.apiKey;

          if (!apiKey) {
            throw new Error('Not authenticated');
          }


          // Use AppendService (imported at top of file)
          const appendService = AppendService.getInstance();

          const result = await appendService.appendToObject(
            spaceId,
            objectId,
            content,
            metadata,
            apiKey
          );

          if (result.success) {
            console.log(`[Service Worker] Append successful: ${objectId}`);
            sendResponse({ success: true, data: result });
          } else {
            throw new Error(result.error || 'Append failed');
          }
          break;
        }

        default:
          console.warn('Unknown message type:', (message as any).type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      if (QueueManager.shouldQueue(error)) {
        console.info(`[Service Worker] Message ${message.type} failed (Anytype offline): ${error instanceof Error ? error.message : 'Network error'}`);
      } else {
        console.error('Message handler error:', error);
      }
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  handleAsync();
  return true; // Keep channel open for async response
});

