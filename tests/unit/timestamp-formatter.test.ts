import { formatRelativeTime } from '../../src/lib/utils/timestamp-formatter';

describe('Timestamp Formatter', () => {
    const now = Date.now();

    it('should format times less than 1 minute as "Just now"', () => {
        expect(formatRelativeTime(now - 30 * 1000)).toBe('Just now');
    });

    it('should format times in minutes', () => {
        expect(formatRelativeTime(now - 2 * 60 * 1000)).toBe('2 minutes ago');
        expect(formatRelativeTime(now - 60 * 1000)).toBe('1 minute ago');
    });

    it('should format times in hours', () => {
        expect(formatRelativeTime(now - 2 * 60 * 60 * 1000)).toBe('2 hours ago');
        expect(formatRelativeTime(now - 60 * 60 * 1000)).toBe('1 hour ago');
    });

    it('should format times in days', () => {
        expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000)).toBe('2 days ago');
        expect(formatRelativeTime(now - 24 * 60 * 60 * 1000)).toBe('1 day ago');
    });

    it('should fallback to date for older timestamps', () => {
        const older = new Date(2025, 0, 1).getTime();
        expect(formatRelativeTime(older)).toBe(new Date(older).toLocaleDateString());
    });
});
