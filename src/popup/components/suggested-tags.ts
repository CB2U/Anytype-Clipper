/**
 * Suggested Tags UI Component
 * 
 * Displays tag suggestions from domain, meta keywords, and content analysis
 * Allows one-click addition to selected tags
 */

import type { TagAutocomplete } from './tag-autocomplete';

export class SuggestedTags {
    private container: HTMLElement;
    private tagAutocomplete: TagAutocomplete;
    private suggestions: string[] = [];

    constructor(container: HTMLElement, tagAutocomplete: TagAutocomplete) {
        this.container = container;
        this.tagAutocomplete = tagAutocomplete;
    }

    /**
     * Update and render suggested tags
     * @param suggestions - Array of suggested tag names (lowercase, without #)
     */
    public setSuggestions(suggestions: string[]) {
        this.suggestions = suggestions;
        this.render();
    }

    /**
     * Clear all suggestions
     */
    public clear() {
        this.suggestions = [];
        this.render();
    }

    /**
     * Add a suggested tag to the selected tags
     */
    private async addTag(tagName: string) {
        // Get existing selected tags to avoid duplicates
        const selectedTags = this.tagAutocomplete.getSelectedTags();

        // Check if tag is already selected (case-insensitive)
        if (selectedTags.some(t => t.toLowerCase() === tagName.toLowerCase())) {
            console.log(`[SuggestedTags] Tag "${tagName}" already selected`);
            return;
        }

        try {
            // Use the public API to add the tag
            await this.tagAutocomplete.addTagByName(tagName);

            // Remove from suggestions after adding
            this.suggestions = this.suggestions.filter(s => s !== tagName);
            this.render();
        } catch (error) {
            console.error(`[SuggestedTags] Error adding tag "${tagName}":`, error);
        }
    }

    /**
     * Render the suggested tags UI
     */
    private render() {
        // Clear container
        this.container.innerHTML = '';

        if (this.suggestions.length === 0) {
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'block';

        // Create header
        const header = document.createElement('div');
        header.className = 'suggested-tags-header';
        header.textContent = 'Suggested Tags:';
        this.container.appendChild(header);

        // Create chips container
        const chipsContainer = document.createElement('div');
        chipsContainer.className = 'suggested-tags-chips';

        this.suggestions.forEach(tagName => {
            const chip = document.createElement('button');
            chip.className = 'suggested-tag-chip';
            chip.type = 'button';
            chip.innerHTML = `
                <span class="suggested-tag-name">${tagName}</span>
                <span class="suggested-tag-add">+</span>
            `;

            chip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.addTag(tagName);
            });

            chipsContainer.appendChild(chip);
        });

        this.container.appendChild(chipsContainer);
    }
}
