import { ImageInfo } from '../../types/image';
import { PageMetadata } from '../../types/metadata';

export class ImageDetector {
    /**
     * Extract images from HTML content.
     */
    static extractImages(html: string): ImageInfo[] {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const images = Array.from(doc.getElementsByTagName('img'));

            const seenUrls = new Set<string>();
            const results: ImageInfo[] = [];

            for (const img of images) {
                const src = img.getAttribute('src');
                if (!src || src.startsWith('data:')) continue;

                if (seenUrls.has(src)) continue;
                seenUrls.add(src);

                const width = parseInt(img.getAttribute('width') || '0', 10);
                const height = parseInt(img.getAttribute('height') || '0', 10);

                results.push({
                    url: src,
                    alt: img.getAttribute('alt') || undefined,
                    isFeatured: false,
                    dimensions: (width > 0 && height > 0) ? { width, height } : undefined
                });
            }

            return results;
        } catch (error) {
            console.error('Error extracting images:', error);
            return [];
        }
    }

    /**
     * Identify featured image from metadata.
     */
    static detectFeaturedImage(metadata: PageMetadata): string | null {
        if (metadata.image) return metadata.image;
        return null;
    }

    /**
     * Estimate image size from URL or headers.
     */
    static estimateImageSize(_url: string): number | null {
        // Simple heuristic: check if URL contains dimensions or size hints
        return null;
    }

    /**
     * Get image dimensions from image data.
     */
    static async getImageDimensions(imageData: ArrayBuffer): Promise<{ width: number; height: number }> {
        try {
            const blob = new Blob([imageData]);
            const bitmap = await createImageBitmap(blob);
            const dimensions = { width: bitmap.width, height: bitmap.height };
            bitmap.close();
            return dimensions;
        } catch (error) {
            return { width: 0, height: 0 };
        }
    }
}
