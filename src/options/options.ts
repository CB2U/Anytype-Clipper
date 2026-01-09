/**
 * Options Page Logic for Anytype Clipper Extension
 * 
 * Handles all user interactions on the options page including:
 * - Loading and saving settings
 * - Fetching and caching Spaces
 * - Testing API connection
 * - Form validation
 * - Clear all data operation
 */

import { loadSettings, saveSettings, validatePort, validateMaxAttempts, calculateBackoffIntervals, loadCachedSpaces, saveCachedSpaces } from '../lib/storage/settings-manager-v2';
import { Settings, CachedSpaces } from '../types/settings';
import { StorageManager } from '../lib/storage/storage-manager';

// DOM Elements
const elements = {
    // Default Spaces
    defaultSpaceBookmark: document.getElementById('defaultSpaceBookmark') as HTMLSelectElement,
    defaultSpaceHighlight: document.getElementById('defaultSpaceHighlight') as HTMLSelectElement,
    defaultSpaceArticle: document.getElementById('defaultSpaceArticle') as HTMLSelectElement,
    defaultSpaceNote: document.getElementById('defaultSpaceNote') as HTMLSelectElement,
    defaultSpaceTask: document.getElementById('defaultSpaceTask') as HTMLSelectElement,
    refreshSpaces: document.getElementById('refreshSpaces') as HTMLButtonElement,
    spacesStatus: document.getElementById('spacesStatus') as HTMLSpanElement,

    // Object Types
    defaultObjectTypeBookmark: document.getElementById('defaultObjectTypeBookmark') as HTMLSelectElement,
    defaultObjectTypeHighlight: document.getElementById('defaultObjectTypeHighlight') as HTMLSelectElement,
    defaultObjectTypeArticle: document.getElementById('defaultObjectTypeArticle') as HTMLSelectElement,
    lastUsedBookmark: document.getElementById('lastUsedBookmark') as HTMLParagraphElement,
    lastUsedHighlight: document.getElementById('lastUsedHighlight') as HTMLParagraphElement,
    lastUsedArticle: document.getElementById('lastUsedArticle') as HTMLParagraphElement,
    refreshObjectTypes: document.getElementById('refreshObjectTypes') as HTMLButtonElement,
    objectTypesStatus: document.getElementById('objectTypesStatus') as HTMLSpanElement,

    // Retry Behavior
    maxAttempts: document.getElementById('maxAttempts') as HTMLInputElement,
    retrySchedule: document.getElementById('retrySchedule') as HTMLParagraphElement,

    // Deduplication
    deduplicationEnabled: document.getElementById('deduplicationEnabled') as HTMLInputElement,

    // API Configuration
    apiPort: document.getElementById('apiPort') as HTMLInputElement,
    testConnection: document.getElementById('testConnection') as HTMLButtonElement,
    connectionStatus: document.getElementById('connectionStatus') as HTMLSpanElement,

    // Image Handling
    imageStrategyRadios: document.getElementsByName('imageStrategy') as NodeListOf<HTMLInputElement>,
    maxImages: document.getElementById('maxImages') as HTMLInputElement,
    includeJSON: document.getElementById('includeJSON') as HTMLInputElement,

    // Privacy
    privacyMode: document.getElementById('privacyMode') as HTMLInputElement,

    // Data Management
    clearAllData: document.getElementById('clearAllData') as HTMLButtonElement,
    confirmDialog: document.getElementById('confirmDialog') as HTMLDivElement,
    confirmClear: document.getElementById('confirmClear') as HTMLInputElement,
    confirmClearButton: document.getElementById('confirmClearButton') as HTMLButtonElement,
    cancelClear: document.getElementById('cancelClear') as HTMLButtonElement,

    // Actions
    save: document.getElementById('save') as HTMLButtonElement,
    status: document.getElementById('status') as HTMLSpanElement,
};

/**
 * Initialize the options page
 */
async function init() {
    try {
        // Load settings
        const settings = await loadSettings();

        // Fetch Spaces FIRST (needed for Object Types)
        await fetchSpaces();

        // THEN fetch Object Types (requires spaces to be cached)
        await fetchObjectTypes();

        // Populate form with settings
        populateForm(settings);

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('[Options] Initialization error:', error);
        showStatus('Error loading settings', 'error');
    }
}

/**
 * Populate form with current settings
 */
function populateForm(settings: Settings) {
    // Default Spaces
    if (elements.defaultSpaceBookmark) elements.defaultSpaceBookmark.value = settings.defaultSpaces.bookmark || '';
    if (elements.defaultSpaceHighlight) elements.defaultSpaceHighlight.value = settings.defaultSpaces.highlight || '';
    if (elements.defaultSpaceArticle) elements.defaultSpaceArticle.value = settings.defaultSpaces.article || '';
    if (elements.defaultSpaceNote) elements.defaultSpaceNote.value = settings.defaultSpaces.note || '';
    if (elements.defaultSpaceTask) elements.defaultSpaceTask.value = settings.defaultSpaces.task || '';

    // Retry Behavior
    if (elements.maxAttempts) {
        elements.maxAttempts.value = String(settings.retry.maxAttempts);
        updateRetrySchedule(settings.retry.maxAttempts);
    }

    // Deduplication
    if (elements.deduplicationEnabled) {
        elements.deduplicationEnabled.checked = settings.deduplication.enabled;
    }

    // API Configuration
    if (elements.apiPort) {
        elements.apiPort.value = String(settings.api.port);
    }

    // Image Handling
    elements.imageStrategyRadios.forEach(radio => {
        if (radio.value === settings.images.strategy) {
            radio.checked = true;
        }
    });

    // Privacy
    if (elements.privacyMode) {
        elements.privacyMode.checked = settings.privacy.mode;
    }

    // Object Types - populate defaults
    if (elements.defaultObjectTypeBookmark) {
        elements.defaultObjectTypeBookmark.value = settings.objectTypes.defaults.bookmark;
    }
    if (elements.defaultObjectTypeHighlight) {
        elements.defaultObjectTypeHighlight.value = settings.objectTypes.defaults.highlight;
    }
    if (elements.defaultObjectTypeArticle) {
        elements.defaultObjectTypeArticle.value = settings.objectTypes.defaults.article;
    }

    // Display last-used Object Types
    displayLastUsedObjectTypes(settings);

    // Image settings (legacy from existing options page)
    const storageManager = StorageManager.getInstance();
    storageManager.getImageHandlingSettings().then(imageSettings => {
        if (elements.maxImages) {
            elements.maxImages.value = String(imageSettings.maxEmbeddedImages || 20);
        }
    });

    storageManager.getExtensionSettings().then(extensionSettings => {
        if (elements.includeJSON) {
            elements.includeJSON.checked = extensionSettings.includeJSONForDataTables || false;
        }
    });
}

/**
 * Fetch Spaces from Anytype API
 */
async function fetchSpaces() {
    try {
        showSpacesStatus('Loading Spaces...', 'loading');

        // Use service worker to fetch Spaces (same as popup)
        const response = await chrome.runtime.sendMessage({ type: 'CMD_GET_SPACES' });

        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to fetch Spaces');
        }

        const spaces = response.data || [];

        // Cache the Spaces
        const cachedSpaces: CachedSpaces = {
            spaces: spaces.map((s: any) => ({
                id: s.id,
                name: s.name,
                icon: s.iconEmoji || s.icon,
            })),
            lastFetched: Date.now(),
        };
        await saveCachedSpaces(cachedSpaces);

        // Populate dropdowns
        populateSpaceDropdowns(cachedSpaces.spaces);
        showSpacesStatus('Spaces loaded', 'success');

    } catch (error) {
        console.error('[Options] Error fetching Spaces:', error);

        // Try to load from cache
        const cached = await loadCachedSpaces();
        if (cached && cached.spaces.length > 0) {
            populateSpaceDropdowns(cached.spaces);
            showSpacesStatus('Using cached Spaces (offline)', 'error');
        } else {
            showSpacesStatus('Failed to load Spaces', 'error');
        }
    }
}

/**
 * Populate Space dropdowns
 */
function populateSpaceDropdowns(spaces: Array<{ id: string; name: string; icon?: string }>) {
    const dropdowns = [
        elements.defaultSpaceBookmark,
        elements.defaultSpaceHighlight,
        elements.defaultSpaceArticle,
        elements.defaultSpaceNote,
        elements.defaultSpaceTask,
    ];

    dropdowns.forEach(dropdown => {
        if (!dropdown) return;

        // Clear existing options except "No default"
        dropdown.innerHTML = '<option value="">No default</option>';

        // Add Space options
        spaces.forEach(space => {
            const option = document.createElement('option');
            option.value = space.id;
            option.textContent = space.name;
            dropdown.appendChild(option);
        });
    });
}

/**
 * Fetch Object Types from Anytype API
 */
async function fetchObjectTypes() {
    try {
        showObjectTypesStatus('Loading Object Types...', 'loading');

        // Try to get a space ID from cached spaces
        const cached = await loadCachedSpaces();
        let spaceId: string | null = null;

        if (cached && cached.spaces.length > 0) {
            spaceId = cached.spaces[0].id;
        } else {
            // If no cached spaces, try to get from settings
            const settings = await loadSettings();
            const defaultSpaces = settings.defaultSpaces;
            spaceId = defaultSpaces.bookmark || defaultSpaces.highlight || defaultSpaces.article || null;
        }

        if (!spaceId) {
            // No space available - try to use cached Object Types from settings
            console.warn('[Options] No space available, using cached Object Types');
            const { getCachedObjectTypes } = await import('../lib/storage/settings-manager-v2');
            const cachedTypes = await getCachedObjectTypes();

            if (cachedTypes && cachedTypes.length > 0) {
                populateObjectTypeDropdowns(cachedTypes);
                showObjectTypesStatus('Using cached types', 'success');
                return;
            }

            showObjectTypesStatus('No spaces available - please configure spaces first', 'error');
            return;
        }

        // Fetch Object Types via service worker
        const response = await chrome.runtime.sendMessage({
            type: 'CMD_GET_OBJECT_TYPES',
            payload: { spaceId }
        });

        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to fetch Object Types');
        }

        const objectTypes = response.data || [];
        if (objectTypes.length === 0) {
            showObjectTypesStatus('No Object Types found', 'error');
            return;
        }

        populateObjectTypeDropdowns(objectTypes);
        showObjectTypesStatus('Object Types loaded', 'success');

    } catch (error) {
        console.error('[Options] Error fetching Object Types:', error);

        // Try to use cached Object Types as final fallback
        try {
            const { getCachedObjectTypes } = await import('../lib/storage/settings-manager-v2');
            const cachedTypes = await getCachedObjectTypes();

            if (cachedTypes && cachedTypes.length > 0) {
                populateObjectTypeDropdowns(cachedTypes);
                showObjectTypesStatus('Using cached types (offline)', 'error');
                return;
            }
        } catch (cacheError) {
            console.error('[Options] Failed to load cached types:', cacheError);
        }

        showObjectTypesStatus('Failed to load Object Types', 'error');
    }
}

/**
 * Populate Object Type dropdowns
 */
function populateObjectTypeDropdowns(objectTypes: Array<any>) {
    const dropdowns = [
        elements.defaultObjectTypeBookmark,
        elements.defaultObjectTypeHighlight,
        elements.defaultObjectTypeArticle,
    ];

    dropdowns.forEach(dropdown => {
        if (!dropdown) return;

        // Store current value
        const currentValue = dropdown.value;

        // Clear existing options
        dropdown.innerHTML = '';

        // Add Object Type options
        objectTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.key;
            const icon = type.icon?.emoji || '';
            option.textContent = icon ? `${icon} ${type.name}` : type.name;
            dropdown.appendChild(option);
        });

        // Restore previous value if it exists
        if (currentValue && Array.from(dropdown.options).some(opt => opt.value === currentValue)) {
            dropdown.value = currentValue;
        }
    });
}

/**
 * Display last-used Object Types
 */
function displayLastUsedObjectTypes(settings: Settings) {
    const modes: Array<{ mode: 'bookmark' | 'highlight' | 'article', element: HTMLParagraphElement }> = [
        { mode: 'bookmark', element: elements.lastUsedBookmark },
        { mode: 'highlight', element: elements.lastUsedHighlight },
        { mode: 'article', element: elements.lastUsedArticle },
    ];

    modes.forEach(({ mode, element }) => {
        if (!element) return;

        const lastUsed = settings.objectTypes.lastUsed[mode];
        if (lastUsed) {
            element.textContent = `Last used: ${lastUsed}`;
            element.style.color = '#888';
        } else {
            element.textContent = '';
        }
    });
}

/**
 * Update retry schedule display
 */
function updateRetrySchedule(maxAttempts: number) {
    if (!elements.retrySchedule) return;

    const intervals = calculateBackoffIntervals(maxAttempts);
    const formatted = intervals.map(ms => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${ms / 1000}s`;
        return `${ms / 60000}m`;
    }).join(', ');

    elements.retrySchedule.textContent = formatted;
}

/**
 * Test API connection
 */
async function testConnection() {
    const port = parseInt(elements.apiPort.value, 10);

    if (!validatePort(port)) {
        showConnectionStatus('Invalid port number', 'error');
        return;
    }

    try {
        showConnectionStatus('Testing connection...', 'loading');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`http://localhost:${port}/api/v1/health`, {
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            showConnectionStatus('✓ Connection successful', 'success');
        } else {
            showConnectionStatus('✗ Connection failed', 'error');
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            showConnectionStatus('✗ Connection timeout', 'error');
        } else {
            showConnectionStatus('✗ Connection failed', 'error');
        }
    }
}

/**
 * Validate form inputs
 */
function validateForm(): boolean {
    let isValid = true;

    // Validate port
    const port = parseInt(elements.apiPort.value, 10);
    if (!validatePort(port)) {
        elements.apiPort.setCustomValidity('Port must be between 1 and 65535');
        isValid = false;
    } else {
        elements.apiPort.setCustomValidity('');
    }

    // Validate max attempts
    const maxAttempts = parseInt(elements.maxAttempts.value, 10);
    if (!validateMaxAttempts(maxAttempts)) {
        elements.maxAttempts.setCustomValidity('Max attempts must be between 1 and 20');
        isValid = false;
    } else {
        elements.maxAttempts.setCustomValidity('');
    }

    return isValid;
}

/**
 * Save settings
 */
async function saveSettingsHandler() {
    try {
        // Validate form
        if (!validateForm()) {
            showStatus('Please fix validation errors', 'error');
            return;
        }

        showStatus('Saving settings...', 'loading');

        // Gather settings from form
        const currentSettings = await loadSettings();
        const settings: Settings = {
            ...currentSettings,
            version: 2,
            defaultSpaces: {
                bookmark: elements.defaultSpaceBookmark.value || null,
                highlight: elements.defaultSpaceHighlight.value || null,
                article: elements.defaultSpaceArticle.value || null,
                note: elements.defaultSpaceNote.value || null,
                task: elements.defaultSpaceTask.value || null,
            },
            retry: {
                maxAttempts: parseInt(elements.maxAttempts.value, 10),
                backoffIntervals: calculateBackoffIntervals(parseInt(elements.maxAttempts.value, 10)),
            },
            deduplication: {
                enabled: elements.deduplicationEnabled.checked,
            },
            api: {
                port: parseInt(elements.apiPort.value, 10),
            },
            images: {
                strategy: Array.from(elements.imageStrategyRadios).find(r => r.checked)?.value as any || 'smart',
            },
            privacy: {
                mode: elements.privacyMode.checked,
            },
            objectTypes: {
                defaults: {
                    bookmark: elements.defaultObjectTypeBookmark.value || 'bookmark',
                    highlight: elements.defaultObjectTypeHighlight.value || 'note',
                    article: elements.defaultObjectTypeArticle.value || 'page',
                },
                lastUsed: currentSettings.objectTypes.lastUsed,
                cached: currentSettings.objectTypes.cached,
                lastFetchedAt: currentSettings.objectTypes.lastFetchedAt,
            },
        };

        // Save settings
        await saveSettings(settings);

        // Save legacy image settings
        const storageManager = StorageManager.getInstance();
        const currentImage = await storageManager.getImageHandlingSettings();
        await storageManager.setImageHandlingSettings({
            ...currentImage,
            preference: settings.images.strategy,
            maxEmbeddedImages: parseInt(elements.maxImages.value, 10) || 20,
        });

        // Save extension settings
        const currentExtension = await storageManager.getExtensionSettings();
        await storageManager.setExtensionSettings({
            ...currentExtension,
            includeJSONForDataTables: elements.includeJSON.checked,
        });

        showStatus('✓ Settings saved', 'success');
    } catch (error) {
        console.error('[Options] Error saving settings:', error);
        showStatus('✗ Error saving settings', 'error');
    }
}

/**
 * Clear all data
 */
async function clearAllDataHandler() {
    // Show confirmation dialog
    elements.confirmDialog.style.display = 'flex';
}

/**
 * Confirm clear all data
 */
async function confirmClearHandler() {
    try {
        const storageManager = StorageManager.getInstance();
        await storageManager.clear();

        // Redirect to authentication
        chrome.runtime.sendMessage({ type: 'CLEAR_DATA_COMPLETE' });

        // Close dialog and show success
        elements.confirmDialog.style.display = 'none';
        showStatus('✓ All data cleared', 'success');

        // Redirect to popup (which will show auth flow)
        setTimeout(() => {
            window.location.href = chrome.runtime.getURL('src/popup/popup.html');
        }, 1500);
    } catch (error) {
        console.error('[Options] Error clearing data:', error);
        showStatus('✗ Error clearing data', 'error');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Refresh Spaces
    elements.refreshSpaces?.addEventListener('click', fetchSpaces);

    // Refresh Object Types
    elements.refreshObjectTypes?.addEventListener('click', fetchObjectTypes);

    // Max attempts change
    elements.maxAttempts?.addEventListener('input', () => {
        const value = parseInt(elements.maxAttempts.value, 10);
        if (validateMaxAttempts(value)) {
            updateRetrySchedule(value);
        }
    });

    // Test connection
    elements.testConnection?.addEventListener('click', testConnection);

    // Save settings
    elements.save?.addEventListener('click', saveSettingsHandler);

    // Clear all data
    elements.clearAllData?.addEventListener('click', clearAllDataHandler);
    elements.cancelClear?.addEventListener('click', () => {
        elements.confirmDialog.style.display = 'none';
        elements.confirmClear.checked = false;
    });

    // Confirm checkbox
    elements.confirmClear?.addEventListener('change', () => {
        elements.confirmClearButton.disabled = !elements.confirmClear.checked;
    });

    // Confirm clear button
    elements.confirmClearButton?.addEventListener('click', confirmClearHandler);
}

/**
 * Show status message
 */
function showStatus(message: string, type: 'success' | 'error' | 'loading') {
    if (!elements.status) return;

    elements.status.textContent = message;
    elements.status.className = `status show ${type}`;

    if (type !== 'loading') {
        setTimeout(() => {
            elements.status.classList.remove('show');
        }, 3000);
    }
}

/**
 * Show Spaces status message
 */
function showSpacesStatus(message: string, type: 'success' | 'error' | 'loading') {
    if (!elements.spacesStatus) return;

    elements.spacesStatus.textContent = message;
    elements.spacesStatus.className = `status show ${type}`;

    if (type !== 'loading') {
        setTimeout(() => {
            elements.spacesStatus.classList.remove('show');
        }, 3000);
    }
}

/**
 * Show connection status message
 */
function showConnectionStatus(message: string, type: 'success' | 'error' | 'loading') {
    if (!elements.connectionStatus) return;

    elements.connectionStatus.textContent = message;
    elements.connectionStatus.className = `status show ${type}`;

    if (type !== 'loading') {
        setTimeout(() => {
            elements.connectionStatus.classList.remove('show');
        }, 3000);
    }
}

/**
 * Show Object Types status message
 */
function showObjectTypesStatus(message: string, type: 'success' | 'error' | 'loading') {
    if (!elements.objectTypesStatus) return;

    elements.objectTypesStatus.textContent = message;
    elements.objectTypesStatus.className = `status show ${type}`;

    if (type !== 'loading') {
        setTimeout(() => {
            elements.objectTypesStatus.classList.remove('show');
        }, 3000);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
