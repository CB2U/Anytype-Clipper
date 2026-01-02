export class ImageOptimizer {
    /**
     * Fetch image data from URL with timeout and CORS handling.
     */
    static async fetchImage(url: string, timeout: number): Promise<ArrayBuffer | null> {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(id);

            if (!response.ok) {
                // If 403/404 etc, treat as failure
                return null;
            }

            return await response.arrayBuffer();
        } catch (error) {
            clearTimeout(id);
            this.handleCORSError(error as Error, url);
            return null;
        }
    }

    /**
     * Optimize image to WebP format.
     */
    static async optimizeToWebP(imageData: ArrayBuffer, quality: number): Promise<ArrayBuffer> {
        // Create a timeout promise
        const timeoutMs = 2000; // 2s timeout from spec
        let timeoutId: ReturnType<typeof setTimeout>;

        const timeoutPromise = new Promise<null>((resolve) => {
            timeoutId = setTimeout(() => resolve(null), timeoutMs);
        });

        const conversionPromise = (async () => {
            try {
                const blob = new Blob([imageData]);
                const bitmap = await createImageBitmap(blob);

                const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    bitmap.close();
                    return null;
                }

                ctx.drawImage(bitmap, 0, 0);
                bitmap.close();

                // quality is 0-100, convert to 0-1
                const webpBlob = await canvas.convertToBlob({
                    type: 'image/webp',
                    quality: quality / 100
                });

                return await webpBlob.arrayBuffer();
            } catch (error) {
                console.warn('WebP optimization failed:', error);
                return null;
            }
        })();

        // Race between conversion and timeout
        const result = await Promise.race([conversionPromise, timeoutPromise]);

        if (timeoutId!) clearTimeout(timeoutId);

        // Return original if conversion failed or timed out
        return result || imageData;
    }

    /**
     * Convert image data to base64 data URL.
     */
    static convertToBase64(imageData: ArrayBuffer, mimeType: string): string {
        try {
            const bytes = new Uint8Array(imageData);
            let binary = '';
            const len = bytes.byteLength;
            // Process in chunks to avoid stack overflow for large images
            const chunkSize = 8192;
            for (let i = 0; i < len; i += chunkSize) {
                binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
            }
            const base64 = btoa(binary);
            // Ensure no newlines in base64 string
            const cleanBase64 = base64.replace(/(\r\n|\n|\r)/gm, "");
            return `data:${mimeType};base64,${cleanBase64}`;
        } catch (error) {
            console.error('Base64 conversion failed:', error);
            return '';
        }
    }

    /**
     * Handle CORS errors gracefully.
     */
    static handleCORSError(error: Error, url?: string): void {
        const isCors = error.name === 'TypeError' && error.message.includes('Failed to fetch'); // Common CORS symptom
        const isAbort = error.name === 'AbortError';

        // Sanitize URL (domain only)
        let domain = 'unknown';
        if (url) {
            try {
                domain = new URL(url).hostname;
            } catch (e) { /* ignore */ }
        }

        if (isAbort) {
            console.warn(`Image fetch timed out for domain: ${domain}`);
        } else if (isCors) {
            console.warn(`CORS error fetching image from domain: ${domain}`);
        } else {
            // Check if it's explicitly a network error or other fetch error
            console.warn(`Image fetch failed for domain: ${domain}: ${error.message}`);
        }
    }
}
