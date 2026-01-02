import { ImageHandler } from '../../../src/lib/extractors/image-handler';
import { ImageDetector } from '../../../src/lib/extractors/image-detector';
import { ImageOptimizer } from '../../../src/lib/extractors/image-optimizer';
import { ImageHandlingSettings } from '../../../src/types/image';
import { PageMetadata } from '../../../src/types/metadata';

jest.mock('../../../src/lib/extractors/image-detector');
jest.mock('../../../src/lib/extractors/image-optimizer');

describe('ImageHandler', () => {
    const mockSettings: ImageHandlingSettings = {
        preference: 'smart',
        sizeThreshold: 500000,
        maxEmbeddedImages: 2,
        webpQuality: 85,
        fetchTimeout: 1000
    };

    const mockMetadata: PageMetadata = {} as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (ImageDetector.extractImages as jest.Mock).mockReturnValue([
            { url: 'img1.jpg', isFeatured: false },
            { url: 'img2.jpg', isFeatured: false },
            { url: 'img3.jpg', isFeatured: false }
        ]);
        (ImageDetector.detectFeaturedImage as jest.Mock).mockReturnValue(null);
        (ImageOptimizer.fetchImage as jest.Mock).mockResolvedValue(new ArrayBuffer(100)); // Small image
        (ImageOptimizer.optimizeToWebP as jest.Mock).mockResolvedValue(new ArrayBuffer(50));
        (ImageOptimizer.convertToBase64 as jest.Mock).mockReturnValue('data:image/webp;base64,123');
    });

    describe('processImages', () => {
        it('should process images and respect limit', async () => {
            const results = await ImageHandler.processImages('html', mockMetadata, mockSettings);

            // Max embedded is 2. We have 3 images.
            // Img1: embedded
            // Img2: embedded
            // Img3: external (limit reached)

            expect(results).toHaveLength(3);
            expect(results[0].embedType).toBe('base64');
            expect(results[1].embedType).toBe('base64');
            expect(results[2].embedType).toBe('external');
        });

        it('should prioritize featured image', async () => {
            (ImageDetector.extractImages as jest.Mock).mockReturnValue([
                { url: 'img1.jpg', isFeatured: false },
                { url: 'img2.jpg', isFeatured: false }
            ]);
            (ImageDetector.detectFeaturedImage as jest.Mock).mockReturnValue('img2.jpg');

            const results = await ImageHandler.processImages('html', mockMetadata, mockSettings);

            // img2 should be first
            expect(results[0].originalUrl).toBe('img2.jpg');
            expect(results[0].isFeatured).toBe(true);
            expect(results[1].originalUrl).toBe('img1.jpg');
        });

        it('should respect "never" preference', async () => {
            const neverSettings = { ...mockSettings, preference: 'never' as const };
            const results = await ImageHandler.processImages('html', mockMetadata, neverSettings);

            expect(results.every(r => r.embedType === 'external')).toBe(true);
            expect(ImageOptimizer.fetchImage).not.toHaveBeenCalled();
        });

        it('should not embed large images in smart mode (non-featured)', async () => {
            (ImageOptimizer.fetchImage as jest.Mock).mockResolvedValue(new ArrayBuffer(600000)); // > 500KB

            const results = await ImageHandler.processImages('html', mockMetadata, mockSettings);
            expect(results[0].embedType).toBe('external');
        });

        it('should always embed featured image even if large', async () => {
            (ImageDetector.extractImages as jest.Mock).mockReturnValue([
                { url: 'img1.jpg', isFeatured: false }
            ]);
            (ImageDetector.detectFeaturedImage as jest.Mock).mockReturnValue('img1.jpg');
            (ImageOptimizer.fetchImage as jest.Mock).mockResolvedValue(new ArrayBuffer(600000)); // > 500KB

            const results = await ImageHandler.processImages('html', mockMetadata, mockSettings);
            expect(results[0].embedType).toBe('base64');
        });

        it('should fallback to external if base64 string exceeds hard limit', async () => {
            (ImageOptimizer.fetchImage as jest.Mock).mockResolvedValue(new ArrayBuffer(100));
            // Mock base64 conversion to return HUGE string (> 2,000,000 chars)
            (ImageOptimizer.convertToBase64 as jest.Mock).mockReturnValue('a'.repeat(2000001));

            const results = await ImageHandler.processImages('html', mockMetadata, mockSettings);
            expect(results[0].embedType).toBe('external');
            expect(results[0].error).toContain('too large');
        });
    });
});
