import { StorageManager } from '../lib/storage/storage-manager';
import { ImageHandlingSettings } from '../types/image';

// Restore options from storage
async function restoreOptions() {
    try {
        const storageManager = StorageManager.getInstance();
        const imageSettings = await storageManager.getImageHandlingSettings();
        const extensionSettings = await storageManager.getExtensionSettings();

        const prefSelect = document.getElementById('imagePreference') as HTMLSelectElement;
        const maxInput = document.getElementById('maxImages') as HTMLInputElement;

        // Restore Image Settings
        if (prefSelect) prefSelect.value = imageSettings.preference;
        if (maxInput) maxInput.value = String(imageSettings.maxEmbeddedImages);

        // Restore Table Settings
        const includeJSON = extensionSettings.includeJSONForDataTables || false;
        const checkbox = document.getElementById('includeJSON') as HTMLInputElement;
        if (checkbox) checkbox.checked = includeJSON;

    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// Save options to storage
async function saveOptions() {
    const prefSelect = document.getElementById('imagePreference') as HTMLSelectElement;
    const maxInput = document.getElementById('maxImages') as HTMLInputElement;
    const status = document.getElementById('status') as HTMLElement;

    // Get including JSON setting
    const checkbox = document.getElementById('includeJSON') as HTMLInputElement;
    const includeJSONForDataTables = checkbox?.checked || false;

    try {
        const storageManager = StorageManager.getInstance();

        // Save Image Settings
        const currentImage = await storageManager.getImageHandlingSettings();
        const newImageSettings: ImageHandlingSettings = {
            ...currentImage,
            preference: prefSelect.value as any,
            maxEmbeddedImages: parseInt(maxInput.value, 10) || 20,
        };
        await storageManager.setImageHandlingSettings(newImageSettings);

        // Save Extension Settings (Table Options)
        const currentExtension = await storageManager.getExtensionSettings();
        const newExtensionSettings = {
            ...currentExtension,
            includeJSONForDataTables
        };
        await storageManager.setExtensionSettings(newExtensionSettings);

        // Update status to let user know options were saved.
        status.textContent = 'Options saved.';
        status.classList.add('show');
        setTimeout(() => {
            status.classList.remove('show');
        }, 1500);
    } catch (error) {
        console.error('Failed to save settings:', error);
        status.textContent = 'Error saving settings.';
        status.classList.add('show');
    }
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save')?.addEventListener('click', saveOptions);
