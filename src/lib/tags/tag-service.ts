import { AnytypeApiClient } from '../api/client';
import { StorageManager } from '../storage/storage-manager';
import { Tag } from './types';
import { TAG_PROPERTY_IDS } from '../utils/constants';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Service for managing tags across spaces and properties.
 * Handles caching, property ID discovery, and tag creation.
 */
export class TagService {
    private static instance: TagService;
    private apiClient: AnytypeApiClient;
    private storage: StorageManager;

    private constructor() {
        this.apiClient = new AnytypeApiClient();
        this.storage = StorageManager.getInstance();
    }

    public static getInstance(): TagService {
        if (!TagService.instance) {
            TagService.instance = new TagService();
        }
        return TagService.instance;
    }

    /**
     * Syncs the API key from storage to the API client.
     * Should be called before making API requests.
     */
    private async syncAuthState(): Promise<void> {
        const authData = await this.storage.get('auth');
        if (authData && authData.apiKey) {
            this.apiClient.setApiKey(authData.apiKey);
        }
    }

    /**
     * Gets tags for a specific space and object type.
     * Handles caching and property ID resolution.
     */
    public async getTags(spaceId: string, objectTypeId: string, force: boolean = false): Promise<Tag[]> {
        // Ensure we have the API key
        await this.syncAuthState();

        const propertyId = await this.resolvePropertyId(spaceId, objectTypeId);

        // Check cache (unless forced)
        const tagCache = await this.storage.get('tagCache');
        if (!force) {
            const entry = tagCache ? tagCache[spaceId] : undefined;

            if (entry && entry.propertyId === propertyId && (Date.now() - entry.timestamp < CACHE_TTL_MS)) {
                return entry.tags;
            }
        }

        // Auth check before API call
        const auth = await this.storage.get('auth');
        if (!auth || !auth.apiKey) {
            throw new Error('Not authenticated');
        }
        this.apiClient.setApiKey(auth.apiKey);

        // Fetch from API
        try {
            return await this.fetchTagsWithFallback(spaceId, propertyId, tagCache, objectTypeId);
        } catch (error) {
            console.error('Failed to fetch tags:', error);
            // Rethrow to let UI handle it
            throw error;
        }
    }

    /**
     * Helper to fetch tags with a fallback for the property ID if 'tag' fails
     */
    private async fetchTagsWithFallback(spaceId: string, propertyId: string, tagCache: any, objectTypeId: string): Promise<Tag[]> {
        try {
            const response = await this.apiClient.listTags(spaceId, propertyId);
            let tags = this.extractTags(response);
            let actualPropertyId = propertyId;

            // If we get 0 tags, try the other common ID just in case this one is valid but empty
            if (tags.length === 0 && propertyId === 'tag') {
                try {
                    const altRes = await this.apiClient.listTags(spaceId, 'tags');
                    const altTags = this.extractTags(altRes);
                    if (altTags.length > 0) {
                        tags = altTags;
                        actualPropertyId = 'tags';
                        await this.updatePropertyMapping(spaceId, objectTypeId, actualPropertyId);
                    }
                } catch (e) { /* ignore fallback error if first one succeeded */ }
            }

            if (tags.length === 0) {
                console.log(`No tags found for property "${actualPropertyId}" in space "${spaceId}". Raw response:`, response);
            }

            // Update cache
            const newCache = { ...(tagCache || {}) };
            newCache[spaceId] = {
                tags,
                timestamp: Date.now(),
                propertyId: actualPropertyId
            };
            await this.storage.set('tagCache', newCache);

            return tags;
        } catch (error: any) {
            // Try alternative property ID if we haven't already
            const isNotFoundError = error.status === 404 || (error.status === 400 && error.message?.includes('property'));

            // Log full error for diagnostic purposes
            console.error(`Error fetching tags for property "${propertyId}":`, error);

            if (isNotFoundError) {
                const fallbackPropertyId = propertyId === 'tag' ? 'tags' : 'tag';
                console.warn(`Property ID "${propertyId}" failed, trying "${fallbackPropertyId}" fallback...`);
                try {
                    const response = await this.apiClient.listTags(spaceId, fallbackPropertyId);
                    const tags = this.extractTags(response);

                    // Update mappings permanently for this space and object type
                    await this.updatePropertyMapping(spaceId, objectTypeId, fallbackPropertyId);

                    // Update cache
                    const newCache = { ...(tagCache || {}) };
                    newCache[spaceId] = {
                        tags,
                        timestamp: Date.now(),
                        propertyId: fallbackPropertyId
                    };
                    await this.storage.set('tagCache', newCache);

                    return tags;
                } catch (fallbackError) {
                    throw error;
                }
            }
            throw error;
        }
    }

    private async updatePropertyMapping(spaceId: string, objectTypeId: string, propertyId: string) {
        const mappings = (await this.storage.get('tagPropertyMappings')) || {};
        if (!mappings[spaceId]) mappings[spaceId] = {};
        mappings[spaceId][objectTypeId] = propertyId;
        await this.storage.set('tagPropertyMappings', mappings);
    }

    /**
     * Creates a new tag in a specific space.
     */
    public async createTag(spaceId: string, objectTypeId: string, name: string): Promise<Tag> {
        // Ensure we have the API key
        await this.syncAuthState();

        const propertyId = await this.resolvePropertyId(spaceId, objectTypeId);

        try {
            // Pick a default color as it's required by the API
            const defaultColor = 'blue';
            return await this.createTagWithFallback(spaceId, propertyId, name, defaultColor, objectTypeId);
        } catch (error) {
            console.error('Failed to create tag:', error);
            throw error;
        }
    }

    private async createTagWithFallback(spaceId: string, propertyId: string, name: string, color: string, objectTypeId: string): Promise<Tag> {
        try {
            const response = await this.apiClient.createTag(spaceId, propertyId, {
                Name: name,
                Color: color
            });
            const newTag = response.tag;

            // Invalidate cache
            const tagCache = await this.storage.get('tagCache');
            if (tagCache && tagCache[spaceId]) {
                const newCache = { ...tagCache };
                delete newCache[spaceId];
                await this.storage.set('tagCache', newCache);
            }

            return newTag;
        } catch (error: any) {
            const isNotFoundError = error.status === 404 || (error.status === 400 && error.message?.includes('property'));
            if (isNotFoundError) {
                const fallbackPropertyId = propertyId === 'tag' ? 'tags' : 'tag';
                console.warn(`Tag property "${propertyId}" failed during creation, trying "${fallbackPropertyId}" fallback...`);
                try {
                    const response = await this.apiClient.createTag(spaceId, fallbackPropertyId, {
                        Name: name,
                        Color: color
                    });

                    await this.updatePropertyMapping(spaceId, objectTypeId, fallbackPropertyId);

                    // Invalidate cache
                    const tagCache = await this.storage.get('tagCache');
                    if (tagCache && tagCache[spaceId]) {
                        const newCache = { ...tagCache };
                        delete newCache[spaceId];
                        await this.storage.set('tagCache', newCache);
                    }

                    return response.tag;
                } catch (fallbackError) {
                    throw error;
                }
            }
            throw error;
        }
    }

    /**
     * Resolves the property ID (relation key) for tags based on object type.
     */
    private async resolvePropertyId(spaceId: string, objectTypeId: string): Promise<string> {
        // 1. Check persistent mappings in storage (space-aware learned mappings)
        const mappings = await this.storage.get('tagPropertyMappings');
        if (mappings && mappings[spaceId] && mappings[spaceId][objectTypeId]) {
            return mappings[spaceId][objectTypeId];
        }

        // 2. Dynamic Discovery: Fetch properties from the space to find the tag relation
        try {
            const res = await this.apiClient.listProperties(spaceId);
            const properties = res.data || [];

            // Case A: Look for properties exactly named "Tag" or "Tags"
            const exactTag = properties.find(p => p.name.toLowerCase() === 'tag' || p.name.toLowerCase() === 'tags');
            if (exactTag) {
                console.log(`Dynamic discovery: Found exact tag property "${exactTag.name}" with ID "${exactTag.id}"`);
                await this.updatePropertyMapping(spaceId, objectTypeId, exactTag.id);
                return exactTag.id;
            }

            // Case B: Look for properties with format 'tag' or 'multi-select' containing "tag" in the name
            const likelyTag = properties.find(p =>
                (p.format === 'tag' || p.format === 'multi-select') &&
                p.name.toLowerCase().includes('tag')
            );
            if (likelyTag) {
                console.log(`Dynamic discovery: Found likely tag property "${likelyTag.name}" with ID "${likelyTag.id}"`);
                await this.updatePropertyMapping(spaceId, objectTypeId, likelyTag.id);
                return likelyTag.id;
            }
        } catch (error) {
            console.warn('Dynamic property discovery failed, falling back to guesses:', error);
        }

        // 3. Fallback: Check hardcoded constants (default guesses)
        if (TAG_PROPERTY_IDS[objectTypeId]) {
            return TAG_PROPERTY_IDS[objectTypeId];
        }

        // 4. Ultimate fallback
        return 'tag';
    }

    /**
     * Resiliently extracts a Tag array from various possible API response structures.
     */
    private extractTags(response: any): Tag[] {
        if (!response) return [];

        // CASE 1: Flat array
        if (Array.isArray(response)) return response;

        // CASE 2: Nested in 'data' field (Official docs)
        if (response.data && Array.isArray(response.data)) return response.data;

        // CASE 3: Nested in 'tags' field (Alternative versions)
        if (response.tags && Array.isArray(response.tags)) return response.tags;

        // CASE 4: Nested objects where value is an array
        const arrayProp = Object.values(response).find(val => Array.isArray(val));
        if (arrayProp) return arrayProp as Tag[];

        return [];
    }
}
