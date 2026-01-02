import { AuthManager, AuthStatus } from '../lib/auth/auth-manager';
import { TagAutocomplete } from './components/tag-autocomplete';


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
  btnDisconnect: document.getElementById('btn-disconnect') as HTMLButtonElement,
  spaceSelector: document.getElementById('space-selector') as HTMLSelectElement,
  formContainer: document.getElementById('bookmark-form-placeholder'),

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

    // 2. Clear loading state
    if (mainElements.spaceSelector) {
      mainElements.spaceSelector.innerHTML = '';
      mainElements.spaceSelector.disabled = false;
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
          };
          updateMetadataUI();

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

async function handleSaveArticle() {
  await handleSave(true);
}

async function handleSave(isArticle: boolean = false) {
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
      isHighlightCapture: isHighlight
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
      showStatus(
        isHighlight ? 'Highlight Saved! 🎉' :
          (isArticle ? 'Article Saved! 🎉' : 'Bookmark Saved! 🎉'),
        false
      );
    } else {
      throw new Error(response?.error || 'Unknown error');
    }

  } catch (error) {
    console.error('Save failed:', error);
    showStatus(`Error: ${error instanceof Error ? error.message : 'Save failed'}`, true);
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  init();
  authElements.btnConnect?.addEventListener('click', handleConnect);
  authElements.btnVerify?.addEventListener('click', handleVerify);
  mainElements.btnDisconnect?.addEventListener('click', handleDisconnect);
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
});
