import { ImageDetector } from '../../../src/lib/extractors/image-detector';
import { PageMetadata } from '../../../src/types/metadata';

describe('ImageDetector', () => {
    describe('extractImages', () => {
        it('should extract images from HTML', () => {
            const html = '<div><img src="https://example.com/img1.jpg" alt="Img1" width="100" height="100"><img src="img2.png"></div>';
            const images = ImageDetector.extractImages(html);
            expect(images).toHaveLength(2);
            expect(images[0]).toEqual({
                url: 'https://example.com/img1.jpg',
                alt: 'Img1',
                isFeatured: false,
                dimensions: { width: 100, height: 100 }
            });
            expect(images[1].url).toBe('img2.png');
            expect(images[1].dimensions).toBeUndefined();
        });

        it('should ignore data URLs', () => {
            const html = '<img src="data:image/png;base64,123">';
            const images = ImageDetector.extractImages(html);
            expect(images).toHaveLength(0);
        });

        it('should deduplicate URLs', () => {
            const html = '<img src="img1.jpg"><img src="img1.jpg">';
            const images = ImageDetector.extractImages(html);
            expect(images).toHaveLength(1);
        });
    });

    describe('detectFeaturedImage', () => {
        it('should return image from metadata', () => {
            const metadata = { image: 'featured.jpg' } as PageMetadata;
            expect(ImageDetector.detectFeaturedImage(metadata)).toBe('featured.jpg');
        });

        it('should return null if no image in metadata', () => {
            const metadata = {} as PageMetadata;
            expect(ImageDetector.detectFeaturedImage(metadata)).toBeNull();
        });
    });

    describe('getImageDimensions', () => {
        beforeAll(() => {
            // Mock createImageBitmap
            global.createImageBitmap = jest.fn().mockResolvedValue({
                width: 200,
                height: 100,
                close: jest.fn()
            });
            // Mock Blob if needed, JSDOM usually has basic Blob, but minimal implementation
        });

        it('should return dimensions', async () => {
            const buffer = new ArrayBuffer(8);
            const dim = await ImageDetector.getImageDimensions(buffer);
            expect(dim).toEqual({ width: 200, height: 100 });
        });
    });
});
