import { AuthManager, AuthStatus } from '../lib/auth/auth-manager';
import { TagAutocomplete } from './components/tag-autocomplete';
import { SuggestedTags } from './components/suggested-tags';
import { TagSuggestionService } from '../lib/services/tag-suggestion-service';
import { QueueStatusSection } from './components/QueueStatusSection';
import { NotificationContainer } from './components/notification';
import notificationService from '../lib/notifications/notification-service';


// DOM Elements
const views = {
  loading: document.getElementById('loading-view'),
  auth: document.getElementById('auth-view'),
  main: document.getElementById('main-view'),
};

const authElements = {
  btnConnect: document.getElementById('btn-connect') as HTMLButtonElement,
  challengeSection: document.getElementById('challenge-section'),
  inputCode: document.getElementById('input-code') as HTMLInputElement,
  btnVerify: document.getElementById('btn-verify') as HTMLButtonElement,
  errorMsg: document.getElementById('auth-error'),
  desc: document.getElementById('auth-desc'),
  actionSection: document.getElementById('action-section'),
};

const mainElements = {
  header: document.querySelector('.header'),
  btnSettings: document.getElementById('btn-settings') as HTMLButtonElement,
  btnDisconnect: document.getElementById('btn-disconnect') as HTMLButtonElement,
  spaceSelector: document.getElementById('space-selector') as HTMLSelectElement,
  formContainer: document.getElementById('bookmark-form-placeholder'),
  queuePlaceholder: document.getElementById('queue-status-placeholder') as HTMLDivElement,

  // Form Elements
  inputTitle: document.getElementById('input-title') as HTMLInputElement,
  inputNote: document.getElementById('input-note') as HTMLTextAreaElement,
  inputTags: document.getElementById('input-tags') as HTMLInputElement,
  btnSave: document.getElementById('btn-save') as HTMLButtonElement,
  btnSaveArticle: document.getElementById('btn-save-article') as HTMLButtonElement,
  statusMsg: document.getElementById('save-status'),

  // Highlight Specific
  highlightFields: document.getElementById('highlight-fields'),
  bookmarkFields: document.getElementById('bookmark-fields'),
  inputQuote: document.getElementById('input-quote') as HTMLTextAreaElement,
  displayContext: document.getElementById('display-context'),
  tagContainer: document.getElementById('tag-autocomplete-container') as HTMLDivElement,
  tagChips: document.getElementById('tag-chips') as HTMLDivElement,

  // Metadata Preview
  metadataPreview: document.getElementById('metadata-preview'),
  metaAuthor: document.getElementById('meta-author'),
  metaSite: document.getElementById('meta-site'),
};

const authManager = AuthManager.getInstance();

// State
let currentTab: chrome.tabs.Tab | null = null;
let currentHighlight: any = null;
let currentMetadata: any = null;
let tagAutocomplete: TagAutocomplete | null = null;
let suggestedTags: SuggestedTags | null = null;
let tagSuggestionService: TagSuggestionService | null = null;
let queueSection: QueueStatusSection | null = null;
let queueUpdateTimer: any = null;
let notificationContainer: NotificationContainer | null = null;

// --- Space Management ---

interface Space {
  id: string;
  name: string;
  iconEmoji?: string;
}

async function loadSpaces() {
  try {
    // 1. Get Spaces from Background
    const response = await chrome.runtime.sendMessage({ type: 'CMD_GET_SPACES' });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to fetch spaces');
    }

    const spaces: Space[] = response.data;
    const isCached = !!response.cached;

    // 2. Clear loading state
    if (mainElements.spaceSelector) {
      mainElements.spaceSelector.innerHTML = '';
      mainElements.spaceSelector.disabled = false;

      if (isCached) {
        console.info('[Popup] Using cached spaces (offline mode)');
        // Optional: show a small info indicator
      }
    }

    if (spaces.length === 0) {
      const option = document.createElement('option');
      option.text = 'No spaces found';
      mainElements.spaceSelector?.add(option);
      if (mainElements.spaceSelector) mainElements.spaceSelector.disabled = true;
      return;
    }

    // 3. Populate Dropdown
    spaces.forEach(space => {
      const option = document.createElement('option');
      option.value = space.id;
      option.text = `${space.iconEmoji || '🟦'} ${space.name}`;
      mainElements.spaceSelector?.add(option);
    });

    // 4. Restore Selection
    const storage = await chrome.storage.local.get(['lastSelectedSpaceId']);
    if (storage.lastSelectedSpaceId && mainElements.spaceSelector) {
      mainElements.spaceSelector.value = storage.lastSelectedSpaceId as string;
    }

    // Fallback: If persisted value invalid, select first
    if (mainElements.spaceSelector && !mainElements.spaceSelector.value && spaces.length > 0) {
      mainElements.spaceSelector.value = spaces[0].id;
    }

    // Save initial default if none selected
    persistSpaceSelection();

    // Update Tag Autocomplete
    if (tagAutocomplete && mainElements.spaceSelector) {
      tagAutocomplete.setSpaceId(mainElements.spaceSelector.value);
    }

  } catch (error) {
    console.error('Failed to load spaces:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (mainElements.spaceSelector) {
      mainElements.spaceSelector.innerHTML = `<option disabled>Error: ${errorMessage}</option>`;
    }

    if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('auth')) {
      showError('Authentication failed. Please reconnect.');
    } else {
      showError(`Could not load spaces: ${errorMessage}`);
    }
  }
}

function persistSpaceSelection() {
  const selectedId = mainElements.spaceSelector?.value;
  if (selectedId) {
    chrome.storage.local.set({ lastSelectedSpaceId: selectedId });
    if (tagAutocomplete) {
      tagAutocomplete.setSpaceId(selectedId);
    }
  }
}

// --- Bookmark Form ---

async function loadCurrentTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      currentTab = tabs[0];
    }

    // 1. Check for highlight capture FIRST
    const data = await chrome.storage.local.get('lastHighlight');
    if (data.lastHighlight) {
      console.log('[Popup] Highlight detected, skipping article extraction');
      currentHighlight = data.lastHighlight;

      // Switch to highlight mode UI
      mainElements.bookmarkFields?.classList.add('hidden');
      mainElements.highlightFields?.classList.remove('hidden');
      if (mainElements.btnSave) mainElements.btnSave.textContent = 'Save Highlight';

      if (tagAutocomplete) {
        tagAutocomplete.setObjectTypeId('Note');
      }

      // Populate fields
      if (mainElements.inputQuote) mainElements.inputQuote.value = currentHighlight.quote;
      if (mainElements.inputTitle) mainElements.inputTitle.value = currentHighlight.pageTitle || currentTab?.title || '';
      if (mainElements.displayContext) {
        const before = currentHighlight.contextBefore ? `...${currentHighlight.contextBefore}` : '';
        const after = currentHighlight.contextAfter ? `${currentHighlight.contextAfter}...` : '';
        mainElements.displayContext.innerHTML = `<span style="opacity: 0.6">${before}</span> <strong style="color: #000">${currentHighlight.quote}</strong> <span style="opacity: 0.6">${after}</span>`;
      }

      // Clear the temporary highlight from storage so it doesn't persist inappropriately
      await chrome.storage.local.remove('lastHighlight');

      // T1-T2: Extract metadata and generate tag suggestions for highlights
      try {
        const metaResponse = await chrome.runtime.sendMessage({ type: 'CMD_EXTRACT_METADATA' });
        if (metaResponse && metaResponse.success) {
          currentMetadata = metaResponse.data;
          await generateTagSuggestions();
        }
      } catch (error) {
        console.warn('[Popup] Tag suggestion generation failed for highlight:', error);
        // Silently fail - suggestions are optional
      }

      return; // Exit early, no need for further extraction
    }

    // 2. Trigger metadata and article extraction (only if NOT a highlight)
    if (currentTab && currentTab.id) {
      try {
        // Try Extract Article first
        // Try Extract Article first
        const articleResponse = await chrome.runtime.sendMessage({ type: 'CMD_EXTRACT_ARTICLE' });
        if (articleResponse && articleResponse.success && articleResponse.data?.article) {
          const result = articleResponse.data;
          // Map ArticleExtractionResult to PageMetadata for consistent usage
          currentMetadata = {
            title: result.article.title,
            description: result.article.excerpt, // Use excerpt for description
            content: result.article.markdown || result.article.textContent,
            textContent: result.article.textContent,
            author: result.article.byline,
            siteName: result.article.siteName,
            language: result.article.lang,
            canonicalUrl: currentTab.url,
            imageCount: result.metadata.imageCount,
            embeddedImageCount: result.metadata.embeddedImageCount
          };
          updateMetadataUI();

          // Generate tag suggestions
          await generateTagSuggestions();

          // Show Save as Article button
          if (mainElements.btnSaveArticle) {
            mainElements.btnSaveArticle.classList.remove('hidden');
          }
        } else {
          // Fallback to basic metadata
          const metaResponse = await chrome.runtime.sendMessage({ type: 'CMD_EXTRACT_METADATA' });
          if (metaResponse && metaResponse.success) {
            currentMetadata = metaResponse.data;
            updateMetadataUI();
            await generateTagSuggestions();
          }
        }
      } catch (e) {
        console.warn('Extraction failed:', e);
        // Fallback to basic tab info
        if (mainElements.inputTitle) mainElements.inputTitle.value = currentTab.title || '';

        // Even if extraction failed, try basic metadata fallback
        try {
          const metaResponse = await chrome.runtime.sendMessage({ type: 'CMD_EXTRACT_METADATA' });
          if (metaResponse && metaResponse.success) {
            currentMetadata = metaResponse.data;
            updateMetadataUI();
            await generateTagSuggestions();
          }
        } catch (ignored) { }
      }
    } else if (currentTab) {
      if (mainElements.inputTitle) mainElements.inputTitle.value = currentTab.title || '';
    }
  } catch (error) {
    console.error('Error loading tab info:', error);
  }
}

function updateMetadataUI() {
  if (!currentMetadata) return;

  if (mainElements.inputTitle) mainElements.inputTitle.value = currentMetadata.title || '';
  if (mainElements.inputNote && currentMetadata.description) {
    mainElements.inputNote.value = currentMetadata.description;
  }

  // Preview fields
  if (mainElements.metadataPreview) {
    let hasPreview = false;

    if (currentMetadata.author && mainElements.metaAuthor) {
      mainElements.metaAuthor.textContent = `👤 ${currentMetadata.author}`;
      mainElements.metaAuthor.classList.remove('hidden');
      hasPreview = true;
    } else if (mainElements.metaAuthor) {
      mainElements.metaAuthor.classList.add('hidden');
    }

    if (currentMetadata.siteName && mainElements.metaSite) {
      mainElements.metaSite.textContent = `🌐 ${currentMetadata.siteName}`;
      mainElements.metaSite.classList.remove('hidden');
      hasPreview = true;
    } else if (mainElements.metaSite) {
      mainElements.metaSite.classList.add('hidden');
    }

    if (hasPreview) {
      mainElements.metadataPreview.classList.remove('hidden');
    } else {
      mainElements.metadataPreview.classList.add('hidden');
    }
  }
}

/**
 * Generate and display tag suggestions based on current metadata and URL
 */
async function generateTagSuggestions() {
  if (!tagSuggestionService || !suggestedTags || !currentMetadata || !currentTab?.url) {
    return;
  }

  try {
    const result = await tagSuggestionService.suggestTags(currentMetadata, currentTab.url);
    suggestedTags.setSuggestions(result.suggestions);
  } catch (error) {
    console.error('[Popup] Error generating tag suggestions:', error);
    // Silently fail - suggestions are optional
  }
}

async function handleSaveArticle() {
  await handleSave(true);
}

async function handleSave(isArticle: boolean = false, skipDeduplication: boolean = false) {
  if (!currentTab || !currentTab.url) {
    showStatus('Error: No active tab found', true);
    return;
  }

  const spaceId = mainElements.spaceSelector?.value;
  if (!spaceId) {
    showStatus('Please select a space', true);
    return;
  }

  const title = mainElements.inputTitle?.value || currentTab.title || 'Untitled';
  const note = mainElements.inputNote?.value || '';
  const tags = tagAutocomplete ? tagAutocomplete.getSelectedTags() :
    (mainElements.inputTags?.value.split(',').map(t => t.trim()).filter(t => t.length > 0) || []);

  // Disable buttons
  const activeBtn = isArticle ? mainElements.btnSaveArticle : mainElements.btnSave;
  if (mainElements.btnSave) mainElements.btnSave.disabled = true;
  if (mainElements.btnSaveArticle) mainElements.btnSaveArticle.disabled = true;

  if (activeBtn) {
    activeBtn.textContent = 'Saving...';
  }

  const isHighlight = !!currentHighlight;
  try {
    // If we don't have metadata yet (failed or still loading), create a minimal one
    if (!currentMetadata) {
      currentMetadata = {
        title: title,
        canonicalUrl: currentTab.url,
        source: 'fallback'
      };
    } else {
      // Update with user-edited title
      currentMetadata.title = title;
    }

    const payload: any = {
      spaceId,
      metadata: currentMetadata,
      userNote: note,
      tags: tags,
      isHighlightCapture: isHighlight,
      skipDeduplication: skipDeduplication // Pass skipDeduplication flag
    };

    if (isArticle) {
      payload.type_key = 'note';
    }

    if (isHighlight) {
      payload.type_key = 'note';
      payload.quote = currentHighlight.quote;
      payload.contextBefore = currentHighlight.contextBefore;
      payload.contextAfter = currentHighlight.contextAfter;
      payload.url = currentHighlight.url;

      // Ensure metadata is minimal for highlights to avoid article content leaks
      payload.metadata = {
        title: title,
        canonicalUrl: currentHighlight.url,
        source: 'highlight'
      };
    }

    const response = await chrome.runtime.sendMessage({
      type: 'CMD_CAPTURE_BOOKMARK',
      payload
    });

    if (response && response.success) {
      // T5: Handle duplicate detection response
      if (response.data?.duplicate && response.data?.existingObject) {
        const existing = response.data.existingObject;
        const createdDate = new Date(existing.createdAt).toLocaleDateString();

        // Show custom 3-button duplicate dialog
        showDuplicateDialog(existing, createdDate, isArticle, skipDeduplication);
        return;
      }

      // Normal success flow
      if (response.data?.queued) {
        notificationService.createNotification({
          id: crypto.randomUUID(),
          type: 'info',
          severity: 'low',
          title: 'Capture queued',
          message: 'Will sync when Anytype is available',
          autoDismiss: 5000,
          timestamp: Date.now(),
        });
      } else {
        const imgStats = (isArticle && currentMetadata.imageCount)
          ? ` (${currentMetadata.embeddedImageCount}/${currentMetadata.imageCount} images embedded)`
          : '';

        const title = isHighlight ? 'Highlight saved' :
          (isArticle ? `Article saved${imgStats}` : 'Bookmark saved');

        notificationService.createNotification({
          id: crypto.randomUUID(),
          type: 'success',
          severity: 'low',
          title,
          message: 'Open Anytype to view your capture',
          autoDismiss: 5000,
          timestamp: Date.now(),
        });
      }
    } else {
      throw new Error(response?.error || 'Unknown error');
    }

  } catch (error) {
    console.error('Save failed:', error);

    // Use error sanitizer for user-friendly error messages
    import('../lib/utils/error-sanitizer').then(({ sanitizeError }) => {
      const sanitized = sanitizeError(error as Error);

      notificationService.createNotification({
        id: crypto.randomUUID(),
        type: 'error',
        severity: 'high',
        title: sanitized.message,
        message: sanitized.nextSteps,
        autoDismiss: null, // Manual dismiss only for errors
        timestamp: Date.now(),
      });
    });
  } finally {
    if (mainElements.btnSave) {
      mainElements.btnSave.disabled = false;
      mainElements.btnSave.textContent = isHighlight ? 'Save Highlight' : 'Save Bookmark';
    }
    if (mainElements.btnSaveArticle) {
      mainElements.btnSaveArticle.disabled = false;
      mainElements.btnSaveArticle.textContent = 'Save as Article';
    }
  }
}

function showStatus(msg: string, isError: boolean) {
  if (mainElements.statusMsg) {
    mainElements.statusMsg.textContent = msg;
    mainElements.statusMsg.className = isError ? 'status-message error' : 'status-message success';
    mainElements.statusMsg.classList.remove('hidden');
  }
}

/**
 * Show custom 3-button duplicate detection dialog
 */
function showDuplicateDialog(existing: any, createdDate: string, isArticle: boolean, skipDeduplication: boolean) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  // Create dialog
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;

  dialog.innerHTML = `
    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">⚠️ Duplicate Detected</h3>
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
      This URL already exists in your Anytype:
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 500;">
      "${existing.title}"<br>
      <span style="font-size: 12px; color: #999;">Saved on ${createdDate}</span>
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">
      What would you like to do?
    </p>
    <div style="display: flex; gap: 8px; flex-direction: column;">
      <button id="btn-append" class="btn btn-primary" style="width: 100%;">Append to Existing</button>
      <button id="btn-create-anyway" class="btn btn-secondary" style="width: 100%;">Create Anyway</button>
      <button id="btn-skip" class="btn btn-secondary" style="width: 100%;">Skip</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Handle button clicks
  const btnAppend = dialog.querySelector('#btn-append') as HTMLButtonElement;
  const btnCreateAnyway = dialog.querySelector('#btn-create-anyway') as HTMLButtonElement;
  const btnSkip = dialog.querySelector('#btn-skip') as HTMLButtonElement;

  btnAppend.addEventListener('click', async () => {
    document.body.removeChild(overlay);
    console.log('[Popup] User chose: Append to Existing');
    await handleAppend(existing.id, isArticle);
  });

  btnCreateAnyway.addEventListener('click', async () => {
    document.body.removeChild(overlay);
    console.log('[Popup] User chose: Create Anyway');
    await handleSave(isArticle, true); // Retry with skipDeduplication=true
  });

  btnSkip.addEventListener('click', () => {
    document.body.removeChild(overlay);
    console.log('[Popup] User chose: Skip');
    showStatus('Capture cancelled (duplicate URL)', false);

    // Re-enable buttons
    if (mainElements.btnSave) {
      mainElements.btnSave.disabled = false;
      mainElements.btnSave.textContent = currentHighlight ? 'Save Highlight' : 'Save Bookmark';
    }
    if (mainElements.btnSaveArticle) {
      mainElements.btnSaveArticle.disabled = false;
      mainElements.btnSaveArticle.textContent = 'Save as Article';
    }
  });
}

/**
 * Handle appending content to existing object
 */
async function handleAppend(objectId: string, isArticle: boolean) {
  if (!currentTab || !currentTab.url) {
    showStatus('Error: No active tab found', true);
    return;
  }

  const spaceId = mainElements.spaceSelector?.value;
  if (!spaceId) {
    showStatus('Please select a space', true);
    return;
  }

  try {
    // Prepare content to append
    let content = '';
    const isHighlight = !!currentHighlight;

    if (isHighlight) {
      // For highlights, format as blockquote with context
      content = `"${currentHighlight.quote}"`;
      if (currentHighlight.contextBefore || currentHighlight.contextAfter) {
        content += `\n\n**Context:** ${currentHighlight.contextBefore || ''}**[HIGHLIGHT]**${currentHighlight.contextAfter || ''}`;
      }
      const userNote = mainElements.inputNote?.value;
      if (userNote) {
        content += `\n\n**Note:** ${userNote}`;
      }
    } else if (isArticle && currentMetadata?.content) {
      // For articles, use full markdown content
      content = currentMetadata.content;
      const userNote = mainElements.inputNote?.value;
      if (userNote) {
        content = `${userNote}\n\n${content}`;
      }
    } else {
      // For bookmarks, use note
      content = mainElements.inputNote?.value || 'Bookmark saved';
    }

    // Prepare metadata
    const metadata = {
      url: currentTab.url,
      pageTitle: mainElements.inputTitle?.value || currentTab.title || 'Untitled',
      timestamp: new Date().toISOString(),
      captureType: (isHighlight ? 'highlight' : (isArticle ? 'article' : 'bookmark')) as 'highlight' | 'article' | 'bookmark'
    };

    // Send append command to service worker
    const response = await chrome.runtime.sendMessage({
      type: 'CMD_APPEND_TO_OBJECT',
      payload: {
        spaceId,
        objectId,
        content,
        metadata
      }
    });

    if (response && response.success) {
      showStatus(
        isHighlight ? 'Highlight Appended! 🎉' :
          (isArticle ? 'Article Appended! 🎉' : 'Content Appended! 🎉'),
        false
      );
    } else {
      throw new Error(response?.error || 'Append failed');
    }

  } catch (error) {
    console.error('Append failed:', error);
    showStatus(`Error: ${error instanceof Error ? error.message : 'Append failed'}`, true);
  } finally {
    // Re-enable buttons
    if (mainElements.btnSave) {
      mainElements.btnSave.disabled = false;
      mainElements.btnSave.textContent = currentHighlight ? 'Save Highlight' : 'Save Bookmark';
    }
    if (mainElements.btnSaveArticle) {
      mainElements.btnSaveArticle.disabled = false;
      mainElements.btnSaveArticle.textContent = 'Save as Article';
    }
  }
}



// Listen for changes
mainElements.spaceSelector?.addEventListener('change', persistSpaceSelection);


// Simple router
function switchView(viewName: 'loading' | 'auth' | 'main') {
  Object.values(views).forEach(el => el?.classList.add('hidden'));
  views[viewName]?.classList.remove('hidden');
}

// Error handling
function showError(msg: string) {
  if (authElements.errorMsg) {
    authElements.errorMsg.textContent = msg;
    authElements.errorMsg.classList.remove('hidden');
  }
}

function hideError() {
  authElements.errorMsg?.classList.add('hidden');
}

// Auth Flow
async function handleConnect() {
  // If we are in a popup (not a full tab), open a new tab to ensure persistence/UX
  if (!window.location.search.includes('tab=true')) {
    chrome.tabs.create({ url: 'src/popup/popup.html?tab=true&autoConnect=true' });
    window.close();
    return;
  }

  // We are in the tab, proceed with auth
  hideError();
  authElements.btnConnect.disabled = true;
  authElements.btnConnect.textContent = 'Connecting...';

  // 1. Request Challenge
  const state = await authManager.startAuth();

  processAuthState(state);
}

function processAuthState(state: any) {
  if (state.status === AuthStatus.Error) {
    showError(state.error || 'Failed to start auth');
    resetAuthUI();
    return;
  }

  if (state.status === AuthStatus.WaitingForUser) {
    // 2. Show Input Field
    authElements.challengeSection?.classList.remove('hidden');
    authElements.actionSection?.classList.add('hidden'); // Hide connect button
    if (authElements.desc) authElements.desc.textContent = 'Check Anytype Desktop for the 4-digit code.';

    // Focus input
    authElements.inputCode?.focus();
  }
}

async function handleVerify() {
  const code = authElements.inputCode?.value;
  if (!code || code.length !== 4) {
    showError('Please enter a valid 4-digit code');
    return;
  }

  hideError();
  if (authElements.btnVerify) {
    authElements.btnVerify.disabled = true;
    authElements.btnVerify.textContent = 'Verifying...';
  }

  const finalState = await authManager.submitCode(code);

  if (finalState.status === AuthStatus.Authenticated) {
    // Success!

    // If we are in the dedicated auth tab, close it upon success
    if (window.location.search.includes('tab=true')) {
      window.close();
      return;
    }

    switchView('main');
    loadSpaces();
    loadCurrentTab();
  } else {
    showError(finalState.error || 'Verification failed');
    if (authElements.btnVerify) {
      authElements.btnVerify.disabled = false;
      authElements.btnVerify.textContent = 'Verify';
    }
  }
}



function resetAuthUI() {
  authElements.btnConnect.disabled = false;
  authElements.btnConnect.textContent = 'Connect';
  authElements.challengeSection?.classList.add('hidden');
  authElements.actionSection?.classList.remove('hidden');
  if (authElements.inputCode) authElements.inputCode.value = '';
  if (authElements.btnVerify) {
    authElements.btnVerify.disabled = false;
    authElements.btnVerify.textContent = 'Verify';
  }
  if (authElements.desc) authElements.desc.textContent = 'Open Anytype Desktop on this device and click Connect to start.';
}

async function handleDisconnect() {
  await authManager.disconnect();
  switchView('auth');
  resetAuthUI();
}

// Initialization
async function init() {
  try {
    console.log('[Popup] Init start');

    // Initialize notification container
    notificationContainer = new NotificationContainer('top');
    notificationContainer.mount(document.body);

    // Subscribe to notification events
    notificationService.subscribe((event) => {
      if (event.type === 'notification:create' && notificationContainer) {
        notificationContainer.addNotification(
          event.payload,
          (id) => notificationService.dismissNotification(id),
          (id, action) => {
            // Handle notification actions
            console.log('[Popup] Notification action:', action, id);
            notificationService.dismissNotification(id);
          }
        );
      } else if (event.type === 'notification:dismiss' && notificationContainer) {
        notificationContainer.removeNotification(event.payload.id);
      }
    });

    const state = await authManager.init();
    console.log('[Popup] Init state:', state);

    if (state.status === AuthStatus.Authenticated) {
      // If authenticating in a tab and successful (maybe restored), close tab?
      // No, user might want to see it was successful. Only close on explicit verify action.
      // Or if checking storage. But let's keep it simple.
      switchView('main');
      loadSpaces();
      loadCurrentTab();
    } else {
      switchView('auth');

      // Check for restored state (WaitingForUser) from persistence
      if (state.status === AuthStatus.WaitingForUser) {
        console.log('[Popup] Restoring WaitingForUser state');
        processAuthState(state);
      }

      // Check for auto-connect request
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autoConnect') === 'true' && state.status !== AuthStatus.WaitingForUser) {
        console.log('[Popup] AutoConnect detected');
        handleConnect();
      }
    }

  } catch (error) {
    console.error('Init error:', error);
    switchView('auth');
    showError('Application error. Please reinstall extension.');
  }
}

// --- Queue Management ---

async function loadQueue() {
  if (queueUpdateTimer) {
    clearTimeout(queueUpdateTimer);
  }

  queueUpdateTimer = setTimeout(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CMD_GET_QUEUE' });
      if (response && response.success && queueSection) {
        queueSection.updateProps({
          items: response.data,
          onRetry: handleRetryQueueItem,
          onDelete: handleDeleteQueueItem
        });
      }
    } catch (error) {
      console.warn('Failed to load queue:', error);
    } finally {
      queueUpdateTimer = null;
    }
  }, 100);
}

async function handleRetryQueueItem(id: string) {
  try {
    await chrome.runtime.sendMessage({
      type: 'CMD_RETRY_QUEUE_ITEM',
      payload: { id }
    });
    await loadQueue();
  } catch (error) {
    console.error('Retry failed:', error);
  }
}

async function handleDeleteQueueItem(id: string) {
  try {
    await chrome.runtime.sendMessage({
      type: 'CMD_DELETE_QUEUE_ITEM',
      payload: { id }
    });
    await loadQueue();
  } catch (error) {
    console.error('Delete failed:', error);
  }
}

function initQueueUI() {
  if (mainElements.queuePlaceholder) {
    queueSection = new QueueStatusSection(mainElements.queuePlaceholder, {
      items: [],
      onRetry: handleRetryQueueItem,
      onDelete: handleDeleteQueueItem
    });
    loadQueue();

    // Subscribe to storage changes for queue
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.queue) {
        loadQueue();
      }
    });
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  init();
  initQueueUI();
  authElements.btnConnect?.addEventListener('click', handleConnect);
  authElements.btnVerify?.addEventListener('click', handleVerify);
  mainElements.btnDisconnect?.addEventListener('click', handleDisconnect);
  mainElements.btnSettings?.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('src/options/options.html'));
    }
  });

  mainElements.btnSave?.addEventListener('click', () => handleSave(false));
  mainElements.btnSaveArticle?.addEventListener('click', handleSaveArticle);

  // Initialize tag autocomplete
  if (mainElements.inputTags && mainElements.tagContainer && mainElements.tagChips) {
    tagAutocomplete = new TagAutocomplete(
      mainElements.inputTags,
      mainElements.tagContainer,
      mainElements.tagChips
    );
  }

  // Initialize tag suggestion service and UI
  tagSuggestionService = new TagSuggestionService();
  const suggestedTagsContainer = document.getElementById('suggested-tags');
  if (suggestedTagsContainer && tagAutocomplete) {
    suggestedTags = new SuggestedTags(suggestedTagsContainer, tagAutocomplete);
  }
});
