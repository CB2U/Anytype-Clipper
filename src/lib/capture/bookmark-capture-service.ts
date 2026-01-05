import { AnytypeApiClient, checkHealth } from '../api';
import { TagService } from '../tags/tag-service';
import { StorageManager } from '../storage/storage-manager';
import { PageMetadata } from '../../types/metadata';
import { METADATA_PROPERTY_LOOKUP } from '../utils/constants';
import { QueueManager } from '../../background/queue-manager';
import { QueueStatus, QueueItem } from '../../types/queue';

/**
 * Service for orchestrating the capture of bookmarks and articles with metadata.
 */
export class BookmarkCaptureService {
    private static instance: BookmarkCaptureService;
    private apiClient: AnytypeApiClient;
    private tagService: TagService;
    private storage: StorageManager;
    private queueManager: QueueManager;

    private constructor() {
        this.apiClient = new AnytypeApiClient();
        this.tagService = TagService.getInstance();
        this.storage = StorageManager.getInstance();
        this.queueManager = QueueManager.getInstance(this.storage);
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

        // 2. Proactive Health Check (T5, T6)
        const settings = await this.storage.get('settings');
        const port = settings?.apiPort || 31009;

        console.debug(`[BookmarkCaptureService] Performing health check on port ${port}...`);
        const isHealthy = await checkHealth(port, 2000);
        console.log(`[BookmarkCaptureService] Health check result: ${isHealthy ? 'ONLINE' : 'OFFLINE'}`);

        if (!isHealthy) {
            console.info('[BookmarkCaptureService] Anytype unavailable via health check. Queuing immediately.');
            return this.queueCapture(spaceId, metadata, userNote, tags, typeKey, quote);
        }

        // 3. Prepare basic creation params
        const createParams: any = {
            title: metadata.title,
            description: userNote || metadata.description,
            type_key: typeKey,
            source: metadata.canonicalUrl,
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

        try {
            // 4. Create the object
            console.log('[BookmarkCaptureService] Creating object:', createParams);
            const result = await this.apiClient.createObject(spaceId, createParams);
            if (!result.id) throw new Error('Failed to create object: No ID returned');

            // 5. Resolve and update advanced properties (metadata + tags)
            const updateProperties = await this.prepareProperties(spaceId, typeKey, metadata, tags);

            if (updateProperties.length > 0) {
                console.log('[BookmarkCaptureService] Updating properties:', updateProperties);
                await this.apiClient.updateObject(spaceId, result.id, updateProperties);
            }

            return result;
        } catch (error) {
            if (QueueManager.shouldQueue(error)) {
                console.info('[BookmarkCaptureService] API unavailable, adding to offline queue.', error);
                return this.queueCapture(spaceId, metadata, userNote, tags, typeKey, quote);
            }

            // Re-throw if not queueable
            throw error;
        }
    }

    /**
     * Refactored queueing logic to avoid duplication between proactive health check and catch block.
     */
    private async queueCapture(
        spaceId: string,
        metadata: PageMetadata,
        userNote?: string,
        tags: string[] = [],
        typeKey: string = 'bookmark',
        quote?: string
    ): Promise<any> {
        const queueId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `q-${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${Math.random().toString(36).substring(2, 11)}`;

        // De-duplicate: metadata often contains content which is already in payload.content
        const cleanMetadata = { ...metadata };
        if (cleanMetadata.content) {
            // Keep a small snippet or just remove it to save space in the main queue key
            delete cleanMetadata.content;
            if (cleanMetadata.textContent) delete cleanMetadata.textContent;
        }

        // Construct Queue Item
        const queueItem: QueueItem = {
            id: queueId,
            type: typeKey as any,
            payload: {
                spaceId,
                url: metadata.canonicalUrl || '',
                title: metadata.title || '',
                metadata: cleanMetadata,
                notes: userNote,
                tags,
                // Content for article/note
                content: (typeKey === 'article' || typeKey === 'note') ? (metadata.content || quote || '') : '',
                // Additional fields for highlight if we want to support them in payload
                quote: quote || '',
                pageTitle: metadata.title || '',
            } as any,
            status: QueueStatus.Queued,
            timestamps: {
                created: Date.now()
            },
            retryCount: 0
        };

        console.log(`[BookmarkCaptureService] Queuing item ${queueItem.id} (type: ${typeKey})`);
        await this.queueManager.add(queueItem);

        const result = {
            queued: true,
            itemId: queueItem.id,
            type: typeKey
        };
        console.log(`[BookmarkCaptureService] Item ${queueItem.id} queued successfully. Returning result to popup.`);
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
