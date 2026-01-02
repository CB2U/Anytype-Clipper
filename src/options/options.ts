import { StorageManager } from '../lib/storage/storage-manager';
import { ImageHandlingSettings } from '../types/image';

// Restore options from storage
async function restoreOptions() {
    try {
        const settings = await StorageManager.getInstance().getImageHandlingSettings();

        const prefSelect = document.getElementById('imagePreference') as HTMLSelectElement;
        const maxInput = document.getElementById('maxImages') as HTMLInputElement;

        if (prefSelect) prefSelect.value = settings.preference;
        if (maxInput) maxInput.value = String(settings.maxEmbeddedImages);
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// Save options to storage
async function saveOptions() {
    const prefSelect = document.getElementById('imagePreference') as HTMLSelectElement;
    const maxInput = document.getElementById('maxImages') as HTMLInputElement;
    const status = document.getElementById('status') as HTMLElement;

    try {
        // Get current defaults to merge (so we don't lose other props like threshold/quality which lack UI currently)
        const current = await StorageManager.getInstance().getImageHandlingSettings();

        const newSettings: ImageHandlingSettings = {
            ...current,
            preference: prefSelect.value as any,
            maxEmbeddedImages: parseInt(maxInput.value, 10) || 20,
        };

        await StorageManager.getInstance().setImageHandlingSettings(newSettings);

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
