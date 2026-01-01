import { Tag } from '../../lib/tags/types';
import { TagService } from '../../lib/tags/tag-service';

/**
 * UI Component for Tag Autocomplete and Selection
 * Handles dropdown logic, keyboard navigation, and inline tag creation.
 */
export class TagAutocomplete {
    private input: HTMLInputElement;
    private dropdown: HTMLDivElement;
    private chipsContainer: HTMLDivElement;
    private tagService: TagService;
    private spaceId: string = '';
    private objectTypeId: string = 'Bookmark';
    private allTags: Tag[] = [];
    private selectedTags: Tag[] = [];
    private highlightedIndex: number = -1;
    private isLoading: boolean = false;

    constructor(
        input: HTMLInputElement,
        dropdownContainer: HTMLElement,
        chipsContainer: HTMLDivElement
    ) {
        this.input = input;
        this.chipsContainer = chipsContainer;
        this.tagService = TagService.getInstance();

        // Create dropdown element
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'tag-dropdown hidden';
        dropdownContainer.appendChild(this.dropdown);

        this.initEvents();
    }

    /**
     * Updates the current space ID and clears the tag list to force a reload
     */
    public setSpaceId(spaceId: string) {
        if (this.spaceId !== spaceId) {
            this.spaceId = spaceId;
            this.allTags = [];
            this.selectedTags = []; // Clear selections for new space
            this.renderChips();
            this.render();
        }
    }

    /**
     * Updates the object type ID for property resolution
     */
    public setObjectTypeId(typeId: string) {
        this.objectTypeId = typeId;
    }

    /**
     * Returns the names of currently selected tags
     */
    public getSelectedTags(): string[] {
        return this.selectedTags.map(t => t.name);
    }

    /**
     * Clears all selections and input
     */
    public clear() {
        this.selectedTags = [];
        this.input.value = '';
        this.renderChips();
        this.render();
    }

    private initEvents() {
        this.input.addEventListener('focus', () => this.handleFocus());
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!this.input.contains(target) && !this.dropdown.contains(target)) {
                this.hideDropdown();
            }
        });
    }

    private async handleFocus() {
        if (!this.spaceId) return;
        if (this.allTags.length === 0) {
            await this.loadTags();
        }
        this.showDropdown();
        this.render();
    }

    private handleInput() {
        this.highlightedIndex = -1;
        this.showDropdown();
        this.render();
    }

    private handleKeyDown(e: KeyboardEvent) {
        if (this.dropdown.classList.contains('hidden')) {
            if (e.key === 'ArrowDown') {
                this.showDropdown();
            }
            return;
        }

        const options = this.dropdown.querySelectorAll('.tag-option');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.highlightedIndex = Math.min(this.highlightedIndex + 1, options.length - 1);
            this.updateHighlight();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
            this.updateHighlight();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.highlightedIndex >= 0) {
                (options[this.highlightedIndex] as HTMLElement).click();
            } else if (this.input.value.trim()) {
                this.createTag(this.input.value.trim());
            }
        } else if (e.key === 'Escape') {
            this.hideDropdown();
        } else if (e.key === 'Backspace' && !this.input.value && this.selectedTags.length > 0) {
            this.removeTag(this.selectedTags[this.selectedTags.length - 1]);
        }
    }

    private async loadTags(force: boolean = false) {
        if (this.isLoading) return;
        this.isLoading = true;
        this.render();

        try {
            this.allTags = await this.tagService.getTags(this.spaceId, this.objectTypeId, force);
            this.render();
        } catch (error: any) {
            console.error('Failed to load tags for autocomplete:', error);
            this.dropdown.innerHTML = `<div class="tag-error">Failed: ${error.message || 'Unknown error'}</div>`;
        } finally {
            this.isLoading = false;
        }
    }

    private async createTag(name: string) {
        if (this.isLoading || !name) return;
        this.isLoading = true;
        this.input.disabled = true;
        this.render();

        try {
            const newTag = await this.tagService.createTag(this.spaceId, this.objectTypeId, name);
            this.allTags.push(newTag);
            this.selectTag(newTag);
            this.input.value = '';
            this.hideDropdown();
        } catch (error) {
            console.error('Failed to create tag:', error);
            alert(`Failed to create tag "${name}". Please try again.`);
        } finally {
            this.isLoading = false;
            this.input.disabled = false;
            this.input.focus();
            this.render();
        }
    }

    private selectTag(tag: Tag) {
        if (!this.selectedTags.find(t => t.id === tag.id)) {
            this.selectedTags.push(tag);
            this.renderChips();
        }
        this.input.value = '';
        this.hideDropdown();
    }

    private removeTag(tag: Tag) {
        this.selectedTags = this.selectedTags.filter(t => t.id !== tag.id);
        this.renderChips();
    }

    private showDropdown() {
        this.dropdown.classList.remove('hidden');
    }

    private hideDropdown() {
        this.dropdown.classList.add('hidden');
        this.highlightedIndex = -1;
    }

    private updateHighlight() {
        const options = this.dropdown.querySelectorAll('.tag-option');
        options.forEach((opt, i) => {
            if (i === this.highlightedIndex) {
                opt.classList.add('highlighted');
                (opt as HTMLElement).scrollIntoView({ block: 'nearest' });
            } else {
                opt.classList.remove('highlighted');
            }
        });
    }

    private render() {
        if (this.isLoading && this.allTags.length === 0) {
            this.dropdown.innerHTML = '<div class="tag-loading">Loading tags...</div>';
            return;
        }

        const query = this.input.value.toLowerCase().trim();
        const filtered = this.allTags.filter(t =>
            t.name.toLowerCase().includes(query) &&
            !this.selectedTags.find(st => st.id === t.id)
        );

        this.dropdown.innerHTML = '';

        if (filtered.length === 0 && !query) {
            if (this.allTags.length === 0 && !this.isLoading) {
                this.dropdown.innerHTML = `
                    <div class="tag-empty">
                        No tags found 
                        <a href="#" class="tag-retry-link">Retry</a>
                    </div>
                `;
                this.dropdown.querySelector('.tag-retry-link')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.loadTags(true);
                });
            } else {
                this.hideDropdown();
            }
            return;
        }

        filtered.forEach(tag => {
            const el = document.createElement('div');
            el.className = 'tag-option';
            el.innerHTML = `
                <div class="tag-color" style="background-color: ${tag.color || '#ccc'}"></div>
                <span class="tag-name">${tag.name}</span>
            `;
            el.addEventListener('click', () => this.selectTag(tag));
            this.dropdown.appendChild(el);
        });

        // Add "Create new" option if query doesn't exactly match any existing tag
        if (query && !this.allTags.find(t => t.name.toLowerCase() === query)) {
            const createEl = document.createElement('div');
            createEl.className = 'tag-option create-option';
            createEl.innerHTML = `<span class="tag-name">Create "${query}"</span>`;
            createEl.addEventListener('click', () => this.createTag(query));
            this.dropdown.appendChild(createEl);
        }

        if (this.dropdown.innerHTML === '') {
            this.hideDropdown();
        }
    }

    private renderChips() {
        this.chipsContainer.innerHTML = '';
        this.selectedTags.forEach(tag => {
            const chip = document.createElement('div');
            chip.className = 'tag-chip';
            chip.innerHTML = `
                <div class="tag-color-dot" style="background-color: ${tag.color || '#ccc'}"></div>
                <span>${tag.name}</span>
                <span class="remove-tag">&times;</span>
            `;
            chip.querySelector('.remove-tag')?.addEventListener('click', () => this.removeTag(tag));
            this.chipsContainer.appendChild(chip);
        });
    }
}
