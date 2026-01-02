import { AnytypeApiClient } from '../api/client';
import { TagService } from '../tags/tag-service';
import { StorageManager } from '../storage/storage-manager';
import { PageMetadata } from '../../types/metadata';
import { METADATA_PROPERTY_LOOKUP } from '../utils/constants';

/**
 * Service for orchestrating the capture of bookmarks and articles with metadata.
 */
export class BookmarkCaptureService {
    private static instance: BookmarkCaptureService;
    private apiClient: AnytypeApiClient;
    private tagService: TagService;
    private storage: StorageManager;

    private constructor() {
        this.apiClient = new AnytypeApiClient();
        this.tagService = TagService.getInstance();
        this.storage = StorageManager.getInstance();
    }

    public static getInstance(): BookmarkCaptureService {
        if (!BookmarkCaptureService.instance) {
            BookmarkCaptureService.instance = new BookmarkCaptureService();
        }
        return BookmarkCaptureService.instance;
    }

    /**
     * Captures a bookmark or article with full metadata.
     */
    public async captureBookmark(
        spaceId: string,
        metadata: PageMetadata,
        userNote?: string,
        tags: string[] = [],
        typeKey: string = 'bookmark',
        isHighlightCapture: boolean = false,
        quote?: string
    ): Promise<any> {
        // 1. Sync auth state
        const auth = await this.storage.get('auth');
        if (!auth || !auth.apiKey) throw new Error('Not authenticated');
        this.apiClient.setApiKey(auth.apiKey);

        // 2. Prepare basic creation params
        const createParams: any = {
            title: metadata.title,
            description: userNote || metadata.description,
            type_key: typeKey,
            source_url: metadata.canonicalUrl,
        };

        // If it's an article or note, include the content with safety limits
        if (typeKey === 'article' || typeKey === 'note') {
            let articleBody = '';

            if (isHighlightCapture && quote) {
                console.log('[BookmarkCaptureService] Using quote for highlight description');
                articleBody = quote;
            } else {
                // Content is now pre-converted to Markdown in the content script
                articleBody = metadata.content || '';

                // Fallback to textContent (stripped) if content is empty
                if (!articleBody) {
                    articleBody = (metadata.textContent || '').replace(/<[^>]*>/g, '').trim();
                }
            }

            // Safety: Anytype API might struggle with very large bodies. 
            // Truncate to ~10MB (enough for text + several optimized images)
            const MAX_BODY_SIZE = 10 * 1024 * 1024;
            if (articleBody.length > MAX_BODY_SIZE) {
                console.warn(`[BookmarkCaptureService] Content too large (${articleBody.length}), truncating.`);
                articleBody = articleBody.substring(0, MAX_BODY_SIZE) + '\n\n... [Content Truncated]';
            }

            createParams.description = articleBody || createParams.description;
        }

        // 3. Create the object
        console.log('[BookmarkCaptureService] Creating object:', createParams);
        const result = await this.apiClient.createObject(spaceId, createParams);
        if (!result.id) throw new Error('Failed to create object: No ID returned');

        // 4. Resolve and update advanced properties (metadata + tags)
        const updateProperties = await this.prepareProperties(spaceId, typeKey, metadata, tags);

        if (updateProperties.length > 0) {
            console.log('[BookmarkCaptureService] Updating properties:', updateProperties);
            await this.apiClient.updateObject(spaceId, result.id, updateProperties);
        }

        return result;
    }

    /**
     * Resolves property IDs and prepares the properties array for an update.
     */
    private async prepareProperties(spaceId: string, objectType: string, metadata: PageMetadata, tagNames: string[]): Promise<any[]> {
        const properties: any[] = [];

        // 1. Handle Tags (Relations)
        if (tagNames.length > 0) {
            try {
                const tagPropertyId = await (this.tagService as any).resolvePropertyId(spaceId, objectType);
                const existingTags = await this.tagService.getTags(spaceId, objectType);

                const tagIds: string[] = [];
                for (const name of tagNames) {
                    const tag = existingTags.find(t => t.name.toLowerCase() === name.toLowerCase());
                    if (tag) {
                        tagIds.push(tag.id);
                    } else {
                        const newTag = await this.tagService.createTag(spaceId, objectType, name);
                        tagIds.push(newTag.id);
                    }
                }

                if (tagIds.length > 0) {
                    properties.push({
                        key: tagPropertyId,
                        objects: tagIds
                    });
                }
            } catch (e) {
                console.warn('[BookmarkCaptureService] Failed to resolve tags:', e);
            }
        }

        // 2. Handle Metadata Fields
        const metadataFields: (keyof PageMetadata)[] = [
            'author', 'publishedDate', 'siteName', 'language', 'favicon', 'canonicalUrl',
            'extractionLevel', 'extractionQuality', 'extractionTime', 'note'
        ];

        for (const field of metadataFields) {
            const value = metadata[field];
            if (value) {
                const propertyId = await this.resolveMetadataPropertyId(spaceId, field as any);
                if (propertyId) {
                    properties.push({
                        key: propertyId,
                        text: String(value)
                    });
                }
            }
        }

        return properties;
    }

    /**
     * Resolves the relation/property ID for a metadata field with fallback support.
     */
    private async resolveMetadataPropertyId(spaceId: string, field: string): Promise<string | null> {
        const config = (METADATA_PROPERTY_LOOKUP as any)[field];
        if (!config) return null;

        // 1. Check persistent mappings
        const mappings = (await this.storage.get('metadataPropertyMappings') || {}) as any;
        if (mappings[spaceId] && mappings[spaceId][field]) {
            return mappings[spaceId][field];
        }

        // 2. Dynamic Discovery
        try {
            const res = await this.apiClient.listProperties(spaceId);
            const properties = res.data || [];

            // Try to find by any of the search names
            for (const searchName of config.searchNames) {
                const property = properties.find((p: any) => p.name.toLowerCase() === searchName.toLowerCase());
                if (property) {
                    // Update mapping
                    const newMappings = { ...mappings };
                    if (!newMappings[spaceId]) newMappings[spaceId] = {};
                    newMappings[spaceId][field] = property.id;
                    await this.storage.set('metadataPropertyMappings', newMappings);

                    return property.id;
                }
            }
        } catch (e) {
            console.warn(`[BookmarkCaptureService] Dynamic discovery failed for ${field}:`, e);
        }

        // 3. Fallback to constant key if specified and safe
        return config.fallback || null;
    }
}
