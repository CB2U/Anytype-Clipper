/**
 * Context Menu Handler for Anytype Clipper Extension
 * 
 * Centralizes context menu registration and click event handling.
 * Provides three context menu actions:
 * - Send selection to Anytype (text selection only)
 * - Clip article to Anytype (full page)
 * - Bookmark to Anytype (current page)
 */

// Menu item IDs
export const MENU_IDS = {
    SEND_SELECTION: 'send-selection-to-anytype',
    CLIP_ARTICLE: 'clip-article-to-anytype',
    BOOKMARK_PAGE: 'bookmark-to-anytype',
} as const;

/**
 * Register all context menu items
 * Called on extension install/update
 */
export function registerContextMenus(): void {
    console.log('[ContextMenu] Registering context menu items...');

    // Remove any existing menu items to avoid duplicates
    chrome.contextMenus.removeAll(() => {
        // 1. Send selection to Anytype (only visible when text is selected)
        chrome.contextMenus.create({
            id: MENU_IDS.SEND_SELECTION,
            title: 'Send selection to Anytype',
            contexts: ['selection'],
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('[ContextMenu] Error creating selection menu:', chrome.runtime.lastError);
            } else {
                console.log('[ContextMenu] Selection menu registered');
            }
        });

        // 2. Clip article to Anytype (always visible on pages)
        chrome.contextMenus.create({
            id: MENU_IDS.CLIP_ARTICLE,
            title: 'Clip article to Anytype',
            contexts: ['page'],
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('[ContextMenu] Error creating article menu:', chrome.runtime.lastError);
            } else {
                console.log('[ContextMenu] Article menu registered');
            }
        });

        // 3. Bookmark to Anytype (always visible on pages)
        chrome.contextMenus.create({
            id: MENU_IDS.BOOKMARK_PAGE,
            title: 'Bookmark to Anytype',
            contexts: ['page'],
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('[ContextMenu] Error creating bookmark menu:', chrome.runtime.lastError);
            } else {
                console.log('[ContextMenu] Bookmark menu registered');
            }
        });
    });
}

/**
 * Handle context menu click events
 * Routes clicks to appropriate capture handlers
 */
export async function handleContextMenuClick(
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab
): Promise<void> {
    console.log(`[ContextMenu] Menu item clicked: ${info.menuItemId}`);

    if (!tab || !tab.id) {
        console.error('[ContextMenu] No valid tab information');
        return;
    }

    try {
        switch (info.menuItemId) {
            case MENU_IDS.SEND_SELECTION:
                await handleSelectionCapture(info, tab);
                break;
            case MENU_IDS.CLIP_ARTICLE:
                await handleArticleCapture(info, tab);
                break;
            case MENU_IDS.BOOKMARK_PAGE:
                await handleBookmarkCapture(info, tab);
                break;
            default:
                console.warn(`[ContextMenu] Unknown menu item: ${info.menuItemId}`);
        }
    } catch (error) {
        console.error('[ContextMenu] Error handling menu click:', error);
        // Show error notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'Anytype Clipper Error',
            message: `Failed to capture content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
    }
}

/**
 * Handle "Send selection to Anytype" click
 * Captures selected text with context
 */
async function handleSelectionCapture(
    info: chrome.contextMenus.OnClickData,
    tab: chrome.tabs.Tab
): Promise<void> {
    console.log('[ContextMenu] Handling selection capture');

    const selectionText = info.selectionText;
    if (!selectionText) {
        console.error('[ContextMenu] No selection text available');
        return;
    }

    // Send message to content script to get full context
    // The existing highlight capture flow will handle this
    chrome.tabs.sendMessage(tab.id!, {
        command: 'CAPTURE_HIGHLIGHT',
        payload: {
            quote: selectionText,
            pageUrl: tab.url,
            pageTitle: tab.title,
        },
    });

    console.log('[ContextMenu] Selection capture initiated');
}

/**
 * Handle "Clip article to Anytype" click
 * Triggers article extraction
 */
async function handleArticleCapture(
    _info: chrome.contextMenus.OnClickData,
    _tab: chrome.tabs.Tab
): Promise<void> {
    console.log('[ContextMenu] Handling article capture');

    // Open popup to trigger article extraction
    // The popup will handle the extraction flow
    chrome.action.openPopup();

    console.log('[ContextMenu] Article capture initiated (popup opened)');
}

/**
 * Handle "Bookmark to Anytype" click
 * Captures current page as bookmark
 */
async function handleBookmarkCapture(
    info: chrome.contextMenus.OnClickData,
    tab: chrome.tabs.Tab
): Promise<void> {
    console.log('[ContextMenu] Handling bookmark capture');

    // Open popup to complete bookmark capture
    // The popup will handle the actual capture flow
    chrome.action.openPopup();

    console.log('[ContextMenu] Bookmark capture initiated (popup opened)');
}
