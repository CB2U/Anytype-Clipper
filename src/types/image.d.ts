/**
 * Image handling types for Anytype Clipper.
 */

export interface ImageInfo {
    url: string;              // Original image URL
    alt?: string;             // Alt text from HTML
    isFeatured: boolean;      // True if og:image or article:image
    estimatedSize?: number;   // Estimated file size in bytes
    dimensions?: {
        width: number;
        height: number;
    };
}

export interface ProcessedImage {
    originalUrl: string;
    embedType: 'base64' | 'external';
    dataUrl?: string;         // Present if embedType === 'base64'
    format: 'webp' | 'jpeg' | 'png' | 'gif' | 'svg' | 'original';
    alt?: string;
    isFeatured: boolean;
    processingTime?: number;  // Time taken to process (ms)
    error?: string;           // Error message if processing failed
}

export type ImageHandlingPreference = 'always' | 'smart' | 'never';

export interface ImageHandlingSettings {
    preference: ImageHandlingPreference;
    sizeThreshold: number;    // Default: 500KB (512000 bytes)
    maxEmbeddedImages: number; // Default: 20
    webpQuality: number;      // Default: 85 (0-100)
    fetchTimeout: number;     // Default: 5000ms
}
