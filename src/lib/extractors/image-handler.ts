import { ImageHandlingSettings, ProcessedImage, ImageInfo } from '../../types/image';
import { PageMetadata } from '../../types/metadata';
import { ImageDetector } from './image-detector';
import { ImageOptimizer } from './image-optimizer';

export class ImageHandler {
    /**
     * Process images in article HTML based on settings.
     */
    static async processImages(
        html: string,
        metadata: PageMetadata,
        settings: ImageHandlingSettings
    ): Promise<ProcessedImage[]> {
        // 1. Extract images
        let images = ImageDetector.extractImages(html);

        // 2. Identify featured image
        const featuredUrl = ImageDetector.detectFeaturedImage(metadata);

        // 3. Prioritize featured image
        images = this.prioritizeFeaturedImages(images, featuredUrl);

        // 4. Process each image
        const results: ProcessedImage[] = [];
        let embeddedCount = 0;

        for (const image of images) {
            const start = performance.now();
            const result: ProcessedImage = {
                originalUrl: image.url,
                embedType: 'external',
                format: 'original',
                alt: image.alt,
                isFeatured: image.isFeatured
            };

            // Decisions
            const userWantsEmbed = this.shouldEmbedImage(image, settings);
            const limitReached = embeddedCount >= settings.maxEmbeddedImages;

            if (!userWantsEmbed || (limitReached && !image.isFeatured)) {
                // Note: Featured images are prioritized in the list, so they should be processed early.
                // But if we somehow exceeded limit (e.g. lots of featured?), strictly enforce limit?
                // FR-5.2 says "Prioritize featured/hero images first".
                // FR-5.1 says "Limit embedded images to 20 per article".
                // The loop order handles priority. If we hit 20, we stop embedding.
                // Since featured is at top, it gets embedded first.
                results.push(result);
                continue;
            }

            // Attempt to embed
            try {
                const imageData = await ImageOptimizer.fetchImage(image.url, settings.fetchTimeout);

                if (!imageData) {
                    // Fetch failed (CORS or timeout or 404), keep external
                    result.error = 'Fetch failed';
                } else {
                    // Check size threshold for Smart mode
                    const size = imageData.byteLength;
                    const isTooBig = settings.preference === 'smart' &&
                        size > settings.sizeThreshold &&
                        !image.isFeatured;

                    if (isTooBig) {
                        result.embedType = 'external';
                        // We fetched it but decided not to embed.
                    } else {
                        // Optimize
                        const optimizedData = await ImageOptimizer.optimizeToWebP(imageData, settings.webpQuality);
                        const dataUrl = ImageOptimizer.convertToBase64(optimizedData, 'image/webp');

                        // Safety Check: If base64 string is too massive (~1.5MB+), it crashes Markdown parsers
                        // causing "gibberish" rendering. Fallback to external even if featured.
                        const HARD_LIMIT_CHARS = 2_000_000; // ~1.5MB payload
                        if (dataUrl.length > HARD_LIMIT_CHARS) {
                            console.warn(`[ImageHandler] Image too large for embedding (${dataUrl.length} chars). Fallback to external.`);
                            result.embedType = 'external';
                            result.error = 'Image too large for inline embedding';
                        } else {
                            result.embedType = 'base64';
                            result.dataUrl = dataUrl;
                            result.format = 'webp';
                            embeddedCount++;
                        }
                    }
                }
            } catch (error) {
                console.error('Image processing error:', error);
                result.error = error instanceof Error ? error.message : String(error);
            }

            result.processingTime = performance.now() - start;
            results.push(result);
        }

        return results;
    }

    /**
     * Apply image limit and prioritize featured images.
     * Note: helper mostly for testing or specific logic, main logic is in processImages.
     */
    static applyImageLimit(images: ImageInfo[], limit: number, featuredUrl: string | null): ImageInfo[] {
        let sorted = this.prioritizeFeaturedImages(images, featuredUrl);
        // This function as described in plan seemed to imply filtering. 
        // But we just return the full sorted list here for consistency.
        // If we strictly want to return only "images to be embedded", we would slice.
        // But we need all images.
        return sorted.slice(0, limit);
    }

    /**
     * Prioritize featured image in the list.
     */
    static prioritizeFeaturedImages(images: ImageInfo[], featuredUrl: string | null): ImageInfo[] {
        if (!featuredUrl) return images;

        const index = images.findIndex(img => img.url === featuredUrl);
        if (index === -1) {
            // Featured image might not be in the body images (e.g. only in og:tag)
            // But we only process body images. 
            // If it is found, move to top.
            return images;
        }

        const newImages = [...images];
        const [featured] = newImages.splice(index, 1);
        featured.isFeatured = true;
        newImages.unshift(featured);
        return newImages;
    }

    /**
     * Determine if image should be embedded based on settings.
     */
    static shouldEmbedImage(image: ImageInfo, settings: ImageHandlingSettings): boolean {
        if (settings.preference === 'never') return false;
        if (settings.preference === 'always') return true;
        if (settings.preference === 'smart') {
            if (image.isFeatured) return true;
            // Size check usually happens after fetch, so here we return true to attempt it
            return true;
        }
        return true; // Default
    }
}
